import type { Account, AccountId, MidenClient } from '@miden-sdk/miden-sdk';
import { createContext } from 'react';

type MidenNameProviderState = {
  client?: MidenClient;
  syncState: () => Promise<void>;
  getAccount: (accountId: AccountId) => Promise<Account | undefined>;
  getBalance: (accountId: AccountId, faucetId: AccountId) => Promise<bigint>;
};

const initialState: MidenNameProviderState = {
  syncState: () => Promise.resolve(),
  getAccount: () => Promise.resolve(undefined),
  getBalance: () => Promise.resolve(0n),
};

export const MidenNameContext = createContext<MidenNameProviderState>(initialState);
