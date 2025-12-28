import type { DomainMetadata, Profile } from './api';

// Re-export domain-related types from API
export type { DomainMetadata };

// Domain-specific utility types
export interface EnrichedDomain {
  domain: string;
  account_id: string;
  bech32: string;
  created_block: number;
  updated_block: number;
  metadata?: Record<string, any> | null;
  profile?: Profile | null;
}
