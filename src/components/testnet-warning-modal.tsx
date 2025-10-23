import { useState, useEffect } from 'react'
import {
  AlertDialog,
  //  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
// import { Button } from '@/components/ui/button'

export function TestnetWarningModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Check if user chose to not show warning again
    // const dontShowAgain = localStorage.getItem('testnetWarningDontShow')
    // if (dontShowAgain !== 'true') {
    //   setOpen(true)
    // }
    setOpen(true)
  }, [])

  const handleClose = () => {
    setOpen(false)
  }

  // const handleDontShowAgain = () => {
  //   localStorage.setItem('testnetWarningDontShow', 'true')
  //   setOpen(false)
  // }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Testnet Warning</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              This project is currently running on the Miden testnet. All transactions and data generated here are for testing purposes only and do not represent real value. As the Miden Blockchain network is still in its testnet phase, occasional disruptions or delays in network responses may occur due to ongoing technical issues. Please keep this in mind while using the application.            </p>
            <p className="font-semibold">
              Important: Names registered on the testnet may be wiped out during maintenance or new deployments. Registration on testnet does not guarantee name availability or ownership on mainnet.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>Close</AlertDialogCancel>
          {/* <AlertDialogAction asChild>
            <Button onClick={handleDontShowAgain}>Don't Show Again</Button>
          </AlertDialogAction> */}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}