// Para wallet imports — temporarily disabled (dependency issues)
// import { clientMutex } from '@/lib/clientMutex';
// import { NETWORK } from '@/lib/config';
import {
  TransactionType,
  useWallet,
} from '@miden-sdk/miden-wallet-adapter';
// import { useAccount, useLogout } from '@getpara/react-sdk-lite';
// import { useParaMiden } from '@miden-sdk/use-miden-para-react';
// import { ParaClientContext } from './ParaClientContext';
// import { AccountId, AccountInterface, NetworkId, TransactionRequest as TxRequest } from '@miden-sdk/miden-sdk';
// import { accountIdToBech32 } from '@/lib/midenClient';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import {
  type TransactionRequest,
  UnifiedWalletContext,
  type WalletType,
} from './UnifiedWalletContext';

interface UnifiedWalletProviderProps {
  readonly children: ReactNode;
}

export function UnifiedWalletProvider({ children }: UnifiedWalletProviderProps) {
  const midenWallet = useWallet();

  // Para hooks — temporarily disabled
  // const { isConnected: paraConnected } = useAccount();
  // const { logoutAsync } = useLogout();
  // const { client: paraMidenClient, accountId: paraMidenAccountId } = useParaMiden(NETWORK.rpcEndpoint);

  const [walletType, setWalletType] = useState<WalletType>(null);
  const midenConnected = midenWallet.connected;

  useEffect(() => {
    if (midenConnected && walletType !== 'miden') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWalletType('miden');
    } else if (!midenConnected && walletType !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWalletType(null);
    }
  }, [midenConnected, walletType]);

  const requestTransaction = useCallback(
    async (tx: TransactionRequest): Promise<string | undefined> => {
      if (walletType === 'miden') {
        if ('type' in tx && tx.type === TransactionType.Custom) {
          return midenWallet.requestTransaction?.({
            type: TransactionType.Custom,
            payload: tx.payload,
          });
        }
        return midenWallet.requestTransaction?.(tx as Parameters<NonNullable<typeof midenWallet.requestTransaction>>[0]);
      }
      // Para wallet transaction handling — temporarily disabled
      // } else if (walletType === 'para' && paraMidenClient && paraMidenAccountId) {
      //   return clientMutex.runExclusive(async () => {
      //     if ('type' in tx && tx.type === TransactionType.Custom) {
      //       const customTx = tx.payload as { transactionRequest: string };
      //       const txRequestBytes = Uint8Array.from(atob(customTx.transactionRequest), c => c.charCodeAt(0));
      //       const txRequest = TxRequest.deserialize(txRequestBytes);
      //       const accountId = AccountId.fromHex(paraMidenAccountId);
      //       const result = await paraMidenClient.transactions.submit(accountId, txRequest);
      //       return result.txId.toHex();
      //     }
      //     throw new Error('Unsupported transaction type for Para wallet');
      //   });
      // }
      return undefined;
    },
    [walletType, midenWallet],
  );

  const disconnect = useCallback(async () => {
    if (walletType === 'miden') {
      await midenWallet.disconnect?.();
    }
    // Para disconnect — temporarily disabled
    // } else if (walletType === 'para') {
    //   await logoutAsync();
    // }
    setWalletType(null);
  }, [walletType, midenWallet]);

  // Para account ID state — temporarily disabled
  // const [paraAccountIdObj, setParaAccountIdObj] = useState<AccountId | undefined>();
  // useEffect(() => {
  //   if (paraMidenAccountId && walletType === 'para') {
  //     try {
  //       setParaAccountIdObj(AccountId.fromHex(paraMidenAccountId));
  //     } catch (e) {
  //       console.error('Failed to parse Para Miden account ID:', e);
  //     }
  //   } else {
  //     setParaAccountIdObj(undefined);
  //   }
  // }, [paraMidenAccountId, walletType]);

  // Para address state — temporarily disabled
  // const [paraAddress, setParaAddress] = useState<string | null>(null);
  // useEffect(() => {
  //   if (paraAccountIdObj && walletType === 'para') {
  //     try {
  //       setParaAddress(paraAccountIdObj.toBech32(NetworkId.testnet(), AccountInterface.BasicWallet));
  //     } catch {
  //       try {
  //         setParaAddress(accountIdToBech32(paraAccountIdObj));
  //       } catch {
  //         setParaAddress(null);
  //       }
  //     }
  //   } else {
  //     setParaAddress(null);
  //   }
  // }, [paraAccountIdObj, walletType]);

  const value = useMemo(() => ({
    connected: midenConnected,
    connecting: midenWallet.connecting,
    walletType,
    address: midenWallet.address ?? null,
    accountId: undefined,
    requestTransaction,
    disconnect,
  }), [
    walletType,
    midenConnected,
    midenWallet.connecting,
    midenWallet.address,
    requestTransaction,
    disconnect,
  ]);

  // Para client context — temporarily disabled
  // const paraClientValue = walletType === 'para' ? (paraMidenClient ?? undefined) : undefined;

  return (
    <UnifiedWalletContext.Provider value={value}>
      {/* Para client context wrapper — temporarily disabled */}
      {/* <ParaClientContext.Provider value={paraClientValue}> */}
      {children}
      {/* </ParaClientContext.Provider> */}
    </UnifiedWalletContext.Provider>
  );
}
