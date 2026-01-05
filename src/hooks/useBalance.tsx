import { type AccountId, type WebClient } from '@demox-labs/miden-sdk';
import { useEffect, useState } from 'react';
import { getMidenClient } from '@/lib/MidenClientSingleton';
import type { BalanceParams } from '@/types/hooks';

const getBalanceFromClient = async (
    client: WebClient,
    accountId: AccountId,
    faucetId: AccountId,
) => {
    const acc = await client.getAccount(accountId);
    const balance = acc?.vault().getBalance(faucetId);
    return balance;
};

export const useBalance = (
    { accountId, faucetId }: BalanceParams,
) => {
    const [balance, setBalance] = useState<bigint | null>(null);

    useEffect(() => {
        let clear: number;
        let isActive = true;

        const initAndRefresh = async () => {
            if (!accountId || !faucetId) {
                setBalance(null);
                return;
            }

            const clientSingleton = getMidenClient();

            // Import account (lazy init happens here if needed)
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
                } catch (error) {
                    console.error('Failed to fetch balance:', error);
                }
            };

            await refreshBalance();
            clear = setInterval(refreshBalance, 15000);
        };

        initAndRefresh();
        return () => {
            isActive = false;
            clearInterval(clear);
        };
    }, [faucetId, accountId]);

    return balance;
};