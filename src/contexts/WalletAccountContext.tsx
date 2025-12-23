import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useWallet } from '@demox-labs/miden-wallet-adapter-react';
import { AccountId } from '@demox-labs/miden-sdk';
import { bech32ToAccountId } from '@/lib/midenClient';
import { getAccountAllDomains } from '@/api/accounts';

interface WalletAccountContextValue {
  accountId: AccountId | undefined;
  bech32: string | null;
  hasRegisteredDomain: boolean;
  activeDomain: string | null;
  allDomains: string[] | null;
  isLoading: boolean;
  refetch: () => void;
}

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

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return (
    <WalletAccountContext.Provider
      value={{
        accountId,
        bech32,
        hasRegisteredDomain,
        activeDomain,
        allDomains,
        isLoading,
        refetch,
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

