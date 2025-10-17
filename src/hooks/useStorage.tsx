import { type AccountId, WebClient, Word } from '@demox-labs/miden-sdk';
import { useEffect, useState } from 'react';
import { safeAccountImport } from '@/lib/midenClient';

interface StorageParams {
    readonly accountId: AccountId;
    readonly index: number;
    readonly key?: Word;
}

const getStorageItemFromClient = async (client: WebClient, accountId: AccountId, index: number) => {
    try {
        const acc = await safeAccountImport(client, accountId).then(() => client.getAccount(accountId));
        const item = acc?.storage().getItem(index)
        return item
    } catch (e) {
        console.warn("Error from getting storage item", e)
    }

}

const getStorageMapItemFromClient = async (client: WebClient, accountId: AccountId, index: number, key: Word) => {
    try {
        const acc = await safeAccountImport(client, accountId).then(() => client.getAccount(accountId));
        const item = acc?.storage().getMapItem(index, key)
        return item
    } catch (e) {
        console.warn("Error from getting map item", e)
    }

}

export const useStorage = (
    { accountId, index, key }: StorageParams,
) => {
    const [storageItem, setStorageItem] = useState<Word | undefined>(undefined);
    const [storageHex, setStorageHex] = useState<string | undefined>(undefined);
    const [storageU64s, setStorageU64s] = useState<BigUint64Array | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const initAndFetch = async () => {
            const nodeEndpoint = "https://rpc.testnet.miden.io";
            const client = await WebClient.createClient(nodeEndpoint);
            console.log("Current block number: ", (await client.syncState()).blockNum());

            if (!client || !accountId) return;

            const fetchStorage = async () => {
                setIsLoading(true);
                await client.syncState();
                try {
                    let item;
                    if (key !== undefined) {
                        // If key is provided, get map item
                        item = await getStorageMapItemFromClient(client, accountId, index, key);
                    } else {
                        // If key is not provided, get regular storage item
                        item = await getStorageItemFromClient(client, accountId, index);
                    }

                    setStorageItem(item);

                    // Convert Word to JavaScript types
                    if (item) {
                        setStorageHex(item.toHex());
                        setStorageU64s(item.toU64s());
                    } else {
                        setStorageHex(undefined);
                        setStorageU64s(undefined);
                    }
                } catch (error) {
                    console.error('Failed to fetch storage:', error);
                    setStorageItem(undefined);
                    setStorageHex(undefined);
                    setStorageU64s(undefined);
                } finally {
                    setIsLoading(false);
                }
            };

            // Fetch immediately on mount
            await fetchStorage();
        };

        initAndFetch();
    }, [accountId, index, key]);

    return {
        storageItem,      // Raw Word object
        storageHex,       // Hex string representation
        storageU64s,      // BigUint64Array (4 u64 values)
        isLoading
    };
};