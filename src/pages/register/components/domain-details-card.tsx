import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Minus, Plus } from 'lucide-react'

interface DomainDetailsCardProps {
  domain: string
  years: number | string
  showYearsTooltip: boolean
  onYearsChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onYearsIncrement?: () => void
  onYearsDecrement?: () => void
}

export function DomainDetailsCard({ domain, years, showYearsTooltip, onYearsChange, onYearsIncrement, onYearsDecrement }: DomainDetailsCardProps) {
  const handleIncrement = () => {
    const currentYears = typeof years === 'string' ? parseInt(years) || 1 : years
    if (currentYears < 10) {
      onYearsIncrement?.()
    }
  }

  const handleDecrement = () => {
    const currentYears = typeof years === 'string' ? parseInt(years) || 1 : years
    if (currentYears > 1) {
      onYearsDecrement?.()
    }
  }
  return (
    <Card className="bg-card border-primary">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Domain Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center min-h-9">
          <span className="text-muted-foreground">Domain:</span>
          <span className="font-medium">{domain}.miden</span>
        </div>
        {/* <div className="flex justify-between items-center min-h-9">
          <span className="text-muted-foreground">Status:</span>
          <span className="text-green-500 font-medium">Available</span>
        </div> */}
        <div className="flex justify-between items-center min-h-9">
          <span className="text-muted-foreground">Years to register:</span>
          <TooltipProvider>
            <Tooltip open={showYearsTooltip}>
              <TooltipTrigger asChild>
                <div className="flex h-9 w-[100px] rounded-md border border-input bg-transparent shadow-sm">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-full w-9 rounded-none border-0 hover:bg-transparent"
                    onClick={handleDecrement}
                    disabled={typeof years === 'number' && years <= 1}
                  >
                    <Minus className="h-4 w-4 text-primary" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={years}
                    onChange={onYearsChange}
                    className="flex-1 h-full px-0 text-center border-0 shadow-none focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-full w-9 rounded-none border-0 hover:bg-transparent"
                    onClick={handleIncrement}
                    disabled={typeof years === 'number' && years >= 10}
                  >
                    <Plus className="h-4 w-3 text-primary" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-red-500 text-white">
                <p>Maximum 10 years of register available</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  )
}