import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from 'react';
import { useWallet } from '@demox-labs/miden-wallet-adapter-react';
import { AccountId } from '@demox-labs/miden-sdk';
import { bech32ToAccountId } from '@/lib/midenClient';
import { getAccountAllDomains } from '@/api/accounts';
import { useBalance } from '@/hooks/useBalance';
import { MIDEN_FAUCET_CONTRACT_ADDRESS } from '@/shared/constants';
import { usePendingTransactions } from '@/hooks/usePendingTransactions';
import type { WalletAccountContextValue } from '@/types/wallet';

const WalletAccountContext = createContext<WalletAccountContextValue | undefined>(undefined);

export function WalletAccountProvider({ children }: { children: ReactNode }) {
  const { connected, address: rawAccountId } = useWallet();
  const [accountId, setAccountId] = useState<AccountId | undefined>(undefined);
  const bech32 = rawAccountId;
  const [hasRegisteredDomain, setHasRegisteredDomain] = useState(false);
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const [allDomains, setAllDomains] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Faucet ID for balance queries
  const faucetId = useMemo(
    () => AccountId.fromHex(MIDEN_FAUCET_CONTRACT_ADDRESS as string),
    []
  );

  // Get user balance with automatic polling
  const balance = useBalance({ accountId, faucetId });

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  // Monitor pending transactions
  const {
    pending: pendingTransactions,
    isMonitoring: isMonitoringTransactions,
    addPendingTransaction,
    isDomainConfirmed,
    confirmedDomains
  } = usePendingTransactions(accountId?.toString(), refetch);

  // Convert Bech32 accountId to AccountId when wallet connects
  useEffect(() => {
    if (!connected || !rawAccountId) {
      setAccountId(undefined);
      setHasRegisteredDomain(false);
      setActiveDomain(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const id = bech32ToAccountId(rawAccountId);
      setAccountId(id);
    } catch (error) {
      console.error('Failed to convert accountId:', error);
      setAccountId(undefined);
      setIsLoading(false);
    }
  }, [connected, rawAccountId]);

  // Fetch wallet data when accountId changes
  useEffect(() => {
    if (!accountId || !connected) {
      // Only reset loading if we're not connected (disconnected case)
      if (!connected) {
        setIsLoading(false);
      }
      return;
    }

    let isActive = true;

    const fetchWalletData = async () => {
      try {
        const allDomainsResponse = await getAccountAllDomains(accountId.toString());
        if (allDomainsResponse.success && allDomainsResponse.data) {
          setAllDomains(allDomainsResponse.data.domains);
          setHasRegisteredDomain(allDomainsResponse.data.domains.length > 0);
          setActiveDomain(allDomainsResponse.data.active_domain || null);
        }

      } catch (error) {
        console.error('Failed to fetch wallet data:', error);
        if (isActive) {
          setHasRegisteredDomain(false);
          setActiveDomain(null);
          setAllDomains(null);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchWalletData();

    return () => {
      isActive = false;
    };
  }, [accountId, connected, refetchTrigger]);

  return (
    <WalletAccountContext.Provider
      value={{
        accountId,
        bech32,
        balance,
        hasRegisteredDomain,
        activeDomain,
        allDomains,
        isLoading,
        refetch,
        // Transaction monitoring
        pendingTransactions,
        isMonitoringTransactions,
        addPendingTransaction,
        isDomainConfirmed,
        confirmedDomains,
      }}
    >
      {children}
    </WalletAccountContext.Provider>
  );
}

export function useWalletAccount() {
  const context = useContext(WalletAccountContext);
  if (context === undefined) {
    throw new Error('useWalletAccount must be used within a WalletAccountProvider');
  }
  return context;
}

