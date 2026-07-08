export const MIDEN_ID_CONTRACT_ADDRESS = '0xa57d6b12bebc6671339efefba10417';
// Block at which the registry contract was created. Used as the lower bound for
// on-chain note lookups (e.g. the Reclaim scan) — there can be no register-notes
// before this block, so scanning earlier is wasted work.
// TODO(0.15): update to the 0.15 registry's creation block (~268698). 226699 is
// the OLD contract's block — safe (only over-scans) but not optimal.
export const MIDEN_ID_CONTRACT_CREATION_BLOCK = 226699;
export const MIDEN_FAUCET_CONTRACT_ADDRESS = '0x2458e5446128e6b150b75b8ebd9ce1';
export const MIDEN_FAUCET_ID_BECH32 = 'mtst1aqj93e2yvy5wdv2skadca0vuuypfnp80_qr7qqq9wr6w';
export const API_BASE = 'https://midenid-backend.onrender.com';
// 5 * 1024 * 1024 = 5 MB
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
