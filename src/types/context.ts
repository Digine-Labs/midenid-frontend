import type { ReactNode } from 'react';
import type { WebClient, AccountId } from '@demox-labs/miden-sdk';

// Client context for managing WebClient singleton
export interface ClientContextValue {
  client: WebClient | null;
  isInitializing: boolean;
  isReady: boolean;
  error: Error | null;
  importAccounts: (accounts: AccountId[]) => Promise<void>;
  reinitialize: () => Promise<void>;
}

// Domain registration context (from contexts/DomainRegistrationContext.tsx)
export interface DomainRegistrationContextType {
  onRegistrationComplete: () => void;
}

export interface DomainRegistrationProviderProps {
  children: ReactNode;
  onRegistrationComplete: () => void;
}

// Wallet account context is in wallet.ts (to avoid circular deps)
