import { describe, it, expect } from 'vitest';
import { decodeChar, decodeDomain } from '../decode';
import { encodeDomain } from '../encode';
import { Felt, Word } from '@miden-sdk/miden-sdk';

describe('decodeChar', () => {
  it('should decode values 1-26 to lowercase letters a-z', () => {
    expect(decodeChar(1)).toBe('a');
    expect(decodeChar(2)).toBe('b');
    expect(decodeChar(13)).toBe('m');
    expect(decodeChar(26)).toBe('z');
  });

  it('should decode values 27-36 to digits 0-9', () => {
    expect(decodeChar(27)).toBe('0');
    expect(decodeChar(28)).toBe('1');
    expect(decodeChar(32)).toBe('5');
    expect(decodeChar(36)).toBe('9');
  });

  it('should return null for invalid values', () => {
    expect(decodeChar(0)).toBeNull();
    expect(decodeChar(37)).toBeNull();
    expect(decodeChar(100)).toBeNull();
    expect(decodeChar(-1)).toBeNull();
  });

  it('should decode all valid letter codes', () => {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    letters.split('').forEach((char, index) => {
      expect(decodeChar(index + 1)).toBe(char);
    });
  });

  it('should decode all valid digit codes', () => {
    const digits = '0123456789';
    digits.split('').forEach((char, index) => {
      expect(decodeChar(27 + index)).toBe(char);
    });
  });

  it('should be inverse of encodeChar', () => {
    // This test requires encodeChar but we're only testing decodeChar
    // We can manually verify the mapping
    const validChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const expectedCodes = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
      27, 28, 29, 30, 31, 32, 33, 34, 35, 36
    ];

    expectedCodes.forEach((code, index) => {
      expect(decodeChar(code)).toBe(validChars[index]);
    });
  });
});

describe('decodeDomain', () => {
  it('should decode a single letter', () => {
    const encoded = 0x503090c01n;
    const encodedWord = Word.newFromFelts([
      new Felt(0n),
      new Felt(0n),
      new Felt(encoded),
      new Felt(5n)
    ]);

    const decodedDomain = decodeDomain(encodedWord);
    expect(decodedDomain).toBe('alice');
  });

  it('should decode domain spanning multiple felts', () => {
    const encodedWord = Word.newFromFelts([
      new Felt(0x50f0an),           // joe
      new Felt(0x40e01020f0204n),   // dboband
      new Felt(0xe010503090c01n),   // alicean
      new Felt(17n)                 // length
    ]);

    const decodedDomain = decodeDomain(encodedWord);
    expect(decodedDomain).toBe('aliceandbobandjoe');
  });

  // Edge case tests
  it('should decode single character domain', () => {
    const singleCharWord = Word.newFromFelts([
      new Felt(0n),
      new Felt(0n),
      new Felt(1n), // 'a'
      new Felt(1n)  // length
    ]);

    expect(decodeDomain(singleCharWord)).toBe('a');
  });

  it('should decode domains at felt boundaries', () => {
    // Test 7 characters (1 felt boundary)
    const domain7 = 'abcdefg';
    const encoded7 = encodeDomain(domain7);
    expect(decodeDomain(encoded7)).toBe(domain7);

    // Test 8 characters (crosses to 2nd felt)
    const domain8 = 'abcdefgh';
    const encoded8 = encodeDomain(domain8);
    expect(decodeDomain(encoded8)).toBe(domain8);

    // Test 14 characters (2 felt boundary)
    const domain14 = 'abcdefghijklmn';
    const encoded14 = encodeDomain(domain14);
    expect(decodeDomain(encoded14)).toBe(domain14);

    // Test 15 characters (crosses to 3rd felt)
    const domain15 = 'abcdefghijklmno';
    const encoded15 = encodeDomain(domain15);
    expect(decodeDomain(encoded15)).toBe(domain15);

    // Test 20 characters (max length)
    const domain20 = 'a'.repeat(20);
    const encoded20 = encodeDomain(domain20);
    expect(decodeDomain(encoded20)).toBe(domain20);
  });

  it('should decode domains with numbers', () => {
    const testDomains = ['user123', '123abc', '0000', '9999', 'abc123xyz'];

    testDomains.forEach(domain => {
      const encoded = encodeDomain(domain);
      expect(decodeDomain(encoded)).toBe(domain);
    });
  });

  it('should maintain round-trip consistency', () => {
    const testDomains = [
      'a',
      'ab',
      'abc',
      'test',
      'alice',
      'user123',
      'abcdefg',      // 7 chars
      'abcdefgh',     // 8 chars
      'abcdefghijklmn', // 14 chars
      'abcdefghijklmno', // 15 chars
      'a'.repeat(20), // max length
    ];

    testDomains.forEach(domain => {
      const encoded = encodeDomain(domain);
      const decoded = decodeDomain(encoded);
      expect(decoded).toBe(domain);

      // Double round-trip
      const reEncoded = encodeDomain(decoded);
      const reEncodedValues = reEncoded.toFelts().map(f => f.asInt());
      const encodedValues = encoded.toFelts().map(f => f.asInt());
      expect(reEncodedValues).toEqual(encodedValues);
    });
  });

  it('should throw error for invalid character codes', () => {
    // Create a Word with invalid character code (37 is invalid)
    const invalidWord = Word.newFromFelts([
      new Felt(0n),
      new Felt(0n),
      new Felt(37n), // Invalid code (valid range: 1-36)
      new Felt(1n)   // length
    ]);

    expect(() => decodeDomain(invalidWord)).toThrow('Invalid character code 37 at position 0');
  });

  it('should handle zero-length edge case', () => {
    const zeroLengthWord = Word.newFromFelts([
      new Felt(0n),
      new Felt(0n),
      new Felt(0n),
      new Felt(0n) // length = 0
    ]);

    expect(decodeDomain(zeroLengthWord)).toBe('');
  });
});
