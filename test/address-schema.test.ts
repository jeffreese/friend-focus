import { describe, expect, it } from 'vitest'
import { friendSchema } from '~/lib/schemas'

describe('friendSchema address fields', () => {
  const baseFriend = { name: 'Test Friend' }

  it('accepts empty address (all fields optional)', () => {
    const result = friendSchema.safeParse(baseFriend)
    expect(result.success).toBe(true)
  })

  it('accepts free-text address only (no structured fields)', () => {
    const result = friendSchema.safeParse({
      ...baseFriend,
      address: '123 Main St, Denver, CO',
    })
    expect(result.success).toBe(true)
  })

  it('accepts full structured address', () => {
    const result = friendSchema.safeParse({
      ...baseFriend,
      address: '123 Main St, Denver, CO 80202, USA',
      addressStreet: '123 Main St',
      addressCity: 'Denver',
      addressState: 'CO',
      addressZip: '80202',
      addressCountry: 'United States',
      addressLat: '39.7392',
      addressLng: '-104.9903',
      addressPlaceId: 'ChIJzxcfI6qAa4cR1jaKJ_j0jhE',
    })
    expect(result.success).toBe(true)
  })

  it('rejects address exceeding max length', () => {
    const result = friendSchema.safeParse({
      ...baseFriend,
      address: 'x'.repeat(501),
    })
    expect(result.success).toBe(false)
  })

  it('rejects addressCity exceeding max length', () => {
    const result = friendSchema.safeParse({
      ...baseFriend,
      addressCity: 'x'.repeat(101),
    })
    expect(result.success).toBe(false)
  })

  it('rejects addressZip exceeding max length', () => {
    const result = friendSchema.safeParse({
      ...baseFriend,
      addressZip: 'x'.repeat(21),
    })
    expect(result.success).toBe(false)
  })
})
