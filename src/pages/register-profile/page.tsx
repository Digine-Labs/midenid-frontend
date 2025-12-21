import { useState, useEffect } from "react"
import { useSearchParams } from "react-router"
import { useWallet } from "@demox-labs/miden-wallet-adapter-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Twitter, Github, Image, FileText, CheckCircle2, AlertCircle, Globe, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Felt, SigningInputs } from "@demox-labs/miden-sdk"
import { useWalletAccount } from "@/contexts/WalletAccountContext"

const API_BASE = "http://localhost:3080/metadata/domains"
const API_BECH32_TO_DOMAINS = "http://localhost:3080/bech32_to_domains"

type RegistrationStep = "domain" | "profile"

interface ProfileData {
  bio: string
  twitter: string
  github: string
  image_url: string
}

export default function RegisterProfile() {
  const [searchParams] = useSearchParams()
  const { signBytes, connected, publicKey, address } = useWallet()
  const { registeredDomain, accountId, hasRegisteredDomain, isLoading: isWalletLoading } = useWalletAccount()

  // Get mode and domain from URL params
  // mode=new: registering a new domain (don't preload)
  // mode=edit&domain=xxx: editing an existing domain (preload)
  // no params: default behavior (auto-detect)
  const urlMode = searchParams.get('mode')
  const urlDomain = searchParams.get('domain')
  const isNewMode = urlMode === 'new'

  // Current step
  const [currentStep, setCurrentStep] = useState<RegistrationStep>("domain")

  // Form fields
  const [domain, setDomain] = useState("")
  const [bio, setBio] = useState("")
  const [twitter, setTwitter] = useState("")
  const [github, setGithub] = useState("")
  const [imageUrl, setImageUrl] = useState("")

  // State
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingProfile, setIsFetchingProfile] = useState(false)
  const [isFetchingDomainFromAPI, setIsFetchingDomainFromAPI] = useState(false)
  const [apiDomain, setApiDomain] = useState<string | null>(null)
  const [signedData, setSignedData] = useState<{
    message_hex: string
    pubkey_hex: string
    signature_hex: string
  } | null>(null)
  const [submissionResult, setSubmissionResult] = useState<{ success: boolean; message: string } | null>(null)
  const [existingProfile, setExistingProfile] = useState<ProfileData | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  // Use registered domain from wallet context or API if available
  const effectiveDomain = domain.trim() || apiDomain || registeredDomain || ""

  // Check if address has a domain via backend API
  // API: GET /bech32_to_domains?bech32=... returns ["domain1", "domain2"]
  const fetchDomainFromAPI = async (bech32Address: string) => {
    try {
      setIsFetchingDomainFromAPI(true)
      const response = await fetch(`${API_BECH32_TO_DOMAINS}?bech32=${encodeURIComponent(bech32Address)}`)

      if (response.ok) {
        const data = await response.json()
        // API returns { domains: ["test", "clem"], account_id: "...", bech32: "..." }
        const domains: string[] = data.domains || []
        // Use first domain if available (for auto-detection)
        if (Array.isArray(domains) && domains.length > 0) {
          setApiDomain(domains[0])
          return domains[0]
        }
      }
      // No domain found or error
      setApiDomain(null)
      return null
    } catch (error) {
      console.error('[RegisterProfile] Failed to fetch domain from API:', error)
      setApiDomain(null)
      return null
    } finally {
      setIsFetchingDomainFromAPI(false)
    }
  }

  // Fetch domain from API when wallet connects (skip if mode=new)
  useEffect(() => {
    if (!connected || !address) {
      setApiDomain(null)
      return
    }

    // Skip fetching existing domain if we're in "new" mode
    if (isNewMode) {
      setApiDomain(null)
      return
    }

    fetchDomainFromAPI(address)
  }, [connected, address, isNewMode])

  // Handle URL params for edit mode
  useEffect(() => {
    if (urlMode === 'edit' && urlDomain && connected) {
      console.log('[RegisterProfile] Edit mode with domain:', urlDomain);
      setCurrentStep("profile")
      setDomain(urlDomain)
      fetchExistingProfile(urlDomain)
    }
  }, [urlMode, urlDomain, connected])

  // If wallet has a registered domain (from API or on-chain), skip to profile step and fetch existing profile
  // Wait until wallet loading and API check are complete before checking
  // Skip this auto-detection if mode=new or mode=edit (URL params take precedence)
  useEffect(() => {
    console.log('[RegisterProfile] Effect - isWalletLoading:', isWalletLoading, 'isFetchingDomainFromAPI:', isFetchingDomainFromAPI, 'connected:', connected, 'apiDomain:', apiDomain, 'registeredDomain:', registeredDomain, 'urlMode:', urlMode);

    // Skip auto-detection if URL mode is specified
    if (urlMode) {
      console.log('[RegisterProfile] URL mode specified, skipping auto-detection');
      return
    }

    // Don't do anything while wallet or API is still loading
    if (isWalletLoading || isFetchingDomainFromAPI) {
      console.log('[RegisterProfile] Still loading, skipping...');
      return
    }

    const detectedDomain = apiDomain || registeredDomain

    if (connected && detectedDomain) {
      console.log('[RegisterProfile] Has domain, switching to profile step:', detectedDomain);
      setCurrentStep("profile")
      setDomain(detectedDomain)
      fetchExistingProfile(detectedDomain)
    } else if (connected && !detectedDomain) {
      console.log('[RegisterProfile] Connected but no domain, staying on domain step');
      // Wallet connected but no domain registered - stay on domain step
      setCurrentStep("domain")
      setIsEditMode(false)
    } else if (!connected) {
      console.log('[RegisterProfile] Not connected, resetting');
      // Reset when disconnected
      setCurrentStep("domain")
      setDomain("")
      setIsEditMode(false)
      setExistingProfile(null)
      setApiDomain(null)
    }
  }, [apiDomain, registeredDomain, connected, isWalletLoading, isFetchingDomainFromAPI, urlMode])

  const fetchExistingProfile = async (domainName: string) => {
    try {
      setIsFetchingProfile(true)
      const response = await fetch(`${API_BASE}/${encodeURIComponent(domainName)}/profile`)

      if (response.ok) {
        const data = await response.json()
        setExistingProfile(data)
        setIsEditMode(true)
        // Pre-populate form fields
        setBio(data.bio || "")
        setTwitter(data.twitter || "")
        setGithub(data.github || "")
        setImageUrl(data.image_url || "")
      } else if (response.status === 404) {
        // No profile exists yet, but domain is registered
        setExistingProfile(null)
        setIsEditMode(false)
      }
    } catch (error) {
      // Profile fetch failed, allow creating new
      setExistingProfile(null)
      setIsEditMode(false)
    } finally {
      setIsFetchingProfile(false)
    }
  }

  const uint8ArrayToHex = (arr: Uint8Array): string => {
    return Array.from(arr)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  const createMessage = (includeProfile: boolean): string => {
    if (includeProfile) {
      return JSON.stringify({
        domain: effectiveDomain,
        bio: bio.trim(),
        twitter: twitter.trim(),
        github: github.trim(),
        image_url: imageUrl.trim(),
        timestamp: Date.now()
      })
    }
    return JSON.stringify({
      domain: effectiveDomain,
      timestamp: Date.now()
    })
  }

  // Helper function to sign data and return signature info
  const signData = async (includeProfile: boolean): Promise<{
    message_hex: string
    pubkey_hex: string
    signature_hex: string
  } | null> => {
    if (!connected || !signBytes || !publicKey) {
      toast.error("Please connect your wallet first")
      return null
    }

    const message = createMessage(includeProfile)
    const messageBytes = new TextEncoder().encode(message)

    try {
      // Convert message to Felt array
      const felts: Felt[] = []
      for (let i = 0; i < messageBytes.length; i += 8) {
        const chunk = messageBytes.slice(i, i + 8)
        let value = 0n
        for (let j = 0; j < chunk.length; j++) {
          value |= BigInt(chunk[j]) << BigInt(j * 8)
        }
        felts.push(new Felt(value))
      }

      // Create SigningInputs and get commitment
      const signingInputs = SigningInputs.newArbitrary(felts)
      const commitment = signingInputs.toCommitment()
      const commitmentBytes = commitment.serialize()

      // Sign with wallet
      const signatureBytes = await signBytes(commitmentBytes, "word")

      const result = {
        message_hex: uint8ArrayToHex(commitmentBytes),
        pubkey_hex: uint8ArrayToHex(publicKey),
        signature_hex: uint8ArrayToHex(signatureBytes)
      }

      // Clean up WASM memory - signingInputs owns the felts after newArbitrary
      try { signingInputs.free() } catch { /* already freed */ }

      return result
    } catch (error) {
      throw error
    }
  }

  // Combined sign and submit for domain registration
  const handleSubmitDomain = async () => {
    if (!effectiveDomain) {
      toast.error("Please enter a domain name")
      return
    }

    try {
      setIsLoading(true)
      setSubmissionResult(null)

      // Sign the data
      const signed = await signData(false)
      if (!signed) {
        setIsLoading(false)
        return
      }

      setSignedData(signed)

      // Submit to API
      const payload = {
        message_hex: signed.message_hex,
        pubkey_hex: signed.pubkey_hex,
        signature_hex: signed.signature_hex,
        account_id: accountId?.toString() || "",
        bech32: address || "",
        created_block: Date.now(),
        domain: effectiveDomain,
        metadata: null,
        updated_block: Date.now()
      }

      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const text = await response.text()
      let result: { error?: string; message?: string } = {}

      if (text) {
        try {
          result = JSON.parse(text)
        } catch {
          if (response.ok) {
            result = { message: text || "Success" }
          } else {
            result = { error: text || `HTTP ${response.status}` }
          }
        }
      }

      if (response.ok) {
        setSubmissionResult({ success: true, message: result.message || "Domain registered successfully!" })
        toast.success("Domain registered successfully!")
        // Move to profile step
        setCurrentStep("profile")
        setSignedData(null)
      } else {
        const errorMsg = result.error || result.message || `HTTP ${response.status}`
        setSubmissionResult({ success: false, message: errorMsg })
        toast.error(`Registration failed: ${errorMsg}`)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      setSubmissionResult({ success: false, message: errorMsg })
      toast.error(`Failed to submit: ${errorMsg}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Combined sign and submit for profile
  const handleSubmitProfile = async () => {
    if (!effectiveDomain) {
      toast.error("Please enter a domain name")
      return
    }

    try {
      setIsLoading(true)
      setSubmissionResult(null)

      // Sign the data
      const signed = await signData(true)
      if (!signed) {
        setIsLoading(false)
        return
      }

      setSignedData(signed)

      // Submit to API
      const payload = {
        message_hex: signed.message_hex,
        pubkey_hex: signed.pubkey_hex,
        signature_hex: signed.signature_hex,
        bio: bio.trim(),
        block_number: Date.now(),
        github: github.trim(),
        image_url: imageUrl.trim(),
        twitter: twitter.trim()
      }

      const apiUrl = `${API_BASE}/${encodeURIComponent(effectiveDomain)}/profile`

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const text = await response.text()
      let result: { error?: string; message?: string } = {}

      if (text) {
        try {
          result = JSON.parse(text)
        } catch {
          if (response.ok) {
            result = { message: text || "Success" }
          } else {
            result = { error: text || `HTTP ${response.status}` }
          }
        }
      }

      if (response.ok) {
        const successMessage = isEditMode ? "Profile updated successfully!" : "Profile created successfully!"
        setSubmissionResult({ success: true, message: result.message || successMessage })
        toast.success(successMessage)
        // After successful submission, mark as edit mode for future updates
        setIsEditMode(true)
        setSignedData(null)
      } else {
        const errorMsg = result.error || result.message || `HTTP ${response.status}`
        setSubmissionResult({ success: false, message: errorMsg })
        toast.error(`${isEditMode ? "Update" : "Registration"} failed: ${errorMsg}`)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      setSubmissionResult({ success: false, message: errorMsg })
      toast.error(`Failed to submit: ${errorMsg}`)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setDomain("")
    setBio("")
    setTwitter("")
    setGithub("")
    setImageUrl("")
    setSignedData(null)
    setSubmissionResult(null)
    setCurrentStep("domain")
  }

  const getPageTitle = () => {
    if (currentStep === "domain") return "Register Domain"
    if (isEditMode) return "Update Profile"
    return "Create Profile"
  }

  const getPageDescription = () => {
    if (currentStep === "domain") return "Register your domain with cryptographic signature"
    if (isEditMode) return "Update your profile information"
    return "Add profile information to your domain"
  }

  return (
    <main
      className="relative flex items-center justify-center pt-20 px-4 sm:px-6 lg:px-8 bg-background min-h-screen"
      style={{ minHeight: "calc(100vh - 3.5rem)" }}
    >
      <div className="w-full md:max-w-2xl">
        <div className="space-y-2 mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold md:tracking-tight">
            {getPageTitle()}
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg px-2">
            {getPageDescription()}
          </p>
        </div>

        {/* Step Indicator - hide if domain already registered */}
        {!hasRegisteredDomain && !apiDomain && (
          <div className="flex justify-center gap-2 mb-6">
            <div className={`px-3 py-1 rounded-full text-sm ${currentStep === "domain" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              1. Domain
            </div>
            <div className={`px-3 py-1 rounded-full text-sm ${currentStep === "profile" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              2. Profile
            </div>
          </div>
        )}

        {/* Current Profile Display */}
        {connected && !isWalletLoading && !isFetchingDomainFromAPI && existingProfile && isEditMode && (
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Current Profile</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchExistingProfile(effectiveDomain)}
                disabled={isFetchingProfile}
              >
                <RefreshCw className={`h-4 w-4 ${isFetchingProfile ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="flex items-start gap-4">
              {existingProfile.image_url && (
                <img
                  src={existingProfile.image_url}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              )}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{effectiveDomain}</span>
                </div>

                {existingProfile.bio && (
                  <p className="text-sm text-muted-foreground">{existingProfile.bio}</p>
                )}

                <div className="flex flex-wrap gap-3 text-sm">
                  {existingProfile.twitter && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Twitter className="h-3 w-3" />
                      <span>{existingProfile.twitter}</span>
                    </div>
                  )}
                  {existingProfile.github && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Github className="h-3 w-3" />
                      <span>{existingProfile.github}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {!connected ? (
          <Card className="p-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please connect your Miden wallet to register.
              </AlertDescription>
            </Alert>
          </Card>
        ) : isWalletLoading || (isFetchingDomainFromAPI && !isNewMode) ? (
          <Card className="p-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mr-3" />
              <span className="text-muted-foreground">
                {isFetchingDomainFromAPI && !isNewMode ? "Checking for registered domain..." : "Loading wallet data..."}
              </span>
            </div>
          </Card>
        ) : (
          <Card className="p-6 space-y-6">
            {/* Domain Field (always visible) */}
            <div className="space-y-2">
              <Label htmlFor="domain" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Domain Name
              </Label>
              <Input
                id="domain"
                placeholder={registeredDomain || "yourdomain"}
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                disabled={isLoading || currentStep === "profile"}
              />
              {registeredDomain && !domain && (
                <p className="text-xs text-muted-foreground">
                  Using your registered domain: <span className="font-mono">{registeredDomain}</span>
                </p>
              )}
            </div>

            {/* Profile Fields (only in profile step) */}
            {currentStep === "profile" && (
              <div className="space-y-4">
                {/* Edit mode indicator with refresh button */}
                {(hasRegisteredDomain || apiDomain) && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">
                        {isEditMode ? "Editing existing profile" : "Domain registered - create your profile"}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchExistingProfile(effectiveDomain)}
                      disabled={isFetchingProfile}
                    >
                      <RefreshCw className={`h-4 w-4 ${isFetchingProfile ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="bio" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Bio
                  </Label>
                  <Input
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={isLoading}
                    maxLength={280}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {bio.length}/280
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter" className="flex items-center gap-2">
                    <Twitter className="h-4 w-4" />
                    Twitter Handle
                  </Label>
                  <Input
                    id="twitter"
                    placeholder="@username"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="github" className="flex items-center gap-2">
                    <Github className="h-4 w-4" />
                    GitHub Username
                  </Label>
                  <Input
                    id="github"
                    placeholder="username"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrl" className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Profile Image URL
                  </Label>
                  <Input
                    id="imageUrl"
                    placeholder="https://example.com/avatar.png"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    disabled={isLoading}
                    type="url"
                  />
                </div>
              </div>
            )}

            {/* Loading state while fetching profile */}
            {isFetchingProfile && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-muted-foreground">Loading profile...</span>
              </div>
            )}

            {/* Action Button - Single button that signs and submits */}
            {!isFetchingProfile && (
              <Button
                onClick={currentStep === "domain" ? handleSubmitDomain : handleSubmitProfile}
                disabled={isLoading || !effectiveDomain || isFetchingProfile}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {currentStep === "domain" ? "Registering..." : isEditMode ? "Updating..." : "Saving..."}
                  </>
                ) : (
                  currentStep === "domain"
                    ? "Register Domain"
                    : isEditMode
                      ? "Update Profile"
                      : "Save Profile"
                )}
              </Button>
            )}

            {/* API Endpoint Preview */}
            {effectiveDomain && (
              <p className="text-xs text-muted-foreground text-center">
                Endpoint: <span className="font-mono">
                  {currentStep === "domain"
                    ? `POST ${API_BASE}`
                    : `POST ${API_BASE}/${effectiveDomain}/profile`}
                </span>
              </p>
            )}

            {/* Signed Data Preview */}
            {signedData && (
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-medium text-sm">Signed Data</h3>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-muted rounded-md break-all">
                    <p className="font-medium mb-1">Message (Hex):</p>
                    <p className="font-mono text-muted-foreground">{signedData.message_hex}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-md break-all">
                    <p className="font-medium mb-1">Public Key (Hex):</p>
                    <p className="font-mono text-muted-foreground truncate">{signedData.pubkey_hex.substring(0, 64)}...</p>
                  </div>
                  <div className="p-3 bg-muted rounded-md break-all">
                    <p className="font-medium mb-1">Signature (Hex):</p>
                    <p className="font-mono text-muted-foreground truncate">{signedData.signature_hex.substring(0, 64)}...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submission Result */}
            {submissionResult && (
              <Alert variant={submissionResult.success ? "default" : "destructive"}>
                {submissionResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {submissionResult.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Navigation/Reset Buttons */}
            <div className="flex gap-2">
              {currentStep === "profile" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentStep("domain")
                    setSignedData(null)
                    setSubmissionResult(null)
                  }}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Back to Domain
                </Button>
              )}
              {(signedData || submissionResult) && (
                <Button
                  variant="ghost"
                  onClick={resetForm}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Reset All
                </Button>
              )}
            </div>
          </Card>
        )}

        <div className="min-h-[40px]">
          {/* Spacer */}
        </div>
      </div>
    </main>
  )
}
