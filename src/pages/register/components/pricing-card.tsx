import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { useWallet } from '@demox-labs/miden-wallet-adapter-react'
import { type WebClient } from '@demox-labs/miden-sdk';
import { useBalance } from '@/hooks/useBalance'
import { instantiateClient, bech32ToAccountId, formatBalance } from '@/lib/utils'

interface PricingCardProps {
  domain: string
  years: number | string
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

export function PricingCard({ domain, years, onTermsChange }: PricingCardProps) {
  const { accountId: rawAccountId } = useWallet()
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [client, setClient] = useState<WebClient | undefined>(undefined);

  const basePricePerYear = 5 // 5 MIDEN base price

  const lengthMultiplier = getDomainLengthMultiplier(domain.length)

  const pricePerYear = basePricePerYear * lengthMultiplier

  const pricePerYearFixed = (basePricePerYear * lengthMultiplier).toFixed(2)

  const numericYears = typeof years === 'string' ? parseInt(years) || 1 : years

  const totalPrice = (pricePerYear * numericYears).toFixed(2)

  const accountId = useMemo(() => {
    if (rawAccountId != null) {
      return bech32ToAccountId(rawAccountId);
    } else return undefined;
  }, [rawAccountId]);

  useEffect(() => {
    if (
      client == null && accountId != null
    ) {
      (async () => {
        const newClient = await instantiateClient({
          accountsToImport: [
            accountId,
          ],
        });
        setClient(newClient);
      })();
    }
  }, [accountId, client]);


  const handleTermsChange = (checked: boolean) => {
    setTermsAccepted(checked)
    onTermsChange(checked)
  }

  const midenBalance = useBalance({
    accountId,
    faucetId: bech32ToAccountId("mtst1qzp4jgq9cy75wgp7c833ynr9f4cqzraplt4"), //miden faucetId
    client,
  });

  return (
    <Card className="bg-gray-50">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Pricing Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Your Miden Balance:</span>
          <span className="font-medium">{formatBalance(midenBalance || BigInt(0))} MIDEN</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Price per year:</span>
          <span className="font-medium">{pricePerYearFixed} MIDEN</span>
        </div>
        <div className="flex justify-between items-center text-lg font-semibold">
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
            <div className="flex-1 flex items-start justify-between">
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                I have read and accept the Terms and Conditions
              </label>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 ml-2"
                      type="button"
                    >
                      <Info className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>
                      By checking this box, you agree to our terms of service and privacy policy.
                      You acknowledge that you understand the domain registration process and associated costs.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}