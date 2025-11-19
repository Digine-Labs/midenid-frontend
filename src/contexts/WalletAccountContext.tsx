import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useWallet } from '@demox-labs/miden-wallet-adapter-react';
import { AccountId, Word } from '@demox-labs/miden-sdk';
import { bech32ToAccountId } from '@/lib/midenClient';
import { encodeAccountIdToWord, hasStorageValue, decodeDomainFromWordOld } from '@/utils';
import { MIDEN_ID_CONTRACT_ADDRESS, MIDEN_FAUCET_CONTRACT_ADDRESS } from '@/shared/constants';
import { instantiateClient } from '@/lib/midenClient';

interface WalletAccountContextValue {
  accountId: AccountId | undefined;
  hasRegisteredDomain: boolean;
  registeredDomain: string | null;
  balance: bigint | null;
  isLoading: boolean;
  refetch: () => void;
}

const WalletAccountContext = createContext<WalletAccountContextValue | undefined>(undefined);

export function WalletAccountProvider({ children }: { children: ReactNode }) {
  const { connected, accountId: rawAccountId } = useWallet();
  const [accountId, setAccountId] = useState<AccountId | undefined>(undefined);
  const [hasRegisteredDomain, setHasRegisteredDomain] = useState(false);
  const [registeredDomain, setRegisteredDomain] = useState<string | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Convert Bech32 accountId to AccountId when wallet connects
  useEffect(() => {
    if (!connected || !rawAccountId) {
      setAccountId(undefined);
      setHasRegisteredDomain(false);
      setRegisteredDomain(null);
      setBalance(null);
      return;
    }

    try {
      const id = bech32ToAccountId(rawAccountId);
      setAccountId(id);
    } catch (error) {
      console.error('WalletAccountContext: Failed to convert accountId:', error);
      setAccountId(undefined);
    }
  }, [connected, rawAccountId]);

  // Fetch wallet data when accountId changes
  useEffect(() => {
    if (!accountId || !connected) {
      setIsLoading(false);
      return;
    }

    let isActive = true;

    const fetchWalletData = async () => {
      setIsLoading(true);

      try {
        const contractId = AccountId.fromHex(MIDEN_ID_CONTRACT_ADDRESS);
        const faucetId = AccountId.fromHex(MIDEN_FAUCET_CONTRACT_ADDRESS);

        const client = await instantiateClient({ accountsToImport: [accountId, contractId] });
        await client.syncState();

        if (!isActive) return

        // Encode accountId to Word for storage query
        const prefixFelt = accountId.prefix();
        const suffixFelt = accountId.suffix();
        const prefix = prefixFelt.asInt();
        const suffix = suffixFelt.asInt();
        const storageKey = encodeAccountIdToWord(prefix, suffix);

        // Query storage slot 4 (ID -> Name mapping) for registered domain
        const contractAccount = await client.getAccount(contractId);
        let domainWord: Word | undefined;

        try {
          domainWord = contractAccount?.storage().getMapItem(4, storageKey);
        } catch (error) {
          console.warn('Failed to get domain from storage:', error);
        }

        if (!isActive) return;

        // Check if account has a registered domain
        const hasDomain = hasStorageValue(domainWord);
        setHasRegisteredDomain(hasDomain);

        // Decode domain name if exists
        if (hasDomain && domainWord) {
          try {
            const domain = decodeDomainFromWordOld(domainWord);
            setRegisteredDomain(domain);
          } catch (error) {
            console.error('Failed to decode domain:', error);
            setRegisteredDomain(null);
          }
        } else {
          setRegisteredDomain(null);
        }

        // Fetch balance
        const userAccount = await client.getAccount(accountId);
        const walletBalance = userAccount?.vault().getBalance(faucetId);

        if (isActive) {
          setBalance(walletBalance ? BigInt(walletBalance) : BigInt(0));
        }

      } catch (error) {
        console.error('WalletAccountContext: Failed to fetch wallet data:', error);
        if (isActive) {
          setHasRegisteredDomain(false);
          setRegisteredDomain(null);
          setBalance(null);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchWalletData();

    return () => {
      isActive = false;
    };
  }, [accountId, connected, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return (
    <WalletAccountContext.Provider
      value={{
        accountId,
        hasRegisteredDomain,
        registeredDomain,
        balance,
        isLoading,
        refetch,
      }}
    >
      {children}
    </WalletAccountContext.Provider>
  );
}

export function useWalletAccount() {
  const context = useContext(WalletAccountContext);
  if (context === undefined) {
    throw new Error('useWalletAccount must be used within a WalletAccountProvider');
  }
  return context;
}

