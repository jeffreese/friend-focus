import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      richColors
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
          /* Match app OKLCH tokens */
          '--success-bg': 'oklch(0.95 0.05 145)',
          '--success-border': 'oklch(0.85 0.1 145)',
          '--success-text': 'oklch(0.35 0.15 145)',
          '--error-bg': 'oklch(0.95 0.03 25)',
          '--error-border': 'oklch(0.85 0.08 25)',
          '--error-text': 'oklch(0.4 0.18 25)',
          '--warning-bg': 'oklch(0.96 0.04 85)',
          '--warning-border': 'oklch(0.88 0.1 85)',
          '--warning-text': 'oklch(0.4 0.13 85)',
          '--info-bg': 'oklch(0.95 0.03 250)',
          '--info-border': 'oklch(0.85 0.08 250)',
          '--info-text': 'oklch(0.4 0.15 250)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
