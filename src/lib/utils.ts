import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Felt, Word } from "@demox-labs/miden-sdk";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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

  // Format with appropriate decimal places, limit to 3 chars
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  const trimmedFractional = fractionalStr.replace(/0+$/, '').substring(0, 3);

  if (trimmedFractional === '') {
    return wholePart.toString();
  }

  return `${wholePart}.${trimmedFractional}`;
};

/**
 * Encodes a name string into a Word for storage in the registry.
 *
 * Names are packed into a single Word (4 Felts) with the following layout:
 * - Felt[0]: Name length
 * - Felt[1-3]: ASCII characters, 7 characters per Felt (56 bits used per Felt)
 *
 * @param name - The name string to encode (max 20 characters, ASCII only)
 * @param reverse - If true, reverses the felt order for storage compatibility (default: true)
 * @returns A Word containing the encoded name
 * @throws {Error} If the name exceeds 20 characters
 *
 * Format: Word: `[length, chars_1-7, chars_8-14, chars_15-20]`
 */
export function encodeNameToWord(name: string, reverse: boolean = true): Word {
  if (name.length > 20) {
    throw new Error("Name must not exceed 20 characters");
  }

  const felts: Felt[] = [
    new Felt(0n),
    new Felt(0n),
    new Felt(0n),
    new Felt(0n),
  ];

  if (reverse) {
    // Reversed mode: Felt[3] = length, Felt[2-0] = chars (for storage queries)
    felts[3] = new Felt(BigInt(name.length));

    const bytes = new TextEncoder().encode(name);

    for (let i = 0; i < 3; i++) {
      const start = i * 7;
      const end = Math.min(start + 7, bytes.length);
      const chunk = bytes.slice(start, end);

      let value = 0n;
      for (let j = 0; j < chunk.length; j++) {
        value |= BigInt(chunk[j]) << BigInt(j * 8);
      }
      felts[2 - i] = new Felt(value);
    }
  } else {
    // Normal mode: Felt[0] = length, Felt[1-3] = chars (for transaction inputs)
    felts[0] = new Felt(BigInt(name.length));

    const bytes = new TextEncoder().encode(name);

    for (let i = 0; i < 3; i++) {
      const start = i * 7;
      const end = Math.min(start + 7, bytes.length);
      const chunk = bytes.slice(start, end);

      let value = 0n;
      for (let j = 0; j < chunk.length; j++) {
        value |= BigInt(chunk[j]) << BigInt(j * 8);
      }
      felts[i + 1] = new Felt(value);
    }
  }

  return Word.newFromFelts(felts);
}

/**
 * Encodes an AccountId (prefix + suffix) into a Word for storage lookup.
 *
 * Used to query slot 4 (ID -> Name mapping) to check if an account has a registered domain.
 *
 * @param prefix - Account ID prefix (bigint)
 * @param suffix - Account ID suffix (bigint)
 * @returns A Word containing the encoded AccountId in storage-compatible format
 *
 * Format: Word: `[0, 0, suffix, prefix]` (reversed for storage compatibility)
 */
export function encodeAccountIdToWord(prefix: bigint, suffix: bigint): Word {
  const felts: Felt[] = [
    new Felt(suffix),
    new Felt(prefix),
    new Felt(0n),
    new Felt(0n),
  ];

  return Word.newFromFelts(felts);
}

/**
 * Checks if a domain name is registered by examining the storage Word value.
 *
 * In the Miden.ID registry, slot 3 stores Name -> AccountID mappings.
 * - If the value is [0, 0, 0, 0], the name is NOT registered
 * - If the value is [prefix, suffix, 0, 0], the name IS registered
 *
 * @param storageWord - The Word value retrieved from storage slot 3
 * @returns true if the name is registered, false otherwise
 */
export function isDomainRegistered(storageWord: Word | undefined): boolean {
  if (!storageWord) return false;

  const u64s = storageWord.toU64s();

  // If all values are 0, the domain is NOT registered
  const isZero = u64s[0] === 0n && u64s[1] === 0n && u64s[2] === 0n && u64s[3] === 0n;

  return !isZero;
}

/**
 * Extracts the owner AccountID from a storage Word (from slot 3: Name -> ID mapping).
 *
 * @param storageWord - The Word value retrieved from storage slot 3
 * @returns An object with prefix and suffix if registered, or null if not registered
 */
export function getOwnerFromStorageWord(storageWord: Word | undefined): { prefix: string, suffix: string } | null {
  if (!storageWord || !isDomainRegistered(storageWord)) {
    return null;
  }

  const felts = storageWord.toFelts();

  // MASM stores Name->ID mapping as: Word[prefix, suffix, 0, 0]
  // But Word.toFelts() returns in reverse: [0, 0, suffix, prefix]
  // So we need to read from the end

  return {
    prefix: felts[0].toString(),  // Index 0 in reversed array = prefix
    suffix: felts[1].toString(),  // Index 1 in reversed array = suffix
  };
}

/**
 * Checks if an account has a registered domain by examining the storage Word value from slot 4.
 *
 * In the Miden.ID registry, slot 4 stores ID -> Name mappings.
 * - If the value is [0, 0, 0, 0], the account has NO domain registered
 * - If the value contains data, the account HAS a domain registered
 *
 * @param storageWord - The Word value retrieved from storage slot 4
 * @returns true if the account has a registered domain, false otherwise
 */
export function hasRegisteredDomain(storageWord: Word | undefined): boolean {
  if (!storageWord) return false;

  const u64s = storageWord.toU64s();

  // If all values are 0, the account has NO domain
  const isZero = u64s[0] === 0n && u64s[1] === 0n && u64s[2] === 0n && u64s[3] === 0n;

  return !isZero;
}
