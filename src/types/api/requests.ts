// Authentication
export interface SignatureAuth {
  message_hex: string;
  pubkey_hex: string;
  signature_hex: string;
}

// Domain Management
export interface CreateDomainMetadataRequest {
  domain: string;
  account_id: string;
  bech32: string;
  created_block: number;
  updated_block: number;
  metadata?: Record<string, any> | null;
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

// Domain Registration
export interface RegisterDomainRequest {
  note_inputs_hex: string;
}

// Batch Operations
export interface BatchGetProfilesRequest {
  domains: string[];
}
