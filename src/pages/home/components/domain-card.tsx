import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { encodeNameToWord, isDomainRegistered } from '@/utils'
import { AccountId } from '@demox-labs/miden-sdk'
import { MIDEN_ID_CONTRACT_ADDRESS } from '@/shared/constants'
import { useStorage } from '@/hooks/useStorage'

interface DomainCardProps {
  domain: string
}

export function DomainCard({ domain }: DomainCardProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [domainAvailable, setDomainAvailable] = useState(false)

  const contractId = useMemo(
    () => AccountId.fromHex(MIDEN_ID_CONTRACT_ADDRESS as string),
    []
  );

  // Encode domain name for storage lookup
  const storageKey = useMemo(() => {
    if (!domain) return undefined;
    try {
      return encodeNameToWord(domain);
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
  const isRegistered = useMemo(() => isDomainRegistered(storageItem), [storageItem]);


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


  const handleCardClick = useCallback(() => {
    if (!loading && domainAvailable) {
      navigate(`/register?domain=${encodeURIComponent(domain)}`)
    }
  }, [loading, domainAvailable, domain, navigate])

  return (
    <Card
      className="cursor-pointer hover:shadow transition-all duration-200 border hover:border-primary/50 bg-card"
      onClick={handleCardClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {domain}.miden
          </CardTitle>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : domainAvailable ? (
            <Badge variant="secondary" className="bg-primary text-green-800">
              Available
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-red-200 text-red-800">
              Unavailable
            </Badge>
          )}
        </div>
      </CardHeader>
    </Card>
  )
}