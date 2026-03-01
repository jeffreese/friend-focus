import { env } from '~/lib/env.server'

export interface PlaceSuggestion {
  placeId: string
  description: string
  mainText: string
  secondaryText: string
}

export interface PlaceDetails {
  placeId: string
  formattedAddress: string
  street: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
  lat: number | null
  lng: number | null
}

export function isPlacesEnabled(): boolean {
  return !!env.GOOGLE_MAPS_API_KEY
}

export async function autocomplete(input: string): Promise<PlaceSuggestion[]> {
  if (!env.GOOGLE_MAPS_API_KEY || !input.trim()) return []

  const response = await fetch(
    'https://places.googleapis.com/v1/places:autocomplete',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': env.GOOGLE_MAPS_API_KEY,
      },
      body: JSON.stringify({
        input: input.trim(),
        includedPrimaryTypes: [
          'street_address',
          'subpremise',
          'locality',
          'sublocality',
          'postal_code',
          'administrative_area_level_1',
          'administrative_area_level_2',
          'country',
          'premise',
          'neighborhood',
          'route',
          'point_of_interest',
        ],
      }),
    },
  )

  if (!response.ok) return []

  const data = (await response.json()) as {
    suggestions?: Array<{
      placePrediction?: {
        placeId: string
        text?: { text: string }
        structuredFormat?: {
          mainText?: { text: string }
          secondaryText?: { text: string }
        }
      }
    }>
  }

  return (data.suggestions ?? [])
    .filter(
      (
        s,
      ): s is typeof s & {
        placePrediction: NonNullable<typeof s.placePrediction>
      } => !!s.placePrediction,
    )
    .map(s => ({
      placeId: s.placePrediction.placeId,
      description: s.placePrediction.text?.text ?? '',
      mainText: s.placePrediction.structuredFormat?.mainText?.text ?? '',
      secondaryText:
        s.placePrediction.structuredFormat?.secondaryText?.text ?? '',
    }))
}

export async function getPlaceDetails(
  placeId: string,
): Promise<PlaceDetails | null> {
  if (!env.GOOGLE_MAPS_API_KEY || !placeId) return null

  const response = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': env.GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'id,formattedAddress,addressComponents,location',
      },
    },
  )

  if (!response.ok) return null

  const place = (await response.json()) as {
    formattedAddress?: string
    addressComponents?: Array<{
      types: string[]
      longText?: string
      shortText?: string
    }>
    location?: { latitude: number; longitude: number }
  }

  const components = place.addressComponents ?? []
  const find = (type: string) => components.find(c => c.types.includes(type))

  const streetNumber = find('street_number')?.longText
  const route = find('route')?.longText
  const street = [streetNumber, route].filter(Boolean).join(' ') || null

  return {
    placeId,
    formattedAddress: place.formattedAddress ?? '',
    street,
    city: find('locality')?.longText ?? find('sublocality')?.longText ?? null,
    state: find('administrative_area_level_1')?.shortText ?? null,
    zip: find('postal_code')?.longText ?? null,
    country: find('country')?.longText ?? null,
    lat: place.location?.latitude ?? null,
    lng: place.location?.longitude ?? null,
  }
}
