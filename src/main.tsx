import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from '@/components/ThemeProvider.tsx'
import { WalletProvider } from '@demox-labs/miden-wallet-adapter-react'
import { MidenWalletAdapter } from '@demox-labs/miden-wallet-adapter-miden'
import { WalletModalProvider } from '@demox-labs/miden-wallet-adapter-reactui'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { Loader2 } from 'lucide-react'

const Home = lazy(() => import('@/pages/home/page'))
// const Identity = lazy(() => import('./pages/identity/page.tsx'))
// const MyDomains = lazy(() => import('./pages/my-domains/page.tsx'))
const NotFound = lazy(() => import('./pages/not-found/page.tsx'))

// Dashboard pages (separate auth system)
const DashboardLayout = lazy(() => import('@/pages/dashboard/layout'))
const DashboardLogin = lazy(() => import('@/pages/dashboard/login/page'))
const Dashboard = lazy(() => import('@/pages/dashboard/page'))

const PageLoader = () => (
  <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 56px)' }}>
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      // {
      //   path: "identity",
      //   element: (
      //     <Suspense fallback={<PageLoader />}>
      //       <Identity />
      //     </Suspense>
      //   )
      // },
      // {
      //   path: "my-domains",
      //   element: (
      //     <Suspense fallback={<PageLoader />}>
      //       <MyDomains />
      //     </Suspense>
      //   )
      // },
      {
        path: "*",
        element: (
          <Suspense fallback={<PageLoader />}>
            <NotFound />
          </Suspense>
        )
      }
    ]
  },
  // Dashboard routes (separate from wallet-based auth)
  {
    path: "/dashboard",
    element: (
      <Suspense fallback={<PageLoader />}>
        <DashboardLayout />
      </Suspense>
    ),
    children: [
      {
        path: "login",
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardLogin />
          </Suspense>
        )
      },
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <Dashboard />
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
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </WalletModalProvider>
    </WalletProvider>
  </StrictMode>,
)
