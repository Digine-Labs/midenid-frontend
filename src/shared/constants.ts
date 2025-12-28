export const MIDEN_ID_CONTRACT_ADDRESS = "0xf090f55f132c11405c162476ac8469";
export const MIDEN_FAUCET_CONTRACT_ADDRESS = "0x54bf4e12ef20082070758b022456c7";
export const MIDEN_FAUCET_ID_BECH32 = "mtst1ap2t7nsjausqsgrswk9syfzkcu328yna";
// export const API_BASE = "https://midenid-backend.onrender.com";
export const API_BASE = "http://localhost:3080";

// Validation constraints matching backend database
export const VALIDATION = {
  DOMAIN_MAX: 20,
  BIO_MAX: 500,
  SOCIAL_MAX: 50,      // twitter, github, discord, telegram
  IMAGE_URL_MAX: 500,
  ACCOUNT_ID_LENGTH: 32,  // 0x + 30 hex chars
} as const;
