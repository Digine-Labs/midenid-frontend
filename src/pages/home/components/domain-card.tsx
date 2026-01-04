import { useState, useEffect, useMemo, useRef } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { encodeDomain, hasStorageValue } from '@/utils'
import { AccountId } from '@demox-labs/miden-sdk'
import { MIDEN_ID_CONTRACT_ADDRESS } from '@/shared/constants'
import { useStorage } from '@/hooks/useStorage'
import { RegisterModal } from '@/components/RegisterModal'
import { useWallet, useWalletModal } from '@demox-labs/miden-wallet-adapter'
import { useToast } from '@/hooks/useToast'
import { ToastCause } from '@/types/toast'

interface DomainCardProps {
  domain: string
}

export function DomainCard({ domain }: DomainCardProps) {
  const [loading, setLoading] = useState(true)
  const [domainAvailable, setDomainAvailable] = useState<boolean | null>(null)
  const { connected } = useWallet();
  const walletModal = useWalletModal();
  const showToast = useToast();
  const warningShownRef = useRef(false);

  const contractId = useMemo(
    () => AccountId.fromHex(MIDEN_ID_CONTRACT_ADDRESS as string),
    []
  );

  // Encode domain name for storage lookup
  const storageKey = useMemo(() => {
    if (!domain) return undefined;
    try {
      return encodeDomain(domain);
    } catch (error) {
      console.error("Failed to encode domain:", error);
      return undefined;
    }
  }, [domain]);

  // Check if domain is registered by querying storage slot 5 (Name -> ID mapping)
  const { storageItem, isLoading: isCheckingStorage } = useStorage({
    accountId: contractId,
    index: 5,
    key: storageKey
  });

  // Check registration status
  const isRegistered = useMemo(() => hasStorageValue(storageItem), [storageItem]);


  // Update domain availability based on storage check
  useEffect(() => {
    if (!domain || !storageKey) {
      setDomainAvailable(null);
      setLoading(false);
      return;
    }

    // Show loading while storage is being fetched
    if (isCheckingStorage) {
      setLoading(true);
      return;
    }

    // Storage fetch completed, update availability
    setDomainAvailable(!isRegistered);
    setLoading(false);
  }, [domain, storageKey, isCheckingStorage, isRegistered])

  // Show warning toast if loading takes too long
  useEffect(() => {
    // Reset warning flag when domain changes or loading stops
    if (!loading || !domain) {
      warningShownRef.current = false;
      return;
    }

    // Set timer to show warning after 3500ms
    const timer = setTimeout(() => {
      if (loading && !warningShownRef.current) {
        showToast(ToastCause.DOMAIN_CHECK_SLOW);
        warningShownRef.current = true;
      }
    }, 4000);

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