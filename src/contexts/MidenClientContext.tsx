import { createContext, useContext } from 'react';
import type { Account, AccountId, MidenClient } from '@miden-sdk/miden-sdk';

export interface MidenClientContextValue {
  client: MidenClient | null;
  isReady: boolean;
  error: Error | null;
  /**
   * AccountId of the connected wallet, decoded from its bech32 address.
   * Null when no wallet is connected (or the address can't be parsed).
   * Use `.isPrivate()` / `.isPublic()` to branch on storage mode.
   */
  userAccountId: AccountId | null;
  syncState: () => Promise<void>;
  getAccount: (accountId: AccountId) => Promise<Account | null>;
  withClient: <T>(fn: (c: MidenClient) => Promise<T>) => Promise<T>;
  checkDomainAvailable: (domain: string) => Promise<boolean>;
  getDomainOwner: (domain: string) => Promise<AccountId | null>;
  /**
   * Balance of the connected wallet's account for a given faucet (bech32).
   * - Public/network accounts: read on-chain via the Miden client (no wallet prompt).
   * - Private accounts: falls back to `requestAssets()` on the wallet adapter.
   * Returns null when no wallet is connected or the lookup fails.
   */
  getUserBalance: (faucetIdBech32: string) => Promise<bigint | null>;
  /**
   * Balance of an arbitrary account for a given faucet. Goes through the
   * Miden client, so it only works for accounts whose state is reachable
   * (public, network, or already imported).
   */
  getAccountBalance: (accountId: AccountId, faucetId: AccountId) => Promise<bigint>;
}

export const MidenClientContext = createContext<MidenClientContextValue | null>(null);

export function useMidenClient(): MidenClientContextValue {
  const ctx = useContext(MidenClientContext);
  if (!ctx) {
    throw new Error('useMidenClient must be used inside <MidenClientProvider>');
  }
  return ctx;
}
