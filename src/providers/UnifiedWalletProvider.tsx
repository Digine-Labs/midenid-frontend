import { useWallet } from "@miden-sdk/miden-wallet-adapter";
import { useAccount, useLogout } from '@getpara/react-sdk-lite';
import { useParaMiden } from '@miden-sdk/use-miden-para-react';
import { useEffect, useState, type ReactNode } from "react";
import { NETWORK } from "@/lib/config";
import {
  type TransactionRequest as _TransactionRequest,
  UnifiedWalletContext as _UnifiedWalletContext,
  type WalletType,
} from './UnifiedWalletContext';

interface UnifiedWalletProviderProps {
  readonly children: ReactNode;
}

export function UnifiedWalletProvider({ children: _children }: UnifiedWalletProviderProps) {
    const midenWallet = useWallet();

    const { isConnected: paraConnected } = useAccount();
    const { logoutAsync: _logoutAsync } = useLogout();

    const {
        client: _paraMidenClient,
        accountId: _paraMiddenAccountId,
    } = useParaMiden(NETWORK.rpcEndpoint);

    const [walletType, setWalletType] = useState<WalletType>(null);

    const midenConnected = midenWallet.connected;

    useEffect(() => {
        if (midenConnected && walletType !== 'miden') {
        setWalletType('miden');
        } else if (paraConnected && !midenConnected && walletType !== 'para') {
        setWalletType('para');
        } else if (!midenConnected && !paraConnected && walletType !== null) {
        setWalletType(null);
        }
    }, [midenConnected, paraConnected, walletType]);
}