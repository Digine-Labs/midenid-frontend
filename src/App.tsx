import SiteHeader from './components/SiteHeader'
import { Outlet } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import BlockSyncStatus from '@/components/BlockSyncStatus'

function App() {

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <SiteHeader />
      <div>
        <Outlet />
      </div>
      <Toaster />
      <BlockSyncStatus />
    </div>
  )
}

export default App
