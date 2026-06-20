export const MIDEN_ID_CONTRACT_ADDRESS = '0x88f63686037e63406bbb8f5d01adb0';
export const MIDEN_FAUCET_CONTRACT_ADDRESS = '0x0a7d175ed63ec5200fb2ced86f6aa5';
export const MIDEN_FAUCET_ID_BECH32 = 'mtst1aq9869676clv2gq0kt8dsmm255zs6hs3_qr7qqq9wr6w';
// Single backend base URL, used by every API call AND the device-flow sign-request
// relay (which lives in the same backend — see midenname-agent-skills/design/
// device-flow-signing.md). Override with VITE_API_BASE (e.g. http://localhost:3080
// for local dev). `import.meta.env` is typed by vite/client in the app build but
// NOT when this module is imported by vite.config.ts (Node context), so read it
// through a cast that compiles in both — and it's undefined at config-eval time, so
// optional-chain it.
const VITE_ENV = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
export const API_BASE = VITE_ENV?.VITE_API_BASE ?? 'https://midenid-backend.onrender.com';
// 5 * 1024 * 1024 = 5 MB
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
