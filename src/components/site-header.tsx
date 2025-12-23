import { Menubar } from '@/components/ui/menubar'
import { Separator } from '@/components/ui/separator'
import { Link } from 'react-router'
import { MobileSidebar } from './mobile-sidebar'
import { WalletMultiButton } from '@demox-labs/miden-wallet-adapter-reactui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Github, Send } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'
import { useTheme } from './theme-provider'

export function SiteHeader() {
  const { resolvedTheme } = useTheme()
  const logoSrc = resolvedTheme === 'dark' ? '/images/alternate/8.png' : '/images/alternate/7.png'

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-background border-b">
      <Menubar className="h-14 w-full border-0 px-4 md:px-6">
        <div className="flex w-full items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center">
              <img
                src={logoSrc}
                alt="Miden.name"
                className="h-5 md:h-6"
              />
            </Link>
          </div>

          {/* Desktop Navigation & Wallet */}
          <div className="hidden md:flex items-center gap-4">
            <nav className="flex items-center gap-6">
              <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
                Home
              </Link>
              <div className="relative cursor-pointer text-sm font-medium text-gray-300 dark:text-gray-500">
                My Domains
                <span className="absolute -top-2 -right-4 text-[8px] font-semibold text-primary">
                  SOON
                </span>
              </div>
              <div className="relative cursor-pointer text-sm font-medium text-gray-300 dark:text-gray-500">
                Identity
                <span className="absolute -top-2 -right-4 text-[8px] font-semibold text-primary">
                  SOON
                </span>
              </div>
              <a href="https://docs.miden.name/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-primary transition-colors">
                Docs
              </a>
              <DropdownMenu>
                <DropdownMenuTrigger className="text-sm font-medium hover:text-primary transition-colors focus:outline-none">
                  Socials
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <a href="https://x.com/midenname" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                      <img
                        src="/icons/twitter.png"
                        alt="Twitter"
                        className="h-4 w-4"
                        style={{ filter: resolvedTheme === 'dark' ? 'invert(1)' : 'none' }}
                      />
                      <span>X / Twitter</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="https://discord.gg/CfWvRh9xCe" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                      <img
                        src="/icons/discord.png"
                        alt="Discord"
                        className="h-4 w-4"
                        style={{ filter: resolvedTheme === 'dark' ? 'invert(1)' : 'none' }}
                      />
                      <span>Discord</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="https://t.me/midenname" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                      <Send className="h-4 w-4" />
                      <span>Telegram</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="https://github.com/Digine-Labs" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                      <Github className="h-4 w-4" />
                      <span>GitHub</span>
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

            </nav>



            <Separator orientation="vertical" className="h-6" />
            <WalletMultiButton />

            <div className="flex items-center">
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile Menu */}
          <MobileSidebar />
        </div>
      </Menubar>
    </header >
  )
}

export default SiteHeader


