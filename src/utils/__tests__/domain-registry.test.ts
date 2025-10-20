import { describe, it, expect } from 'vitest';
import { isDomainRegistered, getOwnerFromStorageWord, hasRegisteredDomain } from '../domain-registry';
import { Word, Felt } from '@demox-labs/miden-sdk';

describe('isDomainRegistered', () => {
  it('should return false for undefined Word', () => {
    expect(isDomainRegistered(undefined)).toBe(false);
  });

  it('should return false for zero Word (unregistered domain)', () => {
    const zeroWord = Word.newFromFelts([
      new Felt(0n),
      new Felt(0n),
      new Felt(0n),
      new Felt(0n)
    ]);
    expect(isDomainRegistered(zeroWord)).toBe(false);
  });

  it('should return true for non-zero Word (registered domain)', () => {
    const registeredWord = Word.newFromFelts([
      new Felt(12345n), // prefix
      new Felt(67890n), // suffix
      new Felt(0n),
      new Felt(0n)
    ]);
    expect(isDomainRegistered(registeredWord)).toBe(true);
  });

  it('should return true if any part is non-zero', () => {
    const partialWord = Word.newFromFelts([
      new Felt(1n),
      new Felt(0n),
      new Felt(0n),
      new Felt(0n)
    ]);
    expect(isDomainRegistered(partialWord)).toBe(true);
  });
});

describe('getOwnerFromStorageWord', () => {
  it('should return null for undefined Word', () => {
    expect(getOwnerFromStorageWord(undefined)).toBeNull();
  });

  it('should return null for zero Word (unregistered domain)', () => {
    const zeroWord = Word.newFromFelts([
      new Felt(0n),
      new Felt(0n),
      new Felt(0n),
      new Felt(0n)
    ]);
    expect(getOwnerFromStorageWord(zeroWord)).toBeNull();
  });

  it('should extract owner AccountID from registered domain', () => {
    const prefix = 12345n;
    const suffix = 67890n;

    const registeredWord = Word.newFromFelts([
      new Felt(prefix),
      new Felt(suffix),
      new Felt(0n),
      new Felt(0n)
    ]);

    const owner = getOwnerFromStorageWord(registeredWord);
    expect(owner).not.toBeNull();
    expect(owner?.prefix).toBe(prefix.toString());
    expect(owner?.suffix).toBe(suffix.toString());
  });

  it('should handle large AccountID values', () => {
    const prefix = 999999999999n;
    const suffix = 888888888888n;

    const registeredWord = Word.newFromFelts([
      new Felt(prefix),
      new Felt(suffix),
      new Felt(0n),
      new Felt(0n)
    ]);

    const owner = getOwnerFromStorageWord(registeredWord);
    expect(owner?.prefix).toBe(prefix.toString());
    expect(owner?.suffix).toBe(suffix.toString());
  });
});

describe('hasRegisteredDomain', () => {
  it('should return false for undefined Word', () => {
    expect(hasRegisteredDomain(undefined)).toBe(false);
  });

  it('should return false for zero Word (no domain registered)', () => {
    const zeroWord = Word.newFromFelts([
      new Felt(0n),
      new Felt(0n),
      new Felt(0n),
      new Felt(0n)
    ]);
    expect(hasRegisteredDomain(zeroWord)).toBe(false);
  });

  it('should return true for non-zero Word (domain registered)', () => {
    const domainWord = Word.newFromFelts([
      new Felt(0n),
      new Felt(0n),
      new Felt(0x503090c01n), // "alice" encoded
      new Felt(5n)            // length
    ]);
    expect(hasRegisteredDomain(domainWord)).toBe(true);
  });

  it('should return true if any part is non-zero', () => {
    const partialWord = Word.newFromFelts([
      new Felt(0n),
      new Felt(0n),
      new Felt(0n),
      new Felt(1n) // Just length field set
    ]);
    expect(hasRegisteredDomain(partialWord)).toBe(true);
  });
});

describe('domain-registry integration tests', () => {
  it('should correctly identify registered vs unregistered domains', () => {
    const unregisteredWord = Word.newFromFelts([
      new Felt(0n),
      new Felt(0n),
      new Felt(0n),
      new Felt(0n)
    ]);

    const registeredWord = Word.newFromFelts([
      new Felt(123n),
      new Felt(456n),
      new Felt(0n),
      new Felt(0n)
    ]);

    expect(isDomainRegistered(unregisteredWord)).toBe(false);
    expect(isDomainRegistered(registeredWord)).toBe(true);

    expect(getOwnerFromStorageWord(unregisteredWord)).toBeNull();
    expect(getOwnerFromStorageWord(registeredWord)).not.toBeNull();
  });

  it('should correctly identify accounts with/without domains', () => {
    const noDomainWord = Word.newFromFelts([
      new Felt(0n),
      new Felt(0n),
      new Felt(0n),
      new Felt(0n)
    ]);

    const hasDomainWord = Word.newFromFelts([
      new Felt(0n),
      new Felt(0n),
      new Felt(0x503090c01n),
      new Felt(5n)
    ]);

    expect(hasRegisteredDomain(noDomainWord)).toBe(false);
    expect(hasRegisteredDomain(hasDomainWord)).toBe(true);
  });
});
