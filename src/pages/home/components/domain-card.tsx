import { useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { checkDomainAvailability } from '@/api'
import { RegisterModal } from '@/components/register-modal'
import { useWallet, useWalletModal } from '@demox-labs/miden-wallet-adapter'
import { VALIDATION } from '@/shared/constants'

interface DomainCardProps {
  domain: string
}

// Domain validation helper
const isValidDomain = (domain: string): boolean => {
  if (!domain || domain.length < 1 || domain.length > VALIDATION.DOMAIN_MAX) return false;
  return /^[a-z0-9]+$/i.test(domain);
}

export function DomainCard({ domain }: DomainCardProps) {
  const [loading, setLoading] = useState(true)
  const [domainAvailable, setDomainAvailable] = useState(false)
  const { connected } = useWallet();
  const walletModal = useWalletModal();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Check domain availability using backend API (with debouncing and validation)
  useEffect(() => {
    if (!domain) {
      setDomainAvailable(false);
      setLoading(false);
      return;
    }

    // Frontend validation
    if (!isValidDomain(domain)) {
      setDomainAvailable(false);
      setLoading(false);
      return;
    }

    // Debounce: 500ms wait before API call
    setLoading(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const result = await checkDomainAvailability(domain);

        if (result.success && result.data) {
          setDomainAvailable(result.data.available);
        } else {
          // API error - default to unavailable (safe side)
          setDomainAvailable(false);
        }
      } catch (error) {
        console.error('Domain availability check failed:', error);
        setDomainAvailable(false);
      } finally {
        setLoading(false);
      }
    }, 500);

    // Cleanup on unmount or domain change
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [domain])

  // Handle card click - open wallet modal if not connected
  const handleCardClick = () => {
    if (!loading && domainAvailable && !connected) {
      walletModal.setVisible(true);
    }
  };

  const cardContent = (
    <Card
      className={`cursor-pointer hover:shadow transition-all duration-200 border bg-card ${!loading && !domainAvailable
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
    return (
      <RegisterModal
        domain={domain}
        trigger={cardContent}
      />
    );
  }

  // Otherwise, just show the card (unavailable or loading)
  return cardContent;
}