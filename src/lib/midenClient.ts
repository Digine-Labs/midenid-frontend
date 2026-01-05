import {
  AccountId,
  Address,
  NetworkId,
  WebClient,
  Word,
  Felt,
  SigningInputs,
} from '@demox-labs/miden-sdk';
import { hasStorageValue, encodeDomain, uint8ArrayToHex, createMessage } from '@/utils';
import type { CreateMessageParams } from '@/types/profile';
import type { SignedData } from '@/types/auth';
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

  const state = await client.syncState();

  console.log(state.blockNum())

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

export async function hasRegisteredDomain(
  client: WebClient,
  domain: string
): Promise<boolean> {
  const maxAttempts = 15 // 15 attempts * 5 seconds = 75 seconds
  let attempts = 0

  const contractId = AccountId.fromHex(MIDEN_ID_CONTRACT_ADDRESS as string);
  const storageKey = encodeDomain(domain);

  while (attempts < maxAttempts) {
    await client.syncState()

    const contractAccount = await client.getAccount(contractId);
    let domainWord: Word | undefined;

    try {
      domainWord = contractAccount?.storage().getMapItem(5, storageKey);
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
}

/**
 * Sign profile data with Miden wallet
 * @param params - Profile data to sign
 * @param signBytes - Wallet signing function
 * @param publicKey - Wallet public key
 * @returns Signed data with hex-encoded signature
 */
export async function signProfileData(
  params: CreateMessageParams,
  signBytes: (data: Uint8Array, kind: any) => Promise<Uint8Array>,
  publicKey: Uint8Array
): Promise<SignedData> {
  const message = createMessage(params);
  const messageBytes = new TextEncoder().encode(message);

  try {
    // Convert message to Felt array (8-byte chunks)
    const felts: Felt[] = [];
    for (let i = 0; i < messageBytes.length; i += 8) {
      const chunk = messageBytes.slice(i, i + 8);
      let value = 0n;
      for (let j = 0; j < chunk.length; j++) {
        value |= BigInt(chunk[j]) << BigInt(j * 8);
      }
      felts.push(new Felt(value));
    }

    // Create SigningInputs and get commitment
    const signingInputs = SigningInputs.newArbitrary(felts);
    const commitment = signingInputs.toCommitment();
    const commitmentBytes = commitment.serialize();

    // Sign with wallet
    const signatureBytes = await signBytes(commitmentBytes, "word");

    const result = {
      message_hex: uint8ArrayToHex(commitmentBytes),
      pubkey_hex: uint8ArrayToHex(publicKey),
      signature_hex: uint8ArrayToHex(signatureBytes)
    };

    // Clean up WASM memory
    try {
      signingInputs.free();
    } catch {
      // Already freed
    }

    return result;
  } catch (error) {
    console.error('Signing failed:', error);
    throw error;
  }
}