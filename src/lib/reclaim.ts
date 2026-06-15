import { MIDEN_FAUCET_ID_BECH32 } from '@/shared/constants';

/**
 * Blocks that must pass since a note's block before the sender may reclaim it,
 * mirroring a P2IDE `reclaim_height`. The note must also still be unconsumed.
 */
export const RECLAIM_AFTER_BLOCKS = 300;

/**
 * Builds the consume payload to reclaim a register-note's assets back to the
 * sender, for `useWallet().requestConsume`. Our register-notes are public and
 * carry a single MIDEN fungible asset.
 *
 * NOTE: this only succeeds once the register-note script supports sender
 * reclaim (P2IDE-style); current notes have no reclaim branch, so the wallet
 * will reject it. The UI gates the button on the same conditions regardless.
 */
export function buildReclaimConsume(note: { noteId: string; amount: string | bigint }) {
  return {
    faucetId: MIDEN_FAUCET_ID_BECH32,
    noteId: note.noteId,
    noteType: 'public' as const,
    amount: Number(note.amount),
  };
}
