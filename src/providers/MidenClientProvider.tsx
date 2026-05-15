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
import { MIDEN_ID_CONTRACT_ADDRESS } from '@/shared/constants';
import { encodeDomain } from '@/utils/encode';
import {
  MidenClientContext,
  type MidenClientContextValue,
} from '@/contexts/MidenClientContext';

const SYNC_THROTTLE_MS = 1500;
const DOMAIN_TO_OWNER_SLOT = 'naming::domain_to_owner';

export function MidenClientProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<MidenClient | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const lastSyncTimeRef = useRef(0);
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
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
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
    if (now - lastSyncTimeRef.current >= SYNC_THROTTLE_MS) {
      try {
        await c.sync();
      } catch (e) {
        console.warn('[MidenClientProvider] client.sync() failed (continuing)', e);
      }
      lastSyncTimeRef.current = now;
    }
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
      if (!MIDEN_ID_CONTRACT_ADDRESS) {
        throw new Error('VITE_MIDEN_ID_CONTRACT_ADDRESS is not set');
      }

      const domainWord = encodeDomain(domain);
      const registryId = AccountId.fromHex(MIDEN_ID_CONTRACT_ADDRESS as string);

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

  const value = useMemo<MidenClientContextValue>(
    () => ({
      client,
      isReady: client !== null,
      error,
      userAccountId,
      syncState,
      getAccount,
      withClient,
      checkDomainAvailable,
      getDomainOwner,
      getUserBalance,
      getAccountBalance,
    }),
    [
      client,
      error,
      userAccountId,
      syncState,
      getAccount,
      withClient,
      checkDomainAvailable,
      getDomainOwner,
      getUserBalance,
      getAccountBalance,
    ],
  );

  return (
    <MidenClientContext.Provider value={value}>
      {children}
    </MidenClientContext.Provider>
  );
}
