import { parseWithZod } from '@conform-to/zod/v4'
import { describe, expect, it } from 'vitest'
import { eventSchema } from '~/lib/schemas'

function createFormData(entries: Record<string, string>): FormData {
  const formData = new FormData()
  for (const [key, value] of Object.entries(entries)) {
    formData.append(key, value)
  }
  return formData
}

describe('event creation validation', () => {
  it('succeeds with valid event data', () => {
    const formData = createFormData({
      name: 'Dinner with Sarah',
      activityId: 'act-1',
      date: '2026-03-15',
      time: '19:00',
      location: 'Downtown Grill',
    })
    const submission = parseWithZod(formData, { schema: eventSchema })
    expect(submission.status).toBe('success')
    if (submission.status === 'success') {
      expect(submission.value.name).toBe('Dinner with Sarah')
      expect(submission.value.activityId).toBe('act-1')
    }
  })

  it('succeeds with minimal data (name only)', () => {
    const formData = createFormData({ name: 'Quick hangout' })
    const submission = parseWithZod(formData, { schema: eventSchema })
    expect(submission.status).toBe('success')
  })

  it('fails when name is missing', () => {
    const formData = createFormData({ name: '' })
    const submission = parseWithZod(formData, { schema: eventSchema })
    expect(submission.status).toBe('error')
    const result = submission.reply()
    expect(result.error?.name).toBeDefined()
  })

  it('passes through friendId in form data without affecting validation', () => {
    const formData = createFormData({
      name: 'Hiking with Alex',
      friendId: 'friend-123',
      activityId: 'act-2',
    })
    const submission = parseWithZod(formData, { schema: eventSchema })
    // friendId is not part of eventSchema, so it's ignored by validation
    expect(submission.status).toBe('success')
    // The action reads friendId separately from formData.get('friendId')
    expect(formData.get('friendId')).toBe('friend-123')
  })
})
