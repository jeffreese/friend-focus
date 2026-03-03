import type { GoogleCalendarEventInput } from '~/lib/google.server'

export interface CalendarEventInput {
  name: string
  activityName: string | null
  date: string | null
  time: string | null
  location: string | null
  timeZone?: string
}

/**
 * Build a Google Calendar API event payload from an app event.
 */
export function buildCalendarEventPayload(
  eventDetail: CalendarEventInput,
): GoogleCalendarEventInput {
  const { name, location, date, time, activityName, timeZone } = eventDetail

  const description = activityName ? `Activity: ${activityName}` : undefined
  const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone

  if (time && date) {
    const [h, m] = time.split(':').map(Number)
    let endH = h + 1
    let endDate = date
    if (endH >= 24) {
      endH = endH - 24
      const d = new Date(`${date}T00:00:00`)
      d.setDate(d.getDate() + 1)
      endDate = d.toISOString().split('T')[0]
    }
    const endTime = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`

    return {
      summary: name,
      description,
      location: location || undefined,
      start: { dateTime: `${date}T${time}:00`, timeZone: tz },
      end: { dateTime: `${endDate}T${endTime}:00`, timeZone: tz },
    }
  }

  // All-day event
  const startDate = date!
  const nextDay = new Date(`${startDate}T00:00:00`)
  nextDay.setDate(nextDay.getDate() + 1)
  const endDate = nextDay.toISOString().split('T')[0]

  return {
    summary: name,
    description,
    location: location || undefined,
    start: { date: startDate },
    end: { date: endDate },
  }
}
