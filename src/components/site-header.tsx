import { Menubar } from '@/components/ui/menubar'
//import { ThemeToggle } from '@/components/theme-toggle'
import { WalletMultiButton  } from '@demox-labs/miden-wallet-adapter'

export function SiteHeader() {
  return (
    <header className="w-full border-b">
      <Menubar className="h-14 w-full border-0 px-4">
        <div className="flex w-full items-center justify-between">
          <div className="text-lg font-bold tracking-tight luckiest-guy-regular text-2xl">Miden.ID</div>
          <div className="flex items-center gap-2">
            {/*<ThemeToggle />*/}
            <WalletMultiButton />
          </div>
        </div>
      </Menubar>
    </header>
  )
}

export default SiteHeader


