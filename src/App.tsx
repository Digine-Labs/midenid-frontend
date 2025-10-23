
// import { useEffect, useState } from 'react'
import SiteHeader from './components/site-header'
import { Outlet } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
// import { toast } from 'sonner'
// import { useWalletAccount } from '@/contexts/WalletAccountContext'
// import { AlertCircle } from 'lucide-react'

function App() {
  // const { hasRegisteredDomain, isLoading } = useWalletAccount()
  // const [hasShownToast, setHasShownToast] = useState(false)

  // // Show toast once when wallet connects without a registered domain
  // useEffect(() => {
  //   // Don't show toast if we're still loading or if we've already shown it
  //   if (isLoading || hasShownToast) return

  //   // Show toast if wallet has no registered domain
  //   if (hasRegisteredDomain === true && !isLoading) {
  //     toast.warning('A Domain is registered to this wallet.', {
  //       description: 'You can have only 1 domain per wallet account.',
  //       icon: <AlertCircle className="h-5 w-5" />,
  //       duration: 5000,
  //       style: {
  //         background: "hsl(var(--destructive-bg))",
  //         borderColor: "hsl(var(--destructive-border))",
  //         color: "hsl(var(--destructive-text))",
  //       },
  //       classNames: {
  //         title: 'font-bold',
  //         description: 'font-semibold',
  //       },
  //     })
  //     setHasShownToast(true)
  //   }
  // }, [hasRegisteredDomain, isLoading, hasShownToast])

  // Reset toast flag when domain status changes
  // useEffect(() => {
  //   if (hasRegisteredDomain) {
  //     setHasShownToast(false)
  //   }
  // }, [hasRegisteredDomain])

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <SiteHeader />
      <div>
        <Outlet />
      </div>
      <Toaster />
    </div>
  )
}

export default App
