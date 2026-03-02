import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { authClient } from '~/lib/auth.client'

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade() {
    setLoading(true)
    setError(null)

    try {
      await authClient.linkSocial({
        provider: 'google',
        callbackURL,
        scopes: ['https://www.googleapis.com/auth/contacts'],
      })
    } catch {
      setError('Failed to start permission upgrade. Please try again.')
      setLoading(false)
    }
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

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleUpgrade} disabled={loading}>
            {loading ? 'Redirecting...' : 'Upgrade Permission'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
