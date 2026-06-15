import { useState } from 'react'
import { useWallet } from '@miden-sdk/miden-wallet-adapter'
import { Loader2, Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useMidenClient } from '@/contexts/MidenClientContext'
import { addSentNote, type StoredSentNote } from '@/lib/sentNotesStore'
import { NoteRow } from './TransactionsDialog'

interface ReclaimDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Phase = 'idle' | 'searching' | 'found' | 'not-found' | 'error'

function normalizeDomain(input: string): string {
  return input.trim().toLowerCase().replace(/\.miden$/, '')
}

/**
 * Recovery flow for register-notes NOT in this browser's localStorage (e.g. sent
 * from another device). Note IDs use a random serial, so they can't be derived
 * from the domain — we do one bounded registry-tag scan, match the entered
 * domain, persist the results, then render them as normal rows (status + reclaim).
 *
 * A domain can have MORE than one note from the same wallet (e.g. two
 * registrations raced and only one was consumed). We show every match so the
 * stuck/reclaimable one is never hidden behind the consumed one.
 */
export function ReclaimDialog({ open, onOpenChange }: ReclaimDialogProps) {
  const { getSentRegistryNotes } = useMidenClient()
  const { address } = useWallet()
  const [domain, setDomain] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [results, setResults] = useState<StoredSentNote[]>([])

  const search = async () => {
    const target = normalizeDomain(domain)
    if (!target || !address) return

    setPhase('searching')
    setResults([])
    try {
      const found = await getSentRegistryNotes()
      const matches = found.filter(n => n.domain === target)
      if (matches.length === 0) {
        setPhase('not-found')
        return
      }
      const stored: StoredSentNote[] = matches.map(m => ({
        noteId: m.noteId,
        domain: m.domain,
        amount: m.amount.toString(),
        blockNumber: m.blockNum,
        timestamp: Date.now(),
      }))
      // Persist all so they show up instantly in Transactions next time.
      stored.forEach(s => addSentNote(address, s))
      setResults(stored)
      setPhase('found')
    } catch (e) {
      console.error('[reclaim-lookup] failed', e)
      setPhase('error')
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void search()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reclaim a registration</DialogTitle>
          <DialogDescription>
            Registered from another device and don't see it under Transactions? Enter the
            domain to look it up on-chain (scans the full registry history).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="e.g. alice"
              className="w-full rounded-md border bg-background px-3 py-2 pr-16 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              .miden
            </span>
          </div>
          <Button type="submit" disabled={!domain.trim() || phase === 'searching'}>
            {phase === 'searching' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Find
          </Button>
        </form>

        <div className="min-h-[3rem] space-y-2">
          {phase === 'searching' && (
            <p className="py-3 text-center text-sm text-muted-foreground">
              Scanning the registry…
            </p>
          )}
          {phase === 'found' && results.map(r => <NoteRow key={r.noteId} note={r} />)}
          {phase === 'not-found' && (
            <p className="py-3 text-center text-sm text-muted-foreground">
              No note from this wallet found for that domain.
            </p>
          )}
          {phase === 'error' && (
            <p className="py-3 text-center text-sm text-destructive">
              Lookup failed. Please try again.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
