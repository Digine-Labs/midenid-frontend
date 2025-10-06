import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import {
  type AccountId,
  Address,
  NetworkId,
  WebClient,
} from '@demox-labs/miden-sdk';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const instantiateClient = async (
  { accountsToImport }: { accountsToImport: AccountId[] },
) => {
  const nodeEndpoint = 'https://rpc.testnet.miden.io:443';
  const client = await WebClient.createClient(nodeEndpoint);
  for (const acc of accountsToImport) {
    try {
      await safeAccountImport(client, acc);
    } catch (e) { console.error(e) }
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

/**
 * Formats a balance value from bigint to a readable number string
 * @param balance - The balance as a bigint (e.g., 200000000n)
 * @param decimals - Number of decimal places (default: 6)
 * @returns The formatted balance as a string (e.g., "200")
 */
export const formatBalance = (balance: bigint, decimals: number = 6): string => {
  if (balance === BigInt(0)) {
    return '0';
  }

  const divisor = BigInt(Math.pow(10, decimals));
  const wholePart = balance / divisor;
  const fractionalPart = balance % divisor;

  if (fractionalPart === BigInt(0)) {
    return wholePart.toString();
  }

  // Format with appropriate decimal places
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  const trimmedFractional = fractionalStr.replace(/0+$/, '');

  if (trimmedFractional === '') {
    return wholePart.toString();
  }

  return `${wholePart}.${trimmedFractional}`;
};