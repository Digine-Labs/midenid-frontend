import { useState, useEffect, useMemo, useRef } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { encodeDomain, hasStorageValue } from '@/utils'
import { AccountId } from '@demox-labs/miden-sdk'
import { MIDEN_ID_CONTRACT_ADDRESS } from '@/shared/constants'
import { getMidenClient } from '@/lib/MidenClientSingleton'
import { RegisterModal } from '@/components/RegisterModal'
import { useWallet, useWalletModal } from '@demox-labs/miden-wallet-adapter'
import { useToast } from '@/hooks/useToast'
import { ToastCause } from '@/types/toast'
import { checkDomainAvailability } from '@/api'

interface DomainCardProps {
  domain: string
}

export function DomainCard({ domain }: DomainCardProps) {
  const [loading, setLoading] = useState(true)
  const [domainAvailable, setDomainAvailable] = useState<boolean | null>(null)
  const [apiCheckComplete, setApiCheckComplete] = useState(false)
  const [apiCheckFailed, setApiCheckFailed] = useState(false)
  const { connected } = useWallet();
  const walletModal = useWalletModal();
  const showToast = useToast();
  const warningShownRef = useRef(false);
  const isCheckingRef = useRef(false);

  const contractId = useMemo(
    () => AccountId.fromHex(MIDEN_ID_CONTRACT_ADDRESS as string),
    []
  );

  // PRIMARY: API check for domain availability
  useEffect(() => {
    if (!domain) {
      setDomainAvailable(null);
      setLoading(false);
      setApiCheckComplete(false);
      setApiCheckFailed(false);
      isCheckingRef.current = false;
      return;
    }

    if (isCheckingRef.current) {
      return;
    }

    let isCancelled = false;

    const checkAvailabilityViaAPI = async () => {
      isCheckingRef.current = true;
      setLoading(true);
      setApiCheckComplete(false);
      setApiCheckFailed(false);

      try {
        const result = await checkDomainAvailability(domain);

        if (isCancelled) return;

        if (result.success && result.data) {
          setDomainAvailable(result.data.available);
          setApiCheckComplete(true);
          setApiCheckFailed(false);
          setLoading(false);
          isCheckingRef.current = false;
        } else {
          console.warn('API check failed, falling back to storage:', result.error);
          setApiCheckFailed(true);
          setApiCheckComplete(true);
          isCheckingRef.current = false;
        }
      } catch (error) {
        if (!isCancelled) {
          console.warn('API check error, falling back to storage:', error);
          setApiCheckFailed(true);
          setApiCheckComplete(true);
          isCheckingRef.current = false;
        }
      }
    };

    checkAvailabilityViaAPI();

    return () => {
      isCancelled = true;
      isCheckingRef.current = false; // Reset on cleanup
    };
  }, [domain]);

  // FALLBACK: Manual storage check (only runs if API fails)
  useEffect(() => {
    // Only run if API check is complete and failed
    if (!apiCheckComplete || !apiCheckFailed) {
      return;
    }

    if (!domain) {
      setDomainAvailable(null);
      setLoading(false);
      return;
    }

    let isCancelled = false;

    const checkStorageAvailability = async () => {
      setLoading(true);

      try {
        // Encode domain for storage lookup
        const storageKey = encodeDomain(domain);

        // Get Miden client singleton and WebClient instance
        const clientSingleton = getMidenClient();
        const client = await clientSingleton.getClient();
        await clientSingleton.importAccount(contractId)

        // Sync state to get latest blockchain data
        await client.syncState();

        // Get contract account
        const contractAccount = await client.getAccount(contractId);

        if (isCancelled) return;

        // Query storage slot 5 (Name -> ID mapping)
        let domainWord;
        try {
          domainWord = contractAccount?.storage().getMapItem(5, storageKey);
        } catch (error) {
          console.warn('Failed to get domain from storage:', error);
        }

        // Check if domain is registered
        const isRegistered = hasStorageValue(domainWord);

        if (!isCancelled) {
          setDomainAvailable(!isRegistered);
          setLoading(false);
        }
      } catch (error) {
        console.error('Storage check failed:', error);
        if (!isCancelled) {
          setDomainAvailable(null);
          setLoading(false);
        }
      }
    };

    checkStorageAvailability();

    return () => {
      isCancelled = true;
    };
  }, [apiCheckComplete, apiCheckFailed, domain, contractId])

  // Show warning toast if loading takes too long
  useEffect(() => {
    // Reset warning flag when domain changes or loading stops
    if (!loading || !domain) {
      warningShownRef.current = false;
      return;
    }

    // Set timer to show warning after 5000ms
    const timer = setTimeout(() => {
      if (loading && !warningShownRef.current) {
        showToast(ToastCause.DOMAIN_CHECK_SLOW);
        warningShownRef.current = true;
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [loading, domain, showToast]);

  // Handle card click - open wallet modal if not connected
  const handleCardClick = () => {
    if (!loading && domainAvailable === true && !connected) {
      walletModal.setVisible(true);
    }
  };

  const cardContent = (
    <Card
      className={`cursor-pointer hover:shadow transition-all duration-200 border bg-card ${!loading && domainAvailable === false
        ? 'hover:border-destructive/50'
        : 'hover:border-primary/50'
        }`}
      onClick={handleCardClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg font-semibold break-all min-w-0 flex-1 text-left">
            {domain}<span className="whitespace-nowrap">.miden</span>
          </CardTitle>
          {loading || domainAvailable === null ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
          ) : domainAvailable === true ? (
            <Badge variant="secondary" className="bg-primary text-green-800 flex-shrink-0">
              Available
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-red-200 text-red-800 flex-shrink-0">
              Unavailable
            </Badge>
          )}
        </div>
      </CardHeader>
    </Card>
  );

  // If domain is available and not loading, wrap in RegisterModal
  if (!loading && domainAvailable === true && connected) {
    return <RegisterModal domain={domain} trigger={cardContent} />;
  }

  // Otherwise, just show the card (unavailable or loading)
  return cardContent;
}