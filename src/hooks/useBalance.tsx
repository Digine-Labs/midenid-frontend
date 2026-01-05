import { type AccountId, type WebClient } from '@demox-labs/miden-sdk';
import { useEffect, useState, useRef } from 'react';
import { getMidenClient } from '@/lib/MidenClientSingleton';
import type { BalanceParams } from '@/types/hooks';

const REFRESH_INTERVAL_MS = 15000;

async function getBalanceFromClient(
  client: WebClient,
  accountId: AccountId,
  faucetId: AccountId,
): Promise<bigint | undefined> {
  const acc = await client.getAccount(accountId);
  return acc?.vault().getBalance(faucetId);
}

export function useBalance({ accountId, faucetId }: BalanceParams): bigint | null {
  const [balance, setBalance] = useState<bigint | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let isActive = true;

    const cleanup = () => {
      isActive = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    if (!accountId || !faucetId) {
      setBalance(null);
      return cleanup;
    }

    const initAndRefresh = async () => {
      const clientSingleton = getMidenClient();
      await clientSingleton.importAccount(accountId);

      const refreshBalance = async () => {
        if (!isActive) return;

        try {
          const client = await clientSingleton.getClient();
          await client.syncState();
          const newBalance = await getBalanceFromClient(client, accountId, faucetId);
          if (isActive) {
            setBalance(BigInt(newBalance ?? 0));
          }
        } catch {
          // Silently ignore balance fetch errors
        }
      };

      await refreshBalance();
      intervalRef.current = setInterval(refreshBalance, REFRESH_INTERVAL_MS);
    };

    initAndRefresh();
    return cleanup;
  }, [faucetId, accountId]);

  return balance;
}
