import type { AccountId } from '@demox-labs/miden-sdk';

// Balance hook params (from hooks/useBalance.tsx)
export interface BalanceParams {
  readonly accountId: AccountId | undefined;
  readonly faucetId: AccountId;
}