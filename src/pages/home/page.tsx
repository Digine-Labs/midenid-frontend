import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DomainCard } from './components/domain-card'
import { TestnetWarningModal } from '@/components/testnet-warning-modal'
import { RoughNotation } from 'react-rough-notation'
import { useTheme } from '@/components/theme-provider'

export default function Home() {
  const [inputValue, setInputValue] = useState('')
  const [debouncedValue, setDebouncedValue] = useState('')
  const [showTooltip, setShowTooltip] = useState(false)
  const { resolvedTheme } = useTheme()

  // Use darker green for identity highlight only in dark mode
  const identityColor = resolvedTheme === 'dark' ? '#11B83D' : '#0FE046'

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Check if there are any invalid characters
    const hasInvalidChars = /[^a-zA-Z0-9]/.test(value)

    // Extract only valid characters and limit to 21 characters using regex
    const match = value.match(/[a-zA-Z0-9]{0,21}/)
    const filteredValue = match ? match[0] : ''

    // Check if length was exceeded
    const lengthExceeded = value.replace(/[^a-zA-Z0-9]/g, '').length > 21

    setInputValue(filteredValue)

    // Show tooltip if invalid characters were entered or length exceeded
    if (hasInvalidChars || lengthExceeded) {
      setShowTooltip(true)
    }
  }

  // Debounce input value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue)
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [inputValue])

  // Hide tooltip after 3 seconds
  useEffect(() => {
    if (showTooltip) {
      const timer = setTimeout(() => {
        setShowTooltip(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showTooltip])

  return (
    <>
      <TestnetWarningModal />
      <main className="relative flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-background min-h-screen">
        <div className="relative z-10 w-full sm:max-w-md md:max-w-2xl lg:max-w-3xl text-center">
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl sm:text-3xl md:text-4xl font-bold tracking-wide">
              Choose your m<span className="text-primary">id</span>en name
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg px-2">
              One <RoughNotation type="highlight" color={identityColor} strokeWidth={2} iterations={2} show={true} padding={[2, 4]}>name</RoughNotation> to rule them all. Your digital identity across the Miden universe.
            </p>
          </div>

          <div className="w-full space-y-4 ">
            {/*<Card className="bg-yellow-100 border-green-500 rounded-md">
              <CardContent className="flex items-start gap-3 p-4">
                <Info className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-900 text-left">
                  <strong>Testing Mode:</strong> For mocking purposes, even-length domain names are shown as available, while odd-length domain names are shown as unavailable.
                </p>
              </CardContent>
            </Card>*/}

            <TooltipProvider>
              <Tooltip open={showTooltip}>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="e.g. joe"
                      value={inputValue}
                      onChange={handleInputChange}
                      className="w-full h-16 sm:h-18 rounded-md pl-4 sm:pl-6 pr-24 sm:pr-36 text-base sm:text-lg bg-card"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center gap-2 pr-3 sm:pr-4">
                      <span className="h-5 sm:h-6 w-px bg-muted-foreground mr-2 sm:mr-3" />
                      <span className="text-sm sm:text-base font-medium text-muted-foreground">.miden</span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-red-600 text-white">
                  <p>Only English letters and numbers are allowed</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Dynamic Card */}
            <div className="min-h-[120px]">
              {debouncedValue.trim() && (
                <DomainCard domain={debouncedValue.trim().toLowerCase()} />
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}