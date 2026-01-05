import { WebClient, AccountId } from '@demox-labs/miden-sdk';

/**
 * Lazy-initialized singleton class for managing Miden WebClient
 *
 * Features:
 * - True singleton pattern (module-level, not context-based)
 * - Lazy initialization (client created on first use, not on app start)
 * - Promise-based async API
 * - Automatic duplicate prevention for account imports
 * - Non-blocking startup (app can start before client is ready)
 */
class MidenClientSingleton {
  // Singleton instance
  private static instance: MidenClientSingleton | null = null;

  // WebClient instance (lazy-initialized)
  private client: WebClient | null = null;

  // Initialization promise (prevents concurrent initialization)
  private initPromise: Promise<WebClient> | null = null;

  // State flags
  private isInitializing: boolean = false;

  // Imported accounts tracking (prevents duplicates)
  private importedAccounts: Set<string> = new Set();

  // Error state
  private lastError: Error | null = null;

  // RPC endpoint
  private readonly nodeEndpoint = 'https://rpc.testnet.miden.io';

  // Private constructor (singleton pattern)
  private constructor() {}

  /**
   * Get singleton instance
   * This is the only way to access the singleton
   */
  public static getInstance(): MidenClientSingleton {
    if (!MidenClientSingleton.instance) {
      MidenClientSingleton.instance = new MidenClientSingleton();
    }
    return MidenClientSingleton.instance;
  }

  /**
   * Get WebClient instance (async)
   * Lazy-initializes the client on first call
   * Returns the same promise for concurrent calls
   *
   * @returns Promise<WebClient> - The initialized WebClient
   * @throws Error if initialization fails
   */
  public async getClient(): Promise<WebClient> {
    // If already initialized, return immediately
    if (this.client) {
      return this.client;
    }

    // If initialization is in progress, wait for it
    if (this.initPromise) {
      return this.initPromise;
    }

    // Otherwise, start initialization
    return this.initialize();
  }

  /**
   * Get WebClient instance (sync)
   * Returns null if not yet initialized
   * Useful for optional rendering without waiting
   *
   * @returns WebClient | null
   */
  public getClientSync(): WebClient | null {
    return this.client;
  }

  /**
   * Initialize WebClient
   * Handles IndexedDB errors with automatic retry
   *
   * @private
   * @returns Promise<WebClient>
   */
  private async initialize(): Promise<WebClient> {
    this.isInitializing = true;
    this.lastError = null;

    // Store promise to prevent concurrent initialization
    this.initPromise = (async () => {
      try {
        // Create WebClient
        const newClient = await WebClient.createClient(this.nodeEndpoint);

        // Initial sync
        await newClient.syncState();

        this.client = newClient;
        this.isInitializing = false;

        return newClient;
      } catch (error) {
        // Handle IndexedDB schema errors
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (
          errorMsg.includes('Indexdb') ||
          errorMsg.includes('WebStore') ||
          errorMsg.includes('primary key')
        ) {
          // Clear IndexedDB and retry
          await this.clearIndexedDB();

          const newClient = await WebClient.createClient(this.nodeEndpoint);
          await newClient.syncState();

          this.client = newClient;
          this.isInitializing = false;

          return newClient;
        }

        // Non-recoverable error
        this.lastError = error as Error;
        this.isInitializing = false;
        throw error;
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  /**
   * Import account into the client
   * Automatically prevents duplicate imports
   * Safe to call multiple times with same account
   *
   * @param accountId - Account to import
   * @returns Promise<void>
   */
  public async importAccount(accountId: AccountId): Promise<void> {
    // Ensure client is initialized
    const client = await this.getClient();

    const accountKey = accountId.toString();

    // Skip if already imported
    if (this.importedAccounts.has(accountKey)) {
      return;
    }

    // Check if account already exists in client
    const existingAccount = await client.getAccount(accountId);
    if (!existingAccount) {
      try {
        await client.importAccountById(accountId);
      } catch (err) {
        // Account may not exist on chain or already imported
        // Log warning but don't throw (non-fatal)
        console.warn(`Failed to import account ${accountKey}:`, err);
      }
    }

    // Mark as imported
    this.importedAccounts.add(accountKey);
  }

  /**
   * Disconnect and cleanup
   * Terminates the client and resets all state
   * Call this on logout or wallet disconnect
   *
   * @returns Promise<void>
   */
  public async disconnect(): Promise<void> {
    if (this.client) {
      try {
        this.client.terminate();
      } catch (err) {
        console.error('Error terminating client:', err);
      }
    }

    this.client = null;
    this.initPromise = null;
    this.isInitializing = false;
    this.importedAccounts.clear();
    this.lastError = null;
  }

  /**
   * Check if client is ready
   * @returns boolean
   */
  public isReady(): boolean {
    return this.client !== null && !this.isInitializing;
  }

  /**
   * Get last error (if any)
   * @returns Error | null
   */
  public getError(): Error | null {
    return this.lastError;
  }

  /**
   * Clear Miden IndexedDB databases
   * Used for error recovery
   *
   * @private
   * @returns Promise<void>
   */
  private async clearIndexedDB(): Promise<void> {
    const databases = await indexedDB.databases();
    for (const db of databases) {
      if (db.name && (db.name.includes('miden') || db.name.includes('Miden'))) {
        indexedDB.deleteDatabase(db.name);
      }
    }
    // Wait a bit for cleanup
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * Get the MidenClient singleton instance
 * This is the primary export - use this in your components
 *
 * @example
 * ```typescript
 * import { getMidenClient } from '@/lib/MidenClientSingleton';
 *
 * const clientSingleton = getMidenClient();
 * await clientSingleton.importAccount(accountId);
 * const client = await clientSingleton.getClient();
 * ```
 */
export const getMidenClient = () => MidenClientSingleton.getInstance();
