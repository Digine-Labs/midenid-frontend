import type { PendingTransaction } from '@/types/transaction';

const STORAGE_KEY = 'miden_pending_transactions';

export const getPendingTransactions = (): PendingTransaction[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('[transactionStorage] Failed to read pending transactions:', error);
    return [];
  }
};

export const savePendingTransaction = (transaction: PendingTransaction): void => {
  try {
    const current = getPendingTransactions();
    // Remove any existing entry for this domain
    const filtered = current.filter(t => t.domain !== transaction.domain);
    const updated = [...filtered, transaction];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('[transactionStorage] Failed to save pending transaction:', error);
  }
};

export const removePendingTransaction = (domain: string): void => {
  try {
    const current = getPendingTransactions();
    const filtered = current.filter(t => t.domain !== domain);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('[transactionStorage] Failed to remove pending transaction:', error);
  }
};

export const clearAllPendingTransactions = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear pending transactions:', error);
  }
};
