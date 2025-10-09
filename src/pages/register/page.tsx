import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { useWallet } from '@demox-labs/miden-wallet-adapter'
import { Button } from '@/components/ui/button'
import { PricingCard } from './components/pricing-card'
import { DomainDetailsCard } from './components/domain-details-card'
import { Faq } from './components/faq'
import { WalletMultiButton } from '@demox-labs/miden-wallet-adapter'

export default function Register() {
  const [searchParams] = useSearchParams()
  const domain = searchParams.get('domain') || ''
  const [years, setYears] = useState<number | string>(1)
  const [showYearsTooltip, setShowYearsTooltip] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [emptyInputTimer, setEmptyInputTimer] = useState<number | null>(null)
  const { connected } = useWallet()


  const handleYearsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value

    // Clear any existing empty input timer
    if (emptyInputTimer) {
      clearTimeout(emptyInputTimer)
      setEmptyInputTimer(null)
    }

    // Allow empty input for better user experience
    if (inputValue === '') {
      setYears('')
      setShowYearsTooltip(false)

      // Set timer to reset to 1 after 3 seconds of empty input
      const timer = setTimeout(() => {
        setYears(1)
        setEmptyInputTimer(null)
      }, 3000)

      setEmptyInputTimer(timer)
      return
    }

    const value = parseInt(inputValue)

    // Handle invalid input (NaN)
    if (isNaN(value)) {
      return
    }

    if (value > 10) {
      setShowYearsTooltip(true)
      setYears(10) // Cap at 10
    } else if (value < 1) {
      setYears(1) // Minimum 1 year
    } else {
      setYears(value)
      setShowYearsTooltip(false)
    }
  }

  // Hide tooltip after 3 seconds
  useEffect(() => {
    if (showYearsTooltip) {
      const timer = setTimeout(() => {
        setShowYearsTooltip(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showYearsTooltip])

  // Cleanup empty input timer on component unmount
  useEffect(() => {
    return () => {
      if (emptyInputTimer) {
        clearTimeout(emptyInputTimer)
      }
    }
  }, [emptyInputTimer])

  const handlePurchase = useCallback(() => {
    // Mock purchase functionality
    const numericYears = typeof years === 'string' ? parseInt(years) || 1 : years
    alert(`Mock purchase initiated for ${domain}.miden for ${numericYears} year${numericYears > 1 ? 's' : ''}!`)
  }, [domain, years])


  return (
    <main className="flex items-center justify-center px-4 sm:px-6 lg:px-8" style={{ minHeight: 'calc(100vh - 56px)' }}>
      <div className="w-full sm:max-w-md md:max-w-2xl lg:max-w-3xl text-center py-5">
        <div className="space-y-2 mb-6 ">
          <h1 className="luckiest-guy-regular text-2xl sm:text-3xl md:text-4xl font-bold md:tracking-tight">
            Register {domain}.miden
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg px-2">
            Complete your Miden identity registration to claim this domain.
          </p>
        </div>

        <div className="w-full space-y-4 ">
          <DomainDetailsCard
            domain={domain}
            years={years}
            showYearsTooltip={showYearsTooltip}
            onYearsChange={handleYearsChange}
          />

          {!connected ? (
            <div className="flex justify-center">
              <WalletMultiButton />
            </div>
          ) : (
            <div className="space-y-4">
              <PricingCard
                domain={domain}
                years={years}
                onTermsChange={setTermsAccepted}
              />
              <div className="flex justify-center gap-4">
                <Button
                  onClick={handlePurchase}
                  disabled={!termsAccepted}
                  className="px-8 py-2 text-lg font-semibold bg-[#FF9A00]"
                  size="lg"
                >
                  Purchase
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="my-12">
          <Faq />
        </div>
      </div>
    </main>
  )
}