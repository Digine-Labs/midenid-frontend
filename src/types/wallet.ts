import type { AccountId } from '@demox-labs/miden-sdk';
import type { PendingTransaction } from './transaction';

// Wallet account context value (from contexts/WalletAccountContext.tsx)
export interface WalletAccountContextValue {
  accountId: AccountId | undefined;
  bech32: string | null;
  balance: bigint | null;
  hasRegisteredDomain: boolean;
  activeDomain: string | null;
  allDomains: string[] | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refetch: () => void;
  // Transaction monitoring
  pendingTransactions: PendingTransaction[];
  isMonitoringTransactions: boolean;
  addPendingTransaction: (transaction: Omit<PendingTransaction, 'timestamp' | 'attemptCount'>) => void;
  isDomainConfirmed: (domain: string) => boolean;
  confirmedDomains: Map<string, boolean>;
}
