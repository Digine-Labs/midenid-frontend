// Domain Responses
export interface AccountToAllDomainsResponse {
  account_id: string;
  bech32: string;
  domains: string[];
  active_domain: string | null;
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
