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

export interface AccountToDomainResponse {
  account_id: string;
  domain: string | null;
  bech32: string;
}

export interface AccountToAllDomainsResponse {
  account_id: string;
  bech32: string;
  domains: string[];
  active_domain: string | null;
}

export interface EnrichedDomainResponse {
  domain: string;
  account_id: string;
  bech32: string;
  created_block: number;
  updated_block: number;
  metadata?: Record<string, any> | null;
  profile?: Profile | null;
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

export interface ProfileResult {
  domain: string;
  profile?: Profile | null;
}

// Batch Responses
export interface BatchAccountToDomainResponse {
  results: AccountToDomainResponse[];
}

export interface BatchGetProfilesResponse {
  results: ProfileResult[];
}

export interface VerifySignatureResponse {
  valid: boolean;
  message?: string;
  signature_length?: number;
}
