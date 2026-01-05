import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode
} from 'react';
import { AccountId, WebClient } from '@demox-labs/miden-sdk';
import { instantiateClient, safeAccountImport } from '@/lib/midenClient';
import type { ClientContextValue } from '@/types/context';

const ClientContext = createContext<ClientContextValue | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<WebClient | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track imported accounts to prevent duplicates
  const importedAccountsRef = useRef<Set<string>>(new Set());
  // Track in-flight imports to prevent concurrent imports of same account
  const isImportingRef = useRef<Map<string, Promise<void>>>(new Map());

  // Initialize client on mount
  useEffect(() => {
    const initClient = async () => {
      setIsInitializing(true);
      try {
        // Create client with no initial accounts (manual import pattern)
        const newClient = await instantiateClient({ accountsToImport: [] });
        setClient(newClient);
        setIsReady(true);
      } catch (err) {
        console.error('Failed to initialize client:', err);
        setError(err as Error);
        setIsReady(false);
      } finally {
        setIsInitializing(false);
      }
    };

    initClient();

    // Cleanup on unmount
    return () => {
      if (client) {
        try {
          client.terminate();
        } catch (err) {
          console.error('Error terminating client:', err);
        }
      }
    };
  }, []);

  const importAccounts = useCallback(async (accounts: AccountId[]) => {
    if (!client) {
      console.warn('Client not ready for account import');
      return;
    }

    // Filter out accounts that are already imported or currently importing
    const accountsToImport = accounts.filter(acc => {
      const key = acc.toString();
      if (importedAccountsRef.current.has(key) || isImportingRef.current.has(key)) {
        return false;
      }
      return true;
    });

    if (accountsToImport.length === 0) {
      return; // All accounts already imported or importing
    }

    // Import accounts sequentially to avoid race conditions
    for (const acc of accountsToImport) {
      const key = acc.toString();

      const importPromise = (async () => {
        try {
          await safeAccountImport(client, acc);
          importedAccountsRef.current.add(key);
        } catch (err) {
          console.error(`Failed to import account ${key}:`, err);
          // Don't add to importedAccounts on failure - allow retry
        } finally {
          isImportingRef.current.delete(key);
        }
      })();

      isImportingRef.current.set(key, importPromise);
      await importPromise;
    }
  }, [client]);

  const reinitialize = useCallback(async () => {
    setIsInitializing(true);
    setError(null);

    // Terminate existing client
    if (client) {
      try {
        client.terminate();
      } catch (err) {
        console.error('Error terminating client:', err);
      }
    }

    // Save previously imported accounts
    const previouslyImported = Array.from(importedAccountsRef.current);

    // Clear tracking
    importedAccountsRef.current.clear();
    isImportingRef.current.clear();

    try {
      // Parse account IDs from string format
      const accountIds = previouslyImported.map(str => {
        // AccountId.toString() format is "AccountId { inner: 0x... }"
        // Extract hex and recreate AccountId
        const hexMatch = str.match(/0x[\da-f]+/i);
        if (hexMatch) {
          return AccountId.fromHex(hexMatch[0]);
        }
        throw new Error(`Invalid account ID format: ${str}`);
      });

      const newClient = await instantiateClient({ accountsToImport: accountIds });
      setClient(newClient);
      setIsReady(true);

      // Restore imported accounts set
      previouslyImported.forEach(key => importedAccountsRef.current.add(key));
    } catch (err) {
      console.error('Failed to reinitialize client:', err);
      setError(err as Error);
      setIsReady(false);
    } finally {
      setIsInitializing(false);
    }
  }, [client]);

  return (
    <ClientContext.Provider
      value={{
        client,
        isInitializing,
        isReady,
        error,
        importAccounts,
        reinitialize,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
}
