import type { ReactNode } from 'react';

// Domain registration context (from contexts/DomainRegistrationContext.tsx)
export interface DomainRegistrationContextType {
  onRegistrationComplete: () => void;
}

export interface DomainRegistrationProviderProps {
  children: ReactNode;
  onRegistrationComplete: () => void;
}

// Wallet account context is in wallet.ts (to avoid circular deps)
