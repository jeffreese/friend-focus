export interface CalendarRsvpInput {
  id: string
  friendEmail: string | null
  calendarInviteSent: boolean
  status: string
}

export interface GoogleAttendeeInput {
  email: string
  responseStatus: string
}

/**
 * Compute which local invitations need RSVP updates based on Google Calendar
 * attendee responses. Pure function for testability.
 */
export function computeCalendarRsvpUpdates(
  invitations: CalendarRsvpInput[],
  googleAttendees: GoogleAttendeeInput[],
): Array<{ invitationId: string; newStatus: string }> {
  const attendeeMap = new Map(
    googleAttendees.map(a => [a.email.toLowerCase(), a.responseStatus]),
  )

  const updates: Array<{ invitationId: string; newStatus: string }> = []

  for (const inv of invitations) {
    if (!inv.friendEmail || !inv.calendarInviteSent) continue
    const googleStatus = attendeeMap.get(inv.friendEmail.toLowerCase())
    if (!googleStatus) continue

    if (googleStatus === 'accepted' && inv.status !== 'attending') {
      updates.push({ invitationId: inv.id, newStatus: 'attending' })
    } else if (googleStatus === 'declined' && inv.status !== 'declined') {
      updates.push({ invitationId: inv.id, newStatus: 'declined' })
    }
  }

  return updates
}
