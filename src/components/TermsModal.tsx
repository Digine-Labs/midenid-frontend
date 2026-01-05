import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
  DialogPortal,
} from '@/components/ui/dialog'

interface TermsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TermsModal({ open, onOpenChange }: TermsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay
          className="z-[10001]"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        />
        <DialogContent
          className="sm:max-w-md max-w-[90vw] z-[10002] fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>Terms and Conditions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <p className="text-sm text-muted-foreground">
              By checking this box, you agree to our terms of service and privacy policy.
              You acknowledge that you understand the domain registration process and associated costs.
            </p>
            <p className="text-sm text-muted-foreground">
              This is a testnet environment for demonstration purposes. All transactions are executed on the Miden testnet.
            </p>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
