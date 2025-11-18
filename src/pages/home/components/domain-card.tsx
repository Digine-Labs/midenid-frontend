import { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { encodeDomainOld, hasStorageValue } from '@/utils'
import { AccountId } from '@demox-labs/miden-sdk'
import { MIDEN_ID_CONTRACT_ADDRESS } from '@/shared/constants'
import { useStorage } from '@/hooks/useStorage'
import { RegisterModal } from '@/components/register-modal'
import { useWallet, useWalletModal } from '@demox-labs/miden-wallet-adapter'

interface DomainCardProps {
  domain: string
}

export function DomainCard({ domain }: DomainCardProps) {
  const [loading, setLoading] = useState(true)
  const [domainAvailable, setDomainAvailable] = useState(false)
  const { connected } = useWallet();
  const walletModal = useWalletModal();

  const contractId = useMemo(
    () => AccountId.fromHex(MIDEN_ID_CONTRACT_ADDRESS as string),
    []
  );

  // Encode domain name for storage lookup
  const storageKey = useMemo(() => {
    if (!domain) return undefined;
    try {
      return encodeDomainOld(domain);
    } catch (error) {
      console.error("Failed to encode domain:", error);
      return undefined;
    }
  }, [domain]);

  // Check if domain is registered by querying storage slot 3 (Name -> ID mapping)
  const { storageItem, isLoading: isCheckingStorage } = useStorage({
    accountId: contractId,
    index: 3,
    key: storageKey
  });

  // Check registration status
  const isRegistered = useMemo(() => hasStorageValue(storageItem), [storageItem]);


  // Update domain availability based on storage check
  useEffect(() => {
    if (!domain || !storageKey) {
      setDomainAvailable(false);
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

  // Handle card click - open wallet modal if not connected
  const handleCardClick = () => {
    if (!loading && domainAvailable && !connected) {
      walletModal.setVisible(true);
    }
  };

  const cardContent = (
    <Card
      className="cursor-pointer hover:shadow transition-all duration-200 border hover:border-primary/50 bg-card"
      onClick={handleCardClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg font-semibold break-all min-w-0 flex-1 text-left">
            {domain}<span className="whitespace-nowrap">.miden</span>
          </CardTitle>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
          ) : domainAvailable ? (
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
  if (!loading && domainAvailable && connected) {
    return <RegisterModal domain={domain} trigger={cardContent} />;
  }

  // Otherwise, just show the card (unavailable or loading)
  return cardContent;
}