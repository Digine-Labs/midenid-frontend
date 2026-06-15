import { useState } from 'react'
import { useWallet, useWalletModal, WalletMultiButton } from '@miden-sdk/miden-wallet-adapter'
import { CircleUser, User, Globe, Receipt, Undo2, Copy, Check, RefreshCw, LogOut } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TransactionsDialog } from './TransactionsDialog'
import { ReclaimDialog } from './ReclaimDialog'

/**
 * Single merged wallet menu: replaces both the SDK's `WalletMultiButton`
 * (connected state) and our old profile menu. The connect flow is left to the
 * SDK (`WalletMultiButton`) when disconnected; the connected button + dropdown is
 * ours. The wallet actions just call SDK functions — Copy (clipboard), Change
 * wallet (`useWalletModal().setVisible`), Disconnect (`useWallet().disconnect`).
 */
export function WalletMenu() {
  const { connected, address, disconnect } = useWallet()
  const { setVisible } = useWalletModal()
  const [showTransactions, setShowTransactions] = useState(false)
  const [showReclaim, setShowReclaim] = useState(false)
  const [copied, setCopied] = useState(false)

  // Disconnected (or wallet not yet selected): let the SDK handle connect.
  if (!connected || !address) return <WalletMultiButton />

  const underscoreIndex = address.indexOf('_')
  const shortAddress =
    underscoreIndex > 4
      ? `${address.slice(0, 6)}…${address.slice(underscoreIndex - 4, underscoreIndex)}`
      : address

  const copyAddress = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // clipboard may be unavailable; non-fatal
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus:outline-none"
            aria-label="Wallet menu"
          >
            <CircleUser className="h-5 w-5 text-muted-foreground" />
            <span className="font-mono">{shortAddress}</span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center justify-between gap-2">
            <span className="truncate font-mono text-xs text-muted-foreground">
              {shortAddress}
            </span>
            <button
              onClick={copyAddress}
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus:outline-none"
              aria-label="Copy address"
              title={copied ? 'Copied' : 'Copy address'}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="bg-border" />

          {/* Profile & My Domains: coming soon — disabled, styled like the
              old header "My Domains" link (muted text + primary SOON badge). */}
          <DropdownMenuItem
            disabled
            className="flex items-center gap-2 text-gray-300 dark:text-gray-500 data-[disabled]:opacity-100"
          >
            <User className="h-4 w-4" />
            <span className="relative">
              Profile
              <span className="absolute -top-2 -right-4 text-[8px] font-semibold text-primary">
                SOON
              </span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled
            className="flex items-center gap-2 text-gray-300 dark:text-gray-500 data-[disabled]:opacity-100"
          >
            <Globe className="h-4 w-4" />
            <span className="relative">
              My Domains
              <span className="absolute -top-2 -right-4 text-[8px] font-semibold text-primary">
                SOON
              </span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-2"
            onClick={() => setShowTransactions(true)}
          >
            <Receipt className="h-4 w-4" />
            <span>Transactions</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-2"
            onClick={() => setShowReclaim(true)}
          >
            <Undo2 className="h-4 w-4" />
            <span>Reclaim</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-border" />

          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-2"
            onClick={() => setVisible(true)}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Change wallet</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-2 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
            onClick={() => void disconnect()}
          >
            <LogOut className="h-4 w-4" />
            <span>Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TransactionsDialog open={showTransactions} onOpenChange={setShowTransactions} />
      <ReclaimDialog open={showReclaim} onOpenChange={setShowReclaim} />
    </>
  )
}
