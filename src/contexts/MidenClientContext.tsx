import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useWallet } from '@demox-labs/miden-wallet-adapter-react';
import { AccountId, WebClient } from '@demox-labs/miden-sdk';
import { bech32ToAccountId, safeAccountImport } from '@/lib/midenClient';
import { MIDEN_ID_CONTRACT_ADDRESS } from '@/shared/constants';

interface MidenClientContextValue {
  client: WebClient | null;
  isLoading: boolean;
  syncClient: () => Promise<void>;
  getClient: () => Promise<WebClient | null>;
}

const MidenClientContext = createContext<MidenClientContextValue | undefined>(undefined);

export function MidenClientProvider({ children }: { children: ReactNode }) {
  const { connected, accountId: rawAccountId } = useWallet();
  const [client, setClient] = useState<WebClient | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize client on mount or when wallet connection changes
  useEffect(() => {
    let isActive = true;

    const initializeClient = async () => {
      // Cleanup previous client if exists
      if (client) {
        try {
          client.terminate();
        } catch (e) {
          console.warn('Failed to terminate previous client:', e);
        }
        setClient(null);
      }

      setIsLoading(true);

      try {
        const nodeEndpoint = 'https://rpc.testnet.miden.io';
        const newClient = await WebClient.createClient(nodeEndpoint);

        if (!isActive) {
          newClient.terminate();
          return;
        }

        // Always import contract account (for read-only access)
        const contractId = AccountId.fromHex(MIDEN_ID_CONTRACT_ADDRESS);
        await safeAccountImport(newClient, contractId);

        // If wallet is connected, also import user account
        if (connected && rawAccountId) {
          const accountId = bech32ToAccountId(rawAccountId);
          await safeAccountImport(newClient, accountId);
        }

        // Sync state
        await newClient.syncState();

        if (isActive) {
          setClient(newClient);
        } else {
          newClient.terminate();
        }
      } catch (error) {
        console.error('MidenClientContext: Failed to initialize client:', error);
        if (isActive) {
          setClient(null);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    initializeClient();

    return () => {
      isActive = false;
      // Cleanup client on unmount
      if (client) {
        try {
          client.terminate();
        } catch (e) {
          console.warn('Failed to terminate client on cleanup:', e);
        }
      }
    };
  }, [connected, rawAccountId]);

  // Manual sync method
  const syncClient = async () => {
    if (!client) {
      throw new Error('Client not initialized');
    }
    await client.syncState();
  };

  // Get client with auto-sync
  const getClient = async (): Promise<WebClient | null> => {
    if (!client) {
      return null;
    }
    await client.syncState();
    return client;
  };

  return (
    <MidenClientContext.Provider
      value={{
        client,
        isLoading,
        syncClient,
        getClient,
      }}
    >
      {children}
    </MidenClientContext.Provider>
  );
}

export function useMidenClient() {
  const context = useContext(MidenClientContext);
  if (context === undefined) {
    throw new Error('useMidenClient must be used within a MidenClientProvider');
  }
  return context;
}
