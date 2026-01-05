import { useEffect, useState, useCallback, useRef } from 'react';
import { AccountId } from '@demox-labs/miden-sdk';
import { hasRegisteredDomain } from '@/lib/midenClient';
import { useClient } from '@/contexts/ClientContext';
import { createDomainMetadata } from '@/api';
import { MIDEN_ID_CONTRACT_ADDRESS } from '@/shared';
import {
  getPendingTransactions,
  savePendingTransaction,
  removePendingTransaction
} from '@/utils/transaction-storage';
import type { PendingTransaction, TransactionResult } from '@/types/transaction';

const POLLING_INTERVAL = 10_000; // 10s
const MAX_ATTEMPTS = 8;

export const usePendingTransactions = (
  accountId?: string,
  onTransactionConfirmed?: () => void
) => {
  const [pending, setPending] = useState<PendingTransaction[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const { client, isReady, importAccounts } = useClient();

  // UI state
  const [confirmedDomains, setConfirmedDomains] =
    useState<Map<string, boolean>>(new Map());

  /**
   * CONCURRENCY GUARDS
   * inFlight  : async process continue
   * completed : success
   *
   * useRef = sync, render bağımsız, race-safe
   */
  const inFlightDomainsRef = useRef<Set<string>>(new Set());
  const completedDomainsRef = useRef<Set<string>>(new Set());

  // Import contract account once when client is ready
  useEffect(() => {
    if (!client || !isReady || !accountId) return;

    const contractId = AccountId.fromHex(MIDEN_ID_CONTRACT_ADDRESS as string);
    importAccounts([contractId]);
  }, [client, isReady, accountId, importAccounts]);

  // Load from storage
  useEffect(() => {
    if (!accountId) {
      // Clear all state when wallet disconnects
      setPending([]);
      setConfirmedDomains(new Map());
      inFlightDomainsRef.current.clear();
      completedDomainsRef.current.clear();
      return;
    }

    const stored = getPendingTransactions();
    const userTransactions = stored.filter(t => t.accountId === accountId);

    setPending(userTransactions);
  }, [accountId]);

  // Add pending transaction
  const addPendingTransaction = useCallback(
    (transaction: Omit<PendingTransaction, 'timestamp' | 'attemptCount'>) => {
      const full: PendingTransaction = {
        ...transaction,
        timestamp: Date.now(),
        attemptCount: 0,
      };

      savePendingTransaction(full);

      setPending(prev => [
        ...prev.filter(t => t.domain !== transaction.domain),
        full,
      ]);

      setConfirmedDomains(prev =>
        new Map(prev).set(transaction.domain, false)
      );
    },
    []
  );

  // Remove pending
  const removePending = useCallback((domain: string) => {
    removePendingTransaction(domain);
    setPending(prev => prev.filter(t => t.domain !== domain));
  }, []);

  const isDomainConfirmed = useCallback(
    (domain: string) => confirmedDomains.get(domain) === true,
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
      if (!isActive || !client || !isReady) return;

      const results: TransactionResult[] = [];

      for (const tx of pending) {
        if (!isActive) break;

        const domain = tx.domain;

        if (
          inFlightDomainsRef.current.has(domain) ||
          completedDomainsRef.current.has(domain)
        ) {
          continue;
        }

        inFlightDomainsRef.current.add(domain);

        try {
          const isRegistered = await hasRegisteredDomain(client, domain);

          if (!isRegistered) {
            inFlightDomainsRef.current.delete(domain);

            const nextAttempt = tx.attemptCount + 1;

            if (nextAttempt >= MAX_ATTEMPTS) {
              removePending(domain);
              results.push({
                success: false,
                domain,
                error: 'timeout',
              });
            } else {
              const updated = { ...tx, attemptCount: nextAttempt };
              savePendingTransaction(updated);

              setPending(prev =>
                prev.map(t => (t.domain === domain ? updated : t))
              );
            }

            continue;
          }

          /**
           * ✅ DOMAIN REGISTERED
           */
          setConfirmedDomains(prev =>
            new Map(prev).set(domain, true)
          );

          try {
            await createDomainMetadata({
              domain,
              account_id: tx.accountId,
              bech32: tx.bech32,
              created_block: tx.blockNumber,
              updated_block: tx.blockNumber,
            });
          } catch (err: any) {
            // 409 = already exists → SUCCESS
            if (err?.response?.status !== 409) {
              throw err;
            }
          }

          // ✅ MARK COMPLETED
          completedDomainsRef.current.add(domain);

          // Refetch wallet account data
          onTransactionConfirmed?.();

          removePending(domain);
          results.push({ success: true, domain });
        } catch (err) {
          console.error(
            `[usePendingTransactions] Error processing ${domain}:`,
            err
          );
          // retry on next poll
        } finally {
          // 🔓 UNLOCK (completed olanlar artık completed guard'da)
          inFlightDomainsRef.current.delete(domain);
        }
      }
    };

    // initial run
    monitorTransactions();

    const intervalId = setInterval(
      monitorTransactions,
      POLLING_INTERVAL
    );

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [pending, removePending, client, isReady]);

  return {
    pending,
    isMonitoring,
    addPendingTransaction,
    removePendingTransaction: removePending,
    isDomainConfirmed,
    confirmedDomains,
  };
};
