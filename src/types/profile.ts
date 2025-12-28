import type { Profile, UpsertProfileRequest } from './api';

// Re-export from API
export type { Profile };

// Profile utility types (from api/profile.ts)
export type ProfileData = Omit<
  Profile,
  'id' | 'domain_id' | 'created_block' | 'updated_block'
>;

export type ProfilePayload = UpsertProfileRequest;

// Message creation parameters (from utils/format.ts)
export interface CreateMessageParams {
  domain: string;
  bio?: string;
  twitter?: string;
  github?: string;
  discord?: string;
  telegram?: string;
  image_url?: string;
}
