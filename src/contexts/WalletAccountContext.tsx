import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { useWallet } from '@demox-labs/miden-wallet-adapter-react';
import { AccountId, Felt, SigningInputs } from '@demox-labs/miden-sdk';
import { bech32ToAccountId } from '@/lib/midenClient';
import { getAccountAllDomains } from '@/api/accounts';
import { getBlockNumber } from '@/api/miden';
import { login, logout } from '@/api/auth';
import { uint8ArrayToHex } from '@/utils';

interface WalletAccountContextValue {
  accountId: AccountId | undefined;
  bech32: string | null;
  hasRegisteredDomain: boolean;
  activeDomain: string | null;
  allDomains: string[] | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  blockNumber: number | null;
  refetch: () => void;
}

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
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const prevConnectedRef = useRef<boolean>(false);

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
      setBlockNumber(null);
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
    if (!connected || !signBytes || !publicKey || isAuthenticated) {
      return;
    }

    let isActive = true;

    const authenticate = async () => {
      try {
        // Create a simple auth message
        const authMessage = JSON.stringify({
          action: 'authenticate',
          timestamp: Date.now(),
        });
        const messageBytes = new TextEncoder().encode(authMessage);

        // Convert message to Felt array (8-byte chunks)
        const felts: Felt[] = [];
        for (let i = 0; i < messageBytes.length; i += 8) {
          const chunk = messageBytes.slice(i, i + 8);
          let value = 0n;
          for (let j = 0; j < chunk.length; j++) {
            value |= BigInt(chunk[j]) << BigInt(j * 8);
          }
          felts.push(new Felt(value));
        }

        // Create SigningInputs and get commitment
        const signingInputs = SigningInputs.newArbitrary(felts);
        const commitment = signingInputs.toCommitment();
        const commitmentBytes = commitment.serialize();

        // Sign with wallet
        const signatureBytes = await signBytes(commitmentBytes, "word");

        // Call login API
        const result = await login({
          message_hex: uint8ArrayToHex(commitmentBytes),
          pubkey_hex: uint8ArrayToHex(publicKey),
          signature_hex: uint8ArrayToHex(signatureBytes),
        });

        // Clean up WASM memory
        try {
          signingInputs.free();
        } catch {
          // Already freed
        }

        if (isActive && result.success) {
          setIsAuthenticated(true);
          console.log('[Auth] Session established successfully');
        } else if (isActive) {
          console.error('[Auth] Authentication failed:', result.error);
        }
      } catch (error) {
        console.error('[Auth] Authentication error:', error);
      }
    };

    authenticate();

    return () => {
      isActive = false;
    };
  }, [connected, signBytes, publicKey, isAuthenticated]);

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
        // Fetch domains and block number in parallel
        const [allDomainsResponse, blockNumberResponse] = await Promise.all([
          getAccountAllDomains(accountId.toString()),
          getBlockNumber(),
        ]);

        if (allDomainsResponse.success && allDomainsResponse.data) {
          setAllDomains(allDomainsResponse.data.domains);
          setHasRegisteredDomain(allDomainsResponse.data.domains.length > 0);
          setActiveDomain(allDomainsResponse.data.active_domain || null);
        }

        if (blockNumberResponse.success && blockNumberResponse.data) {
          setBlockNumber(blockNumberResponse.data.block_number);
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
        hasRegisteredDomain,
        activeDomain,
        allDomains,
        isLoading,
        isAuthenticated,
        blockNumber,
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

