import type { CreateMessageParams } from '@/types/profile';

/**
 * Convert Uint8Array to hex string
 * @param arr - Uint8Array to convert
 * @returns Hex string representation
 * @example
 * uint8ArrayToHex(new Uint8Array([255, 0, 128])) // => "ff0080"
 */
export const uint8ArrayToHex = (arr: Uint8Array): string => {
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Decode a base64 string into a Uint8Array (browser-safe via atob).
 * @param b64 - Base64-encoded string
 * @returns Decoded bytes
 */
export const base64ToUint8Array = (b64: string): Uint8Array => {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

/**
 * Create a JSON message for signing profile data
 * @param params - Profile data parameters
 * @returns JSON string of the message with timestamp
 * @example
 * createMessage({ domain: "alice", bio: "Hello", ... })
 * // => '{"domain":"alice","bio":"Hello",...,"timestamp":1234567890}'
 */
export const createMessage = (params: CreateMessageParams): string => {
  return JSON.stringify({
    domain: params.domain,
    bio: params.bio?.trim() || '',
    twitter: params.twitter?.trim() || '',
    github: params.github?.trim() || '',
    discord: params.discord?.trim() || '',
    telegram: params.telegram?.trim() || '',
    image_url: params.image_url?.trim() || '',
    timestamp: Date.now()
  });
};
