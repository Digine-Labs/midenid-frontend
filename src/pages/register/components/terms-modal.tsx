import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'

interface TermsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TermsModal({ open, onOpenChange }: TermsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Terms and Conditions</DialogTitle>
          <DialogClose />
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            By checking this box, you agree to our terms of service and privacy policy.
            You acknowledge that you understand the domain registration process and associated costs.
          </p>
          <p className="text-sm text-muted-foreground">
            This is a testnet environment for demonstration purposes. All transactions are executed on the Miden testnet.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
