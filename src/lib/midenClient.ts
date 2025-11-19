import {
  AccountId,
  Address,
  NetworkId,
  WebClient,
  Word,
  Felt,
} from '@demox-labs/miden-sdk';
import { hasStorageValue, encodeDomainOld } from '@/utils';
import { MIDEN_ID_CONTRACT_ADDRESS } from '@/shared';


export const instantiateClient = async (
  { accountsToImport }: { accountsToImport: AccountId[] },
) => {
  const nodeEndpoint = 'https://rpc.testnet.miden.io';
  const client = await WebClient.createClient(nodeEndpoint);
  for (const acc of accountsToImport) {
    try {
      await safeAccountImport(client, acc);
    } catch (e) {
      console.error('Account import failed:', e);
    }
  }

  await client.syncState();

  return client;
};

export const safeAccountImport = async (client: WebClient, accountId: AccountId) => {
  if (await client.getAccount(accountId) == null) {
    try {
      await client.importAccountById(accountId);
    } catch (e) {
      console.warn(e);
    }
  }
};

export const accountIdToBech32 = (
  accountId: AccountId,
  networkId: NetworkId = NetworkId.Testnet,
) => {
  return Address.fromAccountId(accountId, 'Unspecified').toBech32(networkId);
};

export const bech32ToAccountId = (bech32str: string) => {
  return Address.fromBech32(bech32str).accountId();
};

export function generateRandomSerialNumber(): Word {
  return Word.newFromFelts([
    new Felt(BigInt(Math.floor(Math.random() * 0x1_0000_0000))),
    new Felt(BigInt(Math.floor(Math.random() * 0x1_0000_0000))),
    new Felt(BigInt(Math.floor(Math.random() * 0x1_0000_0000))),
    new Felt(BigInt(Math.floor(Math.random() * 0x1_0000_0000))),
  ]);
}

export async function hasRegisteredDomain(
  domain: string,
  providedClient?: WebClient
): Promise<boolean> {
  const maxAttempts = 30 // 30 attempts * 5 seconds = 150 seconds
  let attempts = 0

  const contractId = AccountId.fromHex(MIDEN_ID_CONTRACT_ADDRESS as string);

  // Use provided client or create new one
  const client = providedClient || await instantiateClient({ accountsToImport: [contractId] })
  const shouldTerminate = !providedClient; // Only terminate if we created the client

  const storageKey = encodeDomainOld(domain);

  try {
    while (attempts < maxAttempts) {
      await client.syncState()

      const contractAccount = await client.getAccount(contractId);
      let domainWord: Word | undefined;

      try {
        domainWord = contractAccount?.storage().getMapItem(3, storageKey);
      } catch (error) {
        console.warn('Failed to get domain from storage:', error);
      }

      const hasDomain = hasStorageValue(domainWord);

      if (hasDomain) {
        return true
      }

      await new Promise(resolve => setTimeout(resolve, 5000))
      attempts++
    }

    return false
  } finally {
    // Only terminate if we created the client ourselves
    if (shouldTerminate) {
      client.terminate()
    }
  }
}