import { Menubar } from '@/components/ui/menubar'
import { Separator } from '@/components/ui/separator'
import { Link } from 'react-router'
import { MobileSidebar } from './mobile-sidebar'
import { WalletMultiButton } from '@demox-labs/miden-wallet-adapter'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Github, Send, X, MessageCircle } from 'lucide-react'

export function SiteHeader() {
  return (
    <header className="fixed top-0 left-0 w-full z-50" style={{ background: 'linear-gradient(180deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)' }}>
      <Menubar className="h-14 w-full border-0 px-4 md:px-6">
        <div className="flex w-full items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-lg font-bold md:tracking-tight text-xl md:text-2xl text-white hover:text-primary transition-colors">
            Miden.name
          </Link>

          {/* Desktop Navigation & Wallet */}
          <div className="hidden md:flex items-center gap-4">
            <nav className="flex items-center gap-6">
              <Link to="/" className="text-sm font-medium text-white hover:text-primary transition-colors">
                Home
              </Link>
              <a href="https://docs.miden.name/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white hover:text-primary transition-colors">
                Docs
              </a>
              <DropdownMenu>
                <DropdownMenuTrigger className="text-sm font-medium text-white hover:text-primary transition-colors focus:outline-none">
                  Socials
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <a href="https://github.com/Digine-Labs" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                      <Github className="h-4 w-4" />
                      <span>GitHub</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="https://t.me/midenname" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                      <Send className="h-4 w-4" />
                      <span>Telegram</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="https://x.com/midenname" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                      <img src="/icons/twitter.png" alt="Twitter" className="h-4 w-4" />
                      <span>X / Twitter</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="https://discord.gg/CfWvRh9xCe" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                      <img src="/icons/discord.png" alt="Discord" className="h-4 w-4" />
                      <span>Discord</span>
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="cursor-pointer text-sm font-medium text-gray-300">Identity - Coming Soon</p>
            </nav>

            <Separator orientation="vertical" className="h-6 w-[2px]" />

            <WalletMultiButton />
          </div>

          {/* Mobile Menu */}
          <MobileSidebar />
        </div>
      </Menubar>
    </header>
  )
}

export default SiteHeader


