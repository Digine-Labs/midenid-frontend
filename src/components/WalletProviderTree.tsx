import {
  WalletProvider,
  WalletModalProvider,
  MidenWalletAdapter,
} from '@miden-sdk/miden-wallet-adapter'
import type { ReactNode } from 'react'

const wallets = [new MidenWalletAdapter({ appName: 'Miden.name' })]

export function WalletProviderTree({ children }: { children: ReactNode }) {
  return (
    <WalletProvider wallets={wallets}>
      <WalletModalProvider>
        {children}
      </WalletModalProvider>
    </WalletProvider>
  )
}
