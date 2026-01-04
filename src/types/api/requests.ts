// Authentication
export interface SignatureAuth {
  message_hex: string;
  pubkey_hex: string;
  signature_hex: string;
  account_id: string;
}

export interface VerifySignatureRequest {
  message_hex: string;
  pubkey_hex: string;
  signature_hex: string;
  account_id: string;
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

export interface UpdateDomainMetadataRequest {
  metadata?: Record<string, any> | null;
  updated_block: number;
}

// Profile Management (uses session cookie auth, no signature needed in body)
export interface UpsertProfileRequest {
  bio?: string;
  twitter?: string;
  github?: string;
  discord?: string;
  telegram?: string;
  image_url?: string;
  block_number?: number;
}

// Batch Operations
export interface BatchAccountItem {
  account_id: string;
}

export interface BatchAccountToDomainRequest {
  accounts: BatchAccountItem[];
}

export interface BatchGetProfilesRequest {
  domains: string[];
}
