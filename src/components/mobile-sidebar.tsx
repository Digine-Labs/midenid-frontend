import { Link } from 'react-router'
import { Menu, Github, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { WalletMultiButton } from '@demox-labs/miden-wallet-adapter'
import { Separator } from '@/components/ui/separator'
import { useTheme } from './theme-provider'
import ThemeToggle from './theme-toggle'

export function MobileSidebar() {
  const { resolvedTheme } = useTheme()
  return (

    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Toggle menu"
        >
          <Menu size={30} />
        </Button>

      </SheetTrigger>

      <SheetContent side="right" className="w-80 md:hidden flex flex-col h-full pt-10 justify-between">
        <div>
          {/* Navigation */}
          <nav className="flex flex-col mt-8 space-y-4">
            <SheetClose asChild>
              <Link
                to="/"
                className="text-base font-medium hover:text-primary transition-colors py-2 px-3 rounded-md hover:bg-accent"
              >
                Home
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link
                to="/my-domains"
                className="text-base font-medium hover:text-primary transition-colors py-2 px-3 rounded-md hover:bg-accent"
              >
                My Domains
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <a
                href="https://docs.miden.name/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-medium hover:text-primary transition-colors py-2 px-3 rounded-md hover:bg-accent"
              >
                Docs
              </a>
            </SheetClose>
            <p className="cursor-pointer text-base font-medium py-2 px-3 rounded-md text-gray-400">Identity - Coming Soon</p>
          </nav>

          {/* Wallet button */}
          <div className="py-2 px-3 relative mt-6">
            <SheetClose asChild>
              <div>
                <WalletMultiButton />
              </div>
            </SheetClose>
          </div>

          {/* Theme Toggle */}
          <div className="py-2 px-3 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </div>



        {/* Social Media Icons */}
        <div className="pb-6 px-3">
          <Separator className="mb-4" />
          <p className="text-sm font-medium text-muted-foreground mb-3">Follow Us</p>
          <div className="flex items-center gap-4">
            <a
              href="https://twitter.com/diginelabs"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="Twitter"
            >
              <img src="/icons/twitter.png" alt="Twitter" className="h-5 w-5" style={{ filter: resolvedTheme === 'dark' ? 'invert(1)' : 'none' }} />
            </a>
            <a
              href="https://discord.gg/diginelabs"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="Discord"
            >
              <img src="/icons/discord.png" alt="Discord" className="h-5 w-5" style={{ filter: resolvedTheme === 'dark' ? 'invert(1)' : 'none' }} />
            </a>
            <a
              href="https://t.me/diginelabs"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="Telegram"
            >
              <Send className="h-5 w-5" />
            </a>
            <a
              href="https://github.com/Digine-Labs"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}