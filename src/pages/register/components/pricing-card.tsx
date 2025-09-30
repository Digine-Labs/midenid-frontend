import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info, RefreshCw } from 'lucide-react'
import { useWallet } from '@demox-labs/miden-wallet-adapter-react'

interface Asset {
  faucetId: string
  amount: string
}

interface PricingCardProps {
  domain: string
  years: number | string
  onSubscriptionChange: (checked: boolean) => void
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

export function PricingCard({ domain, years, onSubscriptionChange, onTermsChange }: PricingCardProps) {
  const { requestAssets, accountId } = useWallet()
  const [subscriptionEnabled, setSubscriptionEnabled] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasRequested, setHasRequested] = useState(false)

  const basePricePerYear = 0.05 // 0.05 MIDEN base price
  const lengthMultiplier = getDomainLengthMultiplier(domain.length)
  const pricePerYear = basePricePerYear * lengthMultiplier
  const numericYears = typeof years === 'string' ? parseInt(years) || 1 : years
  const totalPrice = (pricePerYear * numericYears).toFixed(3)

  const handleSubscriptionChange = (checked: boolean) => {
    setSubscriptionEnabled(checked)
    onSubscriptionChange(checked)
  }

  const handleTermsChange = (checked: boolean) => {
    setTermsAccepted(checked)
    onTermsChange(checked)
  }

  const handleRequestAssets = async () => {
    if (!accountId || !requestAssets) return

    try {
      setError(null)
      setLoading(true)
      const fetchedAssets = await requestAssets() || []
      setAssets(fetchedAssets)
      setHasRequested(true)
    } catch (err: any) {
      console.error('Error requesting assets:', err)
      setError(err?.message ?? 'Failed to fetch assets')
      setHasRequested(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-gray-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Pricing Details</CardTitle>
          <Button
            onClick={handleRequestAssets}
            disabled={!accountId || loading}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Get Assets'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Assets Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {hasRequested && assets.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md space-y-2">
            <h3 className="text-sm font-semibold text-blue-900">Your Assets</h3>
            <div className="space-y-1">
              {assets.map((asset, i) => (
                <div key={i} className="text-xs text-blue-800 flex justify-between">
                  <span className="font-mono truncate">{asset.faucetId}</span>
                  <span className="font-semibold ml-2">{asset.amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasRequested && assets.length === 0 && !loading && !error && (
          <div className="p-3 bg-gray-100 border border-gray-300 rounded-md">
            <p className="text-sm text-gray-700">No assets found on this account</p>
          </div>
        )}

        {!hasRequested && !loading && !error && accountId && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-700">Click "Get Assets" to view your balance</p>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Price per year:</span>
          <span className="font-medium">{pricePerYear.toFixed(3)} MIDEN</span>
        </div>
        <div className="flex justify-between items-center text-lg font-semibold">
          <span>Total Price:</span>
          <span>{totalPrice} MIDEN</span>
        </div>

        <div className="border-t pt-4 space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="subscription"
              checked={subscriptionEnabled}
              onCheckedChange={handleSubscriptionChange}
            />
            <div className="flex-1 flex items-start justify-between">
              <label
                htmlFor="subscription"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Enable subscription and don't pay gas for your renewal
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
                      Enabling a subscription permits Miden ID to renew your domain automatically every year for you!
                      This approval gives us only the possibility to renew your domain once per year (maximum 0.009 MIDEN/year)
                      and we'll cover the transaction fee for you!
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

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