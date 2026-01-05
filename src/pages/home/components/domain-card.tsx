import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { RegisterModal } from '@/components/RegisterModal'
import { useWallet, useWalletModal } from '@demox-labs/miden-wallet-adapter'
import { useDomainAvailability } from '@/hooks/useDomainAvailability'

interface DomainCardProps {
  domain: string
}

export function DomainCard({ domain }: DomainCardProps) {
  const { connected } = useWallet();
  const walletModal = useWalletModal();
  const { loading, domainAvailable } = useDomainAvailability(domain);

  const handleCardClick = () => {
    if (!loading && domainAvailable === true && !connected) {
      walletModal.setVisible(true);
    }
  };

  const cardContent = (
    <Card
      className={`cursor-pointer hover:shadow transition-all duration-200 border bg-card ${
        !loading && domainAvailable === false
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

  if (!loading && domainAvailable === true && connected) {
    return <RegisterModal domain={domain} trigger={cardContent} />;
  }

  return cardContent;
}
