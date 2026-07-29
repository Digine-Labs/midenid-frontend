// The registry address, note-script bytes and storage slot names all come from the
// midenname-contracts-rs deploy tooling. Never hand-edit them here — regenerate with:
//   cargo run -p integration --release --bin export-frontend -- --registry 0x...
// and overwrite src/shared/generated/registry.ts with the output.
export { MIDEN_ID_CONTRACT_ADDRESS } from './generated/registry';

// Block at which the registry contract was created. Used as the lower bound for
// on-chain note lookups (e.g. the Reclaim scan) — there can be no register-notes
// before this block, so scanning earlier is wasted work.
//
// The Rust registry (0x5d5458f5…) was deployed at roughly block 1037400; this is
// rounded down for margin. Update it whenever the registry is redeployed, or the
// Reclaim scan will miss notes.
export const MIDEN_ID_CONTRACT_CREATION_BLOCK = 1037000;
export const MIDEN_FAUCET_CONTRACT_ADDRESS = '0x2458e5446128e6b150b75b8ebd9ce1';
export const MIDEN_FAUCET_ID_BECH32 = 'mtst1aqj93e2yvy5wdv2skadca0vuuypfnp80_qr7qqq9wr6w';
export const API_BASE = 'https://midenid-backend.onrender.com';
// 5 * 1024 * 1024 = 5 MB
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
