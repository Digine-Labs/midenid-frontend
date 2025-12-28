import { useEffect, useState, useCallback, useRef } from 'react';
import { hasRegisteredDomain } from '@/lib/midenClient';
import { createDomainMetadata } from '@/api';
import {
  getPendingTransactions,
  savePendingTransaction,
  removePendingTransaction
} from '@/utils/transactionStorage';
import type { PendingTransaction, TransactionResult } from '@/types/transaction';

const POLLING_INTERVAL = 10000; // 10 seconds
const MAX_ATTEMPTS = 8; // 8 attempts * 10s = 80 seconds

export const usePendingTransactions = (accountId?: string) => {
  const [pending, setPending] = useState<PendingTransaction[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Map<domain, isConfirmed>
  const [confirmedDomains, setConfirmedDomains] =
    useState<Map<string, boolean>>(new Map());

  // ✅ DEDUP / LOCK GUARD (state DEĞİL)
  const processedDomainsRef = useRef<Set<string>>(new Set());

  // Load from localStorage on mount / account change
  useEffect(() => {
    const stored = getPendingTransactions();
    const userTransactions = accountId
      ? stored.filter(t => t.accountId === accountId)
      : stored;

    setPending(userTransactions);
  }, [accountId]);

  // Add a new pending transaction
  const addPendingTransaction = useCallback(
    (transaction: Omit<PendingTransaction, 'timestamp' | 'attemptCount'>) => {
      const fullTransaction: PendingTransaction = {
        ...transaction,
        timestamp: Date.now(),
        attemptCount: 0,
      };

      savePendingTransaction(fullTransaction);

      setPending(prev => [
        ...prev.filter(t => t.domain !== transaction.domain),
        fullTransaction,
      ]);

      setConfirmedDomains(prev =>
        new Map(prev).set(transaction.domain, false)
      );
    },
    []
  );

  // Remove a pending transaction
  const removePending = useCallback((domain: string) => {
    removePendingTransaction(domain);
    setPending(prev => prev.filter(t => t.domain !== domain));
  }, []);

  // Check confirmation state
  const isDomainConfirmed = useCallback(
    (domain: string): boolean => confirmedDomains.get(domain) === true,
    [confirmedDomains]
  );

  // Monitor pending transactions
  useEffect(() => {
    if (pending.length === 0) {
      setIsMonitoring(false);
      return;
    }

    setIsMonitoring(true);
    let isActive = true;

    const monitorTransactions = async () => {
      if (!isActive) return;

      const results: TransactionResult[] = [];

      for (const transaction of pending) {
        if (!isActive) break;

        const domain = transaction.domain;

        // ✅ HARD DEDUP GUARD
        if (processedDomainsRef.current.has(domain)) {
          continue;
        }

        try {
          const isRegistered = await hasRegisteredDomain(domain);

          if (isRegistered) {
            // 🔒 LOCK domain IMMEDIATELY
            processedDomainsRef.current.add(domain);

            // Update UI state
            setConfirmedDomains(prev =>
              new Map(prev).set(domain, true)
            );

            // Backend call (idempotency-safe)
            await createDomainMetadata({
              domain,
              account_id: transaction.accountId,
              bech32: transaction.bech32,
              created_block: transaction.blockNumber,
              updated_block: transaction.blockNumber,
            });

            removePending(domain);
            results.push({ success: true, domain });
          } else {
            const newAttemptCount = transaction.attemptCount + 1;

            if (newAttemptCount >= MAX_ATTEMPTS) {
              removePending(domain);
              results.push({
                success: false,
                domain,
                error: 'timeout',
              });
            } else {
              const updated = {
                ...transaction,
                attemptCount: newAttemptCount,
              };

              savePendingTransaction(updated);

              setPending(prev =>
                prev.map(t => (t.domain === domain ? updated : t))
              );
            }
          }
        } catch (error) {
          console.error(
            `[usePendingTransactions] Error monitoring ${domain}:`,
            error
          );
          // retry on next interval
        }
      }
    };

    // Initial run
    monitorTransactions();

    // Polling
    const intervalId = setInterval(
      monitorTransactions,
      POLLING_INTERVAL
    );

    return () => {
      isActive = false;
      clearInterval(intervalId);
      // ❌ NO setState here
    };
  }, [pending, removePending]);

  return {
    pending,
    isMonitoring,
    addPendingTransaction,
    removePendingTransaction: removePending,
    isDomainConfirmed,
    confirmedDomains,
  };
};
