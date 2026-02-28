import { describe, expect, it } from 'vitest'
import {
  scoreActivityInterest,
  scoreAttendance,
  scoreCloseness,
  scoreSocialFit,
} from '~/lib/recommendation-scoring'

describe('scoreActivityInterest', () => {
  it('returns 100 for "loves it" (rating 1)', () => {
    expect(scoreActivityInterest(1)).toBe(100)
  })

  it('returns 75 for "interested" (rating 2)', () => {
    expect(scoreActivityInterest(2)).toBe(75)
  })

  it('returns 50 for "maybe" (rating 3)', () => {
    expect(scoreActivityInterest(3)).toBe(50)
  })

  it('returns 25 for "probably not" (rating 4)', () => {
    expect(scoreActivityInterest(4)).toBe(25)
  })

  it('returns 0 for "definitely not" (rating 5)', () => {
    expect(scoreActivityInterest(5)).toBe(0)
  })

  it('returns 40 for null (no rating)', () => {
    expect(scoreActivityInterest(null)).toBe(40)
  })
})

describe('scoreCloseness', () => {
  it('returns 100 for the closest tier (lowest sortOrder)', () => {
    expect(scoreCloseness(1, 1, 5)).toBe(100)
  })

  it('returns 0 for the most distant tier (highest sortOrder)', () => {
    expect(scoreCloseness(5, 1, 5)).toBe(0)
  })

  it('returns 50 for mid-range', () => {
    expect(scoreCloseness(3, 1, 5)).toBe(50)
  })

  it('returns 30 when sortOrder is null', () => {
    expect(scoreCloseness(null, 1, 5)).toBe(30)
  })

  it('returns 100 when min equals max (only one tier)', () => {
    expect(scoreCloseness(1, 1, 1)).toBe(100)
  })
})

describe('scoreSocialFit', () => {
  it('returns 50 when there are no invitees', () => {
    const result = scoreSocialFit('friend-1', new Set(), new Map(), null)
    expect(result).toEqual({ knows: 0, of: 0, score: 50 })
  })

  it('scores higher for tight_knit when friend knows invitees strongly', () => {
    const connectionMap = new Map([
      [
        'friend-1',
        new Map([
          ['invitee-1', 5],
          ['invitee-2', 5],
        ]),
      ],
    ])
    const invitees = new Set(['invitee-1', 'invitee-2'])
    const result = scoreSocialFit(
      'friend-1',
      invitees,
      connectionMap,
      'tight_knit',
    )
    expect(result.knows).toBe(2)
    expect(result.of).toBe(2)
    expect(result.score).toBe(100)
  })

  it('scores higher for mixer when friend does NOT know invitees', () => {
    const connectionMap = new Map([['friend-1', new Map()]])
    const invitees = new Set(['invitee-1', 'invitee-2'])
    const result = scoreSocialFit('friend-1', invitees, connectionMap, 'mixer')
    expect(result.knows).toBe(0)
    expect(result.score).toBe(100)
  })

  it('scores lower for mixer when friend knows all invitees', () => {
    const connectionMap = new Map([
      [
        'friend-1',
        new Map([
          ['invitee-1', 3],
          ['invitee-2', 3],
        ]),
      ],
    ])
    const invitees = new Set(['invitee-1', 'invitee-2'])
    const result = scoreSocialFit('friend-1', invitees, connectionMap, 'mixer')
    expect(result.score).toBe(0)
  })
})

describe('scoreAttendance', () => {
  it('returns score 50 when no past invitations', () => {
    const result = scoreAttendance([], 'event-1', [])
    expect(result).toEqual({ rate: '0/0', score: 50 })
  })

  it('scores high for good attendance rate', () => {
    const invitations = [
      { status: 'attending', attended: true, eventId: 'event-2' },
      { status: 'attending', attended: true, eventId: 'event-3' },
    ]
    const result = scoreAttendance(invitations, 'event-1', [
      'event-2',
      'event-3',
    ])
    expect(result.score).toBeGreaterThan(70)
  })

  it('scores low for poor attendance rate', () => {
    const invitations = [
      { status: 'declined', attended: false, eventId: 'event-2' },
      { status: 'declined', attended: false, eventId: 'event-3' },
    ]
    const result = scoreAttendance(invitations, 'event-1', [
      'event-2',
      'event-3',
    ])
    expect(result.score).toBeLessThan(30)
  })

  it('excludes the current event from calculations', () => {
    const invitations = [
      { status: 'attending', attended: null, eventId: 'event-1' },
    ]
    const result = scoreAttendance(invitations, 'event-1', [])
    expect(result).toEqual({ rate: '0/0', score: 50 })
  })
})
