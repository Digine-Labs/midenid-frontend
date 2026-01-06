// Domain Responses
export interface DomainMetadata {
  id: number;
  domain: string;
  account_id: string;
  bech32: string;
  created_block: number;
  updated_block: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  metadata?: Record<string, any> | null;
}

export interface AccountToAllDomainsResponse {
  account_id: string;
  bech32: string;
  domains: string[];
  active_domain: string | null;
}

export interface DomainAvailabilityResponse {
  domain: string;
  available: boolean;
  block_number: number;
}

// Profile Responses
export interface Profile {
  id: number;
  domain_id: number;
  bio?: string;
  twitter?: string;
  github?: string;
  discord?: string;
  telegram?: string;
  image_url?: string;
  created_block: number;
  updated_block: number;
  created_at: string;
  updated_at: string;
}

// Batch Responses
export interface BatchGetProfilesResponse {
  results: {
    domain: string;
    profile?: Profile | null;
  }[];
}

// Domain registration response
export interface RegisterDomainResponse {
  transaction_request_hex: string;
}

// Miden blockchain responses
export interface MidenBalanceResponse {
  account_id: string;
  balance: string;
}
