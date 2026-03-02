import { describe, expect, it } from 'vitest'
import {
  type CalendarRsvpInput,
  computeCalendarRsvpUpdates,
  type GoogleAttendeeInput,
} from '~/lib/calendar-rsvp'

function makeInvitation(
  overrides: Partial<CalendarRsvpInput> = {},
): CalendarRsvpInput {
  return {
    id: 'inv-1',
    friendEmail: 'alice@example.com',
    calendarInviteSent: true,
    status: 'invited',
    ...overrides,
  }
}

function makeAttendee(
  overrides: Partial<GoogleAttendeeInput> = {},
): GoogleAttendeeInput {
  return {
    email: 'alice@example.com',
    responseStatus: 'needsAction',
    ...overrides,
  }
}

describe('computeCalendarRsvpUpdates', () => {
  it('maps Google accepted to local attending', () => {
    const updates = computeCalendarRsvpUpdates(
      [makeInvitation({ id: 'inv-1', status: 'invited' })],
      [makeAttendee({ responseStatus: 'accepted' })],
    )
    expect(updates).toEqual([{ invitationId: 'inv-1', newStatus: 'attending' }])
  })

  it('maps Google declined to local declined', () => {
    const updates = computeCalendarRsvpUpdates(
      [makeInvitation({ id: 'inv-1', status: 'invited' })],
      [makeAttendee({ responseStatus: 'declined' })],
    )
    expect(updates).toEqual([{ invitationId: 'inv-1', newStatus: 'declined' }])
  })

  it('does not change status for tentative', () => {
    const updates = computeCalendarRsvpUpdates(
      [makeInvitation({ status: 'invited' })],
      [makeAttendee({ responseStatus: 'tentative' })],
    )
    expect(updates).toEqual([])
  })

  it('does not change status for needsAction', () => {
    const updates = computeCalendarRsvpUpdates(
      [makeInvitation({ status: 'invited' })],
      [makeAttendee({ responseStatus: 'needsAction' })],
    )
    expect(updates).toEqual([])
  })

  it('does not update if local status already matches', () => {
    const updates = computeCalendarRsvpUpdates(
      [makeInvitation({ status: 'attending' })],
      [makeAttendee({ responseStatus: 'accepted' })],
    )
    expect(updates).toEqual([])
  })

  it('skips invitations without calendarInviteSent', () => {
    const updates = computeCalendarRsvpUpdates(
      [makeInvitation({ calendarInviteSent: false })],
      [makeAttendee({ responseStatus: 'accepted' })],
    )
    expect(updates).toEqual([])
  })

  it('skips invitations without email', () => {
    const updates = computeCalendarRsvpUpdates(
      [makeInvitation({ friendEmail: null })],
      [makeAttendee({ responseStatus: 'accepted' })],
    )
    expect(updates).toEqual([])
  })

  it('matches emails case-insensitively', () => {
    const updates = computeCalendarRsvpUpdates(
      [makeInvitation({ friendEmail: 'Alice@Example.COM' })],
      [
        makeAttendee({
          email: 'alice@example.com',
          responseStatus: 'accepted',
        }),
      ],
    )
    expect(updates).toEqual([{ invitationId: 'inv-1', newStatus: 'attending' }])
  })

  it('handles multiple invitations with mixed statuses', () => {
    const updates = computeCalendarRsvpUpdates(
      [
        makeInvitation({
          id: 'inv-1',
          friendEmail: 'alice@example.com',
          status: 'invited',
        }),
        makeInvitation({
          id: 'inv-2',
          friendEmail: 'bob@example.com',
          status: 'invited',
        }),
        makeInvitation({
          id: 'inv-3',
          friendEmail: 'carol@example.com',
          status: 'attending',
        }),
      ],
      [
        makeAttendee({
          email: 'alice@example.com',
          responseStatus: 'accepted',
        }),
        makeAttendee({
          email: 'bob@example.com',
          responseStatus: 'declined',
        }),
        makeAttendee({
          email: 'carol@example.com',
          responseStatus: 'accepted',
        }),
      ],
    )
    expect(updates).toEqual([
      { invitationId: 'inv-1', newStatus: 'attending' },
      { invitationId: 'inv-2', newStatus: 'declined' },
    ])
  })

  it('handles no matching attendees', () => {
    const updates = computeCalendarRsvpUpdates(
      [makeInvitation({ friendEmail: 'alice@example.com' })],
      [
        makeAttendee({
          email: 'unknown@example.com',
          responseStatus: 'accepted',
        }),
      ],
    )
    expect(updates).toEqual([])
  })

  it('handles empty inputs', () => {
    expect(computeCalendarRsvpUpdates([], [])).toEqual([])
    expect(computeCalendarRsvpUpdates([makeInvitation()], [])).toEqual([])
    expect(computeCalendarRsvpUpdates([], [makeAttendee()])).toEqual([])
  })
})
