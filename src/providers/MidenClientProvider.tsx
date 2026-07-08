import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AccountId, Word, type Account, type MidenClient } from '@miden-sdk/miden-sdk';
import { useWallet } from '@miden-sdk/miden-wallet-adapter';
import { bech32ToAccountId, instantiateClient } from '@/lib/midenClient';
import { createMutex, type Mutex } from '@/lib/clientMutex';
import { fetchSentRegistryNotes, type SentNote } from '@/lib/registryNotes';
import { MIDEN_ID_CONTRACT_ADDRESS } from '@/shared/constants';
import { encodeDomain } from '@/utils/encode';
import {
  MidenClientContext,
  type MidenClientContextValue,
} from '@/contexts/MidenClientContext';
import { SyncStatus } from '@/types/sync';

const SYNC_THROTTLE_MS = 1500;
// How often the background poller triggers a sync. Must be > SYNC_THROTTLE_MS so
// each tick actually runs instead of being throttled away.
const SYNC_POLL_INTERVAL_MS = 10_000;
// Testnet sync is flaky during the v0.13→v0.14 transition; require a couple of
// consecutive failures before flipping the indicator to red, to avoid flicker.
const SYNC_FAILURE_THRESHOLD = 2;
const DOMAIN_TO_OWNER_SLOT = 'naming::domain_to_owner';

export function MidenClientProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<MidenClient | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.Initializing);
  const [syncedBlock, setSyncedBlock] = useState<number | null>(null);
  const lastSyncTimeRef = useRef(0);
  const hasSyncedOnceRef = useRef(false);
  const consecutiveFailuresRef = useRef(0);
  const mutexRef = useRef<Mutex>(createMutex());
  const { address, requestAssets } = useWallet();

  const userAccountId = useMemo<AccountId | null>(() => {
    if (!address) return null;
    try {
      return bech32ToAccountId(address);
    } catch {
      return null;
    }
  }, [address]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await instantiateClient({ accountsToImport: [] });
        if (cancelled) {
          c.terminate();
          return;
        }
        setClient(c);
        setSyncStatus(SyncStatus.InitialSync);
        // Seed the displayed block from local state so a number shows immediately,
        // before the first network sync lands.
        try {
          const height = await mutexRef.current.runExclusive(() => c.getSyncHeight());
          if (!cancelled) setSyncedBlock(height);
        } catch {
          // Best-effort; the first periodic sync will populate it.
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(String(e)));
          setSyncStatus(SyncStatus.Error);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Best-effort sync. Testnet currently returns merkle-store errors during the
  // v0.13→v0.14 transition; we don't want every read to fail because of that.
  // Operations that need fresh data should fall back to `getOrImport` which
  // does a one-account network fetch independent of the global sync.
  const throttledSync = useCallback(async (c: MidenClient) => {
    const now = Date.now();
    if (now - lastSyncTimeRef.current < SYNC_THROTTLE_MS) return;
    try {
      const summary = await c.sync();
      const blockNum = summary.blockNum();
      summary.free();
      setSyncedBlock(blockNum);
      hasSyncedOnceRef.current = true;
      consecutiveFailuresRef.current = 0;
      setSyncStatus(SyncStatus.Synced);
    } catch (e) {
      console.warn('[MidenClientProvider] client.sync() failed (continuing)', e);
      consecutiveFailuresRef.current += 1;
      // Only surface red once failures persist; a single blip keeps the prior state.
      if (consecutiveFailuresRef.current >= SYNC_FAILURE_THRESHOLD) {
        setSyncStatus(SyncStatus.Error);
      }
    }
    lastSyncTimeRef.current = now;
  }, []);

  const withClient = useCallback(
    <T,>(fn: (c: MidenClient) => Promise<T>): Promise<T> => {
      if (!client) {
        return Promise.reject(new Error('Miden client is not ready'));
      }
      return mutexRef.current.runExclusive(() => fn(client));
    },
    [client],
  );

  const syncState = useCallback(async () => {
    if (!client) return;
    await mutexRef.current.runExclusive(() => throttledSync(client));
  }, [client, throttledSync]);

  // Background poller: keeps the sync-status indicator live even when no user
  // action triggers a sync. Fires once immediately, then on an interval.
  useEffect(() => {
    if (!client) return;
    void syncState();
    const id = setInterval(() => void syncState(), SYNC_POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [client, syncState]);

  const getAccount = useCallback(
    async (accountId: AccountId): Promise<Account | null> => {
      if (!client) return null;
      return mutexRef.current.runExclusive(async () => {
        await throttledSync(client);
        return client.accounts.get(accountId);
      });
    },
    [client, throttledSync],
  );

  const getDomainOwner = useCallback(
    async (domain: string): Promise<AccountId | null> => {
      if (!client) return null;

      const domainWord = encodeDomain(domain);
      const registryId = AccountId.fromHex(MIDEN_ID_CONTRACT_ADDRESS);

      return mutexRef.current.runExclusive(async () => {
        await throttledSync(client);
        const account = await client.accounts.getOrImport(registryId);

        // Match the backend's `encode_domain_masm_key`: reverse the encoded Word's felts
        // to match the MASM stack convention used when the map key was written via
        // mem_loadw_be in `_update_domain_owner`.
        const kf = domainWord.toFelts();
        const reversedKey = Word.newFromFelts([kf[3], kf[2], kf[1], kf[0]]);

        const ownerWord = account.storage().getMapItem(DOMAIN_TO_OWNER_SLOT, reversedKey);
        if (!ownerWord) return null;

        const vf = ownerWord.toFelts();
        if (vf.every(f => f.asInt() === 0n)) return null;

        // Stored value layout (empirical): [0, 0, suffix, prefix]. Miden AccountId
        // suffix has LSB = 0; that's how we identified which felt is which.
        return AccountId.fromPrefixSuffix(vf[3], vf[2]);
      });
    },
    [client, throttledSync],
  );

  const checkDomainAvailable = useCallback(
    async (domain: string): Promise<boolean> => {
      const owner = await getDomainOwner(domain);
      return owner === null;
    },
    [getDomainOwner],
  );

  const getAccountBalance = useCallback(
    async (accountId: AccountId, faucetId: AccountId): Promise<bigint> => {
      if (!client) return 0n;
      return mutexRef.current.runExclusive(async () => {
        await throttledSync(client);
        await client.accounts.getOrImport(accountId);
        return client.accounts.getBalance(accountId, faucetId);
      });
    },
    [client, throttledSync],
  );

  const getUserBalance = useCallback(
    async (faucetIdBech32: string): Promise<bigint | null> => {
      if (!userAccountId) return null;

      // Public or network accounts: state is reachable on-chain — no wallet prompt.
      if (!userAccountId.isPrivate() && client) {
        try {
          const faucetId = AccountId.fromBech32(faucetIdBech32);
          return await getAccountBalance(userAccountId, faucetId);
        } catch (e) {
          console.error('[MidenClientProvider] on-chain balance read failed', e);
          return null;
        }
      }

      // Private account: only the wallet knows the balance.
      if (!requestAssets) return null;
      try {
        const assets = await requestAssets();
        const asset = assets.find(a => a.faucetId === faucetIdBech32);
        return asset ? BigInt(asset.amount) : 0n;
      } catch (e) {
        console.error('[MidenClientProvider] requestAssets failed', e);
        return null;
      }
    },
    [userAccountId, requestAssets, client, getAccountBalance],
  );

  // Notes the connected wallet sent to the registry. Runs on a standalone
  // read-only RpcClient (see fetchSentRegistryNotes), so it bypasses the client
  // mutex. Deliberately depends only on `userAccountId` so the callback stays
  // stable — depending on `syncedBlock` (which the poller bumps every few
  // seconds) would restart the fetch on every block and it would never settle.
  // The lib fetches its own chain tip when no hint is given (one extra RPC).
  const getSentRegistryNotes = useCallback(async (): Promise<SentNote[]> => {
    if (!userAccountId) return [];
    return fetchSentRegistryNotes(userAccountId);
  }, [userAccountId]);

  const value = useMemo<MidenClientContextValue>(
    () => ({
      client,
      isReady: client !== null,
      error,
      syncStatus,
      syncedBlock,
      userAccountId,
      syncState,
      getAccount,
      withClient,
      checkDomainAvailable,
      getDomainOwner,
      getUserBalance,
      getAccountBalance,
      getSentRegistryNotes,
    }),
    [
      client,
      error,
      syncStatus,
      syncedBlock,
      userAccountId,
      syncState,
      getAccount,
      withClient,
      checkDomainAvailable,
      getDomainOwner,
      getUserBalance,
      getAccountBalance,
      getSentRegistryNotes,
    ],
  );

  return (
    <MidenClientContext.Provider value={value}>
      {children}
    </MidenClientContext.Provider>
  );
}
