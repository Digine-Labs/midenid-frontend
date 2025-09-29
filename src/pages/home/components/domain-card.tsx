import { useNavigate } from 'react-router'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface DomainCardProps {
  domain: string
}

export function DomainCard({ domain }: DomainCardProps) {
  const navigate = useNavigate()

  const handleCardClick = () => {
    navigate(`/register?domain=${encodeURIComponent(domain)}`)
  }

  return (
    <Card
      className="cursor-pointer hover:shadow transition-all duration-200 border hover:border-primary/50 bg-gray-50"
      onClick={handleCardClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {domain}.miden
          </CardTitle>
          <Badge variant="secondary" className="bg-green-200 text-green-800 hover:bg-green-100">
            Available
          </Badge>
        </div>
      </CardHeader>
    </Card>
  )
}