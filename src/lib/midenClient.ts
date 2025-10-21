import {
  AccountId,
  Address,
  NetworkId,
  WebClient,
  Word,
  Felt,
  NoteFilter,
  NoteFilterTypes,
} from '@demox-labs/miden-sdk';
import { hasRegisteredDomain as checkHasRegisteredDomain, encodeAccountIdToWord } from '@/utils';
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

export async function isNoteCommitted(accountId: AccountId, noteId: string): Promise<boolean> {
  const maxAttempts = 30 // 30 attempts * 2 seconds = 60 seconds
  let attempts = 0
  console.log("started")

  let client = await instantiateClient({ accountsToImport: [] })

  while (attempts < maxAttempts) {
    await client.syncState()

    const noteFilter = new NoteFilter(NoteFilterTypes.Committed)

    const consumableNotes = await client.getConsumableNotes(accountId)
    const committedNotes = await client.getInputNotes(noteFilter)

    const found = consumableNotes.some((note) => note.inputNoteRecord().id().toString() === noteId)
      || committedNotes.some((note) => note.id().toString() === noteId)

    if (found) {
      console.log(`✅ note found ${noteId}`)
      return true
    }

    console.log(`Note ${noteId} not found. Waiting...`)
    await new Promise(resolve => setTimeout(resolve, 2000))
    attempts++
  }

  console.log(`❌ note ${noteId} not found after 60 seconds`)
  return false
}

export async function hasRegisteredDomain(accountId: AccountId): Promise<boolean> {
  const maxAttempts = 30 // 30 attempts * 2 seconds = 60 seconds
  let attempts = 0
  console.log("started")

  const contractId = AccountId.fromHex(MIDEN_ID_CONTRACT_ADDRESS as string);

  let client = await instantiateClient({ accountsToImport: [accountId] })

  while (attempts < maxAttempts) {
    await client.syncState()

    const prefixFelt = accountId.prefix();
    const suffixFelt = accountId.suffix();
    const prefix = prefixFelt.asInt();
    const suffix = suffixFelt.asInt();
    const storageKey = encodeAccountIdToWord(prefix, suffix);

    const contractAccount = await client.getAccount(contractId);
    let domainWord: Word | undefined;

    try {
      domainWord = contractAccount?.storage().getMapItem(4, storageKey);
    } catch (error) {
      console.warn('Failed to get domain from storage:', error);
    }

    const hasDomain = checkHasRegisteredDomain(domainWord);

    if (hasDomain) {
      console.log(`✅ Domain registered to ${accountId}`)
      return true
    }

    console.log(`Domain for ${accountId} not found. Waiting...`)
    await new Promise(resolve => setTimeout(resolve, 2000))
    attempts++
  }

  console.log(`❌ Domain for ${accountId} not found after 60 seconds`)
  return false
}