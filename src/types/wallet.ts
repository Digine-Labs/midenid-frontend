import type { AccountId } from '@demox-labs/miden-sdk';

// Wallet account context value (from contexts/WalletAccountContext.tsx)
export interface WalletAccountContextValue {
  accountId: AccountId | undefined;
  bech32: string | null;
  balance: bigint | null;
  hasRegisteredDomain: boolean;
  activeDomain: string | null;
  allDomains: string[] | null;
  isLoading: boolean;
  refetch: () => void;
  // Transaction monitoring
}
