/**
 * Formats a balance value from bigint to a readable number string.
 *
 * This function handles Miden token balances which are stored with 6 decimal places.
 * It converts raw bigint values (e.g., 200000000n) to human-readable strings (e.g., "200").
 *
 * @param balance - The balance as a bigint (e.g., 200000000n for 200 tokens)
 * @param decimals - Number of decimal places to consider (default: 6 for Miden tokens)
 * @returns The formatted balance as a string (e.g., "200" or "200.5")
 *
 * @example
 * formatBalance(200000000n) // => "200"
 * formatBalance(200500000n) // => "200.5"
 * formatBalance(0n) // => "0"
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
