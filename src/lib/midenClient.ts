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


// Helper to clear IndexedDB if schema is incompatible
const clearMidenIndexedDB = async () => {
  const databases = await indexedDB.databases();
  for (const db of databases) {
    if (db.name && (db.name.includes('miden') || db.name.includes('Miden'))) {
      indexedDB.deleteDatabase(db.name);
    }
  }
  await new Promise(resolve => setTimeout(resolve, 100));
};

export const instantiateClient = async (
  { accountsToImport }: { accountsToImport: AccountId[] },
) => {
  const nodeEndpoint = 'https://rpc.testnet.miden.io';

  let client: WebClient;
  try {
    client = await WebClient.createClient(nodeEndpoint);
  } catch (e) {
    // If database schema is incompatible, clear and retry
    const errorMsg = e instanceof Error ? e.message : String(e);
    if (errorMsg.includes('Indexdb') || errorMsg.includes('WebStore') || errorMsg.includes('primary key')) {
      await clearMidenIndexedDB();
      client = await WebClient.createClient(nodeEndpoint);
    } else {
      throw e;
    }
  }

  for (const acc of accountsToImport) {
    try {
      await safeAccountImport(client, acc);
    } catch {
      // Silently ignore import failures
    }
  }

  await client.syncState();

  return client;
};

export const safeAccountImport = async (client: WebClient, accountId: AccountId) => {
  if (await client.getAccount(accountId) == null) {
    try {
      await client.importAccountById(accountId);
    } catch {
      // Account may already exist or be unavailable
    }
  }
};

export const accountIdToBech32 = (
  accountId: AccountId,
  networkId: NetworkId = NetworkId.Testnet,
) => {
  return Address.fromAccountId(accountId).toBech32(networkId)
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

export async function hasRegisteredDomain(domain: string): Promise<boolean> {
  const maxAttempts = 30 // 30 attempts * 5 seconds = 150 seconds
  let attempts = 0

  const contractId = AccountId.fromHex(MIDEN_ID_CONTRACT_ADDRESS as string);

  let client = await instantiateClient({ accountsToImport: [contractId] })

  const storageKey = encodeDomainOld(domain);

  while (attempts < maxAttempts) {
    await client.syncState()

    const contractAccount = await client.getAccount(contractId);
    let domainWord: Word | undefined;

    try {
      domainWord = contractAccount?.storage().getMapItem(3, storageKey);
    } catch {
      // Storage query failed, domain not registered
    }

    const hasDomain = hasStorageValue(domainWord);

    if (hasDomain) {
      return true
    }

    await new Promise(resolve => setTimeout(resolve, 5000))
    attempts++
  }

  client.terminate()

  return false
}