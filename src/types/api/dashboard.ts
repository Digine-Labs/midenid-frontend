/**
 * Dashboard API types
 * Session-based authentication for admin dashboard
 */

// Request types
export interface DashboardLoginRequest {
  username: string;
  password: string;
}

// Response types
export interface DashboardLoginResponse {
  success: boolean;
  message: string;
}

export interface DashboardLogoutResponse {
  success: boolean;
  message: string;
}

export interface BlockchainStatus {
  current_block: number;
  sync_interval_secs: number;
}

export interface NotificationStatus {
  telegram_enabled: boolean;
}

export interface DomainRegistration {
  domain: string;
  account_id: string;
  created_block: number;
  created_at: string;
}

export interface SystemStats {
  total_domains: number;
  total_profiles: number;
  last_store_reset: string | null;
}

export interface DashboardData {
  blockchain: BlockchainStatus;
  notifications: NotificationStatus;
  recent_domains: DomainRegistration[];
  stats: SystemStats;
}

export interface DashboardErrorResponse {
  error: string;
}

// Valid limit values for dashboard data
export type DashboardLimit = 10 | 25 | 50 | 100;

// Admin action response types
export interface ResetStoreResponse {
  success: boolean;
  message: string;
}

export interface TelegramStatusResponse {
  enabled: boolean;
  message: string;
}

export interface TelegramToggleResponse {
  enabled: boolean;
  message: string;
}
