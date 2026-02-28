import { parseWithZod } from '@conform-to/zod/v4'
import { describe, expect, it } from 'vitest'
import { loginSchema, noteSchema } from '~/lib/schemas'

// This file demonstrates how to test the form validation logic used in
// route actions. It uses parseWithZod with FormData — the same pattern
// used in action functions — without needing a running server or database.

function createFormData(entries: Record<string, string>): FormData {
  const formData = new FormData()
  for (const [key, value] of Object.entries(entries)) {
    formData.append(key, value)
  }
  return formData
}

describe('login action validation', () => {
  it('succeeds with valid form data', () => {
    const formData = createFormData({
      email: 'test@example.com',
      password: 'password123',
    })
    const submission = parseWithZod(formData, { schema: loginSchema })
    expect(submission.status).toBe('success')
  })

  it('returns field errors for invalid email', () => {
    const formData = createFormData({
      email: 'not-an-email',
      password: 'password123',
    })
    const submission = parseWithZod(formData, { schema: loginSchema })
    expect(submission.status).toBe('error')
    // reply() returns the SubmissionResult sent to the client — same as
    // what route actions return via `submission.reply()`
    const result = submission.reply()
    expect(result.error?.email).toBeDefined()
    expect(result.error?.password).toBeUndefined()
  })

  it('returns field errors for missing password', () => {
    const formData = createFormData({
      email: 'test@example.com',
      password: '',
    })
    const submission = parseWithZod(formData, { schema: loginSchema })
    expect(submission.status).toBe('error')
    const result = submission.reply()
    expect(result.error?.password).toBeDefined()
  })

  it('returns multiple field errors for empty form', () => {
    const formData = createFormData({
      email: '',
      password: '',
    })
    const submission = parseWithZod(formData, { schema: loginSchema })
    expect(submission.status).toBe('error')
    const result = submission.reply()
    expect(result.error?.email).toBeDefined()
    expect(result.error?.password).toBeDefined()
  })
})

describe('note action validation', () => {
  it('succeeds with valid note data', () => {
    const formData = createFormData({
      content: 'Some journal content',
    })
    const submission = parseWithZod(formData, { schema: noteSchema })
    expect(submission.status).toBe('success')
    if (submission.status === 'success') {
      expect(submission.value.content).toBe('Some journal content')
    }
  })

  it('returns field errors for empty content', () => {
    const formData = createFormData({ content: '' })
    const submission = parseWithZod(formData, { schema: noteSchema })
    expect(submission.status).toBe('error')
    const result = submission.reply()
    expect(result.error?.content).toBeDefined()
  })
})
