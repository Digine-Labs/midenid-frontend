import { useState } from "react"
import { useWallet } from "@demox-labs/miden-wallet-adapter-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, CheckCircle2, Key } from "lucide-react"
import { toast } from "sonner"
import { SecretKey, Felt, PublicKey, SigningInputs } from "@demox-labs/miden-sdk"

// Signature is exported in the JS but not in TypeScript definitions
// @ts-ignore - Signature exists in runtime but missing from type definitions
import { Signature } from "@demox-labs/miden-sdk"

export default function SignMessage() {
  const { signBytes, connected, publicKey } = useWallet()
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState<'signature' | 'publicKey' | 'demoPublicKey' | null>(null)
  const [demoSignature, setDemoSignature] = useState<Uint8Array | null>(null)
  const [demoPublicKey, setDemoPublicKey] = useState<Uint8Array | null>(null)
  const [demoPublicKeyCommitment, setDemoPublicKeyCommitment] = useState<Uint8Array | null>(null)
  const [demoCommitment, setDemoCommitment] = useState<Uint8Array | null>(null)
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null)
  const [backendVerificationResult, setBackendVerificationResult] = useState<boolean | null>(null)
  const [storedSigningInputs, setStoredSigningInputs] = useState<any>(null)
  const [storedCommitment, setStoredCommitment] = useState<any>(null)
  const [storedPubKey, setStoredPubKey] = useState<any>(null)
  const [storedSignature, setStoredSignature] = useState<any>(null)
  const [storedSignatureBytes, setStoredSignatureBytes] = useState<Uint8Array | null>(null)

  const handleSignMessage = async () => {
    // Redirect to SDK signing which uses signBytes
    await handleSDKSignMessage()
  }

  const uint8ArrayToHex = (arr: Uint8Array): string => {
    return Array.from(arr)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  const handleSDKSignMessage = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message to sign")
      return
    }

    try {
      setIsLoading(true)

      // Check if wallet is connected and has signBytes
      if (connected && signBytes && publicKey) {
        // Use wallet's signBytes method

        // Step 1: Convert message to Felt array
        const messageBytes = new TextEncoder().encode(message)
        const felts: Felt[] = []

        for (let i = 0; i < messageBytes.length; i += 8) {
          const chunk = messageBytes.slice(i, i + 8)
          let value = 0n
          for (let j = 0; j < chunk.length; j++) {
            value |= BigInt(chunk[j]) << BigInt(j * 8)
          }
          felts.push(new Felt(value))
        }

        // Step 2: Create SigningInputs from felts
        const signingInputs = SigningInputs.newArbitrary(felts)

        // Step 3: Get the commitment (this is what actually gets signed)
        const commitment = signingInputs.toCommitment()
        const commitmentBytes = commitment.serialize()

        // Step 4: Sign the commitment using wallet's signBytes with "word" kind
        // The wallet signs the commitment Word (32 bytes)
        const signatureBytes = await signBytes(commitmentBytes, "word")

        // Try to deserialize the public key to get commitment
        // The wallet may provide the key in different formats
        let pubKeyCommitmentBytes: Uint8Array | null = null
        let pubKeyObj: PublicKey | null = null

        try {
          pubKeyObj = PublicKey.deserialize(publicKey)
          const pubKeyCommitment = pubKeyObj.toCommitment()
          pubKeyCommitmentBytes = pubKeyCommitment.serialize()
        } catch {
          // Wallet public key format may not be compatible with SDK's deserialize
          pubKeyCommitmentBytes = null
        }

        setDemoSignature(signatureBytes)
        setDemoPublicKey(publicKey)
        setDemoPublicKeyCommitment(pubKeyCommitmentBytes)
        setDemoCommitment(commitmentBytes)
        setVerificationResult(null)
        setBackendVerificationResult(null)

        // Store objects for local verification
        setStoredSigningInputs(signingInputs)
        setStoredCommitment(commitment)
        setStoredPubKey(pubKeyObj)
        setStoredSignatureBytes(signatureBytes)
        setStoredSignature(null)

        toast.success("✅ Message signed with wallet!")

        // Clean up WASM memory - only free the felts array
        // DON'T free commitment or signingInputs - they're stored for verification
        // and freeing them while stored causes "null pointer passed to rust" error
        felts.forEach(f => f.free())

      } else {
        // Fallback to SDK signing with temporary keys

        const secretKey = SecretKey.rpoFalconWithRNG()
        const pubKey = secretKey.publicKey()

        // Step 1: Convert message to Felt array
        const messageBytes = new TextEncoder().encode(message)
        const felts: Felt[] = []

        for (let i = 0; i < messageBytes.length; i += 8) {
          const chunk = messageBytes.slice(i, i + 8)
          let value = 0n
          for (let j = 0; j < chunk.length; j++) {
            value |= BigInt(chunk[j]) << BigInt(j * 8)
          }
          felts.push(new Felt(value))
        }

        // Step 2: Create SigningInputs from felts
        const signingInputs = SigningInputs.newArbitrary(felts)

        // Step 3: Get the commitment (this is what actually gets signed)
        const commitment = signingInputs.toCommitment()
        const commitmentBytes = commitment.serialize()

        // Step 4: Sign the signing inputs using signData
        const signature = secretKey.signData(signingInputs)

        // Step 5: Get signature bytes and public key (full + commitment)
        const signatureBytes = signature.serialize()
        const pubKeyBytes = pubKey.serialize()
        const pubKeyCommitment = pubKey.toCommitment()
        const pubKeyCommitmentBytes = pubKeyCommitment.serialize()

        setDemoSignature(signatureBytes)
        setDemoPublicKey(pubKeyBytes)
        setDemoPublicKeyCommitment(pubKeyCommitmentBytes)
        setDemoCommitment(commitmentBytes)

        // Store objects for verification (don't free these yet)
        setStoredSigningInputs(signingInputs)
        setStoredCommitment(commitment)
        setStoredPubKey(pubKey)
        setStoredSignature(signature)
        setStoredSignatureBytes(signatureBytes)
        setVerificationResult(null)
        setBackendVerificationResult(null)

        toast.success("✅ Message signed with SDK (temporary keypair)!")

        // Clean up WASM memory - only free temporary objects
        // DON'T free commitment, signingInputs, or signature - they're stored for verification
        felts.forEach(f => f.free())
        secretKey.free()
      }

    } catch (error) {
      console.error("Failed to sign message:", error)
      toast.error(`Failed to sign: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifySignature = async () => {
    if (!storedSigningInputs) {
      toast.error("Please sign a message first before verifying")
      return
    }

    // Check if we have a public key for local verification
    if (!storedPubKey) {
      toast.error("Local verification not available - wallet public key format is incompatible. Use backend verification instead.")
      return
    }

    try {
      setIsLoading(true)
      let isValid = false

      // Check which signing method was used
      if (storedSignature) {
        // SDK signing: Use verifyData with SigningInputs
        isValid = storedPubKey.verifyData(storedSigningInputs, storedSignature)
      } else if (storedCommitment && storedSignatureBytes) {
        // Wallet signing: Deserialize signature and verify against commitment

        // @ts-ignore - Signature.deserialize exists but not in type definitions
        const sig = Signature.deserialize(storedSignatureBytes)
        isValid = storedPubKey.verify(storedCommitment, sig)
        // @ts-ignore
        sig.free()
      } else {
        throw new Error("Missing signature data for verification")
      }

      setVerificationResult(isValid)

      if (isValid) {
        toast.success("✅ Signature verified successfully!")
      } else {
        toast.error("❌ Signature verification failed!")
      }

    } catch (error) {
      console.error("Failed to verify signature:", error)
      toast.error(`Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setVerificationResult(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackendVerifySignature = async () => {
    if (!demoSignature || !demoPublicKey || !demoCommitment) {
      toast.error("Please sign a message first before verifying with backend")
      return
    }

    try {
      setIsLoading(true)

      // Prepare the payload matching your backend API format
      // message_hex: the commitment (Word) that was actually signed
      // pubkey_hex: the public key to verify against (32 bytes)
      // signature_hex: the full 1563-byte signature
      const payload = {
        message_hex: uint8ArrayToHex(demoCommitment),
        pubkey_hex: uint8ArrayToHex(demoPublicKey),
        signature_hex: uint8ArrayToHex(demoSignature)
      }

      // Send POST request to backend
      const response = await fetch('http://localhost:3000/verify_signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      // Backend returns { valid: true/false } or { error: "..." }
      const isValid = result.valid === true

      setBackendVerificationResult(isValid)

      if (response.ok && isValid) {
        toast.success("✅ Backend verification passed!")
      } else {
        toast.error(`❌ Backend verification failed: ${result.error || result.message || 'Unknown error'}`)
      }

    } catch (error) {
      console.error("Failed to verify signature with backend:", error)
      toast.error(`Backend verification error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setBackendVerificationResult(false)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string, type: 'signature' | 'publicKey' | 'demoPublicKey') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      const label = type === 'signature' ? 'Signature' : type === 'demoPublicKey' ? 'Demo public key' : 'Public key'
      toast.success(`${label} copied to clipboard`)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      toast.error("Failed to copy to clipboard")
    }
  }

  return (
    <main
      className="relative flex items-center justify-center pt-20 px-4 sm:px-6 lg:px-8 bg-background min-h-screen"
      style={{ minHeight: "calc(100vh - 3.5rem)" }}
    >
      <div className="w-full md:max-w-3xl">
        <div className="space-y-2 mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold md:tracking-tight">
            Sign Message Test
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg px-2">
            Test Miden wallet message signing functionality
          </p>
        </div>

        {connected && signBytes && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20 mb-6">
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>Wallet connected!</strong>
              <p className="mt-2">
                You can now sign messages using your wallet's keys via the <code className="bg-green-100 dark:bg-green-900 px-1 rounded">signBytes</code> method.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {connected && !signBytes && (
          <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 mb-6">
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <strong>Wallet signing not available</strong>
              <p className="mt-2">
                Your wallet doesn't support the <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">signBytes</code> method.
                You can still use the SDK demo with temporary keys below.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {!connected && (
          <Alert className="mb-6">
            <AlertDescription>
              You can try the signing demo below with/without connecting your wallet.
            </AlertDescription>
          </Alert>
        )}

        {(!connected || !signBytes) ? (
          <>

            <Card className="p-4 sm:p-6 bg-card space-y-6 mt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Miden Signing Demo</h2>
                </div>
               
              </div>

              {/* Message Input */}
              <div className="space-y-2">
                <Label htmlFor="demo-message">Message to Sign</Label>
                <Input
                  id="demo-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message here..."
                  className="font-mono"
                />
              </div>

              {/* Sign Button */}
              <Button
                onClick={handleSDKSignMessage}
                disabled={isLoading || !message.trim()}
                className="w-full"
              >
                {isLoading ? "Signing..." : "Sign Message with SDK"}
              </Button>

              {/* Demo Results */}
              {demoSignature && demoPublicKey && (
                <div className="space-y-4 pt-4 border-t">
                  {/* Original Message as Hex */}
                  {message && (
                    <div className="space-y-2">
                      <Label>Message (Hex)</Label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 p-3 bg-muted rounded-md font-mono text-xs break-all">
                          {uint8ArrayToHex(new TextEncoder().encode(message))}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText(uint8ArrayToHex(new TextEncoder().encode(message)))
                            toast.success("Message hex copied to clipboard")
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Original message: "{message}" ({new TextEncoder().encode(message).length} bytes)
                      </p>
                    </div>
                  )}

                  {/* Commitment (what gets signed) */}
                  {demoCommitment && (
                    <div className="space-y-2">
                      <Label>Commitment (what gets signed)</Label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 p-3 bg-muted rounded-md font-mono text-xs break-all">
                          {uint8ArrayToHex(demoCommitment)}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText(uint8ArrayToHex(demoCommitment))
                            toast.success("Message hex copied to clipboard")
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Length: {demoCommitment.length} bytes
                      </p>
                    </div>
                  )}

                  {/* Public Key Commitment (32 bytes) */}
                  {demoPublicKeyCommitment && (
                    <div className="space-y-2">
                      <Label>Public Key Commitment (32 bytes)</Label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 p-3 bg-muted rounded-md font-mono text-xs break-all">
                          {uint8ArrayToHex(demoPublicKeyCommitment)}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText(uint8ArrayToHex(demoPublicKeyCommitment))
                            toast.success("Public key commitment copied to clipboard")
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Length: {demoPublicKeyCommitment.length} bytes (commitment/hash)
                      </p>
                    </div>
                  )}

                  {/* Full Public Key Polynomial */}
                  <div className="space-y-2">
                    <Label>Public Key Full ({demoPublicKey.length} bytes - polynomial)</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-3 bg-muted rounded-md font-mono text-xs break-all max-h-24 overflow-y-auto">
                        {uint8ArrayToHex(demoPublicKey)}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(uint8ArrayToHex(demoPublicKey), 'demoPublicKey')}
                      >
                        {copied === 'demoPublicKey' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Length: {demoPublicKey.length} bytes (full Falcon-512 polynomial)
                    </p>
                  </div>

                  {/* Demo Signature */}
                  <div className="space-y-2">
                    <Label>Signature (Hex)</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-3 bg-muted rounded-md font-mono text-xs break-all">
                        {uint8ArrayToHex(demoSignature)}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(uint8ArrayToHex(demoSignature), 'signature')}
                      >
                        {copied === 'signature' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Length: {demoSignature.length} bytes
                    </p>

                    {/* Raw Signature Bytes */}
                    <details className="pt-2">
                      <summary className="cursor-pointer text-sm font-medium mb-2">
                        Raw Signature Bytes
                      </summary>
                      <div className="p-3 bg-muted rounded-md font-mono text-xs break-all max-h-32 overflow-y-auto">
                        [{Array.from(demoSignature).join(', ')}]
                      </div>
                    </details>
                  </div>

                  {/* Verify Signature Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={handleVerifySignature}
                      disabled={isLoading}
                      variant="outline"
                      className="flex-1"
                    >
                      {isLoading ? "Verifying..." : "Verify Locally"}
                    </Button>
                    <Button
                      onClick={handleBackendVerifySignature}
                      disabled={isLoading}
                      variant="default"
                      className="flex-1"
                    >
                      {isLoading ? "Verifying..." : "Verify with Backend"}
                    </Button>
                  </div>

                  {/* Local Verification Result */}
                  {verificationResult !== null && (
                    <Alert className={verificationResult ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-red-500 bg-red-50 dark:bg-red-950/20"}>
                      <AlertDescription className={verificationResult ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}>
                        <strong>{verificationResult ? "✅ Local Verification Passed" : "❌ Local Verification Failed"}</strong>
                        <p className="mt-2">
                          {verificationResult
                            ? "The signature is valid and was created by this public key for this message."
                            : "The signature verification failed. This signature does not match the message and public key."}
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Backend Verification Result */}
                  {backendVerificationResult !== null && (
                    <Alert className={backendVerificationResult ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-red-500 bg-red-50 dark:bg-red-950/20"}>
                      <AlertDescription className={backendVerificationResult ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}>
                        <strong>{backendVerificationResult ? "✅ Backend Verification Passed" : "❌ Backend Verification Failed"}</strong>
                        <p className="mt-2">
                          {backendVerificationResult
                            ? "The backend server successfully verified the signature."
                            : "The backend server failed to verify the signature."}
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}

                  {connected && signBytes ? (
                    <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                      <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                        <strong>Note:</strong> This signature was created using your wallet's actual secret key via the signBytes method.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                      <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                        <strong>Note:</strong> This signature was created with a temporary keypair generated just for this demo.
                        To sign with your actual wallet keys, connect your wallet and it will use the signBytes method.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </Card>
          </>
        ) : (
          <Card className="p-4 sm:p-6 bg-card space-y-6">
            {/* Public Key Display */}
            {publicKey && (
              <div className="space-y-2">
                <Label>Public Key</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-muted rounded-md font-mono text-xs break-all">
                    {uint8ArrayToHex(publicKey)}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(uint8ArrayToHex(publicKey), 'publicKey')}
                  >
                    {copied === 'publicKey' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Length: {publicKey.length} bytes
                </p>
              </div>
            )}

            {/* Message Input */}
            <div className="space-y-2">
              <Label htmlFor="message">Message to Sign</Label>
              <Input
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message here..."
                className="font-mono"
              />
            </div>

            {/* Sign Button */}
            <Button
              onClick={handleSignMessage}
              disabled={!connected || isLoading || !message.trim()}
              className="w-full"
            >
              {isLoading ? "Signing..." : "Sign Message"}
            </Button>

            {/* Results Display */}
            {demoSignature && (
              <div className="space-y-4 pt-4 border-t">
                {/* Original Message as Hex */}
                {message && (
                  <div className="space-y-2">
                    <Label>Message (Hex)</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-3 bg-muted rounded-md font-mono text-xs break-all">
                        {uint8ArrayToHex(new TextEncoder().encode(message))}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(uint8ArrayToHex(new TextEncoder().encode(message)))
                          toast.success("Message hex copied to clipboard")
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Original message: "{message}" ({new TextEncoder().encode(message).length} bytes)
                    </p>
                  </div>
                )}

                {/* Commitment (what gets signed) */}
                {demoCommitment && (
                  <div className="space-y-2">
                    <Label>Commitment (what gets signed)</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-3 bg-muted rounded-md font-mono text-xs break-all">
                        {uint8ArrayToHex(demoCommitment)}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(uint8ArrayToHex(demoCommitment))
                          toast.success("Commitment hex copied to clipboard")
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Length: {demoCommitment.length} bytes
                    </p>
                  </div>
                )}

                {/* Signature */}
                <div className="space-y-2">
                  <Label>Signature (Hex)</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-muted rounded-md font-mono text-xs break-all">
                      {uint8ArrayToHex(demoSignature)}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(uint8ArrayToHex(demoSignature), 'signature')}
                    >
                      {copied === 'signature' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Length: {demoSignature.length} bytes
                  </p>

                  {/* Raw Signature Bytes */}
                  <details className="pt-2">
                    <summary className="cursor-pointer text-sm font-medium mb-2">
                      Raw Signature Bytes
                    </summary>
                    <div className="p-3 bg-muted rounded-md font-mono text-xs break-all max-h-32 overflow-y-auto">
                      [{Array.from(demoSignature).join(', ')}]
                    </div>
                  </details>
                </div>
              </div>
            )}

          </Card>
        )}

        <div className="min-h-[40px]">
          {/* Spacer */}
        </div>
      </div>
    </main>
  )
}
