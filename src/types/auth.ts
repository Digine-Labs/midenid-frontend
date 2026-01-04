import type { SignatureAuth, VerifySignatureRequest, VerifySignatureResponse } from './api';

// Re-export API auth types
export type { SignatureAuth, VerifySignatureRequest, VerifySignatureResponse };

// Signed data type (from lib/midenClient.ts) - used for profile signing
export interface SignedData {
  message_hex: string;
  pubkey_hex: string;
  signature_hex: string;
}
