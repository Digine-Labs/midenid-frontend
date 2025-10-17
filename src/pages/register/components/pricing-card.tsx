import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useWallet } from '@demox-labs/miden-wallet-adapter-react'
import { useBalance } from '@/hooks/useBalance'
import { bech32ToAccountId } from '@/lib/midenClient'
import { formatBalance } from '@/lib/utils'
import { MIDEN_FAUCET_ID_BECH32 } from '@/shared/constants'
import { TermsModal } from './terms-modal'

interface PricingCardProps {
  domain: string
  years: number | string
  termsAccepted: boolean
  onTermsChange: (checked: boolean) => void
}

// Calculate price per year based on domain length
const getDomainLengthMultiplier = (length: number): number => {
  switch (length) {
    case 1: return 5
    case 2: return 4
    case 3: return 3
    case 4: return 2
    default: return 1 // 5 characters and more
  }
}

// Constants
const BASE_PRICE_PER_YEAR = 5

export function PricingCard({ domain, years, termsAccepted, onTermsChange }: PricingCardProps) {
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false)
  const { accountId: rawAccountId } = useWallet()

  const accountId = useMemo(() => {
    if (rawAccountId != null) {
      return bech32ToAccountId(rawAccountId);
    } else return undefined;
  }, [rawAccountId]);

  const faucetId = useMemo(() =>
    bech32ToAccountId(MIDEN_FAUCET_ID_BECH32),
    []
  );

  const lengthMultiplier = useMemo(() =>
    getDomainLengthMultiplier(domain.length),
    [domain.length]
  );

  const numericYears = useMemo(() =>
    typeof years === 'string' ? parseInt(years) || 1 : years,
    [years]
  );

  const pricePerYear = useMemo(() =>
    BASE_PRICE_PER_YEAR * lengthMultiplier,
    [lengthMultiplier]
  );

  const pricePerYearFixed = useMemo(() =>
    pricePerYear.toFixed(2),
    [pricePerYear]
  );

  const totalPrice = useMemo(() =>
    (pricePerYear * numericYears).toFixed(2),
    [pricePerYear, numericYears]
  );


  const handleTermsChange = (checked: boolean) => {

    onTermsChange(checked)
  }

  const midenBalance = useBalance({
    accountId,
    faucetId,
  });

  return (
    <Card className="bg-card border-primary">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Pricing Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center min-h-9">
          <span className="text-muted-foreground">Your Miden Balance:</span>
          <span className="font-medium">{formatBalance(midenBalance || BigInt(0))} MIDEN</span>
        </div>
        <div className="flex justify-between items-center min-h-9">
          <span className="text-muted-foreground">Price per year:</span>
          <span className="font-medium">{pricePerYearFixed} MIDEN</span>
        </div>
        <div className="flex justify-between items-center text-lg font-semibold min-h-9">
          <span>Total Price:</span>
          <span>{totalPrice} MIDEN</span>
        </div>

        <div className="border-t pt-4 space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={handleTermsChange}
            />
            <div className="text-sm font-medium leading-none">
              <span
                className="cursor-pointer"
                onClick={() => handleTermsChange(!termsAccepted)}
              >
                I have read and accept the{' '}
              </span>
              <span
                className="underline cursor-pointer hover:text-primary"
                onClick={() => setIsTermsModalOpen(true)}
              >
                Terms and Conditions
              </span>
            </div>
          </div>
        </div>
      </CardContent>

      <TermsModal open={isTermsModalOpen} onOpenChange={setIsTermsModalOpen} />
    </Card>
  )
}