import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from '@/components/theme-provider'
import { WalletProvider } from '@demox-labs/miden-wallet-adapter-react'
import { MidenWalletAdapter } from '@demox-labs/miden-wallet-adapter'
import { WalletModalProvider } from '@demox-labs/miden-wallet-adapter-reactui'
import '@demox-labs/miden-wallet-adapter-reactui/dist/styles.css'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { MidenClientProvider } from '@/contexts/MidenClientContext'

import Home from '@/pages/home/page'
// import Profile from '@/pages/profile/page'
// import About from '@/pages/about/page'
import Register from '@/pages/register/page'

const wallets = [new MidenWalletAdapter({ appName: 'Miden.ID' })]

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
      //   path: "profile",
      //   element: <Profile />
      // },
      // {
      //   path: "about",
      //   element: <About />
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
    //network={WalletAdapterNetwork.Testnet}
    //decryptPermission={DecryptPermission.UponRequest}
    //autoConnect={true}
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
