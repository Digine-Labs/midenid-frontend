// Auto-generated types from OpenAPI specification

/**
 * Signature authentication data for API requests
 * All authenticated API requests must include these fields
 */
export interface SignatureAuth {
  message_hex: string;
  pubkey_hex: string;
  signature_hex: string;
}

/**
 * Domain metadata from database
 */
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

/**
 * Profile data from database
 */
export interface Profile {
  id: number;
  domain_id: number;
  bio?: string | null;
  twitter?: string | null;
  github?: string | null;
  discord?: string | null;
  telegram?: string | null;
  image_url?: string | null;
  created_block: number;
  updated_block: number;
  created_at: string;
  updated_at: string;
}

/**
 * Enriched domain response with metadata and profile
 */
export interface EnrichedDomainResponse {
  domain: string;
  account_id: string;
  bech32: string;
  created_block: number;
  updated_block: number;
  metadata?: Record<string, any> | null;
  profile?: Profile | null;
}

/**
 * Account to domain response
 */
export interface AccountToDomainResponse {
  account_id: string;
  domain?: string | null;
  bech32?: string | null;
}

/**
 * Account to all domains response
 */
export interface AccountToAllDomainsResponse {
  account_id: string;
  bech32: string;
  domains: string[];
  active_domain?: string | null;
}

/**
 * Batch account item
 */
export interface BatchAccountItem {
  account_id: string;
}

/**
 * Batch account to domain request
 */
export interface BatchAccountToDomainRequest {
  accounts: BatchAccountItem[];
}

/**
 * Batch account to domain response
 */
export interface BatchAccountToDomainResponse {
  results: AccountToDomainResponse[];
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: string;
  version: string;
}

/**
 * Home response
 */
export interface HomeResponse {
  message: string;
}

/**
 * Account exists response
 */
export interface AccountExistsResponse {
  account_id: string;
  exists: boolean;
}

/**
 * Block number response
 */
export interface BlockNumberResponse {
  block_number: number;
}

/**
 * Verify signature request
 */
export interface VerifySignatureRequest {
  message_hex: string;
  pubkey_hex: string;
  signature_hex: string;
}

/**
 * Verify signature response
 */
export interface VerifySignatureResponse {
  valid: boolean;
  message?: string | null;
  signature_length?: number | null;
}

/**
 * Create domain metadata request
 */
export interface CreateDomainMetadataRequest {
  domain: string;
  account_id: string;
  bech32: string;
  created_block: number;
  updated_block: number;
  metadata?: Record<string, any> | null;
}

/**
 * Update domain metadata request
 */
export interface UpdateDomainMetadataRequest {
  metadata?: Record<string, any> | null;
  updated_block?: number | null;
}

/**
 * Upsert profile request
 * Authentication is now handled via session cookie, no signature needed in body
 */
export interface UpsertProfileRequest {
  bio?: string | null;
  twitter?: string | null;
  github?: string | null;
  discord?: string | null;
  telegram?: string | null;
  image_url?: string | null;
  block_number?: number;
}

/**
 * Single profile result in batch response
 */
export interface ProfileResult {
  domain: string;
  profile?: Profile | null;
}

/**
 * Batch get profiles request
 */
export interface BatchGetProfilesRequest {
  domains: string[];
}

/**
 * Batch get profiles response
 */
export interface BatchGetProfilesResponse {
  results: ProfileResult[];
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
