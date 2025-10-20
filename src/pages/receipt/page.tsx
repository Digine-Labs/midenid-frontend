import { useNavigate, useLocation } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
import { useEffect } from 'react'
import { Breadcrumb } from "../register/components/breadcrumb"
import { formatBalance } from '@/utils'

interface LocationState {
    domain: string
    years: number
    price: string
}

export default function Receipt() {
    const navigate = useNavigate()
    const location = useLocation()
    const state = location.state as LocationState | null

    useEffect(() => {
        // Redirect to home if required state is missing
        if (!state || !state.domain || !state.years || !state.price) {
            navigate('/', { replace: true })
        }
    }, [state, navigate])

    if (!state || !state.domain || !state.years || !state.price) {
        return null
    }

    const { domain, years, price } = state

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-4xl">
                <Breadcrumb currentStep="done" />

                <div className="mt-8">
                    <Card className="bg-card border-green-500 border-2">
                        <CardHeader className="text-center pb-4">
                            <div className="flex justify-center mb-4">
                                <CheckCircle2 className="h-16 w-16 text-green-500" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-green-500">
                                Registration Successful!
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="text-center text-muted-foreground mb-6">
                                Your domain has been successfully registered on the Miden network.
                            </div>

                            <div className="space-y-4 bg-muted/50 rounded-lg p-6">
                                <div className="flex justify-between items-center min-h-9 border-b border-border pb-3">
                                    <span className="text-muted-foreground">Domain:</span>
                                    <span className="font-semibold text-lg">{domain}.miden</span>
                                </div>

                                <div className="flex justify-between items-center min-h-9 border-b border-border pb-3">
                                    <span className="text-muted-foreground">Registration Period:</span>
                                    <span className="font-medium">{years} {years === 1 ? 'year' : 'years'}</span>
                                </div>

                                <div className="flex justify-between items-center min-h-9">
                                    <span className="text-muted-foreground">Total Paid:</span>
                                    <span className="font-semibold text-lg text-primary">{formatBalance(BigInt(price))} MIDEN</span>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">

                                <Button
                                    className="flex-1"
                                    onClick={() => navigate('/')}
                                >
                                    Go to Home Page
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}