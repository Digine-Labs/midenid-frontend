import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useWallet } from '@demox-labs/miden-wallet-adapter-react';
import { AccountId, WebClient, Word } from '@demox-labs/miden-sdk';
import { bech32ToAccountId, safeAccountImport } from '@/lib/midenClient';
import { encodeAccountIdToWord, hasRegisteredDomain as checkHasRegisteredDomain } from '@/lib/utils';
import { MIDEN_ID_CONTRACT_ADDRESS, MIDEN_FAUCET_CONTRACT_ADDRESS } from '@/shared/constants';

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
        const nodeEndpoint = 'https://rpc.testnet.miden.io';
        const client = await WebClient.createClient(nodeEndpoint);
        await client.syncState();

        if (!isActive) return;

        // Import account
        await safeAccountImport(client, accountId);

        // Get contract IDs
        const contractId = AccountId.fromHex(MIDEN_ID_CONTRACT_ADDRESS as string);
        const faucetId = AccountId.fromHex(MIDEN_FAUCET_CONTRACT_ADDRESS as string);

        // Import contract account
        await safeAccountImport(client, contractId);

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
        const hasDomain = checkHasRegisteredDomain(domainWord);
        setHasRegisteredDomain(hasDomain);

        // Decode domain name if exists
        if (hasDomain && domainWord) {
          try {
            const domain = decodeDomainFromWord(domainWord);
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

/**
 * Decodes a domain name from a Word stored in slot 4 (ID -> Name mapping).
 *
 * Format: Word[length, chars_1-7, chars_8-14, chars_15-20]
 */
function decodeDomainFromWord(word: Word): string {
  const felts = word.toFelts();

  // Length is in the last felt (reversed storage)
  const length = Number(felts[3].asInt());

  if (length === 0) {
    return '';
  }

  const bytes: number[] = [];

  // Decode 3 character chunks (7 chars each)
  for (let i = 0; i < 3; i++) {
    const feltValue = felts[2 - i].asInt();

    for (let j = 0; j < 7; j++) {
      if (bytes.length >= length) break;

      const byte = Number((feltValue >> BigInt(j * 8)) & 0xFFn);
      if (byte !== 0) {
        bytes.push(byte);
      }
    }

    if (bytes.length >= length) break;
  }

  return new TextDecoder().decode(new Uint8Array(bytes));
}
