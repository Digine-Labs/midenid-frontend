import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useWalletAccount } from '@/contexts/WalletAccountContext'
import { WalletMultiButton } from '@demox-labs/miden-wallet-adapter-reactui'
import { useWallet } from '@demox-labs/miden-wallet-adapter-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Globe, Github, User, Pencil, RefreshCw } from 'lucide-react'
import { getAccountAllDomains, batchGetProfiles } from '@/api'
import type { ProfileData } from '@/api'
import { useTheme } from '@/components/ThemeProvider'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ThemedIcon } from '@/components/ui/themed-icon'

interface DomainInfo {
  domain: string
  profile?: ProfileData
}

interface PageWrapperProps {
  children: React.ReactNode
  centered?: boolean
}

function PageWrapper({ children, centered = true }: PageWrapperProps) {
  return (
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
}

interface DomainCardItemProps {
  domainInfo: DomainInfo
  isActive: boolean
  onEdit: (domain: string) => void
}

function DomainCardItem({ domainInfo, isActive, onEdit }: DomainCardItemProps) {
  const { resolvedTheme } = useTheme()

  return (
    <Card
      className={`bg-card transition-colors cursor-pointer group hover:border-primary/50 ${
        resolvedTheme === "dark" ? "hover:bg-accent/50" : "hover:bg-accent/10"
      }`}
      onClick={() => onEdit(domainInfo.domain)}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
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

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-semibold truncate">
                {domainInfo.domain}.m<span className="text-primary">id</span>en
              </h2>
              {isActive && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 flex-shrink-0">
                  Active
                </Badge>
              )}
            </div>

            {domainInfo.profile?.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {domainInfo.profile.bio}
              </p>
            )}

            <div className="flex flex-wrap gap-3 text-sm">
              {domainInfo.profile?.twitter && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <ThemedIcon src="/icons/twitter.png" alt="Twitter" className="h-3 w-3" />
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

          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(domainInfo.domain)
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function MyDomains() {
  const navigate = useNavigate()
  const { connected, address } = useWallet()
  const { isLoading: isWalletLoading } = useWalletAccount()
  const [domains, setDomains] = useState<DomainInfo[]>([])
  const [activeDomain, setActiveDomain] = useState<string | null>(null)
  const [isLoadingDomains, setIsLoadingDomains] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDomains = useCallback(async () => {
    if (!address) return

    setIsLoadingDomains(true)
    setError(null)

    try {
      const result = await getAccountAllDomains(address)

      if (!result.success) {
        if (result.error?.includes('404')) {
          setDomains([])
          setActiveDomain(null)
          return
        }
        throw new Error(result.error || 'Failed to fetch domains')
      }

      const domainNames: string[] = result.data?.domains || []
      setActiveDomain(result.data?.active_domain || null)

      if (!Array.isArray(domainNames) || domainNames.length === 0) {
        setDomains([])
        return
      }

      try {
        const batchResult = await batchGetProfiles(domainNames)
        const domainsWithProfiles = batchResult.results.map((result) => ({
          domain: result.domain,
          profile: result.profile ? {
            bio: result.profile.bio ?? undefined,
            twitter: result.profile.twitter ?? undefined,
            github: result.profile.github ?? undefined,
            discord: result.profile.discord ?? undefined,
            telegram: result.profile.telegram ?? undefined,
            image_url: result.profile.image_url ?? undefined,
            created_at: result.profile.created_at,
            updated_at: result.profile.updated_at,
          } : undefined
        }))
        setDomains(domainsWithProfiles)
      } catch {
        setDomains(domainNames.map((name) => ({ domain: name, profile: undefined })))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch domains')
      setDomains([])
    } finally {
      setIsLoadingDomains(false)
    }
  }, [address])

  useEffect(() => {
    if (connected && address && !isWalletLoading) {
      fetchDomains()
    } else if (!connected) {
      setDomains([])
    }
  }, [connected, address, isWalletLoading, fetchDomains])

  const handleAddDomain = () => navigate('/')
  const handleEditDomain = (domainName: string) => navigate('/identity', { state: { domain: domainName } })

  const isLoading = isWalletLoading || isLoadingDomains

  if (!connected) {
    return (
      <PageWrapper>
        <div className="space-y-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide">My Domains</h1>
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

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="space-y-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide">My Domains</h1>
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading your domains...</p>
          </div>
        </div>
      </PageWrapper>
    )
  }

  if (error) {
    return (
      <PageWrapper>
        <div className="space-y-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide">My Domains</h1>
          <Card className="bg-card">
            <CardContent className="pt-6">
              <p className="text-destructive text-base">{error}</p>
              <Button variant="outline" className="mt-4" onClick={fetchDomains}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageWrapper>
    )
  }

  if (domains.length === 0) {
    return (
      <PageWrapper>
        <div className="space-y-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide">My Domains</h1>
          <Card className="bg-card">
            <CardContent className="pt-6 pb-6 space-y-4">
              <div className="flex justify-center">
                <Globe className="w-12 h-12 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-base sm:text-lg">No domains registered yet</p>
              <p className="text-sm text-muted-foreground">Register your first Miden identity domain</p>
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

  return (
    <PageWrapper centered={false}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide">My Domains</h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={fetchDomains} disabled={isLoadingDomains}>
              <RefreshCw className={`w-4 h-4 ${isLoadingDomains ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={handleAddDomain}>
              <Plus className="w-4 h-4 mr-2" />
              Register New Domain
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {domains.map((domainInfo) => (
            <DomainCardItem
              key={domainInfo.domain}
              domainInfo={domainInfo}
              isActive={activeDomain === domainInfo.domain}
              onEdit={handleEditDomain}
            />
          ))}
        </div>

        <div className="min-h-[80px]" />
      </div>
    </PageWrapper>
  )
}
