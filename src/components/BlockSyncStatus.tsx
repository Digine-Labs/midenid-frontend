import { useMidenClient } from '@/contexts/MidenClientContext';
import { SyncStatus } from '@/types/sync';
import { cn } from '@/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type StatusMeta = { dot: string; label: string; pulse: boolean; tooltip?: string };

// Dot colors reuse the toast theme tokens (defined in index.css for light/dark).
const STATUS_META: Record<SyncStatus, StatusMeta> = {
  [SyncStatus.Initializing]: {
    dot: 'bg-[hsl(var(--warning-border))]',
    label: 'Connecting…',
    pulse: true,
  },
  [SyncStatus.InitialSync]: {
    dot: 'bg-[hsl(var(--warning-border))]',
    label: 'Initial sync…',
    pulse: true,
  },
  [SyncStatus.Synced]: {
    dot: 'bg-[hsl(var(--success-border))]',
    label: 'Synced',
    pulse: false,
  },
  [SyncStatus.Error]: {
    dot: 'bg-[hsl(var(--destructive-border))]',
    label: 'Sync error',
    pulse: false,
    // Red tooltip (overrides the default bg-primary) to match the error dot.
    tooltip: 'bg-[hsl(var(--destructive-border))] text-white',
  },
};

/**
 * Passive block-sync indicator pinned to the bottom-right corner.
 * - 🟢 green: caught up to the chain tip  🟡 yellow: connecting / initial sync
 * - 🔴 red: sync error
 * Always shows the latest synced block number. State comes from `useMidenClient()`.
 */
export function BlockSyncStatus() {
  const { syncStatus, syncedBlock } = useMidenClient();
  const meta = STATUS_META[syncStatus];
  const blockLabel = syncedBlock != null ? String(syncedBlock) : '—';

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            role="status"
            aria-live="polite"
            aria-label={`Block sync: ${meta.label}, block ${blockLabel}`}
            className={cn(
              'fixed bottom-4 right-4 z-40 flex select-none items-center gap-2',
              'rounded-full border border-border bg-card/95 px-3 py-1.5 shadow-lg backdrop-blur',
              'text-xs font-medium text-card-foreground',
            )}
          >
            <span className="relative flex h-2.5 w-2.5">
              {meta.pulse && (
                <span
                  className={cn(
                    'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                    meta.dot,
                  )}
                />
              )}
              <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', meta.dot)} />
            </span>
            <span className="tabular-nums">{blockLabel}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className={meta.tooltip}>
          {meta.label}
          {syncedBlock != null && ` · block ${syncedBlock}`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default BlockSyncStatus;
