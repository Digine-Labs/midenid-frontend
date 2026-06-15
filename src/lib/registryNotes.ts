import {
  AccountId,
  Endpoint,
  NoteId,
  NoteTag,
  RpcClient,
  Word,
} from '@miden-sdk/miden-sdk';
import { decodeDomain } from '@/utils/decode';
import {
  MIDEN_FAUCET_ID_BECH32,
  MIDEN_ID_CONTRACT_ADDRESS,
  MIDEN_ID_CONTRACT_CREATION_BLOCK,
} from '@/shared/constants';

/**
 * A register-note this wallet sent to the registry contract, flattened to plain
 * JS values. We never keep WASM-backed SDK objects in this struct (they'd leak /
 * become use-after-free once the underlying client is freed); everything is a
 * string / bigint / number that React can hold safely.
 */
export interface SentNote {
  noteId: string;
  /** Decoded domain label, e.g. "alice" (render as `alice.miden`). */
  domain: string;
  /** Payment amount in MIDEN base units (divide by 1e6 for display). */
  amount: bigint;
  /** Block height at which the note was committed. */
  blockNum: number;
  /** `consumed` = registry processed it; `waiting` = still un-consumed on-chain. */
  status: 'consumed' | 'waiting';
}

// Runaway guard for the discovery loop. Each iteration is one syncNotes RPC;
// the node advances the cursor per page of tag matches, so realistically far
// fewer than this. Bumped high because the Reclaim scan now covers full history
// (contract creation → tip). A console.warn fires if the cap is ever reached.
const MAX_SCAN_PAGES = 1000;

/**
 * Live status of a single note, looked up directly by id (one cheap RPC, plus a
 * nullifier check when it exists). Used by the per-row "Check status" button.
 *
 * - `not-found`: the note doesn't exist on-chain (never committed, wrong id, or
 *   consumed-and-pruned long ago) — NOT reclaimable.
 * - `waiting`: committed but not yet consumed — reclaimable once the block
 *   window has passed.
 * - `consumed`: consumed by the registry (registration succeeded).
 */
export type NoteLiveStatus = 'not-found' | 'waiting' | 'consumed';

export async function checkNoteStatus(noteId: string): Promise<NoteLiveStatus> {
  const rpc = new RpcClient(Endpoint.testnet());
  try {
    let id: NoteId;
    try {
      id = NoteId.fromHex(noteId);
    } catch {
      return 'not-found';
    }

    const fetched = await rpc.getNotesById([id]);
    if (!fetched || fetched.length === 0) return 'not-found';

    const fn = fetched[0];
    const input = fn.asInputNote();
    if (!input) return 'waiting'; // present but body unavailable (private) — treat as live
    const note = input.note();
    const block = fn.inclusionProof.location().blockNum();

    const commitHeight = await rpc.getNullifierCommitHeight(note.nullifier(), block);
    return commitHeight !== undefined ? 'consumed' : 'waiting';
  } finally {
    rpc.free();
  }
}

// Layout of the register note's storage (inputs), from RegisterModal:
//   [0..3] = TOKEN (faucet suffix, prefix, 0, 0)
//   [4..7] = DOMAIN word (felt0, felt1, felt2, length)
const DOMAIN_FELT_OFFSET = 4;

/**
 * Fetches every register-note the connected wallet sent to the registry contract
 * since the contract was created (full history). Frontend-only: uses a standalone
 * read-only `RpcClient` rather than the worker-backed client, so it neither blocks
 * the client mutex nor pollutes the local IndexedDB store with other users' notes.
 *
 * Notes are discoverable on the node only by their *tag* (the registry), so we
 * scan the registry tag and filter on `sender` — the tag is best-effort, so the
 * sender filter is mandatory, not an optimisation. Used by the Reclaim lookup,
 * which needs to find notes that aren't in this browser's localStorage.
 *
 * @param userAccountId - the connected wallet's account id (the note sender).
 * @param tipHint - a known chain tip (e.g. the provider's `syncedBlock`) to skip
 *   one RPC; when absent we fetch the latest block header.
 */
export async function fetchSentRegistryNotes(
  userAccountId: AccountId,
  tipHint?: number | null,
): Promise<SentNote[]> {
  const rpc = new RpcClient(Endpoint.testnet());

  try {
    const faucetId = AccountId.fromBech32(MIDEN_FAUCET_ID_BECH32);
    const faucetKey = faucetId.toString();
    const userId = userAccountId.toString();

    // 1. Determine the chain tip. Scan from the contract's creation block — there
    //    can be no register-notes before it.
    let tip = tipHint && tipHint > 0 ? tipHint : 0;
    if (!tip) {
      const latest = await rpc.getBlockHeaderByNumber();
      tip = latest.blockNum();
    }
    const from = Math.min(MIDEN_ID_CONTRACT_CREATION_BLOCK, tip);

    // 2. Discover the user's note ids by scanning the registry tag. syncNotes
    //    returns a page plus a `blockTo` cursor; loop until we reach the tip.
    //    We page against a fixed `tip` snapshot (and bound the node scan with it)
    //    rather than the live chain tip — testnet keeps producing blocks, so
    //    chasing `chainTip()` would never terminate.
    const noteIds: NoteId[] = [];
    const seen = new Set<string>();
    let cursor = from;
    let guard = 0;
    for (; guard < MAX_SCAN_PAGES; guard++) {
      // A fresh NoteTag per call: wasm-bindgen consumes (frees) by-value args,
      // so the tag can't be reused across iterations.
      const registryId = AccountId.fromHex(MIDEN_ID_CONTRACT_ADDRESS);
      const tag = NoteTag.withAccountTarget(registryId);
      const info = await rpc.syncNotes(cursor, tip, [tag]);

      for (const block of info.blocks()) {
        for (const committed of block.notes()) {
          if (committed.sender().toString() !== userId) continue;
          const id = committed.noteId();
          const idStr = id.toString();
          if (seen.has(idStr)) continue;
          seen.add(idStr);
          noteIds.push(id);
        }
      }

      const next = info.blockTo();
      if (next >= tip || next <= cursor) break;
      cursor = next;
    }
    if (guard >= MAX_SCAN_PAGES) {
      console.warn(
        `[registryNotes] scan hit the ${MAX_SCAN_PAGES}-page cap; results may be incomplete`,
      );
    }

    if (noteIds.length === 0) return [];

    // 3. Hydrate full note data (public notes carry everything on-chain).
    const fetched = await rpc.getNotesById(noteIds);

    const results: SentNote[] = [];
    for (const fn of fetched) {
      try {
        const input = fn.asInputNote();
        if (!input) continue; // private/no body — our notes are public, so skip oddities
        const note = input.note();

        // Domain — felts [4..7] reconstruct the original encoded domain Word.
        const items = note.recipient().storage().items();
        const domainWord = Word.newFromFelts([
          items[DOMAIN_FELT_OFFSET],
          items[DOMAIN_FELT_OFFSET + 1],
          items[DOMAIN_FELT_OFFSET + 2],
          items[DOMAIN_FELT_OFFSET + 3],
        ]);
        let domain: string;
        try {
          domain = decodeDomain(domainWord);
        } catch {
          domain = '(unknown)';
        }

        // Amount — the MIDEN fungible asset locked in the note.
        const assets = note.assets().fungibleAssets();
        const midenAsset =
          assets.find(a => a.faucetId().toString() === faucetKey) ?? assets[0];
        const amount = midenAsset ? midenAsset.amount() : 0n;

        // Block number — from the inclusion proof location.
        const blockNum = fn.inclusionProof.location().blockNum();

        // Status — a committed nullifier means the note has been consumed.
        const commitHeight = await rpc.getNullifierCommitHeight(
          note.nullifier(),
          blockNum,
        );
        const status: SentNote['status'] =
          commitHeight !== undefined ? 'consumed' : 'waiting';

        results.push({
          noteId: fn.noteId.toString(),
          domain,
          amount,
          blockNum,
          status,
        });
      } catch (e) {
        // Skip a note we can't decode rather than failing the whole list.
        console.warn('[registryNotes] failed to decode a note (skipping)', e);
      }
    }

    // Newest first.
    results.sort((a, b) => b.blockNum - a.blockNum);
    return results;
  } finally {
    rpc.free();
  }
}
