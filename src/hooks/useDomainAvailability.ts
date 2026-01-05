import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AccountId } from '@demox-labs/miden-sdk';
import { MIDEN_ID_CONTRACT_ADDRESS } from '@/shared/constants';
import { checkDomainAvailability } from '@/api';
import { encodeDomain, hasStorageValue } from '@/utils';
import { getMidenClient } from '@/lib/MidenClientSingleton';
import { useToast } from '@/hooks/useToast';
import { ToastCause } from '@/types/toast';

const SLOW_CHECK_WARNING_MS = 5000;

interface UseDomainAvailabilityResult {
  loading: boolean;
  domainAvailable: boolean | null;
}

export function useDomainAvailability(domain: string): UseDomainAvailabilityResult {
  const [loading, setLoading] = useState(true);
  const [domainAvailable, setDomainAvailable] = useState<boolean | null>(null);
  const showToast = useToast();

  const isCheckingRef = useRef(false);
  const warningShownRef = useRef(false);

  const contractId = useMemo(
    () => AccountId.fromHex(MIDEN_ID_CONTRACT_ADDRESS as string),
    []
  );

  // Fallback to storage check if API fails
  const checkStorageAvailability = useCallback(async (
    domainToCheck: string,
    signal: AbortSignal
  ): Promise<boolean | null> => {
    try {
      const storageKey = encodeDomain(domainToCheck);
      const clientSingleton = getMidenClient();
      const client = await clientSingleton.getClient();
      await clientSingleton.importAccount(contractId);
      await client.syncState();

      if (signal.aborted) return null;

      const contractAccount = await client.getAccount(contractId);
      let domainWord;
      try {
        domainWord = contractAccount?.storage().getMapItem(5, storageKey);
      } catch {
        // Storage lookup failed
      }

      const isRegistered = hasStorageValue(domainWord);
      return !isRegistered;
    } catch {
      return null;
    }
  }, [contractId]);

  useEffect(() => {
    if (!domain) {
      setDomainAvailable(null);
      setLoading(false);
      isCheckingRef.current = false;
      warningShownRef.current = false;
      return;
    }

    if (isCheckingRef.current) {
      return;
    }

    const abortController = new AbortController();
    let warningTimeout: ReturnType<typeof setTimeout> | undefined;

    const checkAvailability = async () => {
      isCheckingRef.current = true;
      warningShownRef.current = false;
      setLoading(true);

      // Set up warning for slow checks
      warningTimeout = setTimeout(() => {
        if (!warningShownRef.current) {
          showToast(ToastCause.DOMAIN_CHECK_SLOW);
          warningShownRef.current = true;
        }
      }, SLOW_CHECK_WARNING_MS);

      try {
        // Try API first
        const result = await checkDomainAvailability(domain);

        if (abortController.signal.aborted) return;

        if (result.success && result.data) {
          setDomainAvailable(result.data.available);
          setLoading(false);
          isCheckingRef.current = false;
          return;
        }

        // API failed, fallback to storage
        const storageResult = await checkStorageAvailability(domain, abortController.signal);

        if (abortController.signal.aborted) return;

        setDomainAvailable(storageResult);
        setLoading(false);
      } catch {
        if (!abortController.signal.aborted) {
          setDomainAvailable(null);
          setLoading(false);
        }
      } finally {
        isCheckingRef.current = false;
        if (warningTimeout) clearTimeout(warningTimeout);
      }
    };

    checkAvailability();

    return () => {
      abortController.abort();
      isCheckingRef.current = false;
      if (warningTimeout) clearTimeout(warningTimeout);
    };
  }, [domain, checkStorageAvailability, showToast]);

  return { loading, domainAvailable };
}
