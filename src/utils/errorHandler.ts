import { ErrorCodes } from '@/types/errors';

/**
 * Wrapper function to execute operations with automatic error tracking and logging
 *
 * @param stepCode - Unique error code for this operation (e.g., ErrorCodes.CLIENT_INIT_FAILED)
 * @param stepName - Human-readable name of the operation (e.g., "Client initialization")
 * @param operation - The async or sync operation to execute
 * @returns The result of the operation
 * @throws Error with code prefix if the operation fails
 *
 * @example
 * const client = await executeStep(
 *   ErrorCodes.CLIENT_INIT_FAILED,
 *   'Client initialization',
 *   () => instantiateClient({ accountsToImport: [] })
 * );
 */
export async function executeStep<T>(
  stepCode: ErrorCodes,
  stepName: string,
  operation: () => T | Promise<T>
): Promise<T> {
  try {
    const result = await operation();
    return result;
  } catch (error) {
    console.error(`[${stepCode}] Failed: ${stepName}`, error);

    // Create a new error with the code in the message
    const errorMessage = `[${stepCode}] ${stepName} failed`;
    const wrappedError = new Error(errorMessage);

    // Attach original error details
    (wrappedError as any).code = stepCode;
    (wrappedError as any).originalError = error;

    throw wrappedError;
  }
}
