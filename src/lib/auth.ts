/**
 * Authentication utilities for Miden wallet signing
 */

import { Felt, SigningInputs } from '@demox-labs/miden-sdk';
import type { SignKind } from '@demox-labs/miden-wallet-adapter-base';
import { login } from '@/api/auth';
import { uint8ArrayToHex } from '@/utils';

export interface AuthenticateParams {
  signBytes: (data: Uint8Array, kind: SignKind) => Promise<Uint8Array>;
  publicKey: Uint8Array;
}

export interface AuthenticateResult {
  success: boolean;
  error?: string;
}

/**
 * Authenticate with the backend using wallet signature
 * Creates a signed message and sends it to /auth/verify to establish a session
 */
export async function authenticate({
  signBytes,
  publicKey,
}: AuthenticateParams): Promise<AuthenticateResult> {
  try {
    // Create a simple auth message
    const authMessage = JSON.stringify({
      action: 'authenticate',
      timestamp: Date.now(),
    });
    const messageBytes = new TextEncoder().encode(authMessage);

    // Convert message to Felt array (8-byte chunks)
    const felts: Felt[] = [];
    for (let i = 0; i < messageBytes.length; i += 8) {
      const chunk = messageBytes.slice(i, i + 8);
      let value = 0n;
      for (let j = 0; j < chunk.length; j++) {
        value |= BigInt(chunk[j]) << BigInt(j * 8);
      }
      felts.push(new Felt(value));
    }

    // Create SigningInputs and get commitment
    const signingInputs = SigningInputs.newArbitrary(felts);
    const commitment = signingInputs.toCommitment();
    const commitmentBytes = commitment.serialize();

    // Sign with wallet
    const signatureBytes = await signBytes(commitmentBytes, "word");

    // Call login API
    const result = await login({
      message_hex: uint8ArrayToHex(commitmentBytes),
      pubkey_hex: uint8ArrayToHex(publicKey),
      signature_hex: uint8ArrayToHex(signatureBytes),
    });

    // Clean up WASM memory
    try {
      signingInputs.free();
    } catch {
      // Already freed
    }

    if (result.success) {
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Auth] Authentication error:', error);
    return { success: false, error: errorMsg };
  }
}
