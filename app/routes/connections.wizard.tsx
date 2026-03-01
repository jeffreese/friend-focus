import { parseWithZod } from '@conform-to/zod/v4'
import { ArrowUp, Link2, Users } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ConnectionWizardRow } from '~/components/connection-wizard-row'
import { BackLink } from '~/components/ui/back-link'
import { Button } from '~/components/ui/button'
import { EmptyState } from '~/components/ui/empty-state'
import { PageHeader } from '~/components/ui/page-header'
import { Select } from '~/components/ui/select'
import { APP_NAME } from '~/config'
import { getFriend, getFriends } from '~/lib/friend.server'
import {
  createConnection,
  deleteConnection,
  getConnections,
  updateConnection,
} from '~/lib/friend-connection.server'
import { connectionWizardSchema } from '~/lib/schemas'
import { requireSession } from '~/lib/session.server'
import type { Route } from './+types/connections.wizard'

export function meta() {
  return [{ title: `Connection Wizard — ${APP_NAME}` }]
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)
  const userId = session.user.id

  const friends = getFriends({ userId, sortBy: 'closeness' })
  const allConnections = getConnections(userId)

  return { friends, allConnections }
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireSession(request)
  const userId = session.user.id
  const formData = await request.formData()
  const submission = parseWithZod(formData, {
    schema: connectionWizardSchema,
  })

  if (submission.status !== 'success') {
    return { ok: false }
  }

  const {
    intent,
    selectedFriendId,
    otherFriendId,
    connectionId,
    type,
    strength,
  } = submission.value

  // Verify ownership of both friends
  const fA = getFriend(selectedFriendId, userId)
  if (!fA) return { ok: false }
  const fB = getFriend(otherFriendId, userId)
  if (!fB) return { ok: false }

  if (intent === 'set-connection') {
    if (connectionId) {
      updateConnection(connectionId, {
        type: type || null,
        strength: strength ?? 3,
      })
    } else {
      createConnection(
        {
          friendAId: selectedFriendId,
          friendBId: otherFriendId,
          type: type || null,
          strength: strength ?? 3,
        },
        userId,
      )
    }
  } else if (intent === 'delete-connection' && connectionId) {
    deleteConnection(connectionId)
  }

  return { ok: true }
}

export default function ConnectionWizard({ loaderData }: Route.ComponentProps) {
  const { friends, allConnections } = loaderData
  const [selectedFriendId, setSelectedFriendId] = useState(friends[0]?.id ?? '')
  const topRef = useRef<HTMLDivElement>(null)

  // Build connection count per friend (for dropdown labels)
  const connectionCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of allConnections) {
      counts.set(c.friendAId, (counts.get(c.friendAId) ?? 0) + 1)
      counts.set(c.friendBId, (counts.get(c.friendBId) ?? 0) + 1)
    }
    return counts
  }, [allConnections])

  // Build connections map for the selected friend: otherFriendId -> connection
  const connectionsMap = useMemo(() => {
    const map = new Map<
      string,
      { id: string; type: string | null; strength: number }
    >()
    for (const c of allConnections) {
      if (c.friendAId === selectedFriendId) {
        map.set(c.friendBId, {
          id: c.id,
          type: c.type,
          strength: c.strength,
        })
      } else if (c.friendBId === selectedFriendId) {
        map.set(c.friendAId, {
          id: c.id,
          type: c.type,
          strength: c.strength,
        })
      }
    }
    return map
  }, [allConnections, selectedFriendId])

  if (friends.length < 2) {
    return (
      <div className="max-w-3xl mx-auto">
        <BackLink to="/relationships">Relationships</BackLink>
        <PageHeader title="Connection Wizard" />
        <EmptyState
          icon={Users}
          title="Not Enough Friends"
          description="Add at least two friends before using the connection wizard."
          action={
            <Button asChild>
              <Link to="/friends/new">Add Friend</Link>
            </Button>
          }
        />
      </div>
    )
  }

  const otherFriends = friends.filter(f => f.id !== selectedFriendId)
  const connectedCount = connectionsMap.size

  return (
    <div className="max-w-3xl mx-auto">
      <BackLink to="/relationships">Relationships</BackLink>
      <PageHeader title="Connection Wizard" />

      {/* Friend selector */}
      <div ref={topRef} className="mb-6">
        <label
          htmlFor="friend-select"
          className="block text-sm font-medium mb-1.5"
        >
          Friend
        </label>
        <Select
          id="friend-select"
          value={selectedFriendId}
          onChange={e => setSelectedFriendId(e.target.value)}
        >
          {friends.map(f => {
            const count = connectionCounts.get(f.id) ?? 0
            return (
              <option key={f.id} value={f.id}>
                {f.name} ({count} connection{count !== 1 ? 's' : ''})
              </option>
            )
          })}
        </Select>
        <p className="text-sm text-muted-foreground mt-1.5">
          Set how this friend is connected to others
        </p>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
        <span>
          {otherFriends.length} friend{otherFriends.length !== 1 ? 's' : ''}
        </span>
        <span>{connectedCount} connected</span>
      </div>

      {/* Connection rows */}
      <div className="space-y-2 mb-6">
        {otherFriends.map(f => (
          <ConnectionWizardRow
            key={f.id}
            friend={{
              id: f.id,
              name: f.name,
              tierLabel: f.tierLabel,
              tierColor: f.tierColor,
            }}
            selectedFriendId={selectedFriendId}
            currentConnection={connectionsMap.get(f.id) ?? null}
          />
        ))}
      </div>

      {/* Back to top */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => topRef.current?.scrollIntoView({ behavior: 'smooth' })}
        >
          <ArrowUp className="size-4 mr-1" />
          Back to top
        </Button>
      </div>
    </div>
  )
}
