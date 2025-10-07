import { Menubar } from '@/components/ui/menubar'
import { Separator } from '@/components/ui/separator'
//import { ThemeToggle } from '@/components/theme-toggle'
import { Link } from 'react-router'
import { MobileSidebar } from './mobile-sidebar'
import { ConnectWallet } from './connectWallet'

export function SiteHeader() {
  return (
    <header className="fixed top-0 left-0 w-full border-b bg-background/80 backdrop-blur-sm z-50">
      <Menubar className="h-14 w-full border-0 px-4 md:px-6">
        <div className="flex w-full items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-lg font-bold tracking-tight luckiest-guy-regular text-xl md:text-2xl hover:text-primary transition-colors">
            Miden.ID
          </Link>

          {/* Desktop Navigation & Wallet */}
          <div className="hidden md:flex items-center gap-4">
            <nav className="flex items-center gap-6">
              <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
                Home
              </Link>
              <a href="https://docs.miden.name/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-primary transition-colors">
                Docs
              </a>
              {/* <Link to="/profile" className="text-sm font-medium hover:text-primary transition-colors">
                Profile
              </Link> */}
              <p className="cursor-pointer text-sm font-medium text-gray-400">Identity - Coming Soon</p>
              {/* <Link to="/about" className="text-sm font-medium hover:text-primary transition-colors">
                About
              </Link> */}
            </nav>

            <Separator orientation="vertical" className="h-6 w-[2px]" />

            <ConnectWallet />
          </div>

          {/* Mobile Menu */}
          <MobileSidebar />
        </div>
      </Menubar>
    </header>
  )
}

export default SiteHeader


