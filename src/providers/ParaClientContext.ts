// Para wallet integration — temporarily disabled (dependency issues)
// To re-enable: uncomment below and restore Para deps in package.json

// import type { MidenClient } from '@miden-sdk/miden-sdk';
// import { createContext, useContext } from 'react';

// /**
//  * Internal context for Para wallet's Miden client.
//  *
//  * Kept separate from UnifiedWalletContext so that MidenNameProvider
//  * can access the Para client directly (with proper mutex locking).
//  * Do not use this context outside of MidenNameProvider.
//  */
// export const ParaClientContext = createContext<MidenClient | undefined>(undefined);

// /** Internal hook for MidenNameProvider to access the Para client. */
// export function useParaClient(): MidenClient | undefined {
//   return useContext(ParaClientContext);
// }
