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

  it('succeeds with full structured location fields', () => {
    const formData = createFormData({
      name: 'Dinner Party',
      location: '1600 Amphitheatre Parkway, Mountain View, CA 94043',
      locationStreet: '1600 Amphitheatre Parkway',
      locationCity: 'Mountain View',
      locationState: 'CA',
      locationZip: '94043',
      locationCountry: 'US',
      locationLat: '37.4220656',
      locationLng: '-122.0840897',
      locationPlaceId: 'ChIJj61dQgK6j4AR4GeTYWZsKWw',
    })
    const submission = parseWithZod(formData, { schema: eventSchema })
    expect(submission.status).toBe('success')
    if (submission.status === 'success') {
      expect(submission.value.location).toBe(
        '1600 Amphitheatre Parkway, Mountain View, CA 94043',
      )
      expect(submission.value.locationStreet).toBe('1600 Amphitheatre Parkway')
      expect(submission.value.locationCity).toBe('Mountain View')
      expect(submission.value.locationState).toBe('CA')
      expect(submission.value.locationZip).toBe('94043')
      expect(submission.value.locationLat).toBe('37.4220656')
    }
  })

  it('succeeds with location text only (no structured fields)', () => {
    const formData = createFormData({
      name: 'Pizza Night',
      location: 'My place',
    })
    const submission = parseWithZod(formData, { schema: eventSchema })
    expect(submission.status).toBe('success')
    if (submission.status === 'success') {
      expect(submission.value.location).toBe('My place')
      expect(submission.value.locationStreet).toBeUndefined()
    }
  })

  it('succeeds with empty location fields', () => {
    const formData = createFormData({
      name: 'Mystery Event',
      location: '',
      locationStreet: '',
      locationCity: '',
    })
    const submission = parseWithZod(formData, { schema: eventSchema })
    expect(submission.status).toBe('success')
  })
})
