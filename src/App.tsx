import SiteHeader from './components/SiteHeader'
import { Outlet } from 'react-router'
import { Toaster } from '@/components/ui/sonner'

function App() {

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
