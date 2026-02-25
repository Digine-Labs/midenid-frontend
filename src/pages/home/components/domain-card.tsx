import { lazy, Suspense } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { useWallet, useWalletModal } from '@miden-sdk/miden-wallet-adapter'
import { useDomainAvailability } from '@/hooks/useDomainAvailability'

const RegisterModal = lazy(() =>
  import('@/components/RegisterModal').then((mod) => ({ default: mod.RegisterModal }))
)

interface DomainCardProps {
  domain: string
}

export function DomainCard({ domain }: DomainCardProps) {
  const { available, loading, error } = useDomainAvailability(domain)
  const { connected } = useWallet()
  const walletModal = useWalletModal()

  const handleCardClick = () => {
    if (!loading && available === true && !connected) {
      walletModal.setVisible(true)
    }
  }

  const cardContent = (
    <Card
      className={`cursor-pointer hover:shadow transition-all duration-200 border bg-card ${!loading && available === false
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
          ) : renderBadge(available, error)}
        </div>
      </CardHeader>
    </Card>
  );

  if (!loading && available === true && connected) {
    return (
      <Suspense fallback={cardContent}>
        <RegisterModal domain={domain} trigger={cardContent} />
      </Suspense>
    );
  }

  return cardContent;
}

function renderBadge(isAvailable: boolean | null, error: string | null) {
  if (error) {
    return (
      <Badge variant="secondary" className="bg-yellow-200 text-yellow-800 flex-shrink-0">
        Error
      </Badge>
    )
  }

  if (isAvailable === null) {
    return null
  }

  if (isAvailable) {
    return (
      <Badge variant="secondary" className="bg-primary text-green-800 flex-shrink-0">
        Available
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="bg-red-200 text-red-800 flex-shrink-0">
      Unavailable
    </Badge>
  )
}