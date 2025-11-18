import { Word } from "@demox-labs/miden-sdk";

/**
 * Checks if a storage Word value contains data (non-zero).
 *
 * This is a helper function to determine if a storage slot has been written to.
 * - If the value is [0, 0, 0, 0], the storage is empty (returns false)
 * - If the value contains any non-zero data, the storage has data (returns true)
 *
 * @param storageWord - The Word value retrieved from storage
 * @returns true if the storage contains data, false otherwise
 */
export function hasStorageValue(storageWord: Word | undefined): boolean {
  if (!storageWord) return false;

  const u64s = storageWord.toU64s();

  // If all values are 0, the storage is empty
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
  if (!storageWord || !hasStorageValue(storageWord)) {
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
