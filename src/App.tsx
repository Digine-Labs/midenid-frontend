import { lazy, Suspense, useMemo } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import { Loader2 } from "lucide-react";
import {
  MidenWalletAdapter,
  WalletModalProvider,
  WalletProvider,
} from "@miden-sdk/miden-wallet-adapter";
import { ThemeProvider } from "@/components/ThemeProvider";
// import { ParaProviderWrapper } from '@/providers/ParaProviderWrapper'
// import { UnifiedWalletProvider } from "@/providers/UnifiedWalletProvider";
// import { MidenNameProvider } from "@/providers/MidenNameProvider";
import AppLayout from "@/components/AppLayout";

const Home = lazy(() => import("@/pages/home/page"));
// const Identity = lazy(() => import('@/pages/identity/page'))
// const MyDomains = lazy(() => import('@/pages/my-domains/page'))
const NotFound = lazy(() => import("@/pages/not-found/page"));

const PageLoader = () => (
  <div
    className="flex items-center justify-center"
    style={{ minHeight: "calc(100vh - 56px)" }}
  >
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <Home />
          </Suspense>
        ),
      },
      // {
      //   path: 'identity',
      //   element: (
      //     <Suspense fallback={<PageLoader />}>
      //       <Identity />
      //     </Suspense>
      //   ),
      // },
      // {
      //   path: 'my-domains',
      //   element: (
      //     <Suspense fallback={<PageLoader />}>
      //       <MyDomains />
      //     </Suspense>
      //   ),
      // },
      {
        path: "*",
        element: (
          <Suspense fallback={<PageLoader />}>
            <NotFound />
          </Suspense>
        ),
      },
    ],
  },
]);

function App() {
  const wallets = useMemo(
    () => [new MidenWalletAdapter({ appName: "Miden.name" })],
    [],
  );

  return (
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        {/* <UnifiedWalletProvider>
          <MidenNameProvider> */}
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
        {/* </MidenNameProvider>
        </UnifiedWalletProvider> */}
      </WalletModalProvider>
    </WalletProvider>
  );
}

export default App;
