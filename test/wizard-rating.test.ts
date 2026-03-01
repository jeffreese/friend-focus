import { describe, expect, it } from 'vitest'
import { wizardRatingSchema } from '~/lib/schemas'

describe('wizardRatingSchema', () => {
  it('accepts valid set-rating with rating', () => {
    const result = wizardRatingSchema.safeParse({
      intent: 'set-rating',
      friendId: 'friend-1',
      activityId: 'activity-1',
      rating: 3,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.intent).toBe('set-rating')
      expect(result.data.rating).toBe(3)
    }
  })

  it('accepts valid clear-rating without rating', () => {
    const result = wizardRatingSchema.safeParse({
      intent: 'clear-rating',
      friendId: 'friend-1',
      activityId: 'activity-1',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.intent).toBe('clear-rating')
      expect(result.data.rating).toBeUndefined()
    }
  })

  it('coerces string rating to number', () => {
    const result = wizardRatingSchema.safeParse({
      intent: 'set-rating',
      friendId: 'friend-1',
      activityId: 'activity-1',
      rating: '5',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.rating).toBe(5)
    }
  })

  it('accepts all valid rating values (1-5)', () => {
    for (const rating of [1, 2, 3, 4, 5]) {
      const result = wizardRatingSchema.safeParse({
        intent: 'set-rating',
        friendId: 'friend-1',
        activityId: 'activity-1',
        rating,
      })
      expect(result.success).toBe(true)
    }
  })

  it('rejects rating below 1', () => {
    const result = wizardRatingSchema.safeParse({
      intent: 'set-rating',
      friendId: 'friend-1',
      activityId: 'activity-1',
      rating: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects rating above 5', () => {
    const result = wizardRatingSchema.safeParse({
      intent: 'set-rating',
      friendId: 'friend-1',
      activityId: 'activity-1',
      rating: 6,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid intent', () => {
    const result = wizardRatingSchema.safeParse({
      intent: 'delete',
      friendId: 'friend-1',
      activityId: 'activity-1',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing friendId', () => {
    const result = wizardRatingSchema.safeParse({
      intent: 'set-rating',
      activityId: 'activity-1',
      rating: 3,
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing activityId', () => {
    const result = wizardRatingSchema.safeParse({
      intent: 'set-rating',
      friendId: 'friend-1',
      rating: 3,
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty friendId', () => {
    const result = wizardRatingSchema.safeParse({
      intent: 'set-rating',
      friendId: '',
      activityId: 'activity-1',
      rating: 3,
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty activityId', () => {
    const result = wizardRatingSchema.safeParse({
      intent: 'set-rating',
      friendId: 'friend-1',
      activityId: '',
      rating: 3,
    })
    expect(result.success).toBe(false)
  })
})
