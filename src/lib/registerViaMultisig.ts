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
 *     wallet doesn't expose it either, so we hardcode one operator's endpoint.
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

// The guardian/PSM service the wallet's accounts are registered with. Must match
// the wallet's guardian, or MultisigClient.load() fails.
const GUARDIAN_ENDPOINT = import.meta.env.VITE_GUARDIAN_ENDPOINT as string | undefined;

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
  if (!GUARDIAN_ENDPOINT) {
    throw new Error(
      'VITE_GUARDIAN_ENDPOINT is not set — cannot reach the guardian service for the multisig flow.',
    );
  }

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
  const msClient = new MultisigClient(p.client, { guardianEndpoint: GUARDIAN_ENDPOINT });

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
      if (isReplay(e)) {
        if (i < OFFSETS_MS.length - 1) continue; // escalate and retry
        throw new Error(
          `guardian replay-lock: even +${OFFSETS_MS[i]}ms was rejected for ${accountIdStr}. ` +
            `Another client is holding the account's timestamp ahead of us — retry shortly.`,
        );
      }
      // Not a replay → the PSM genuinely doesn't know this account.
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
  await multisig.submitTransaction(finalRequest);

  return { noteId, proposalId: proposal.id };
}
