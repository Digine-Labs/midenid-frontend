import { type AccountId, type WebClient } from '@demox-labs/miden-sdk';
import { useEffect, useState } from 'react';
import { safeAccountImport } from '@/lib/midenClient';
import { useMidenClient } from '@/contexts/MidenClientContext';

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
    const { client, syncClient } = useMidenClient();

    useEffect(() => {
        let clear: number;
        let isActive = true;

        const initAndRefresh = async () => {
            if (!accountId || !faucetId || !client) return;

            const refreshBalance = async () => {
                if (!isActive || !client) return;

                try {
                    await syncClient();
                    const newBalance = await getBalanceFromClient(client, accountId, faucetId);
                    if (isActive) {
                        setBalance(BigInt(newBalance ?? 0));
                    }
                } catch (error) {
                    console.error('Failed to fetch balance:', error);
                }
            };

            await refreshBalance();
            clear = setInterval(refreshBalance, 10000);
        };

        initAndRefresh();
        return () => {
            isActive = false;
            clearInterval(clear);
        };
    }, [faucetId, accountId, client, syncClient]);

    return balance;
};