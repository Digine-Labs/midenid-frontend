import { useWalletAccount } from '@/contexts/WalletAccountContext'
import { WalletMultiButton } from '@demox-labs/miden-wallet-adapter-reactui'
import { useWallet } from '@demox-labs/miden-wallet-adapter-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

export default function MyDomains() {
    const { connected } = useWallet()
    const { hasRegisteredDomain, registeredDomain, isLoading } = useWalletAccount()

    // If wallet is not connected, show connect wallet button
    if (!connected) {
        return (
            <div className="pt-14 bg-background min-h-screen px-4">
                <main
                    className="flex items-center justify-center sm:px-6 lg:px-8"
                    style={{ minHeight: "calc(100vh - 3.5rem)" }}
                >
                    <div className="w-full sm:max-w-md md:max-w-2xl lg:max-w-3xl text-center">
                        <div className="space-y-6">
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-wide">
                                My M<span className="text-primary">id</span>en Domains
                            </h1>
                            <p className="text-muted-foreground text-base sm:text-lg px-2">
                                Connect your wallet to view your registered domains
                            </p>
                            <div className="flex justify-center">
                                <WalletMultiButton />
                            </div>
                        </div>
                        <div className="min-h-[120px]" />
                    </div>
                </main>
            </div>
        )
    }

    // If loading, show loading state
    if (isLoading) {
        return (
            <div className="pt-14 bg-background min-h-screen px-4">
                <main
                    className="flex items-center justify-center sm:px-6 lg:px-8"
                    style={{ minHeight: "calc(100vh - 3.5rem)" }}
                >
                    <div className="w-full sm:max-w-md md:max-w-2xl lg:max-w-3xl text-center">
                        <div className="space-y-6">
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-wide">
                                My M<span className="text-primary">id</span>en Domains
                            </h1>
                            <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <p>Loading your domains...</p>
                            </div>
                            <div className="min-h-[120px]" />
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    // If no domains registered, show empty state
    if (!hasRegisteredDomain) {
        return (
            <div className="pt-14 bg-background min-h-screen px-4">
                <main
                    className="flex items-center justify-center sm:px-6 lg:px-8"
                    style={{ minHeight: "calc(100vh - 3.5rem)" }}
                >
                    <div className="w-full sm:max-w-md md:max-w-2xl lg:max-w-3xl text-center">
                        <div className="space-y-6">
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-wide">
                                My M<span className="text-primary">id</span>en Domains
                            </h1>
                            <Card className="bg-card">
                                <CardContent className="pt-6">
                                    <p className="text-muted-foreground text-base sm:text-lg">
                                        No domains registered yet
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Visit the home page to search and register your first domain
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="min-h-[120px]" />
                    </div>
                </main>
            </div>
        )
    }

    // Show registered domain
    return (
        <div className="pt-14 bg-background min-h-screen px-4">
            <main
                className="flex items-center justify-center sm:px-6 lg:px-8"
                style={{ minHeight: "calc(100vh - 3.5rem)" }}
            >
                <div className="w-full sm:max-w-md md:max-w-2xl lg:max-w-3xl">
                    <div className="space-y-6">
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-wide text-center">
                            My M<span className="text-primary">id</span>en Domains
                        </h1>
                        <Card className="bg-card">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="text-2xl">
                                        {registeredDomain}<span className="text-primary">.miden</span>
                                    </span>
                                    <Badge variant="secondary" className="bg-primary text-green-800">
                                        Active
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className='p-4 pt-0'>
                                <div className="space-y-2 text-sm text-muted-foreground">
                                    <p>Your registered Miden identity domain</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="min-h-[120px]" />
                </div>
            </main>
        </div>
    )
}
