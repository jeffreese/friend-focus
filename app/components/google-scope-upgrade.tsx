import { ShieldCheck } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

interface GoogleScopeUpgradeProps {
  open: boolean
  onCancel: () => void
  callbackURL?: string
}

export function GoogleScopeUpgrade({
  open,
  onCancel,
  callbackURL = '/profile',
}: GoogleScopeUpgradeProps) {
  function handleUpgrade() {
    window.location.href = `/api/google-scope-upgrade?callbackURL=${encodeURIComponent(callbackURL)}`
  }

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-primary" />
            Additional Permission Required
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            To update your Google Contacts from Friend Focus, we need additional
            permission. This upgrades your connection from{' '}
            <span className="font-medium text-foreground">read-only</span> to{' '}
            <span className="font-medium text-foreground">read and write</span>{' '}
            access.
          </p>

          <p className="text-sm text-muted-foreground">
            You&apos;ll be redirected to Google to approve this change.
          </p>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleUpgrade}>Upgrade Permission</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
