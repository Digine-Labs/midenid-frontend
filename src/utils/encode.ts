import { Felt, Word } from '@demox-labs/miden-sdk';

/**
 * Encodes a character to its numeric representation.
 * a-z: 1-26, 0-9: 27-36
 * Returns null for invalid characters.
 */
export function encodeChar(chr: string): number | null {
  switch (chr) {
    case 'a': return 1;
    case 'b': return 2;
    case 'c': return 3;
    case 'd': return 4;
    case 'e': return 5;
    case 'f': return 6;
    case 'g': return 7;
    case 'h': return 8;
    case 'i': return 9;
    case 'j': return 10;
    case 'k': return 11;
    case 'l': return 12;
    case 'm': return 13;
    case 'n': return 14;
    case 'o': return 15;
    case 'p': return 16;
    case 'q': return 17;
    case 'r': return 18;
    case 's': return 19;
    case 't': return 20;
    case 'u': return 21;
    case 'v': return 22;
    case 'w': return 23;
    case 'x': return 24;
    case 'y': return 25;
    case 'z': return 26;
    case '0': return 27;
    case '1': return 28;
    case '2': return 29;
    case '3': return 30;
    case '4': return 31;
    case '5': return 32;
    case '6': return 33;
    case '7': return 34;
    case '8': return 35;
    case '9': return 36;
    default: return null;
  }
}

/**
 * Encodes a domain name into a Word.
 *
 * Encoding format:
 * - 7 characters per Felt, 8 bits each
 * - First 7 characters go into felt3
 * - Next 7 characters go into felt2
 * - Remaining characters (up to 6) go into felt1
 * - Length is stored in felt4
 *
 * Word format: [felt1, felt2, felt3, length]
 * This is reversed for MASM storage (becomes [length, felt3, felt2, felt1] on stack)
 *
 * @param domain - Domain name (1-20 characters, alphanumeric)
 * @throws Error if domain is empty, too long, or contains invalid characters
 */
export function encodeDomain(domain: string): Word {
  const len = domain.length;

  // Validate length
  if (len === 0) {
    throw new Error('Domain name must have at least 1 character');
  }
  if (len > 20) {
    throw new Error('Domain name must be at most 20 characters');
  }

  // Encode each character
  const encodedChars: number[] = [];
  for (const chr of domain) {
    const charCode = encodeChar(chr);
    if (charCode === null) {
      throw new Error(`Invalid character '${chr}' in domain name`);
    }
    encodedChars.push(charCode);
  }

  // Pack characters into Felts (7 characters per Felt, 8 bits each)
  let felt1 = 0n;
  let felt2 = 0n;
  let felt3 = 0n;

  for (let i = 0; i < encodedChars.length; i++) {
    const charCode = BigInt(encodedChars[i]);
    const bitShift = BigInt((i % 7) * 8);

    if (i < 7) {
      // First 7 characters go into felt3
      felt3 |= charCode << bitShift;
    } else if (i < 14) {
      // Next 7 characters go into felt2
      felt2 |= charCode << bitShift;
    } else {
      // Remaining characters go into felt1
      felt1 |= charCode << bitShift;
    }
  }

  // Format: [felt1, felt2, felt3, length]
  return Word.newFromFelts([
    new Felt(felt1),
    new Felt(felt2),
    new Felt(felt3),
    new Felt(BigInt(len)),
  ]);
}

/**
 * Encodes a domain name into a Word without validation.
 *
 * Same encoding as encodeDomain(), but skips length validation.
 * Use with caution - only when you're certain the input is valid.
 *
 * @param domain - Domain name (alphanumeric)
 * @throws Error if domain contains invalid characters
 */
export function unsafeEncodeDomain(domain: string): Word {
  const len = domain.length;

  // Encode each character
  const encodedChars: number[] = [];
  for (const chr of domain) {
    const charCode = encodeChar(chr);
    if (charCode === null) {
      throw new Error(`Invalid character '${chr}' in domain name`);
    }
    encodedChars.push(charCode);
  }

  // Pack characters into Felts
  let felt1 = 0n;
  let felt2 = 0n;
  let felt3 = 0n;

  for (let i = 0; i < encodedChars.length; i++) {
    const charCode = BigInt(encodedChars[i]);
    const bitShift = BigInt((i % 7) * 8);

    if (i < 7) {
      felt3 |= charCode << bitShift;
    } else if (i < 14) {
      felt2 |= charCode << bitShift;
    } else {
      felt1 |= charCode << bitShift;
    }
  }

  return Word.newFromFelts([
    new Felt(felt1),
    new Felt(felt2),
    new Felt(felt3),
    new Felt(BigInt(len)),
  ]);
}

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
export function encodeDomainOld(name: string, reverse: boolean = true): Word {
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
    new Felt(BigInt(0)),
    new Felt(BigInt(0)),
  ];

  return Word.newFromFelts(felts);
}
