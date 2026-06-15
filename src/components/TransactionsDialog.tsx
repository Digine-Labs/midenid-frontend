import { useEffect, useState } from 'react'
import { useWallet } from '@miden-sdk/miden-wallet-adapter'
import { Loader2, RefreshCw, Inbox, Undo2, ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMidenClient } from '@/contexts/MidenClientContext'
import { useToast } from '@/hooks/useToast'
import { ToastCause } from '@/types/toast'
import { getSentNotes, type StoredSentNote } from '@/lib/sentNotesStore'
import { checkNoteStatus } from '@/lib/registryNotes'
import { RECLAIM_AFTER_BLOCKS, buildReclaimConsume } from '@/lib/reclaim'
import { formatMiden } from '@/utils'

interface TransactionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// 'unknown' until the user refreshes that row; then resolved from chain.
type RowStatus =
  | 'unknown'
  | 'checking'
  | 'registered'
  | 'pending'
  | 'not-found'
  | 'error'

function StatusBadge({ status }: { status: RowStatus }) {
  switch (status) {
    case 'checking':
      return (
        <Badge className="border-transparent bg-muted text-muted-foreground hover:bg-muted">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Checking
        </Badge>
      )
    case 'registered':
      return (
        <Badge className="border-transparent bg-primary/15 text-primary hover:bg-primary/15">
          Registered
        </Badge>
      )
    case 'pending':
      return (
        <Badge className="border-transparent bg-amber-500/15 text-amber-600 hover:bg-amber-500/15 dark:text-amber-400">
          Pending
        </Badge>
      )
    case 'not-found':
      return (
        <Badge className="border-transparent bg-muted text-muted-foreground hover:bg-muted">
          Not found
        </Badge>
      )
    case 'error':
      return (
        <Badge className="border-transparent bg-destructive/15 text-destructive hover:bg-destructive/15">
          Error
        </Badge>
      )
    default:
      return (
        <Badge className="border-transparent bg-muted text-muted-foreground hover:bg-muted">
          Unknown
        </Badge>
      )
  }
}

export function NoteRow({ note }: { note: StoredSentNote }) {
  const { syncedBlock } = useMidenClient()
  const { requestConsume } = useWallet()
  const showToast = useToast()
  const [status, setStatus] = useState<RowStatus>('unknown')
  const [reclaiming, setReclaiming] = useState(false)

  const checkStatus = async () => {
    setStatus('checking')
    try {
      // Look the note up directly by id: a note that doesn't exist on-chain is
      // reported as 'not-found' (never reclaimable), not a phantom "pending".
      const live = await checkNoteStatus(note.noteId)
      setStatus(
        live === 'consumed' ? 'registered' : live === 'waiting' ? 'pending' : 'not-found',
      )
    } catch {
      setStatus('error')
    }
  }

  const blocksPassed =
    syncedBlock != null && syncedBlock - note.blockNumber >= RECLAIM_AFTER_BLOCKS
  // Reclaimable only once we know the note exists, is still unconsumed, and
  // enough blocks have passed (mirrors a P2IDE reclaim window).
  const reclaimable = status === 'pending' && blocksPassed

  const handleReclaim = async () => {
    setReclaiming(true)
    try {
      await requestConsume?.(buildReclaimConsume(note))
      showToast(ToastCause.TRANSACTION_SUBMITTED)
    } catch (e) {
      console.error('[reclaim] failed', e)
      showToast(ToastCause.TRANSACTION_ERROR)
    } finally {
      setReclaiming(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
      <div className="min-w-0">
        <p className="truncate font-medium">
          {note.domain}.m<span className="text-primary">id</span>en
        </p>
        <p className="text-xs text-muted-foreground">
          {formatMiden(BigInt(note.amount))} MIDEN · Block #{note.blockNumber}
        </p>
        <a
          href={`https://testnet.midenscan.com/note/${note.noteId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground transition-colors hover:text-primary hover:underline"
          title={`View note on MidenScan: ${note.noteId}`}
        >
          <span className="truncate">
            {note.noteId.slice(0, 10)}…{note.noteId.slice(-6)}
          </span>
          <ExternalLink className="h-3 w-3 flex-shrink-0" />
        </a>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <StatusBadge status={status} />
        {reclaimable && (
          <Button variant="outline" size="sm" onClick={handleReclaim} disabled={reclaiming}>
            {reclaiming ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Undo2 className="mr-1 h-3.5 w-3.5" />
            )}
            Reclaim
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={checkStatus}
          disabled={status === 'checking'}
          aria-label="Check status"
          title="Check status"
        >
          <RefreshCw className={`h-4 w-4 ${status === 'checking' ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  )
}

export function TransactionsDialog({ open, onOpenChange }: TransactionsDialogProps) {
  const { address } = useWallet()
  const [notes, setNotes] = useState<StoredSentNote[]>([])

  // Read from localStorage on open (and whenever the connected wallet changes).
  // No RPC — status is resolved per-row on demand.
  useEffect(() => {
    if (open && address) setNotes(getSentNotes(address))
  }, [open, address])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Transactions</DialogTitle>
          <DialogDescription>
            Domains you registered from this wallet. Use the refresh icon to check a
            registration's status.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
          {notes.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No transactions yet</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Registrations made from this wallet appear here. Used a different device?
                Find a note via Reclaim.
              </p>
            </div>
          ) : (
            notes.map(note => <NoteRow key={note.noteId} note={note} />)
          )}
        </div>

        <p className="border-t pt-3 text-center text-xs text-muted-foreground">
          Don't see a registration here? Use the <span className="font-medium">Reclaim</span>{' '}
          option with the registered domain to look it up on-chain.
        </p>
      </DialogContent>
    </Dialog>
  )
}
