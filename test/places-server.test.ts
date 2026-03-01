import { afterEach, describe, expect, it, vi } from 'vitest'

// Mock env before importing the module under test
vi.mock('~/lib/env.server', () => ({
  env: {
    GOOGLE_MAPS_API_KEY: '',
  },
}))

import { env } from '~/lib/env.server'
import {
  autocomplete,
  getPlaceDetails,
  isPlacesEnabled,
} from '~/lib/places.server'

const mockedEnv = env as { GOOGLE_MAPS_API_KEY: string }

describe('isPlacesEnabled', () => {
  afterEach(() => {
    mockedEnv.GOOGLE_MAPS_API_KEY = ''
  })

  it('returns false when GOOGLE_MAPS_API_KEY is not set', () => {
    mockedEnv.GOOGLE_MAPS_API_KEY = ''
    expect(isPlacesEnabled()).toBe(false)
  })

  it('returns true when GOOGLE_MAPS_API_KEY is set', () => {
    mockedEnv.GOOGLE_MAPS_API_KEY = 'test-api-key'
    expect(isPlacesEnabled()).toBe(true)
  })
})

describe('autocomplete', () => {
  afterEach(() => {
    mockedEnv.GOOGLE_MAPS_API_KEY = ''
    vi.restoreAllMocks()
  })

  it('returns empty array when API key is not set', async () => {
    mockedEnv.GOOGLE_MAPS_API_KEY = ''
    const result = await autocomplete('Denver')
    expect(result).toEqual([])
  })

  it('returns empty array for empty input', async () => {
    mockedEnv.GOOGLE_MAPS_API_KEY = 'test-key'
    const result = await autocomplete('')
    expect(result).toEqual([])
  })

  it('returns empty array for whitespace-only input', async () => {
    mockedEnv.GOOGLE_MAPS_API_KEY = 'test-key'
    const result = await autocomplete('   ')
    expect(result).toEqual([])
  })

  it('parses a successful response', async () => {
    mockedEnv.GOOGLE_MAPS_API_KEY = 'test-key'
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          suggestions: [
            {
              placePrediction: {
                placeId: 'place-123',
                text: { text: '123 Main St, Denver, CO, USA' },
                structuredFormat: {
                  mainText: { text: '123 Main St' },
                  secondaryText: { text: 'Denver, CO, USA' },
                },
              },
            },
          ],
        }),
        { status: 200 },
      ),
    )

    const result = await autocomplete('123 Main')
    expect(result).toEqual([
      {
        placeId: 'place-123',
        description: '123 Main St, Denver, CO, USA',
        mainText: '123 Main St',
        secondaryText: 'Denver, CO, USA',
      },
    ])
  })

  it('returns empty array on API error', async () => {
    mockedEnv.GOOGLE_MAPS_API_KEY = 'test-key'
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Internal error', { status: 500 }),
    )

    const result = await autocomplete('Denver')
    expect(result).toEqual([])
  })
})

describe('getPlaceDetails', () => {
  afterEach(() => {
    mockedEnv.GOOGLE_MAPS_API_KEY = ''
    vi.restoreAllMocks()
  })

  it('returns null when API key is not set', async () => {
    mockedEnv.GOOGLE_MAPS_API_KEY = ''
    const result = await getPlaceDetails('place-123')
    expect(result).toBeNull()
  })

  it('returns null for empty placeId', async () => {
    mockedEnv.GOOGLE_MAPS_API_KEY = 'test-key'
    const result = await getPlaceDetails('')
    expect(result).toBeNull()
  })

  it('parses address components correctly', async () => {
    mockedEnv.GOOGLE_MAPS_API_KEY = 'test-key'
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          formattedAddress: '123 Main St, Denver, CO 80202, USA',
          addressComponents: [
            { types: ['street_number'], longText: '123' },
            { types: ['route'], longText: 'Main St' },
            { types: ['locality'], longText: 'Denver' },
            {
              types: ['administrative_area_level_1'],
              longText: 'Colorado',
              shortText: 'CO',
            },
            { types: ['postal_code'], longText: '80202' },
            { types: ['country'], longText: 'United States' },
          ],
          location: { latitude: 39.7392, longitude: -104.9903 },
        }),
        { status: 200 },
      ),
    )

    const result = await getPlaceDetails('place-123')
    expect(result).toEqual({
      placeId: 'place-123',
      formattedAddress: '123 Main St, Denver, CO 80202, USA',
      street: '123 Main St',
      city: 'Denver',
      state: 'CO',
      zip: '80202',
      country: 'United States',
      lat: 39.7392,
      lng: -104.9903,
    })
  })

  it('returns null on API error', async () => {
    mockedEnv.GOOGLE_MAPS_API_KEY = 'test-key'
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Not found', { status: 404 }),
    )

    const result = await getPlaceDetails('invalid-id')
    expect(result).toBeNull()
  })
})
