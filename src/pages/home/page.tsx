import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DomainCard } from './components/domain-card'
import { TestnetWarningModal } from '@/components/testnet-warning-modal'

export default function Home() {
  const [inputValue, setInputValue] = useState('')
  const [debouncedValue, setDebouncedValue] = useState('')
  const [showTooltip, setShowTooltip] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Check if there are any invalid characters
    const hasInvalidChars = /[^a-zA-Z0-9]/.test(value)

    // Extract only valid characters and limit to 28 characters using regex
    const match = value.match(/[a-zA-Z0-9]{0,28}/)
    const filteredValue = match ? match[0] : ''

    // Check if length was exceeded
    const lengthExceeded = value.replace(/[^a-zA-Z0-9]/g, '').length > 28

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
      <main className="flex items-center justify-center px-4 sm:px-6 lg:px-8" style={{ minHeight: 'calc(100vh - 56px)' }}>
        <div className="w-full max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-3xl text-center">
        <div className="space-y-2 mb-6">
          <h1 className="luckiest-guy-regular text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            Choose your Miden name
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg px-2">
            Your profile, seamlessly connecting you to the entire Miden ecosystem.
          </p>
        </div>

        <div className="w-full space-y-4">
          <TooltipProvider>
            <Tooltip open={showTooltip}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Your Miden name"
                    value={inputValue}
                    onChange={handleInputChange}
                    className="w-full h-16 sm:h-20 rounded-xl pl-4 sm:pl-6 pr-24 sm:pr-36 text-base sm:text-lg bg-gray-50"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center gap-2 pr-3 sm:pr-4">
                    <span className="h-6 sm:h-8 w-px bg-input mr-2 sm:mr-3" />
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