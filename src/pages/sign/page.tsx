import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { TransactionRequest, AccountId } from '@miden-sdk/miden-sdk'
import {
  CustomTransaction,
  TransactionType,
  WalletMultiButton,
  useWallet,
} from '@miden-sdk/miden-wallet-adapter'
import { Loader2, ShieldCheck, AlertTriangle, ExternalLink, CheckCircle2 } from 'lucide-react'
import { accountIdToBech32, bech32ToAccountId } from '@/lib/midenClient'
import { MIDEN_ID_CONTRACT_ADDRESS, API_BASE } from '@/shared/constants'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

// The `/sign/:id` page of the device-flow signing scheme
// (midenname-agent-skills/design/device-flow-signing.md). An agent proposes an
// unsigned register transaction; the user lands here, the page re-derives the
// trust-critical fields FROM THE TRANSACTION BYTES (not the relay's summary), and
// the user signs in their own wallet. The key never leaves the wallet.

type Phase =
  | 'loading'
  | 'review'
  | 'submitting'
  | 'done'
  | 'rejected'
  | 'expired'
  | 'notfound'
  | 'error'

interface SignRecord {
  id: string
  kind: string
  unsigned_tx_hex: string
  summary?: {
    name?: string
    sender_account?: string
    naming_account?: string
    faucet_id?: string
    price?: string
  }
  status: 'pending' | 'signed' | 'rejected' | 'expired'
  tx_hash?: string | null
  note_id?: string | null
}

// Values re-derived from the unsigned tx itself — this is what the user is really
// signing, independent of whatever the relay claims in `summary`.
interface Derived {
  senderHex: string
  senderBech32: string
  faucetHex: string
  amount: bigint
  noteId: string
}

// The wallet returns its own internal tx id (a UUID), not the on-chain tx hash, so
// we can't link to the transaction. The register NOTE, however, has a real on-chain
// id that MidenScan resolves — link to that instead.
const MIDENSCAN_NOTE = 'https://testnet.midenscan.com/note/'

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/, '')
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  return out
}

function fmtTokens(baseUnits: bigint): string {
  const whole = baseUnits / 1_000_000n
  const frac = baseUnits % 1_000_000n
  return frac === 0n ? whole.toString() : `${whole}.${frac.toString().padStart(6, '0').replace(/0+$/, '')}`
}

export default function SignPage() {
  const { id } = useParams<{ id: string }>()
  const { connected, address, requestTransaction } = useWallet()

  const [phase, setPhase] = useState<Phase>('loading')
  const [error, setError] = useState<string>('')
  const [record, setRecord] = useState<SignRecord | null>(null)
  const [derived, setDerived] = useState<Derived | null>(null)
  const [txReq, setTxReq] = useState<TransactionRequest | null>(null)
  const [noteId, setNoteId] = useState<string>('')

  const load = useCallback(async () => {
    if (!id) return
    setPhase('loading')
    try {
      const resp = await fetch(`${API_BASE}/v1/sign-requests/${id}`)
      if (resp.status === 404) { setPhase('notfound'); return }
      if (!resp.ok) throw new Error(`relay returned ${resp.status}`)
      const rec: SignRecord = await resp.json()
      setRecord(rec)

      if (rec.status === 'signed') {
        setNoteId(rec.note_id ?? '')
        setPhase('done')
        return
      }
      if (rec.status === 'rejected') { setPhase('rejected'); return }
      if (rec.status === 'expired') { setPhase('expired'); return }

      // Re-derive the trust-critical fields straight from the bytes.
      const tr = TransactionRequest.deserialize(hexToBytes(rec.unsigned_tx_hex))
      const notes = tr.expectedOutputOwnNotes()
      if (notes.length === 0) throw new Error('transaction has no output note to register')
      const note = notes[0]
      const sender = note.metadata().sender()
      const assets = note.assets().fungibleAssets()
      if (assets.length === 0) throw new Error('transaction carries no payment asset')
      const asset = assets[0]
      const derivedNoteId = note.id().toString()

      setTxReq(tr)
      setNoteId(derivedNoteId)
      setDerived({
        senderHex: sender.toString(),
        senderBech32: accountIdToBech32(sender),
        faucetHex: asset.faucetId().toString(),
        amount: asset.amount(),
        noteId: derivedNoteId,
      })
      setPhase('review')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setPhase('error')
    }
  }, [id])

  useEffect(() => { void load() }, [load])

  // Sender pinning (invariant #5): the connected wallet must be the account that
  // pays inside the tx. Compared on the AccountId, normalized via toString().
  const connectedHex = useMemo(() => {
    if (!address) return null
    try { return bech32ToAccountId(address).toString() } catch { return null }
  }, [address])
  const walletMatches = !!(derived && connectedHex && connectedHex === derived.senderHex)

  // Soft consistency check against the relay summary (invariant #2): the bytes are
  // authoritative, but a divergence hints at a misbehaving relay.
  const summaryMismatch = useMemo(() => {
    if (!record?.summary || !derived) return false
    const s = record.summary
    const priceOk = !s.price || s.price === derived.amount.toString()
    const faucetOk = !s.faucet_id || s.faucet_id.toLowerCase() === derived.faucetHex.toLowerCase()
    return !(priceOk && faucetOk)
  }, [record, derived])

  const approve = useCallback(async () => {
    if (!txReq || !derived || !record || !requestTransaction) return
    setPhase('submitting')
    setError('')
    try {
      const namingHex = record.summary?.naming_account || MIDEN_ID_CONTRACT_ADDRESS
      const tx = new CustomTransaction(
        derived.senderBech32, // from — the paying account, re-derived from the tx
        accountIdToBech32(AccountId.fromHex(namingHex)), // to — naming registry
        txReq,
        [],
        [],
      )
      const txId = await requestTransaction({ type: TransactionType.Custom, payload: tx })
      // Tell the relay (best-effort; the tx is already submitted by the wallet).
      await fetch(`${API_BASE}/v1/sign-requests/${id}/signed`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tx_hash: txId, note_id: derived.noteId }),
      }).catch(() => {})
      setPhase('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setPhase('review')
    }
  }, [txReq, derived, record, requestTransaction, id])

  const reject = useCallback(async () => {
    await fetch(`${API_BASE}/v1/sign-requests/${id}/rejected`, { method: 'PATCH' }).catch(() => {})
    setPhase('rejected')
  }, [id])

  const name = record?.summary?.name

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Approve registration
            </CardTitle>
            <Badge variant="secondary">device-flow</Badge>
          </div>
          <CardDescription>
            An agent proposed this transaction. Review what you are signing — the
            details below are read directly from the transaction, not from the
            requester. Your key never leaves your wallet.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {phase === 'loading' && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading sign request…
            </div>
          )}

          {phase === 'notfound' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Request not found</AlertTitle>
              <AlertDescription>
                This sign request does not exist. It may have already been completed
                or never created.
              </AlertDescription>
            </Alert>
          )}

          {phase === 'expired' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Request expired</AlertTitle>
              <AlertDescription>
                This request timed out. Ask the agent to generate a new link.
              </AlertDescription>
            </Alert>
          )}

          {phase === 'rejected' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Request rejected</AlertTitle>
              <AlertDescription>This transaction was declined.</AlertDescription>
            </Alert>
          )}

          {phase === 'error' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Could not load the transaction</AlertTitle>
              <AlertDescription className="break-words">{error}</AlertDescription>
            </Alert>
          )}

          {(phase === 'review' || phase === 'submitting') && derived && (
            <>
              <dl className="space-y-3 text-sm">
                <Row label="Domain">
                  <span className="font-medium">{name ? `${name}.miden` : '(name in tx)'}</span>
                </Row>
                <Row label="Price">
                  <span className="font-medium">{fmtTokens(derived.amount)} MIDEN</span>
                  <span className="ml-1 text-muted-foreground">({derived.amount.toString()} base units)</span>
                </Row>
                <Row label="Pay from">
                  <code className="break-all text-xs">{derived.senderBech32}</code>
                </Row>
                <Row label="Payment token">
                  <code className="break-all text-xs">{derived.faucetHex}</code>
                </Row>
                <Row label="Register note">
                  <code className="break-all text-xs">{derived.noteId}</code>
                </Row>
              </dl>

              {summaryMismatch && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Requester summary does not match the transaction</AlertTitle>
                  <AlertDescription>
                    The price or payment token claimed by the requester differs from
                    what the transaction actually does. The values shown above are the
                    real ones. Proceed only if you trust them.
                  </AlertDescription>
                </Alert>
              )}

              <Separator />

              {!connected ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Connect the wallet that owns <code className="text-xs">{derived.senderBech32}</code> to approve.
                  </p>
                  <WalletMultiButton />
                </div>
              ) : !walletMatches ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Wrong wallet connected</AlertTitle>
                  <AlertDescription>
                    This transaction pays from <code className="break-all text-xs">{derived.senderBech32}</code>,
                    but the connected wallet is a different account. Switch accounts to continue.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <ShieldCheck className="h-4 w-4" /> Wallet matches the paying account.
                </div>
              )}

              {error && phase === 'review' && (
                <p className="text-sm text-destructive break-words">{error}</p>
              )}
            </>
          )}

          {phase === 'done' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Signed and submitted</span>
              </div>
              {name && <p className="text-sm text-muted-foreground">{name}.miden registration sent.</p>}
              {noteId && (
                <a
                  className="inline-flex items-center gap-1 text-sm text-primary underline"
                  href={`${MIDENSCAN_NOTE}${noteId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View register note on MidenScan <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <p className="text-xs text-muted-foreground">
                Registration finalizes once the registry consumes the note (usually a few minutes).
                You can return to the agent — it has been notified.
              </p>
            </div>
          )}
        </CardContent>

        {(phase === 'review' || phase === 'submitting') && (
          <CardFooter className="flex gap-3">
            <Button
              className="flex-1"
              onClick={approve}
              disabled={!connected || !walletMatches || phase === 'submitting'}
            >
              {phase === 'submitting' ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing…</>
              ) : (
                'Approve & sign'
              )}
            </Button>
            <Button variant="outline" onClick={reject} disabled={phase === 'submitting'}>
              Reject
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="sm:text-right">{children}</dd>
    </div>
  )
}
