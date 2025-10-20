import { describe, it, expect } from 'vitest';
import { encodeChar, encodeDomain, unsafeEncodeDomain, encodeNameToWord, encodeAccountIdToWord } from '../encode';
import { decodeDomain } from '../decode';

describe('encodeChar', () => {
  it('should encode lowercase letters a-z to 1-26', () => {
    expect(encodeChar('a')).toBe(1);
    expect(encodeChar('b')).toBe(2);
    expect(encodeChar('m')).toBe(13);
    expect(encodeChar('z')).toBe(26);
  });

  it('should encode digits 0-9 to 27-36', () => {
    expect(encodeChar('0')).toBe(27);
    expect(encodeChar('1')).toBe(28);
    expect(encodeChar('5')).toBe(32);
    expect(encodeChar('9')).toBe(36);
  });

  it('should return null for invalid characters', () => {
    expect(encodeChar('A')).toBeNull();
    expect(encodeChar('!')).toBeNull();
    expect(encodeChar('@')).toBeNull();
    expect(encodeChar(' ')).toBeNull();
    expect(encodeChar('-')).toBeNull();
  });

  it('should encode all valid lowercase letters', () => {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    letters.split('').forEach((char, index) => {
      expect(encodeChar(char)).toBe(index + 1);
    });
  });

  it('should encode all valid digits', () => {
    const digits = '0123456789';
    digits.split('').forEach((char, index) => {
      expect(encodeChar(char)).toBe(27 + index);
    });
  });
});

describe('encodeDomain', () => {
  it('should encode a single letter', () => {
    const letter = 'a';
    const encoded = encodeDomain(letter);
    const felts = encoded.toFelts();

    expect(felts[0].asInt()).toBe(0n);
    expect(felts[1].asInt()).toBe(0n);
    expect(felts[2].asInt()).toBe(1n);
    expect(felts[3].asInt()).toBe(1n);
  });

  it('should encode multiple letters', () => {
    const domain = 'alice';
    const encoded = encodeDomain(domain);
    const felts = encoded.toFelts();

    expect(felts[0].asInt()).toBe(0n);
    expect(felts[1].asInt()).toBe(0n);
    expect(felts[2].asInt()).toBe(0x503090c01n);
    expect(felts[3].asInt()).toBe(5n);
  });

  it('should encode domain spanning multiple felts', () => {
    const domain = 'aliceandbobandjoe';
    const encoded = encodeDomain(domain);
    const felts = encoded.toFelts();

    expect(felts[0].asInt()).toBe(0x050f0an); // joe
    expect(felts[1].asInt()).toBe(0x40e01020f0204n); // dboband
    expect(felts[2].asInt()).toBe(0xe010503090c01n); // alicean
    expect(felts[3].asInt()).toBe(17n);
  });

  // Edge case tests
  it('should throw error for empty string', () => {
    expect(() => encodeDomain('')).toThrow('Domain name must have at least 1 character');
  });

  it('should encode max length domain (20 characters)', () => {
    const maxDomain = 'a'.repeat(20);
    const encoded = encodeDomain(maxDomain);
    const felts = encoded.toFelts();
    expect(felts[3].asInt()).toBe(20n);
  });

  it('should throw error for domain exceeding max length (21+ characters)', () => {
    const tooLongDomain = 'a'.repeat(21);
    expect(() => encodeDomain(tooLongDomain)).toThrow('Domain name must be at most 20 characters');
  });

  it('should encode domains with numbers', () => {
    const domain = 'user123';
    const encoded = encodeDomain(domain);
    const felts = encoded.toFelts();
    expect(felts[3].asInt()).toBe(7n);

    // Verify round-trip
    const decoded = decodeDomain(encoded);
    expect(decoded).toBe(domain);
  });

  it('should encode mixed alphanumeric domains', () => {
    const domain = 'abc123xyz';
    const encoded = encodeDomain(domain);
    const felts = encoded.toFelts();
    expect(felts[3].asInt()).toBe(9n);

    const decoded = decodeDomain(encoded);
    expect(decoded).toBe(domain);
  });

  it('should handle domains at felt boundaries', () => {
    // Exactly 7 characters (1 felt boundary)
    const domain7 = 'abcdefg';
    const encoded7 = encodeDomain(domain7);
    let felts = encoded7.toFelts();
    expect(felts[0].asInt()).toBe(0n); // felt1 empty
    expect(felts[1].asInt()).toBe(0n); // felt2 empty
    expect(felts[2].asInt()).not.toBe(0n); // felt3 has data
    expect(felts[3].asInt()).toBe(7n);

    // Exactly 8 characters (crosses to 2nd felt)
    const domain8 = 'abcdefgh';
    const encoded8 = encodeDomain(domain8);
    felts = encoded8.toFelts();
    expect(felts[0].asInt()).toBe(0n); // felt1 empty
    expect(felts[1].asInt()).not.toBe(0n); // felt2 has data
    expect(felts[2].asInt()).not.toBe(0n); // felt3 has data
    expect(felts[3].asInt()).toBe(8n);

    // Exactly 14 characters (2 felt boundary)
    const domain14 = 'a'.repeat(14);
    const encoded14 = encodeDomain(domain14);
    felts = encoded14.toFelts();
    expect(felts[0].asInt()).toBe(0n); // felt1 empty
    expect(felts[1].asInt()).not.toBe(0n); // felt2 has data
    expect(felts[2].asInt()).not.toBe(0n); // felt3 has data
    expect(felts[3].asInt()).toBe(14n);

    // Exactly 15 characters (crosses to 3rd felt)
    const domain15 = 'a'.repeat(15);
    const encoded15 = encodeDomain(domain15);
    felts = encoded15.toFelts();
    expect(felts[0].asInt()).not.toBe(0n); // felt1 has data
    expect(felts[1].asInt()).not.toBe(0n); // felt2 has data
    expect(felts[2].asInt()).not.toBe(0n); // felt3 has data
    expect(felts[3].asInt()).toBe(15n);
  });

  it('should throw error for invalid characters', () => {
    expect(() => encodeDomain('Test')).toThrow("Invalid character 'T' in domain name");
    expect(() => encodeDomain('hello-world')).toThrow("Invalid character '-' in domain name");
    expect(() => encodeDomain('hello.world')).toThrow("Invalid character '.' in domain name");
    expect(() => encodeDomain('hello_world')).toThrow("Invalid character '_' in domain name");
    expect(() => encodeDomain('hello world')).toThrow("Invalid character ' ' in domain name");
  });

  it('should maintain round-trip consistency', () => {
    const testDomains = ['a', 'ab', 'abc', 'test', 'user123', 'abc123xyz', 'a'.repeat(20)];

    testDomains.forEach(domain => {
      const encoded = encodeDomain(domain);
      const decoded = decodeDomain(encoded);
      expect(decoded).toBe(domain);
    });
  });
});

describe('unsafeEncodeDomain', () => {
  it('should encode without length validation', () => {
    const normalDomain = 'test';
    const encoded = unsafeEncodeDomain(normalDomain);
    const felts = encoded.toFelts();
    expect(felts[3].asInt()).toBe(4n);
  });

  it('should allow domains longer than 20 characters', () => {
    const longDomain = 'a'.repeat(25);
    const encoded = unsafeEncodeDomain(longDomain);
    const felts = encoded.toFelts();
    expect(felts[3].asInt()).toBe(25n);
  });

  it('should still throw error for invalid characters', () => {
    expect(() => unsafeEncodeDomain('Test')).toThrow("Invalid character 'T' in domain name");
    expect(() => unsafeEncodeDomain('hello-world')).toThrow("Invalid character '-' in domain name");
  });

  it('should produce same output as encodeDomain for valid inputs', () => {
    const domain = 'test123';
    const safeEncoded = encodeDomain(domain);
    const unsafeEncoded = unsafeEncodeDomain(domain);

    const unsafeValues = unsafeEncoded.toFelts().map(f => f.asInt());
    const safeValues = safeEncoded.toFelts().map(f => f.asInt());
    expect(unsafeValues).toEqual(safeValues);
  });
});

describe('encodeNameToWord', () => {
  it('should encode name in reverse mode (default)', () => {
    const name = 'alice';
    const encoded = encodeNameToWord(name);
    const felts = encoded.toFelts();

    expect(felts[3].asInt()).toBe(BigInt(name.length)); // length in last position
  });

  it('should encode name in non-reverse mode', () => {
    const name = 'alice';
    const encoded = encodeNameToWord(name, false);
    const felts = encoded.toFelts();

    expect(felts[0].asInt()).toBe(BigInt(name.length)); // length in first position
  });

  it('should throw error for names exceeding 20 characters', () => {
    const tooLongName = 'a'.repeat(21);
    expect(() => encodeNameToWord(tooLongName)).toThrow('Name must not exceed 20 characters');
  });

  it('should encode max length name (20 characters)', () => {
    const maxName = 'a'.repeat(20);
    expect(() => encodeNameToWord(maxName)).not.toThrow();
  });

  it('should produce different felt ordering for reverse vs non-reverse', () => {
    const name = 'test';
    const reversedWord = encodeNameToWord(name, true);
    const normalWord = encodeNameToWord(name, false);

    const reversedFelts = reversedWord.toFelts();
    const normalFelts = normalWord.toFelts();

    // Length should be in different positions
    expect(reversedFelts[3].asInt()).toBe(BigInt(name.length));
    expect(normalFelts[0].asInt()).toBe(BigInt(name.length));
  });
});

describe('encodeAccountIdToWord', () => {
  it('should encode AccountId prefix and suffix', () => {
    const prefix = 12345n;
    const suffix = 67890n;

    const encoded = encodeAccountIdToWord(prefix, suffix);
    const felts = encoded.toFelts();

    expect(felts[0].asInt()).toBe(suffix);
    expect(felts[1].asInt()).toBe(prefix);
    expect(felts[2].asInt()).toBe(0n);
    expect(felts[3].asInt()).toBe(0n);
  });

  it('should handle zero values', () => {
    const encoded = encodeAccountIdToWord(0n, 0n);
    const felts = encoded.toFelts();

    felts.forEach(felt => {
      expect(felt.asInt()).toBe(0n);
    });
  });

  it('should handle large AccountId values', () => {
    const prefix = 999999999999n;
    const suffix = 888888888888n;

    const encoded = encodeAccountIdToWord(prefix, suffix);
    const felts = encoded.toFelts();

    expect(felts[0].asInt()).toBe(suffix);
    expect(felts[1].asInt()).toBe(prefix);
  });
});
