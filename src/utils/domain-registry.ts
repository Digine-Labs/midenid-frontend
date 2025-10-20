import { Word } from "@demox-labs/miden-sdk";

/**
 * Checks if a domain name is registered by examining the storage Word value.
 *
 * In the Miden.name registry, slot 3 stores Name -> AccountID mappings.
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
 * In the Miden.name registry, slot 4 stores ID -> Name mappings.
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
