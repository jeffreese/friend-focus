import { Heart } from 'lucide-react'

const REMINDER_LABELS: Record<string, string> = {
  daily: 'Daily',
  every_3_days: 'Every 3 days',
  weekly: 'Weekly',
}

interface CareModeBadgeProps {
  size?: 'sm' | 'md'
}

export function CareModeBadge({ size = 'sm' }: CareModeBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium text-pink-700 bg-pink-100 ${
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'
      }`}
    >
      <Heart size={size === 'sm' ? 10 : 12} className="fill-current" />
      Care
    </span>
  )
}

interface CareModeBannerProps {
  note?: string | null
  reminder?: string | null
  startedAt?: string | null
}

export function CareModeBanner({
  note,
  reminder,
  startedAt,
}: CareModeBannerProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-pink-50 border border-pink-200 text-sm">
      <Heart size={16} className="text-pink-500 fill-current shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-pink-700">Care Mode Active</span>
          {reminder && (
            <span className="text-xs text-pink-500">
              Reminder: {REMINDER_LABELS[reminder] || reminder}
            </span>
          )}
          {startedAt && (
            <span className="text-xs text-pink-400">Since {startedAt}</span>
          )}
        </div>
        {note && <p className="text-pink-600 mt-0.5">{note}</p>}
      </div>
    </div>
  )
}
