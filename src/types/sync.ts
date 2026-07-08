export const SyncStatus = {
  /** Client is still booting (WASM init / IndexedDB open). */
  Initializing: 'initializing',
  /** Client is ready but the first successful sync of the session hasn't landed yet. */
  InitialSync: 'initial-sync',
  /** Most recent sync succeeded — local state is caught up to the chain tip. */
  Synced: 'synced',
  /** Client init failed, or syncs have failed past the tolerance threshold. */
  Error: 'error',
} as const;

export type SyncStatus = typeof SyncStatus[keyof typeof SyncStatus];
