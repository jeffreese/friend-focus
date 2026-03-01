import { describe, expect, it } from 'vitest'
import {
  buildCalendarEventPayload,
  type CalendarEventInput,
} from '~/lib/calendar'

function makeEvent(
  overrides: Partial<CalendarEventInput> = {},
): CalendarEventInput {
  return {
    name: 'Test Event',
    activityName: null,
    date: '2026-07-15',
    time: null,
    location: null,
    invitations: [],
    ...overrides,
  }
}

describe('buildCalendarEventPayload', () => {
  it('creates all-day event when no time is set', () => {
    const payload = buildCalendarEventPayload(
      makeEvent({ name: 'Beach Day', date: '2026-07-15' }),
    )
    expect(payload.summary).toBe('Beach Day')
    expect(payload.start).toEqual({ date: '2026-07-15' })
    expect(payload.end).toEqual({ date: '2026-07-16' })
    expect(payload.start).not.toHaveProperty('dateTime')
  })

  it('creates timed event with 1-hour default duration', () => {
    const payload = buildCalendarEventPayload(
      makeEvent({
        name: 'Dinner',
        date: '2026-03-15',
        time: '19:00',
      }),
    )
    expect(payload.start.dateTime).toBe('2026-03-15T19:00:00')
    expect(payload.end.dateTime).toBe('2026-03-15T20:00:00')
  })

  it('handles midnight rollover for end time', () => {
    const payload = buildCalendarEventPayload(
      makeEvent({
        name: 'Late Night',
        date: '2026-03-15',
        time: '23:30',
      }),
    )
    expect(payload.start.dateTime).toBe('2026-03-15T23:30:00')
    expect(payload.end.dateTime).toBe('2026-03-16T00:30:00')
  })

  it('includes location when set', () => {
    const payload = buildCalendarEventPayload(
      makeEvent({ location: 'Central Park' }),
    )
    expect(payload.location).toBe('Central Park')
  })

  it('omits location when not set', () => {
    const payload = buildCalendarEventPayload(makeEvent({ location: null }))
    expect(payload.location).toBeUndefined()
  })

  it('includes activity name in description', () => {
    const payload = buildCalendarEventPayload(
      makeEvent({ activityName: 'Hiking' }),
    )
    expect(payload.description).toContain('Activity: Hiking')
  })

  it('includes only attending guests in description', () => {
    const payload = buildCalendarEventPayload(
      makeEvent({
        invitations: [
          { friendName: 'Alice', status: 'attending' },
          { friendName: 'Bob', status: 'declined' },
          { friendName: 'Carol', status: 'attending' },
          { friendName: 'Dave', status: 'invited' },
        ],
      }),
    )
    expect(payload.description).toContain('Alice')
    expect(payload.description).toContain('Carol')
    expect(payload.description).not.toContain('Bob')
    expect(payload.description).not.toContain('Dave')
    expect(payload.description).toContain('Guest list (2)')
  })

  it('omits description when no activity and no attending guests', () => {
    const payload = buildCalendarEventPayload(makeEvent())
    expect(payload.description).toBeUndefined()
  })

  it('handles end-of-year date rollover for all-day events', () => {
    const payload = buildCalendarEventPayload(makeEvent({ date: '2026-12-31' }))
    expect(payload.start).toEqual({ date: '2026-12-31' })
    expect(payload.end).toEqual({ date: '2027-01-01' })
  })
})
