export interface PendingTransaction {
  domain: string;
  noteId: string;
  accountId: string;
  bech32: string;
  blockNumber: number;
  timestamp: number; // When transaction was created
  attemptCount: number; // Number of polling attempts made
}

export interface TransactionResult {
  success: boolean;
  domain: string;
  error?: string;
}
