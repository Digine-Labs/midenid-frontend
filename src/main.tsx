import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from '@/components/theme-provider'
import { WalletProvider } from '@demox-labs/miden-wallet-adapter-react'
import { MidenWalletAdapter } from '@demox-labs/miden-wallet-adapter'
import { WalletModalProvider } from '@demox-labs/miden-wallet-adapter-reactui'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { MidenClientProvider } from '@/contexts/MidenClientContext'

import Home from '@/pages/home/page'
import Register from '@/pages/register/page'

const wallets = [new MidenWalletAdapter({ appName: 'Miden.name' })]

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />
      },
      // {
      //   path: "identity",
      //   element: <Identity />
      // },
      {
        path: "register",
        element: <Register />
      }
    ]
  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WalletProvider
      wallets={wallets}
    >
      <WalletModalProvider>
        <MidenClientProvider>
          <ThemeProvider>
            <RouterProvider router={router} />
          </ThemeProvider>
        </MidenClientProvider>
      </WalletModalProvider>
    </WalletProvider>
  </StrictMode>,
)
