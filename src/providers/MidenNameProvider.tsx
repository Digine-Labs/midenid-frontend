import { useUnifiedWallet } from '@/hooks/useUnifiedWallet';
import { clientMutex } from '@/lib/clientMutex';
import { instantiateClient, safeAccountImport } from '@/lib/midenClient';
import type { MidenClient } from '@miden-sdk/miden-sdk';
import { AccountId, Address } from '@miden-sdk/miden-sdk';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
// Para client import — temporarily disabled
// import { useParaClient } from './ParaClientContext';
import { MidenNameContext } from './MidenNameContext';

const SYNC_THROTTLE_MS = 1500;

export function MidenNameProvider({ children }: { children: ReactNode }) {
  const lastSyncTime = useRef(0);
  const { address, accountId: unifiedAccountId } = useUnifiedWallet();
  // Para client — temporarily disabled
  // const paraClient = useParaClient();

  const accountId = useMemo(
    () => unifiedAccountId ?? (address ? Address.fromBech32(address).accountId() : undefined),
    [address, unifiedAccountId],
  );

  const [midenClient, setMidenClient] = useState<MidenClient | undefined>(undefined);

  // Para users reuse the client from UnifiedWalletProvider; Miden users get their own
  // const client = walletType === 'para' ? paraClient : midenClient;
  const client = midenClient;

  // Create client eagerly on mount so read-only queries (e.g. domain availability)
  // work even before a wallet is connected.
  useEffect(() => {
    if (midenClient) return;
    instantiateClient({ accountsToImport: [] })
      .then(setMidenClient)
      .catch(console.error);
  }, [midenClient]);

  // Import the user's account once the wallet connects.
  useEffect(() => {
    if (!midenClient || !accountId) return;
    safeAccountImport(midenClient, accountId).catch(console.error);
  }, [midenClient, accountId]);

  const withClientLock = useCallback(
    <T,>(fn: () => Promise<T>): Promise<T> => clientMutex.runExclusive(fn),
    [],
  );

  const throttledSync = useCallback(async () => {
    if (!client) return;
    const now = Date.now();
    if (now - lastSyncTime.current >= SYNC_THROTTLE_MS) {
      await client.sync();
      lastSyncTime.current = now;
    }
  }, [client]);

  const syncState = useCallback(async () => {
    if (!client) return;
    await withClientLock(async () => {
      await throttledSync();
    });
  }, [client, withClientLock, throttledSync]);

  const getAccount = useCallback(async (id: AccountId) => {
    if (!client) return undefined;
    return withClientLock(async () => {
      await throttledSync();
      return (await client.accounts.get(id)) ?? undefined;
    });
  }, [client, withClientLock, throttledSync]);

  const getBalance = useCallback(async (id: AccountId, faucetId: AccountId) => {
    if (!client) return 0n;
    return withClientLock(async () => {
      await throttledSync();
      return await client.accounts.getBalance(id, faucetId);
    });
  }, [client, withClientLock, throttledSync]);

  const value = useMemo(() => ({
    client,
    syncState,
    getAccount,
    getBalance,
  }), [client, syncState, getAccount, getBalance]);

  return (
    <MidenNameContext.Provider value={value}>
      {children}
    </MidenNameContext.Provider>
  );
}
