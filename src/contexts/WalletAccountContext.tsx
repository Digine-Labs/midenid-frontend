import { createContext, useContext, useEffect, useState, useMemo, useRef, type ReactNode } from 'react';
import { useWallet } from '@demox-labs/miden-wallet-adapter-react';
import { AccountId } from '@demox-labs/miden-sdk';
import { bech32ToAccountId } from '@/lib/midenClient';
import { authenticate } from '@/lib/auth';
import { getAccountAllDomains } from '@/api/accounts';
import { logout } from '@/api/auth';
import { useBalance } from '@/hooks/useBalance';
import { MIDEN_FAUCET_CONTRACT_ADDRESS } from '@/shared/constants';
import { usePendingTransactions } from '@/hooks/usePendingTransactions';
import type { WalletAccountContextValue } from '@/types/wallet';

const WalletAccountContext = createContext<WalletAccountContextValue | undefined>(undefined);

export function WalletAccountProvider({ children }: { children: ReactNode }) {
  const { connected, address: rawAccountId, signBytes, publicKey } = useWallet();
  const [accountId, setAccountId] = useState<AccountId | undefined>(undefined);
  const bech32 = rawAccountId;
  const [hasRegisteredDomain, setHasRegisteredDomain] = useState(false);
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const [allDomains, setAllDomains] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const prevConnectedRef = useRef<boolean>(false);

  // Faucet ID for balance queries
  const faucetId = useMemo(
    () => AccountId.fromHex(MIDEN_FAUCET_CONTRACT_ADDRESS as string),
    []
  );

  // Get user balance with automatic polling
  const balance = useBalance({ accountId, faucetId });

  // Monitor pending transactions
  const {
    pending: pendingTransactions,
    isMonitoring: isMonitoringTransactions,
    addPendingTransaction,
    isDomainConfirmed,
    confirmedDomains
  } = usePendingTransactions(accountId?.toString());

  // Handle wallet disconnection - logout from backend
  useEffect(() => {
    const wasConnected = prevConnectedRef.current;
    prevConnectedRef.current = connected;

    // Wallet disconnected
    if (wasConnected && !connected) {
      logout().catch(err => console.error('Logout failed:', err));
      setIsAuthenticated(false);
      setAccountId(undefined);
      setHasRegisteredDomain(false);
      setActiveDomain(null);
      setAllDomains(null);
      setIsLoading(false);
      return;
    }

    // Wallet not connected
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

  // Authenticate with backend after wallet connects
  useEffect(() => {
    if (!connected || !signBytes || !publicKey || !rawAccountId || isAuthenticated) {
      return;
    }

    let isActive = true;

    const doAuth = async () => {
      try {
        // Convert bech32 to hex account ID for auth request
        const id = bech32ToAccountId(rawAccountId);
        const result = await authenticate({ signBytes, publicKey, accountId: id.toString() });
        if (isActive && result.success) {
          setIsAuthenticated(true);
        } else if (isActive && result.error) {
          console.error('[Auth] Authentication failed:', result.error);
        }
      } catch (error) {
        console.error('[Auth] Failed to convert account ID:', error);
      }
    };

    doAuth();

    return () => {
      isActive = false;
    };
  }, [connected, signBytes, publicKey, rawAccountId, isAuthenticated]);

  // Fetch wallet data when authenticated
  useEffect(() => {
    // Wait for authentication before fetching domains
    if (!accountId || !connected || !isAuthenticated) {
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
  }, [accountId, connected, isAuthenticated, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

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
        isAuthenticated,
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

