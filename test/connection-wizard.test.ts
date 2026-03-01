import { describe, expect, it } from 'vitest'
import { connectionWizardSchema } from '~/lib/schemas'

describe('connectionWizardSchema', () => {
  describe('set-connection intent', () => {
    it('accepts valid set-connection with type and strength', () => {
      const result = connectionWizardSchema.safeParse({
        intent: 'set-connection',
        selectedFriendId: 'friend-1',
        otherFriendId: 'friend-2',
        type: 'Friends',
        strength: '3',
      })
      expect(result.success).toBe(true)
    })

    it('accepts set-connection with connectionId for updates', () => {
      const result = connectionWizardSchema.safeParse({
        intent: 'set-connection',
        selectedFriendId: 'friend-1',
        otherFriendId: 'friend-2',
        connectionId: 'conn-1',
        type: 'Coworkers',
        strength: '4',
      })
      expect(result.success).toBe(true)
    })

    it('accepts set-connection with empty type', () => {
      const result = connectionWizardSchema.safeParse({
        intent: 'set-connection',
        selectedFriendId: 'friend-1',
        otherFriendId: 'friend-2',
        type: '',
        strength: '3',
      })
      expect(result.success).toBe(true)
    })

    it('accepts set-connection without type', () => {
      const result = connectionWizardSchema.safeParse({
        intent: 'set-connection',
        selectedFriendId: 'friend-1',
        otherFriendId: 'friend-2',
        strength: '5',
      })
      expect(result.success).toBe(true)
    })

    it('coerces strength from string to number', () => {
      const result = connectionWizardSchema.safeParse({
        intent: 'set-connection',
        selectedFriendId: 'friend-1',
        otherFriendId: 'friend-2',
        strength: '4',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.strength).toBe(4)
      }
    })
  })

  describe('delete-connection intent', () => {
    it('accepts valid delete-connection', () => {
      const result = connectionWizardSchema.safeParse({
        intent: 'delete-connection',
        selectedFriendId: 'friend-1',
        otherFriendId: 'friend-2',
        connectionId: 'conn-1',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('validation errors', () => {
    it('rejects invalid intent', () => {
      const result = connectionWizardSchema.safeParse({
        intent: 'invalid',
        selectedFriendId: 'friend-1',
        otherFriendId: 'friend-2',
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing selectedFriendId', () => {
      const result = connectionWizardSchema.safeParse({
        intent: 'set-connection',
        otherFriendId: 'friend-2',
        strength: '3',
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing otherFriendId', () => {
      const result = connectionWizardSchema.safeParse({
        intent: 'set-connection',
        selectedFriendId: 'friend-1',
        strength: '3',
      })
      expect(result.success).toBe(false)
    })

    it('rejects strength below 1', () => {
      const result = connectionWizardSchema.safeParse({
        intent: 'set-connection',
        selectedFriendId: 'friend-1',
        otherFriendId: 'friend-2',
        strength: '0',
      })
      expect(result.success).toBe(false)
    })

    it('rejects strength above 5', () => {
      const result = connectionWizardSchema.safeParse({
        intent: 'set-connection',
        selectedFriendId: 'friend-1',
        otherFriendId: 'friend-2',
        strength: '6',
      })
      expect(result.success).toBe(false)
    })
  })
})
