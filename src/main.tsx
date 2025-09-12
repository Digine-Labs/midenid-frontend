import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from '@/components/theme-provider'
import { WalletProvider, WalletModalProvider, MidenWalletAdapter, WalletAdapterNetwork, DecryptPermission } from '@demox-labs/miden-wallet-adapter'
import '@demox-labs/miden-wallet-adapter-reactui/dist/styles.css'

const wallets = [new MidenWalletAdapter({ appName: 'Miden.ID' })]

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WalletProvider
      wallets={wallets}
      //network={WalletAdapterNetwork.Testnet}
      //decryptPermission={DecryptPermission.UponRequest}
      //autoConnect={true}
    >
      <WalletModalProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </WalletModalProvider>
    </WalletProvider>
  </StrictMode>,
)
