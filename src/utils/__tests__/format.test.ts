import { describe, it, expect } from 'vitest';
import { formatBalance } from '../format';

describe('formatBalance', () => {
  it('should return "0" for zero balance', () => {
    expect(formatBalance(0n)).toBe('0');
    expect(formatBalance(BigInt(0))).toBe('0');
  });

  it('should format whole numbers without decimals', () => {
    expect(formatBalance(1000000n)).toBe('1'); // 1 MIDEN
    expect(formatBalance(5000000n)).toBe('5'); // 5 MIDEN
    expect(formatBalance(100000000n)).toBe('100'); // 100 MIDEN
    expect(formatBalance(1000000000n)).toBe('1000'); // 1000 MIDEN
  });

  it('should format balances with decimals (1 decimal place)', () => {
    expect(formatBalance(1500000n)).toBe('1.5'); // 1.5 MIDEN
    expect(formatBalance(10500000n)).toBe('10.5'); // 10.5 MIDEN
  });

  it('should format balances with decimals (2 decimal places)', () => {
    expect(formatBalance(1250000n)).toBe('1.25'); // 1.25 MIDEN
    expect(formatBalance(99990000n)).toBe('99.99'); // 99.99 MIDEN
  });

  it('should format balances with decimals (3 decimal places max)', () => {
    expect(formatBalance(1123000n)).toBe('1.123'); // 1.123 MIDEN
    expect(formatBalance(5678000n)).toBe('5.678'); // 5.678 MIDEN
  });

  it('should trim trailing zeros from decimals', () => {
    expect(formatBalance(1100000n)).toBe('1.1'); // 1.100000 → 1.1
    expect(formatBalance(5500000n)).toBe('5.5'); // 5.500000 → 5.5
    expect(formatBalance(10010000n)).toBe('10.01'); // 10.010000 → 10.01
  });

  it('should limit decimal places to 3 characters', () => {
    expect(formatBalance(1123456n)).toBe('1.123'); // Should truncate to 3 decimal places
    expect(formatBalance(9999999n)).toBe('9.999'); // 9.999999 → 9.999
  });

  it('should handle very small amounts (less than 1)', () => {
    expect(formatBalance(500000n)).toBe('0.5'); // 0.5 MIDEN
    expect(formatBalance(100000n)).toBe('0.1'); // 0.1 MIDEN
    expect(formatBalance(10000n)).toBe('0.01'); // 0.01 MIDEN
    expect(formatBalance(1000n)).toBe('0.001'); // 0.001 MIDEN
    expect(formatBalance(100n)).toBe('0.000'); // 0.0001 → truncated to 3 decimals = 0.000
  });

  it('should handle large balances', () => {
    expect(formatBalance(1000000000000n)).toBe('1000000'); // 1 million MIDEN
    expect(formatBalance(999999999999n)).toBe('999999.999'); // 999,999.999999 MIDEN
  });

  it('should work with custom decimal places', () => {
    expect(formatBalance(1000n, 3)).toBe('1'); // 1 token with 3 decimals
    expect(formatBalance(1500n, 3)).toBe('1.5'); // 1.5 tokens with 3 decimals
    expect(formatBalance(100000000000000000000n, 18)).toBe('100'); // 100 ETH-like token (18 decimals)
  });

  it('should handle edge case: fractional part becomes empty after trimming', () => {
    expect(formatBalance(1000000n, 6)).toBe('1'); // No fractional part
    expect(formatBalance(2000000n, 6)).toBe('2'); // No fractional part
  });
});
