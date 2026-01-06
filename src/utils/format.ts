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
