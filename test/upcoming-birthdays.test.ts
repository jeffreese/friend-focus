import { describe, expect, it } from 'vitest'
import { computeUpcomingBirthdays } from '~/lib/format'

describe('computeUpcomingBirthdays', () => {
  it('returns empty for friends with no birthdays', () => {
    const friends = [
      { id: '1', name: 'Alice', birthday: null },
      { id: '2', name: 'Bob', birthday: null },
    ]
    expect(computeUpcomingBirthdays(friends)).toEqual([])
  })

  it('includes birthdays within the next 30 days', () => {
    const today = new Date()
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    const birthday = `1990-${String(nextWeek.getMonth() + 1).padStart(2, '0')}-${String(nextWeek.getDate()).padStart(2, '0')}`

    const friends = [{ id: '1', name: 'Alice', birthday }]
    const result = computeUpcomingBirthdays(friends)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Alice')
    expect(result[0].daysUntil).toBeLessThanOrEqual(30)
  })

  it('excludes birthdays more than 30 days away', () => {
    const today = new Date()
    const farAway = new Date(today)
    farAway.setDate(farAway.getDate() + 60)
    const birthday = `1990-${String(farAway.getMonth() + 1).padStart(2, '0')}-${String(farAway.getDate()).padStart(2, '0')}`

    const friends = [{ id: '1', name: 'Alice', birthday }]
    expect(computeUpcomingBirthdays(friends)).toEqual([])
  })

  it('sorts by days until birthday', () => {
    const today = new Date()
    const in5Days = new Date(today)
    in5Days.setDate(in5Days.getDate() + 5)
    const in15Days = new Date(today)
    in15Days.setDate(in15Days.getDate() + 15)

    const birthday1 = `1990-${String(in15Days.getMonth() + 1).padStart(2, '0')}-${String(in15Days.getDate()).padStart(2, '0')}`
    const birthday2 = `1990-${String(in5Days.getMonth() + 1).padStart(2, '0')}-${String(in5Days.getDate()).padStart(2, '0')}`

    const friends = [
      { id: '1', name: 'Alice', birthday: birthday1 },
      { id: '2', name: 'Bob', birthday: birthday2 },
    ]
    const result = computeUpcomingBirthdays(friends)
    expect(result[0].name).toBe('Bob')
    expect(result[1].name).toBe('Alice')
  })

  it("includes today's birthday with daysUntil = 0", () => {
    const today = new Date()
    const birthday = `1990-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    const friends = [{ id: '1', name: 'Alice', birthday }]
    const result = computeUpcomingBirthdays(friends)
    expect(result).toHaveLength(1)
    expect(result[0].daysUntil).toBe(0)
  })

  it('respects custom withinDays parameter', () => {
    const today = new Date()
    const in10Days = new Date(today)
    in10Days.setDate(in10Days.getDate() + 10)
    const birthday = `1990-${String(in10Days.getMonth() + 1).padStart(2, '0')}-${String(in10Days.getDate()).padStart(2, '0')}`

    const friends = [{ id: '1', name: 'Alice', birthday }]
    expect(computeUpcomingBirthdays(friends, 5)).toEqual([])
    expect(computeUpcomingBirthdays(friends, 15)).toHaveLength(1)
  })

  it('skips invalid birthday strings', () => {
    const friends = [
      { id: '1', name: 'Alice', birthday: 'invalid' },
      { id: '2', name: 'Bob', birthday: '' },
    ]
    expect(computeUpcomingBirthdays(friends)).toEqual([])
  })
})
