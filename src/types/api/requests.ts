// Authentication
export interface SignatureAuth {
  message_hex: string;
  pubkey_hex: string;
  signature_hex: string;
}

// Profile Management
export interface UpsertProfileRequest extends SignatureAuth {
  bio?: string;
  twitter?: string;
  github?: string;
  discord?: string;
  telegram?: string;
  image_url?: string;
  block_number: number;
}

// Batch Operations
export interface BatchGetProfilesRequest {
  domains: string[];
}
