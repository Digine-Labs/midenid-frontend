import { type AccountId, type WebClient, Word } from '@demox-labs/miden-sdk';
import { useEffect, useState, useMemo } from 'react';
import { useClient } from '@/contexts/ClientContext';
import type { StorageParams } from '@/types/hooks';

const getStorageItemFromClient = async (client: WebClient, accountId: AccountId, index: number) => {
    try {
        const acc = await client.getAccount(accountId)
        if (!acc) {
            console.warn("Account not found after import");
            return undefined;
        }
        const storage = acc.storage();
        if (!storage) {
            console.warn("Account storage is not available");
            return undefined;
        }
        const item = storage.getItem(index)
        return item
    } catch (e) {
        console.warn("Error from getting storage item", e)
        return undefined;
    }

}

const getStorageMapItemFromClient = async (client: WebClient, accountId: AccountId, index: number, key: Word) => {
    try {
        const acc = await client.getAccount(accountId)
        if (!acc) {
            console.warn("Account not found after import");
            return undefined;
        }
        const storage = acc.storage();
        if (!storage) {
            console.warn("Account storage is not available");
            return undefined;
        }
        const item = storage.getMapItem(index, key)
        return item
    } catch (e) {
        console.warn("Error from getting map item", e)
        return undefined;
    }

}

export const useStorage = (
    { accountId, index, key }: StorageParams,
) => {
    const [storageItem, setStorageItem] = useState<Word | undefined>(undefined);
    const [storageHex, setStorageHex] = useState<string | undefined>(undefined);
    const [storageU64s, setStorageU64s] = useState<BigUint64Array | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const { client, isReady, importAccounts } = useClient();

    // Safely serialize key to hex for stable dependency comparison
    const keyHex = useMemo(() => {
        if (!key) return undefined;
        try {
            return key.toHex();
        } catch (e) {
            console.warn("Failed to serialize key:", e);
            return undefined;
        }
    }, [key]);

    useEffect(() => {
        let isCancelled = false;

        const initAndFetch = async () => {
            setIsLoading(true);

            // If key was provided but serialization failed, skip fetch
            if (key !== undefined && keyHex === undefined) {
                console.warn("Key provided but serialization failed, skipping storage fetch");
                if (!isCancelled) {
                    setIsLoading(false);
                    setStorageItem(undefined);
                    setStorageHex(undefined);
                    setStorageU64s(undefined);
                }
                return;
            }

            if (!accountId || !isReady || !client) {
                setIsLoading(false);
                return;
            }

            try {
                // Import account before first use
                await importAccounts([accountId]);

                if (isCancelled) return;

                await client.syncState();

                let item;
                if (key !== undefined) {
                    // If key is provided, get map item
                    item = await getStorageMapItemFromClient(client, accountId, index, key);
                } else {
                    // If key is not provided, get regular storage item
                    item = await getStorageItemFromClient(client, accountId, index);
                }

                if (isCancelled) return;

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
                if (!isCancelled) {
                    console.error('Failed to fetch storage:', error);
                    setStorageItem(undefined);
                    setStorageHex(undefined);
                    setStorageU64s(undefined);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        };

        initAndFetch();

        return () => {
            isCancelled = true;
        };
    }, [accountId, index, keyHex, client, isReady, importAccounts]);

    return {
        storageItem,      // Raw Word object
        storageHex,       // Hex string representation
        storageU64s,      // BigUint64Array (4 u64 values)
        isLoading
    };
};