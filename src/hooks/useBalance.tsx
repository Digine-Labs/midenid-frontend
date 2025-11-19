import { type AccountId, type WebClient } from '@demox-labs/miden-sdk';
import { useEffect, useState } from 'react';
import { safeAccountImport } from '@/lib/midenClient';
import { instantiateClient } from '@/lib/midenClient';

interface BalanceParams {
    readonly accountId?: AccountId;
    readonly faucetId?: AccountId;
}

const getBalanceFromClient = async (
    client: WebClient,
    accountId: AccountId,
    faucetId: AccountId,
) => {
    const acc = await safeAccountImport(client, accountId).then(() => client.getAccount(accountId));
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
            if (!accountId || !faucetId) return;

            const client = await instantiateClient({ accountsToImport: [] })

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
            client.terminate()
            clear = setInterval(refreshBalance, 10000);
        };

        initAndRefresh();
        return () => {
            isActive = false;
            clearInterval(clear);
        };
    }, [faucetId, accountId]);

    return balance;
};