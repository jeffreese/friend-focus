export interface CalendarEventInput {
  name: string
  activityName: string | null
  date: string | null
  time: string | null
  location: string | null
  invitations: Array<{ friendName: string; status: string }>
}

/**
 * Build a Google Calendar API event payload from an app event.
 */
export function buildCalendarEventPayload(eventDetail: CalendarEventInput) {
  const { name, location, date, time, activityName, invitations } = eventDetail

  const lines: string[] = []
  if (activityName) lines.push(`Activity: ${activityName}`)
  const attending = invitations.filter(i => i.status === 'attending')
  if (attending.length > 0) {
    lines.push(`\nGuest list (${attending.length}):`)
    for (const inv of attending) {
      lines.push(`  - ${inv.friendName}`)
    }
  }
  const description = lines.length > 0 ? lines.join('\n') : undefined

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
      start: { dateTime: `${date}T${time}:00` },
      end: { dateTime: `${endDate}T${endTime}:00` },
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
