/**
 * Per-wallet localStorage cache of register-notes this browser sent to the
 * registry. Written at registration time so the Transactions list renders with
 * zero RPC calls. Status is intentionally NOT stored (it changes over time —
 * each row checks it live on demand).
 *
 * Entries are keyed by the sender's wallet address, so connecting a different
 * wallet shows a different list and never another wallet's transactions.
 */
export interface StoredSentNote {
  noteId: string;
  /** Decoded domain label, e.g. "alice" (render as `alice.miden`). */
  domain: string;
  /** Payment amount in MIDEN base units, serialized (bigint isn't JSON-safe). */
  amount: string;
  /** Approximate block height when the note was submitted. */
  blockNumber: number;
  /** Submission time (ms epoch). */
  timestamp: number;
}

const KEY_PREFIX = 'midenid:sent-notes:';
const MAX_ENTRIES = 200;

function keyFor(account: string): string {
  return `${KEY_PREFIX}${account}`;
}

function isAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/** Returns the stored notes for a wallet address, newest first. */
export function getSentNotes(account: string): StoredSentNote[] {
  if (!isAvailable() || !account) return [];
  try {
    const raw = window.localStorage.getItem(keyFor(account));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredSentNote[]) : [];
  } catch {
    return [];
  }
}

/**
 * Adds (or refreshes) a note for a wallet address. Deduplicated by `noteId`;
 * newest entries are kept first and the list is capped.
 */
export function addSentNote(account: string, note: StoredSentNote): void {
  if (!isAvailable() || !account) return;
  try {
    const existing = getSentNotes(account).filter(n => n.noteId !== note.noteId);
    const next = [note, ...existing].slice(0, MAX_ENTRIES);
    window.localStorage.setItem(keyFor(account), JSON.stringify(next));
  } catch {
    // Storage full / disabled — non-fatal; the on-chain Reclaim lookup still works.
  }
}
