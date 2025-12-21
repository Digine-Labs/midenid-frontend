import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useWalletAccount } from '@/contexts/WalletAccountContext'
import { WalletMultiButton } from '@demox-labs/miden-wallet-adapter-reactui'
import { useWallet } from '@demox-labs/miden-wallet-adapter-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Globe, Twitter, Github, User, Pencil, RefreshCw } from 'lucide-react'

const API_BASE = "http://localhost:3080/metadata/domains"
const API_BECH32_TO_DOMAINS = "http://localhost:3080/bech32_to_domains"

interface DomainProfile {
  domain: string
  bio?: string
  twitter?: string
  github?: string
  image_url?: string
}

interface DomainInfo {
  domain: string
  profile?: DomainProfile
}

export default function MyDomains() {
  const navigate = useNavigate()
  const { connected, address } = useWallet()
  const { isLoading: isWalletLoading } = useWalletAccount()

  const [domains, setDomains] = useState<DomainInfo[]>([])
  const [isLoadingDomains, setIsLoadingDomains] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch domains for this address from backend
  const fetchDomains = async () => {
    if (!address) return

    setIsLoadingDomains(true)
    setError(null)

    try {
      // Get domains from bech32 address
      // API: GET /bech32_to_domains?bech32=... returns { domains: [...], account_id: "...", bech32: "..." }
      const response = await fetch(`${API_BECH32_TO_DOMAINS}?bech32=${encodeURIComponent(address)}`)

      if (!response.ok) {
        if (response.status === 404) {
          setDomains([])
          return
        }
        throw new Error(`Failed to fetch domains: ${response.status}`)
      }

      const data = await response.json()
      const domainNames: string[] = data.domains || []

      if (!Array.isArray(domainNames) || domainNames.length === 0) {
        setDomains([])
        return
      }

      // Fetch profiles for all domains in parallel
      const domainsWithProfiles = await Promise.all(
        domainNames.map(async (domainName) => {
          let profile: DomainProfile | undefined

          try {
            const profileResponse = await fetch(`${API_BASE}/${encodeURIComponent(domainName)}/profile`)
            if (profileResponse.ok) {
              profile = await profileResponse.json()
            }
          } catch {
            // Profile fetch failed, continue without it
          }

          return {
            domain: domainName,
            profile
          }
        })
      )

      setDomains(domainsWithProfiles)
    } catch (err) {
      console.error('Failed to fetch domains:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch domains')
      setDomains([])
    } finally {
      setIsLoadingDomains(false)
    }
  }

  useEffect(() => {
    if (connected && address && !isWalletLoading) {
      fetchDomains()
    } else if (!connected) {
      setDomains([])
    }
  }, [connected, address, isWalletLoading])

  const handleAddDomain = () => {
    // Navigate with mode=new to prevent auto-loading existing domain
    navigate('/register-profile?mode=new')
  }

  const handleEditDomain = (domainName: string) => {
    // Navigate to register-profile with edit mode and domain name
    navigate(`/register-profile?mode=edit&domain=${encodeURIComponent(domainName)}`)
  }

  const isLoading = isWalletLoading || isLoadingDomains

  // Page wrapper component to reduce duplication
  const PageWrapper = ({ children, centered = true }: { children: React.ReactNode, centered?: boolean }) => (
    <div className="pt-14 bg-background min-h-screen px-4">
      <main
        className={`flex ${centered ? 'items-center' : 'items-start pt-8'} justify-center sm:px-6 lg:px-8`}
        style={{ minHeight: "calc(100vh - 3.5rem)" }}
      >
        <div className="w-full max-w-2xl">
          {children}
        </div>
      </main>
    </div>
  )

  // Not connected state
  if (!connected) {
    return (
      <PageWrapper>
        <div className="space-y-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide">
            My Domains
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg px-2">
            Connect your wallet to view your registered domains
          </p>
          <div className="flex justify-center">
            <WalletMultiButton />
          </div>
        </div>
      </PageWrapper>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <PageWrapper>
        <div className="space-y-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide">
            My Domains
          </h1>
          <div className="flex justify-center items-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p>Loading your domains...</p>
          </div>
        </div>
      </PageWrapper>
    )
  }

  // Error state
  if (error) {
    return (
      <PageWrapper>
        <div className="space-y-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide">
            My Domains
          </h1>
          <Card className="bg-card">
            <CardContent className="pt-6">
              <p className="text-destructive text-base">
                {error}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={fetchDomains}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageWrapper>
    )
  }

  // Empty state - no domains
  if (domains.length === 0) {
    return (
      <PageWrapper>
        <div className="space-y-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide">
            My Domains
          </h1>
          <Card className="bg-card">
            <CardContent className="pt-6 pb-6 space-y-4">
              <div className="flex justify-center">
                <Globe className="w-12 h-12 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-base sm:text-lg">
                No domains registered yet
              </p>
              <p className="text-sm text-muted-foreground">
                Register your first Miden identity domain
              </p>
              <Button onClick={handleAddDomain} className="mt-2">
                <Plus className="w-4 h-4 mr-2" />
                Register Domain
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageWrapper>
    )
  }

  // Domains list
  return (
    <PageWrapper centered={false}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide">
            My Domains
          </h1>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchDomains}
              disabled={isLoadingDomains}
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingDomains ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={handleAddDomain}>
              <Plus className="w-4 h-4 mr-2" />
              Register New Domain
            </Button>
          </div>
        </div>

        {/* Domains Grid */}
        <div className="grid gap-4">
          {domains.map((domainInfo) => (
            <Card
              key={domainInfo.domain}
              className="bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
              onClick={() => handleEditDomain(domainInfo.domain)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Profile Image or Placeholder */}
                  {domainInfo.profile?.image_url ? (
                    <img
                      src={domainInfo.profile.image_url}
                      alt={domainInfo.domain}
                      className="w-16 h-16 rounded-full object-cover border flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* Domain Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-semibold truncate">
                        {domainInfo.domain}.m<span className="text-primary">id</span>en
                      </h2>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 flex-shrink-0">
                        Active
                      </Badge>
                    </div>

                    {domainInfo.profile?.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {domainInfo.profile.bio}
                      </p>
                    )}

                    {/* Social Links */}
                    <div className="flex flex-wrap gap-3 text-sm">
                      {domainInfo.profile?.twitter && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Twitter className="h-3 w-3" />
                          <span>{domainInfo.profile.twitter}</span>
                        </div>
                      )}
                      {domainInfo.profile?.github && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Github className="h-3 w-3" />
                          <span>{domainInfo.profile.github}</span>
                        </div>
                      )}
                    </div>

                    {!domainInfo.profile && (
                      <p className="text-sm text-muted-foreground">
                        No profile set up yet
                      </p>
                    )}
                  </div>

                  {/* Edit Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditDomain(domainInfo.domain)
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom spacer */}
        <div className="min-h-[80px]" />
      </div>
    </PageWrapper>
  )
}
