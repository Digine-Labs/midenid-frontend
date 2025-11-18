import { Card, CardContent } from '@/components/ui/card'
//import { Input } from '@/components/ui/input'
//import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
//import { Button } from '@/components/ui/button'
//import { Minus, Plus } from 'lucide-react'
import { GradientText } from '@/components/ui/shadcn-io/gradient-text'
import { useEffect, useState } from 'react'
//import { HighlightText } from "@/components/ui/shadcn-io/highlight-text"
import { SlidingNumber } from '@/components/ui/shadcn-io/sliding-number'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TermsModal } from '@/components/terms-modal'
import { Checkbox } from '@/components/ui/checkbox'

interface DomainDetailsCardProps {
  domain: string
  years: number | string
  showYearsTooltip: boolean
  onYearsChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onYearsIncrement?: () => void
  onYearsDecrement?: () => void
  tokenAmount?: number
  tokenName?: string
  onTokenChange?: (token: string) => void
  onTermsChange: (checked: boolean) => void
  termsAccepted: boolean
}

export function DomainDetailsCard({ domain, tokenAmount = 100, tokenName = 'MIDEN', onTokenChange, onTermsChange, termsAccepted }: DomainDetailsCardProps) {
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false)
  
  const [isDark, setIsDark] = useState(false)
  const [randomPhrase] = useState(() => {
    const phrases = [
      "Word around the tavern is they'll call you",
      "The regulars have started calling you",
      "Everyone at the pub knows you as",
      "The bartender introduces you as",
      "Folks around here will know you as",
      "Your friends will toast to",
      "The crowd will cheer for",
      "Patrons will raise their glasses to",
      "The whole tavern will recognize you as",
      "Step right up, you'll be known as"
    ]
    return phrases[Math.floor(Math.random() * phrases.length)]
  })

  const [randomPricePhrase] = useState(() => {
    const pricePhrases = [
      { before: "The house special costs just", after: "shiny" },
      { before: "Your tab will be", after: "of" },
      { before: "The barkeep asks for", after: "nice" },
      { before: "Pour yourself in for only", after: "of" },
      { before: "It's happy hour! Just", after: "of fine" },
      { before: "The price tag shows", after: "tasty" },
      { before: "On the menu today:", after: "crisp" },
      { before: "The bill comes to", after: "of fresh" },
      { before: "For a limited time, only", after: "of premium" },
      { before: "The special offer is", after: "delicious" }
    ]
    return pricePhrases[Math.floor(Math.random() * pricePhrases.length)]
  })

    const handleTermsChange = (checked: boolean) => {

    onTermsChange(checked)
  }

  useEffect(() => {
    // Check if dark mode is enabled
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }

    checkDarkMode()

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  // Dark mode: primary (#0FE046) to lighter greens
  const gradientDark = "linear-gradient(90deg, #0FE046 0%, #5FFF7F 25%, #7FFFA0 50%, #5FFF7F 75%, #0FE046 100%)"
  // Light mode: primary (#0FE046) to darker greens
  const gradientLight = "linear-gradient(90deg, #0FE046 0%, #11B83D 25%, #08CB00 50%, #11B83D 75%, #0FE046 100%)"

  //const handleIncrement = () => {
  //  const currentYears = typeof years === 'string' ? parseInt(years) || 1 : years
  //  if (currentYears < 10) {
  //    onYearsIncrement?.()
  //  }
  //}
//
  //const handleDecrement = () => {
  //  const currentYears = typeof years === 'string' ? parseInt(years) || 1 : years
  //  if (currentYears > 1) {
  //    onYearsDecrement?.()
  //  }
  //}

  const domainElement = (
    <>
    <span className="font-bold text-xl inline-flex items-center">
      <GradientText
        text={`${domain}.miden`}
        gradient={isDark ? gradientDark : gradientLight}
      />

    </span>
    </>
  )
  return (
    <Card className="bg-card border-none">
      <CardContent className="py-8">
        <div className="text-center space-y-6">
          <span className="text-lg leading-relaxed flex flex-wrap items-center justify-center gap-2">
            <span className="text-muted-foreground">{randomPhrase}</span>
            {domainElement}
            <span className="text-muted-foreground">until testnet.</span>
          </span>
          <span className="text-base leading-relaxed flex flex-wrap items-center justify-center gap-2">
            <span className="text-muted-foreground">{randomPricePhrase.before}</span>
            <span className="text-primary text-lg">
              <SlidingNumber
                number={tokenAmount}
                transition={{
                  stiffness: 100,
                  damping: 30,
                  mass: 1
                }}
              />
            </span>
            <span className="text-muted-foreground">{randomPricePhrase.after}</span>
            <Select value={tokenName} onValueChange={onTokenChange}>
              <SelectTrigger className="w-auto h-auto border-0 bg-transparent px-0 py-0 text-primary text-lg focus:ring-0 focus:ring-offset-0 inline-flex gap-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MIDEN">MIDEN</SelectItem>
                <SelectItem value="TEST">TEST</SelectItem>
                <SelectItem value="DEMO">DEMO</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">during the testnet era.</span>
          </span>
        </div>
        <div className="border-t mt-6 pt-6 space-y-4">
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