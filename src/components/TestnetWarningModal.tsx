import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function TestnetWarningModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(true)
  }, [])

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="sm:max-w-md max-w-[90vw] z-[10002] fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]">
        <DialogHeader>
          <DialogTitle>Testnet Warning</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2">
              <div>
                This project is currently running on the Miden testnet. All transactions and data generated here are for testing purposes only and do not represent real value. As the Miden Blockchain network is still in its testnet phase, occasional disruptions or delays in network responses may occur due to ongoing technical issues. Please keep this in mind while using the application.
              </div>
              <div className="font-semibold">
                Important: Names registered on the testnet may be wiped out during maintenance or new deployments. Registration on testnet does not guarantee name availability or ownership on mainnet.
              </div>
              <div className="font-semibold text-red-600">
                Heads up: the Miden browser wallet is being deprecated. The Bread wallet is not supported yet — we'll make an announcement once it's ready. For now, Miden Name registration works only with a guardian account secured by OpenZeppelin, or a local wallet.
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Close</Button>
          {/* <Button onClick={handleDontShowAgain}>Don't Show Again</Button> */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}