import {
  autocomplete,
  getPlaceDetails,
  isPlacesEnabled,
} from '~/lib/places.server'
import { requireSession } from '~/lib/session.server'
import type { Route } from './+types/api.places'

export async function loader({ request }: Route.LoaderArgs) {
  await requireSession(request)

  if (!isPlacesEnabled()) {
    return Response.json({ suggestions: [], enabled: false })
  }

  const url = new URL(request.url)
  const input = url.searchParams.get('input')
  const placeId = url.searchParams.get('placeId')

  if (placeId) {
    const details = await getPlaceDetails(placeId)
    return Response.json({ details })
  }

  if (input) {
    const suggestions = await autocomplete(input)
    return Response.json({ suggestions, enabled: true })
  }

  return Response.json({ suggestions: [], enabled: true })
}
