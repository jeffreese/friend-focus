import { getFriend } from '~/lib/friend.server'
import {
  createGoogleContact as createGoogleContactApi,
  GoogleAuthError,
  hasContactsReadScope,
  hasContactsWriteScope,
  updateGoogleContact as updateGoogleContactApi,
} from '~/lib/google-contacts.server'
import {
  applyDiffResolutions,
  getCachedContact,
  getCachedContactRawJson,
  importGoogleContactAsFriend,
  linkFriendToGoogleContact,
  syncGoogleContactsToCache,
  syncLinkedFriend,
  unlinkFriendFromGoogleContact,
} from '~/lib/google-contacts-sync.server'
import { requireSession } from '~/lib/session.server'
import type { Route } from './+types/api.google-contacts'

export async function action({ request }: Route.ActionArgs) {
  const session = await requireSession(request)
  const userId = session.user.id

  try {
    const body = (await request.json()) as {
      intent: string
      [key: string]: unknown
    }

    switch (body.intent) {
      // ─── Bulk sync: Google → local cache ────────────────────────────
      case 'bulk-sync': {
        if (!hasContactsReadScope(userId)) {
          return Response.json(
            { error: 'Google Contacts permission not granted' },
            { status: 403 },
          )
        }
        const result = await syncGoogleContactsToCache(userId)
        return Response.json(result)
      }

      // ─── Import a cached contact as a new friend ────────────────────
      case 'import': {
        const resourceName = body.resourceName as string
        if (!resourceName) {
          return Response.json(
            { error: 'resourceName is required' },
            { status: 400 },
          )
        }

        const friendId = importGoogleContactAsFriend(userId, resourceName, {
          email: (body.selectedEmail as string) || undefined,
          phone: (body.selectedPhone as string) || undefined,
          address: (body.selectedAddress as string) || undefined,
        })

        return Response.json({ ok: true, friendId })
      }

      // ─── Link an existing friend to a Google contact ────────────────
      case 'link': {
        const friendId = body.friendId as string
        const resourceName = body.resourceName as string
        if (!friendId || !resourceName) {
          return Response.json(
            { error: 'friendId and resourceName are required' },
            { status: 400 },
          )
        }

        const cached = getCachedContact(userId, resourceName)
        if (!cached) {
          return Response.json(
            { error: 'Contact not found in cache' },
            { status: 404 },
          )
        }

        linkFriendToGoogleContact(
          friendId,
          resourceName,
          cached.etag || '',
          userId,
        )

        return Response.json({ ok: true })
      }

      // ─── Unlink a friend from their Google contact ──────────────────
      case 'unlink': {
        const friendId = body.friendId as string
        if (!friendId) {
          return Response.json(
            { error: 'friendId is required' },
            { status: 400 },
          )
        }

        unlinkFriendFromGoogleContact(friendId, userId)
        return Response.json({ ok: true })
      }

      // ─── Sync a single linked friend ────────────────────────────────
      case 'sync-friend': {
        const friendId = body.friendId as string
        const forceCompare = body.forceCompare === true
        if (!friendId) {
          return Response.json(
            { error: 'friendId is required' },
            { status: 400 },
          )
        }

        if (!hasContactsReadScope(userId)) {
          return Response.json(
            { error: 'Google Contacts permission not granted' },
            { status: 403 },
          )
        }

        const result = await syncLinkedFriend(userId, friendId, {
          forceCompare,
        })
        return Response.json(result)
      }

      // ─── Resolve sync diffs ─────────────────────────────────────────
      case 'resolve-diffs': {
        const friendId = body.friendId as string
        const resolutions = body.resolutions as Array<{
          field: string
          action: 'use-google' | 'keep-app' | 'push-to-google' | 'skip'
          value?: string
        }>

        if (!friendId || !resolutions) {
          return Response.json(
            { error: 'friendId and resolutions are required' },
            { status: 400 },
          )
        }

        // Apply local resolutions (use-google, keep-app, skip)
        applyDiffResolutions(friendId, userId, resolutions)

        // Handle push-to-google resolutions (send app values to Google)
        const pushFields = resolutions.filter(
          r => r.action === 'push-to-google' && r.value,
        )
        if (pushFields.length > 0 && hasContactsWriteScope(userId)) {
          const friendData = getFriend(friendId, userId)
          if (
            friendData?.googleContactResourceName &&
            friendData?.googleContactEtag
          ) {
            const fields: Record<string, string | null> = {}
            for (const pf of pushFields) {
              fields[pf.field] = pf.value || null
            }
            try {
              await updateGoogleContactApi(
                userId,
                friendData.googleContactResourceName,
                friendData.googleContactEtag,
                fields,
              )
            } catch {
              // Swallow Google push errors — local changes still applied
            }
          }
        }

        return Response.json({ ok: true })
      }

      // ─── Push data to Google (requires write scope) ─────────────────
      case 'push-to-google': {
        if (!hasContactsWriteScope(userId)) {
          return Response.json(
            { error: 'write-scope-required' },
            { status: 403 },
          )
        }

        const friendId = body.friendId as string
        const resourceName = body.resourceName as string
        const etag = body.etag as string
        const fields = body.fields as Record<string, string | null>

        if (!friendId || !resourceName || !etag || !fields) {
          return Response.json(
            { error: 'friendId, resourceName, etag, and fields are required' },
            { status: 400 },
          )
        }

        const result = await updateGoogleContactApi(
          userId,
          resourceName,
          etag,
          fields,
        )
        return Response.json({ ok: true, etag: result.etag })
      }

      // ─── Create a Google contact from a friend ──────────────────────
      case 'create-google-contact': {
        if (!hasContactsWriteScope(userId)) {
          return Response.json(
            { error: 'write-scope-required' },
            { status: 403 },
          )
        }

        const friendId = body.friendId as string
        const data = body.data as {
          name: string
          email?: string
          phone?: string
          address?: string
        }

        if (!friendId || !data?.name) {
          return Response.json(
            { error: 'friendId and data.name are required' },
            { status: 400 },
          )
        }

        const result = await createGoogleContactApi(userId, data)
        linkFriendToGoogleContact(
          friendId,
          result.resourceName,
          result.etag,
          userId,
        )

        return Response.json({ ok: true, resourceName: result.resourceName })
      }

      // ─── Get raw contact data (for multi-value resolution) ──────────
      case 'get-contact-details': {
        const resourceName = body.resourceName as string
        if (!resourceName) {
          return Response.json(
            { error: 'resourceName is required' },
            { status: 400 },
          )
        }

        const rawContact = getCachedContactRawJson(userId, resourceName)
        if (!rawContact) {
          return Response.json({ error: 'Contact not found' }, { status: 404 })
        }

        return Response.json({
          displayName: rawContact.displayName,
          emails: rawContact.emails,
          phoneNumbers: rawContact.phoneNumbers,
          addresses: rawContact.addresses,
        })
      }

      default:
        return Response.json({ error: 'Unknown intent' }, { status: 400 })
    }
  } catch (err) {
    if (err instanceof GoogleAuthError) {
      return Response.json(
        {
          error: 'google-auth-expired',
          message:
            'Your Google connection has expired. Please reconnect on the Profile page.',
        },
        { status: 401 },
      )
    }

    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred'
    return Response.json({ error: message }, { status: 500 })
  }
}
