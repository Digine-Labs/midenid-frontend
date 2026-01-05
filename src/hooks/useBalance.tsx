import { type AccountId, type WebClient } from '@demox-labs/miden-sdk';
import { useEffect, useState } from 'react';
import type { BalanceParams } from '@/types/hooks';
import { instantiateClient } from '@/lib/midenClient';

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
            console.log('useBalance effect triggered', { accountId: accountId?.toString(), faucetId: faucetId?.toString() });
            if (!accountId || !faucetId) {
                console.log('useBalance: Missing accountId or faucetId, skipping');
                setBalance(null);
                return;
            }
            console.log('Refreshing balance')
            const client = await instantiateClient({ accountsToImport: []});

            // Import account (lazy init happens here if needed)
            await client.importAccountById(accountId);

            const refreshBalance = async () => {
                if (!isActive) return;

                try {
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
            console.log('Setting up 15s interval for balance refresh');
            clear = setInterval(() => {
                console.log('Interval tick - refreshing balance');
                refreshBalance();
            }, 15000);
        };

        initAndRefresh();
        return () => {
            console.log('useBalance cleanup - clearing interval');
            isActive = false;
            clearInterval(clear);
        };
    }, [faucetId, accountId]);

    return balance;
};