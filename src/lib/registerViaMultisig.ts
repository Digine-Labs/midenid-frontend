/**
 * Register a .miden domain from a GUARDIAN (multisig) wallet account.
 *
 * A guardian account can't authorize a custom transaction via the wallet's
 * one-shot `requestTransaction` (no proposal/approval flow → "unauthorized").
 * The OpenZeppelin multisig client drives propose → sign → execute against the
 * guardian (PSM) service instead.
 *
 * Known constraints:
 *  1. VITE_GUARDIAN_ENDPOINT must point at the SAME guardian operator the wallet
 *     registered the account with, or `load()` fails. There is no on-chain way to
 *     discover it (the account stores only a guardian commitment, not a URL) — the
 *     wallet doesn't expose it either. It defaults to OpenZeppelin's operator.
 *  2. The ECDSA cosigner "invalid public key commitment" bug (OZ guardian #313)
 *     is fixed by #314, released in @openzeppelin/guardian v0.15.2. We force the
 *     `ecdsa` scheme below because the wallet exposes only the 32-byte account
 *     commitment, which PublicKeyFormat.parse mis-detects as Falcon.
 */
import {
  AccountId,
  FungibleAsset,
  Note,
  NoteArray,
  NoteAssets,
  NoteMetadata,
  NoteRecipient,
  NoteStorage,
  NoteTag,
  NoteType,
  NoteScript,
  NetworkAccountTarget,
  TransactionRequest,
  TransactionRequestBuilder,
  Endpoint,
  type MidenClient,
} from '@miden-sdk/miden-sdk';
import {
  MultisigClient,
  MidenWalletSigner,
  PublicKeyFormat,
  type WalletSigningContext,
  type SignatureScheme,
} from '@openzeppelin/miden-multisig-client';
import { base64ToUint8Array } from '@/utils';
import { REGISTER_NOTE_SCRIPT_COMPILED_B64 } from '@/shared/notes/register-note-compiled';
import { generateRandomSerialNumber } from './midenClient';

const DEFAULT_GUARDIAN_ENDPOINT = 'https://guardian.openzeppelin.com';
// Runtime override key. Set from the browser console to point the SAME build at a
// different guardian operator (e.g. Lambda Class) without rebuilding:
//   localStorage.setItem('guardianEndpoint', 'https://<operator>'); location.reload();
// Clear with localStorage.removeItem('guardianEndpoint').
const GUARDIAN_ENDPOINT_OVERRIDE_KEY = 'guardianEndpoint';

/**
 * Resolve the guardian (PSM) operator endpoint, in priority order:
 *   1. `explicit` — e.g. the wallet's own `requestGuardianInfo().guardianEndpoint`
 *      (the account knows which operator it was registered with).
 *   2. localStorage `guardianEndpoint` — a runtime override for testing a different
 *      operator against the same build (no rebuild needed).
 *   3. `VITE_GUARDIAN_ENDPOINT` — build-time deployment config.
 *   4. OpenZeppelin's operator — default so a fresh build works with no config.
 *
 * The endpoint MUST match the operator the wallet registered the account with, or
 * `MultisigClient.load()` fails. Any trailing slash is stripped: the multisig
 * client appends `/state` (etc.) with a leading slash, so `.../` would produce
 * `//state` → 404 (misread as "not a guardian account" → wallet fallback →
 * "unauthorized").
 */
function resolveGuardianEndpoint(explicit?: string | null): string {
  let override: string | null = null;
  try {
    override = localStorage.getItem(GUARDIAN_ENDPOINT_OVERRIDE_KEY);
  } catch {
    /* localStorage unavailable — ignore */
  }
  const raw =
    (explicit && explicit.trim()) ||
    (override && override.trim()) ||
    (import.meta.env.VITE_GUARDIAN_ENDPOINT as string | undefined) ||
    DEFAULT_GUARDIAN_ENDPOINT;
  const endpoint = raw.replace(/\/+$/, '');
  const source = explicit
    ? 'wallet/guardian-info'
    : override
      ? 'localStorage override'
      : import.meta.env.VITE_GUARDIAN_ENDPOINT
        ? 'VITE_GUARDIAN_ENDPOINT'
        : 'default';
  console.log(`[registerViaMultisig] guardian endpoint: ${endpoint} (source: ${source})`);
  return endpoint;
}

/**
 * Thrown when the account isn't found on the guardian/PSM — i.e. it's not a
 * guardian account (e.g. a Fully-Private account). The caller should fall back
 * to the normal wallet submit flow.
 */
export class NotAGuardianAccountError extends Error {}

export interface RegisterViaMultisigParams {
  client: MidenClient;
  senderAccountId: AccountId;
  destinationAccountId: AccountId; // the registry (network account)
  noteStorage: NoteStorage; // the [TOKEN, DOMAIN] note inputs (built in RegisterModal)
  faucetId: AccountId;
  amount: bigint;
  // From useWallet():
  walletPublicKey: Uint8Array;
  signBytes: (data: Uint8Array, kind: 'word' | 'signingInputs') => Promise<Uint8Array>;
  // Optional: the operator this account is registered with, e.g. from the wallet's
  // requestGuardianInfo().guardianEndpoint (when available). Takes priority over
  // the localStorage/env/default resolution. Must match the account's operator.
  guardianEndpoint?: string | null;
}

/** Build the SAME network registration note we build on the wallet path. */
function buildRegisterRequest(p: RegisterViaMultisigParams) {
  const script = NoteScript.deserialize(base64ToUint8Array(REGISTER_NOTE_SCRIPT_COMPILED_B64));
  const serial = generateRandomSerialNumber();
  const noteAssets = new NoteAssets([new FungibleAsset(p.faucetId, p.amount)]);
  const noteTag = NoteTag.withAccountTarget(p.destinationAccountId);
  const noteMetadata = new NoteMetadata(p.senderAccountId, NoteType.Public, noteTag);
  const attachment = new NetworkAccountTarget(p.destinationAccountId).toAttachment();
  const recipient = new NoteRecipient(serial, script, p.noteStorage);
  const note = Note.withAttachments(noteAssets, noteMetadata, recipient, [attachment]);
  const noteId = note.id().toString();
  const request = new TransactionRequestBuilder().withOwnOutputNotes(new NoteArray([note])).build();
  return { request, noteId };
}

export async function registerViaMultisig(
  p: RegisterViaMultisigParams,
): Promise<{ noteId: string; proposalId: string }> {
  // 1. Build the registration request FIRST, while the AccountId WASM objects are
  //    still valid. (The guardian load below calls senderAccountId.toString(),
  //    which consumes/frees the WASM object; building afterwards would leave the
  //    note with a null field → "null pointer passed to rust" at note.id().)
  const { request, noteId } = buildRegisterRequest(p);
  const requestBytes = request.serialize();

  // 2. Derive the signer identity from the wallet's public key. The MidenFi wallet
  //    exposes only the 32-byte account commitment as its "publicKey", so
  //    PublicKeyFormat.parse mis-detects ECDSA accounts as `falcon` (the account
  //    signs 65-byte secp256k1 sigs). Force `ecdsa`; the #314 MidenWalletSigner
  //    recovers the real 33-byte key from the signature.
  //    TODO: derive the real scheme from the multisig config instead of forcing it.
  const parsed = PublicKeyFormat.parse(p.walletPublicKey) as {
    scheme: SignatureScheme;
    publicKeyHex: string;
    commitment: string;
  };
  const scheme: SignatureScheme = 'ecdsa';
  const walletCtx: WalletSigningContext = { signBytes: p.signBytes };
  const signer = new MidenWalletSigner(walletCtx, parsed.commitment, scheme);

  // 3. Init multisig client over the SAME frontend Miden client and load the
  //    account from the guardian/PSM (NOT the Miden network — the account is
  //    private). A genuine load failure means the PSM doesn't know this account →
  //    treat it as "not a guardian account" so the caller can fall back.
  const accountIdStr = p.senderAccountId.toString();
  const guardianEndpoint = resolveGuardianEndpoint(p.guardianEndpoint);
  // 0.16 requires an explicit Miden RPC endpoint (0.15 derived it from the
  // client). Use the SDK's testnet endpoint so it matches the rest of the app.
  const msClient = new MultisigClient(p.client, {
    guardianEndpoint,
    midenRpcEndpoint: Endpoint.testnet().toString(),
  });

  // The guardian enforces a strictly-increasing x-timestamp PER ACCOUNT, shared
  // across every client that touches it (wallet + dApp). If another client — or a
  // prior request — pushed the stored high-water mark into the future, our honest
  // Date.now() is rejected with 401 "Replay attack". We can't read the stored
  // value, so escalate our timestamp until the guardian accepts it. The client
  // derives its timestamp from `lastTimestamp` (nextTimestamp returns
  // lastTimestamp+1 whenever now is behind), so nudging that field is enough — no
  // node_modules patch. TODO: the real fix is a server-issued nonce/challenge
  // instead of client wall-clock; raise with OZ.
  const isReplay = (e: unknown) =>
    (e instanceof Error && e.message.includes('Replay attack')) ||
    String(e).includes('Replay attack');
  const guardianHttp = msClient.guardianClient as unknown as { lastTimestamp: number };

  // Each doomed replay attempt still burns a wallet signature (the auth header is
  // signed before the 401), so a cold load can cost several prompts before it
  // lands. Remember the offset that last worked for THIS account and start the
  // ladder there, skipping the low rungs we already know get rejected. First
  // registration pays the discovery cost; repeats do `load` in a single signature.
  const OFFSET_KEY = `guardian-ts-offset:${accountIdStr}`;
  const readRemembered = () => {
    try {
      return Number(localStorage.getItem(OFFSET_KEY)) || 0;
    } catch {
      return 0;
    }
  };
  const LADDER = [0, 30_000, 120_000, 300_000, 900_000];
  const remembered = readRemembered();
  const startIdx = Math.max(0, LADDER.findIndex((o) => o >= remembered));
  const OFFSETS_MS = LADDER.slice(startIdx);

  let multisig: Awaited<ReturnType<typeof msClient.load>> | undefined;
  for (let i = 0; i < OFFSETS_MS.length; i++) {
    if (OFFSETS_MS[i] > 0) {
      guardianHttp.lastTimestamp = Date.now() + OFFSETS_MS[i];
    }
    try {
      multisig = await msClient.load(accountIdStr, signer);
      try {
        localStorage.setItem(OFFSET_KEY, String(OFFSETS_MS[i]));
      } catch {
        /* localStorage unavailable — non-fatal */
      }
      break;
    } catch (e) {
      const status = (e as { status?: number } | null)?.status;
      // A 401 here is almost always the per-account MONOTONIC-TIMESTAMP race, not a
      // bad key. The guardian shares a strictly-increasing x-timestamp high-water
      // mark across every client that touches the account (wallet + dApp), and the
      // wallet keeps advancing it. Proven for this account: the digest/key/scheme we
      // sign are byte-identical to the wallet's OWN successful getState — the only
      // difference is the timestamp. The 0.16 guardian sanitizes the old "Replay
      // attack" wording to a generic `authentication_failed`, so detect the race by
      // STATUS (401), not the legacy string. Escalate our timestamp up the ladder
      // and retry; only give up once the whole ladder is exhausted.
      const isAuthRace = status === 401 || isReplay(e);
      if (isAuthRace) {
        if (i < OFFSETS_MS.length - 1) continue; // push timestamp further ahead, retry
        throw new Error(
          `guardian rejected authentication for ${accountIdStr} (401) even after escalating ` +
            `the timestamp to +${OFFSETS_MS[i]}ms. The wallet may be holding the account's ` +
            `guardian timestamp ahead of us — close the wallet side-panel and retry. If it ` +
            `persists it's a genuine auth/cosigner mismatch, not the timestamp race.`,
        );
      }

      // 404 (or any other non-auth failure) → the PSM genuinely doesn't know this
      // account (e.g. a Fully-Private / non-guardian wallet, which returns 404).
      // Signal the caller to fall back to the normal wallet submit flow.
      throw new NotAGuardianAccountError(
        `guardian load failed for ${accountIdStr}: ${e instanceof Error ? e.message : e}`,
      );
    }
  }
  if (!multisig) {
    throw new Error(`guardian load returned no multisig for ${accountIdStr}`);
  }

  // 3b. `load()` inserts the guardian account anchored at the guardian's snapshot
  //     block, but the shared client's chain MMR was already advanced by the app's
  //     background sync. Executing then fails: "partial blockchain has length N
  //     which does not match block number M". Sync the shared client so the account
  //     anchor and the chain tip agree before we build/execute the transaction.
  try {
    await p.client.sync();
  } catch {
    /* best-effort: a sync failure here is non-fatal, continue to execution */
  }

  // 4. Create the CUSTOM proposal from the pre-serialized request, then cosign it
  //    (1-of-1 → once; for threshold>1 other cosigners sign the same id).
  const proposal = await multisig.createCustomProposal(requestBytes, 'midenid_register');
  await multisig.signProposal(proposal.id);

  // 5. CUSTOM proposals can't use executeProposal (#266). Instead: prepare the
  //    execution advice (cosigner + guardian signatures), fold it into the
  //    request's advice map, and submit the rebuilt request.
  const advice = await multisig.prepareCustomExecution(proposal.id, requestBytes);
  const finalRequest = TransactionRequest.deserialize(requestBytes).extendAdviceMap(advice);
  try {
    await multisig.submitTransaction(finalRequest);
  } catch (e) {
    // The OZ prover workflow runs `executeRequest → prove → submit(node) →
    // apply(local store)`. The FINAL apply() step — which only mirrors the new
    // account state into the local IndexedDB store — can throw
    //   "failed to apply transaction result: storage error: account data wasn't
    //    found for account id <acct>"
    // for a fresh guardian account. By then proof.submit() has ALREADY landed the
    // transaction on-chain (verified: register note created + consumed by the
    // registry), so this is a cosmetic local-bookkeeping failure, not a real
    // registration failure. Swallow ONLY the apply-stage error and treat the
    // registration as successful.
    if (isPostSubmitApplyError(e)) {
      console.warn(
        '[registerViaMultisig] transaction submitted on-chain but local apply() failed ' +
          '(cosmetic; the note is already on-chain). Treating as success.',
        e,
      );
      // The local store is now stale (the nonce bump was not mirrored). Best-effort
      // resync so subsequent reads/registrations see the current state.
      try {
        await p.client.sync();
      } catch {
        /* non-fatal: the next background sync will reconcile */
      }
    } else {
      // Genuine PRE-submit failure — most importantly the mempool/stored-state
      // conflict ("...transaction conflicts with current mempool state ... initial
      // account commitment X does not match the current commitment Y") thrown by
      // proof.submit() BEFORE apply(), which means NOTHING landed. Before surfacing
      // it, dump the guardian's delta lifecycle so we can tell a guardian
      // canonicalization gap from a client-side divergence (per OZ CONCEPTS.md /
      // TROUBLESHOOTING.md). Read-only — never changes the outcome, always rethrows.
      if (isGuardianStateConflict(e)) {
        await logGuardianDeltaDiagnostics(msClient, multisig, accountIdStr).catch((de) =>
          console.warn('[guardian-diag] diagnostics failed', de),
        );
      }
      throw e;
    }
  }

  return { noteId, proposalId: proposal.id };
}

/**
 * True for the OZ prover-workflow error thrown by the LOCAL `submission.apply()`
 * step (mirroring state into the client store) — which runs AFTER the node has
 * already accepted the transaction. Matching on the "apply transaction result"
 * wording keeps genuine "failed to submit proven transaction" errors (mempool
 * conflicts, RPC rejections) propagating as real failures.
 */
function isPostSubmitApplyError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.includes('failed to apply transaction result');
}

/**
 * True for the node's pre-submit rejection when the transaction's initial account
 * commitment doesn't match the account's current on-chain/mempool commitment —
 * i.e. we built on stale state the guardian served via `load()`.
 */
function isGuardianStateConflict(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return (
    msg.includes('conflicts with current mempool state') ||
    msg.includes('does not match the current commitment')
  );
}

/** Minimal structural views of the OZ objects we introspect (fields we read). */
interface DeltaLike {
  nonce?: number;
  prevCommitment?: string;
  newCommitment?: string;
  // DeltaObject.status is itself an object: { status: 'candidate'|'canonical'|
  // 'retained'|'discarded'|...; reason?: 'retry_exhausted'|'diverged'|... }.
  status?: { status?: string; reason?: string } | string;
}
interface GuardianDeltaApi {
  getDeltaProposals(accountId: string): Promise<DeltaLike[]>;
  getDeltaSince(accountId: string, fromNonce: number): Promise<DeltaLike>;
}
interface StateIntrospectable {
  verifyStateCommitment(): Promise<{ localCommitment: string; onChainCommitment: string }>;
}

function summarizeDelta(d: DeltaLike | undefined | null): unknown {
  if (!d || typeof d !== 'object') return d;
  const status = typeof d.status === 'object' ? d.status?.status : d.status;
  const reason = typeof d.status === 'object' ? d.status?.reason : undefined;
  return {
    nonce: d.nonce,
    status,
    reason,
    prevCommitment: d.prevCommitment,
    newCommitment: d.newCommitment,
  };
}

/**
 * READ-ONLY guardian delta diagnostics. Prints, on a stored-state conflict, enough
 * to classify the failure without guessing (see OZ CONCEPTS.md canonicalization
 * lifecycle):
 *  - guardian/local commitment vs on-chain (via verifyStateCommitment): MATCH means
 *    the conflict is elsewhere; MISMATCH means the guardian is behind/diverged.
 *  - each known delta's { nonce, status, reason, prev/newCommitment }: a `canonical`
 *    delta means the tx actually landed (our load()/stale handling is the bug); a
 *    `retained` delta whose newCommitment == the on-chain commitment is a guardian
 *    reconcile gap (file OZ issue); a `retained`/`discarded` delta whose
 *    newCommitment != on-chain is a client-side divergence (fix our build/submit).
 * Never throws into the caller — diagnostics must not mask the real error.
 */
async function logGuardianDeltaDiagnostics(
  msClient: MultisigClient,
  multisig: StateIntrospectable,
  accountId: string,
): Promise<void> {
  try {
    const v = await multisig.verifyStateCommitment();
    const match = v.localCommitment === v.onChainCommitment;
    console.log(
      `[guardian-diag] commitments: guardian/local=${v.localCommitment} on-chain=${v.onChainCommitment} ` +
        `→ ${match ? 'MATCH' : 'MISMATCH (guardian stored state behind/diverged from chain)'}`,
    );
  } catch (e) {
    console.warn('[guardian-diag] verifyStateCommitment failed', e);
  }

  const guardian = (msClient as unknown as { guardianClient: GuardianDeltaApi }).guardianClient;
  try {
    const since = await guardian.getDeltaSince(accountId, 0);
    console.log('[guardian-diag] getDeltaSince(nonce=0):', summarizeDelta(since));
  } catch (e) {
    console.warn('[guardian-diag] getDeltaSince failed', e);
  }
  try {
    const proposals = await guardian.getDeltaProposals(accountId);
    console.log(
      `[guardian-diag] ${Array.isArray(proposals) ? proposals.length : '?'} delta proposal(s):`,
      Array.isArray(proposals) ? proposals.map(summarizeDelta) : proposals,
    );
  } catch (e) {
    console.warn('[guardian-diag] getDeltaProposals failed', e);
  }
}
