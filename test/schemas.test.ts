import { describe, expect, it } from 'vitest'
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  noteSchema,
  registerSchema,
  resetPasswordSchema,
  updateNameSchema,
} from '~/lib/schemas'

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('registerSchema', () => {
  it('accepts valid registration', () => {
    const result = registerSchema.safeParse({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'different',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short passwords', () => {
    const result = registerSchema.safeParse({
      name: 'Test User',
      email: 'test@example.com',
      password: 'short',
      confirmPassword: 'short',
    })
    expect(result.success).toBe(false)
  })
})

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'test@example.com',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = forgotPasswordSchema.safeParse({
      email: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  it('accepts valid reset data', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'some-token',
      password: 'newpassword123',
      confirmPassword: 'newpassword123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects mismatched passwords', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'some-token',
      password: 'newpassword123',
      confirmPassword: 'different',
    })
    expect(result.success).toBe(false)
  })
})

describe('updateNameSchema', () => {
  it('accepts valid name update', () => {
    const result = updateNameSchema.safeParse({
      intent: 'update-name',
      name: 'New Name',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = updateNameSchema.safeParse({
      intent: 'update-name',
      name: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects wrong intent', () => {
    const result = updateNameSchema.safeParse({
      intent: 'wrong',
      name: 'New Name',
    })
    expect(result.success).toBe(false)
  })
})

describe('changePasswordSchema', () => {
  it('accepts valid password change', () => {
    const result = changePasswordSchema.safeParse({
      intent: 'change-password',
      currentPassword: 'oldpassword',
      newPassword: 'newpassword123',
      confirmNewPassword: 'newpassword123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects short new password', () => {
    const result = changePasswordSchema.safeParse({
      intent: 'change-password',
      currentPassword: 'oldpassword',
      newPassword: 'short',
      confirmNewPassword: 'short',
    })
    expect(result.success).toBe(false)
  })

  it('rejects mismatched passwords', () => {
    const result = changePasswordSchema.safeParse({
      intent: 'change-password',
      currentPassword: 'oldpassword',
      newPassword: 'newpassword123',
      confirmNewPassword: 'different',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty current password', () => {
    const result = changePasswordSchema.safeParse({
      intent: 'change-password',
      currentPassword: '',
      newPassword: 'newpassword123',
      confirmNewPassword: 'newpassword123',
    })
    expect(result.success).toBe(false)
  })
})

describe('noteSchema', () => {
  it('accepts valid note', () => {
    const result = noteSchema.safeParse({
      content: 'Some journal content',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty content', () => {
    const result = noteSchema.safeParse({
      content: '',
    })
    expect(result.success).toBe(false)
  })
})
