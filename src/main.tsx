import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from '@/components/ThemeProvider.tsx'
import { WalletProvider } from '@demox-labs/miden-wallet-adapter-react'
import { MidenWalletAdapter } from '@demox-labs/miden-wallet-adapter-miden'
import { WalletModalProvider } from '@demox-labs/miden-wallet-adapter-reactui'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { WalletAccountProvider } from '@/contexts/WalletAccountContext'

const Home = lazy(() => import('@/pages/home/page'))
const Identity = lazy(() => import('./pages/identity/page.tsx'))
const MyDomains = lazy(() => import('./pages/my-domains/page.tsx'))
const NotFound = lazy(() => import('./pages/not-found/page.tsx'))

const PageLoader = () => (
  <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 56px)' }}>
    <div className="text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
      </div>
    </div>
  </div>
)

const wallets = [new MidenWalletAdapter({ appName: 'Miden.name' })]

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <Home />
          </Suspense>
        )
      },
      {
        path: "identity",
        element: (
          <Suspense fallback={<PageLoader />}>
            <Identity />
          </Suspense>
        )
      },
      {
        path: "my-domains",
        element: (
          <Suspense fallback={<PageLoader />}>
            <MyDomains />
          </Suspense>
        )
      },
      {
        path: "*",
        element: (
          <Suspense fallback={<PageLoader />}>
            <NotFound />
          </Suspense>
        )
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
        <WalletAccountProvider>
          <ThemeProvider>
            <RouterProvider router={router} />
          </ThemeProvider>
        </WalletAccountProvider>
      </WalletModalProvider>
    </WalletProvider>
  </StrictMode>,
)
