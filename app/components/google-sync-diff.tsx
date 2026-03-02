import { ArrowRight, Info, Upload, X } from 'lucide-react'
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
import { Select } from '~/components/ui/select'
import type { FieldDiff } from '~/lib/google-contacts-sync.server'

// ─── Sync Diff Banner ──────────────────────────────────────────────────────

interface SyncDiffBannerProps {
  friendName: string
  diffCount: number
  onReview: () => void
  onDismiss: () => void
}

export function SyncDiffBanner({
  friendName,
  diffCount,
  onReview,
  onDismiss,
}: SyncDiffBannerProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 mb-4">
      <div className="flex items-center gap-2 text-sm">
        <Info size={16} className="text-primary shrink-0" />
        <span>
          Google has{' '}
          <span className="font-medium">
            {diffCount} {diffCount === 1 ? 'change' : 'changes'}
          </span>{' '}
          for {friendName}.
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" onClick={onReview}>
          Review Changes
        </Button>
        <button
          type="button"
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground p-1"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── Sync Diff Dialog ──────────────────────────────────────────────────────

type ResolutionAction = 'use-google' | 'keep-app' | 'push-to-google' | 'skip'

interface Resolution {
  field: string
  action: ResolutionAction
  value?: string
}

interface SyncDiffDialogProps {
  open: boolean
  friendName: string
  diffs: FieldDiff[]
  hasGoogleWrite?: boolean
  onApply: (resolutions: Resolution[]) => void
  onCancel: () => void
}

export function SyncDiffDialog({
  open,
  friendName,
  diffs,
  hasGoogleWrite,
  onApply,
  onCancel,
}: SyncDiffDialogProps) {
  const [resolutions, setResolutions] = useState<Map<string, Resolution>>(
    () => {
      const map = new Map<string, Resolution>()
      for (const diff of diffs) {
        // Default: favor whichever side has data
        // - We're empty, Google has data → use Google's
        // - Google is empty, we have data → keep ours
        // - Both have data (conflict) → skip (let user decide)
        let defaultAction: ResolutionAction
        if (!diff.appValue && diff.googleValue) {
          defaultAction = 'use-google'
        } else if (diff.appValue && !diff.googleValue) {
          defaultAction = 'keep-app'
        } else {
          defaultAction = 'skip'
        }
        map.set(diff.field, {
          field: diff.field,
          action: defaultAction,
          value:
            defaultAction === 'use-google'
              ? diff.googleValue || undefined
              : defaultAction === 'keep-app'
                ? diff.appValue || undefined
                : undefined,
        })
      }
      return map
    },
  )

  function setResolution(
    field: string,
    action: ResolutionAction,
    value?: string,
  ) {
    setResolutions(prev => {
      const next = new Map(prev)
      next.set(field, { field, action, value })
      return next
    })
  }

  function handleApply() {
    onApply(Array.from(resolutions.values()))
  }

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Google Sync: {friendName}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground mb-4">
          The following fields differ between your data and Google Contacts.
          Choose how to resolve each one.
        </p>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {diffs.map(diff => {
            const resolution = resolutions.get(diff.field)
            return (
              <DiffRow
                key={diff.field}
                diff={diff}
                resolution={resolution}
                hasGoogleWrite={hasGoogleWrite}
                onChange={(action, value) =>
                  setResolution(diff.field, action, value)
                }
              />
            )
          })}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleApply}>Apply Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DiffRow({
  diff,
  resolution,
  hasGoogleWrite,
  onChange,
}: {
  diff: FieldDiff
  resolution?: Resolution
  hasGoogleWrite?: boolean
  onChange: (action: ResolutionAction, value?: string) => void
}) {
  const hasMultiValues = diff.googleValues && diff.googleValues.length > 1
  // Only show "Update Google" when the user has write scope and the app has a value to push
  const canPushToGoogle = hasGoogleWrite && !!diff.appValue

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{diff.label}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={`text-xs px-2 py-1 rounded ${
              resolution?.action === 'keep-app'
                ? 'bg-primary text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => onChange('keep-app', diff.appValue || undefined)}
          >
            Keep Ours
          </button>
          <button
            type="button"
            className={`text-xs px-2 py-1 rounded ${
              resolution?.action === 'use-google'
                ? 'bg-primary text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
            onClick={() =>
              onChange('use-google', diff.googleValue || undefined)
            }
          >
            Use Google&apos;s
          </button>
          {canPushToGoogle && (
            <button
              type="button"
              className={`text-xs px-2 py-1 rounded inline-flex items-center gap-1 ${
                resolution?.action === 'push-to-google'
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
              onClick={() =>
                onChange('push-to-google', diff.appValue || undefined)
              }
            >
              <Upload size={10} />
              Update Google
            </button>
          )}
          <button
            type="button"
            className={`text-xs px-2 py-1 rounded ${
              resolution?.action === 'skip'
                ? 'bg-primary text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => onChange('skip')}
          >
            Skip
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <div className="flex-1 min-w-0">
          <span className="text-xs text-muted-foreground block mb-0.5">
            Ours
          </span>
          <span className={diff.appValue ? '' : 'text-muted-foreground italic'}>
            {diff.appValue || 'Empty'}
          </span>
        </div>
        <ArrowRight size={14} className="text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs text-muted-foreground block mb-0.5">
            Google
          </span>
          {hasMultiValues && resolution?.action === 'use-google' ? (
            <Select
              className="text-sm"
              value={resolution?.value || diff.googleValue || ''}
              onChange={e => onChange('use-google', e.target.value)}
            >
              {diff.googleValues!.map((gv, i) => (
                <option key={`${gv.value}-${i}`} value={gv.value}>
                  {gv.value}
                  {gv.type ? ` (${gv.type})` : ''}
                </option>
              ))}
            </Select>
          ) : (
            <span
              className={diff.googleValue ? '' : 'text-muted-foreground italic'}
            >
              {diff.googleValue || 'Empty'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
