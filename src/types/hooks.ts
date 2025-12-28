import type { AccountId, Word } from '@demox-labs/miden-sdk';

// Balance hook params (from hooks/useBalance.tsx)
export interface BalanceParams {
  readonly accountId: AccountId | undefined;
  readonly faucetId: AccountId;
}

// Storage hook params (from hooks/useStorage.tsx)
export interface StorageParams {
  readonly accountId: AccountId | undefined;
  readonly index: number;
  key?: Word;
}
