import { parseWithZod } from '@conform-to/zod/v4'
import { Check, List, Network, Plus, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Form, Link, useNavigation } from 'react-router'
import { ConnectionGraph } from '~/components/connection-graph'
import { Button } from '~/components/ui/button'
import { EmptyState } from '~/components/ui/empty-state'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { PageHeader } from '~/components/ui/page-header'
import { SearchInput } from '~/components/ui/search-input'
import { Select } from '~/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Tab, TabList } from '~/components/ui/tabs'
import { APP_NAME } from '~/config'
import { getFriendOptions } from '~/lib/friend.server'
import {
  createConnection,
  deleteConnection,
  getConnections,
  getGraphData,
} from '~/lib/friend-connection.server'
import {
  CONNECTION_STRENGTHS,
  CONNECTION_TYPES,
  friendConnectionSchema,
} from '~/lib/schemas'
import { requireSession } from '~/lib/session.server'
import type { Route } from './+types/relationships'

export function meta() {
  return [{ title: `Relationships — ${APP_NAME}` }]
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)
  const userId = session.user.id
  const connections = getConnections(userId)
  const friendOptions = getFriendOptions(userId)
  const graphData = getGraphData(userId)
  return { connections, friendOptions, graphData }
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireSession(request)
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'add-connection') {
    const submission = parseWithZod(formData, {
      schema: friendConnectionSchema,
    })
    if (submission.status !== 'success') return submission.reply()
    createConnection(submission.value, session.user.id)
    return { ok: true }
  }

  if (intent === 'delete-connection') {
    const id = formData.get('connectionId') as string
    if (id) deleteConnection(id)
    return { ok: true }
  }

  return { ok: false }
}

export default function Relationships({ loaderData }: Route.ComponentProps) {
  const { connections, friendOptions, graphData } = loaderData
  const [view, setView] = useState<'graph' | 'list'>('graph')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [search, setSearch] = useState('')
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const friendMap = new Map(friendOptions.map(f => [f.id, f.name]))

  const connectionCounts = new Map<string, number>()
  for (const c of graphData.connections) {
    connectionCounts.set(
      c.friendAId,
      (connectionCounts.get(c.friendAId) ?? 0) + 1,
    )
    connectionCounts.set(
      c.friendBId,
      (connectionCounts.get(c.friendBId) ?? 0) + 1,
    )
  }

  const nodes = graphData.friends.map(f => ({
    id: f.id,
    name: f.name,
    color: f.tierColor || '#6b7280',
    val: (connectionCounts.get(f.id) ?? 0) + 1,
  }))

  const links = graphData.connections.map(c => ({
    source: c.friendAId,
    target: c.friendBId,
    strength: c.strength ?? 3,
  }))

  const selectedFriend = selectedNodeId
    ? friendOptions.find(f => f.id === selectedNodeId)
    : null

  const tierLegend = useMemo(() => {
    const seen = new Map<string, string>()
    for (const f of graphData.friends) {
      if (f.tierLabel && !seen.has(f.tierLabel)) {
        seen.set(f.tierLabel, f.tierColor || '#6b7280')
      }
    }
    return Array.from(seen.entries())
  }, [graphData.friends])

  const filteredConnections = useMemo(() => {
    let filtered = connections

    if (selectedNodeId) {
      filtered = filtered.filter(
        c => c.friendAId === selectedNodeId || c.friendBId === selectedNodeId,
      )
    }

    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(c => {
        const nameA = (friendMap.get(c.friendAId) || '').toLowerCase()
        const nameB = (friendMap.get(c.friendBId) || '').toLowerCase()
        return (
          nameA.includes(q) ||
          nameB.includes(q) ||
          (c.type && c.type.toLowerCase().includes(q)) ||
          (c.howTheyMet && c.howTheyMet.toLowerCase().includes(q))
        )
      })
    }

    return filtered
  }, [connections, search, selectedNodeId, friendMap])

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Relationships">
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={14} className="mr-1" />
          Add Connection
        </Button>
      </PageHeader>

      {/* Add connection form */}
      {showAddForm && (
        <Form
          method="post"
          className="rounded-xl border border-border-light bg-card p-4 mb-6 space-y-3"
          onSubmit={() => setShowAddForm(false)}
        >
          <input type="hidden" name="intent" value="add-connection" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label htmlFor="friendAId">Friend A</Label>
              <Select name="friendAId" id="friendAId" required>
                <option value="">Select...</option>
                {friendOptions.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="friendBId">Friend B</Label>
              <Select name="friendBId" id="friendBId" required>
                <option value="">Select...</option>
                {friendOptions.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select name="type" id="type">
                <option value="">None</option>
                {CONNECTION_TYPES.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="strength">Strength</Label>
              <Select name="strength" id="strength" defaultValue="3">
                {CONNECTION_STRENGTHS.map((s, i) => (
                  <option key={s} value={i + 1}>
                    {i + 1} — {s}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="howTheyMet">How they met</Label>
              <Input
                type="text"
                name="howTheyMet"
                id="howTheyMet"
                className="bg-card"
              />
            </div>
            <div>
              <Label htmlFor="startDate">Since</Label>
              <Input
                type="date"
                name="startDate"
                id="startDate"
                className="bg-card"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isSubmitting}>
              Save
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
          </div>
        </Form>
      )}

      <TabList className="mb-6">
        <Tab active={view === 'graph'} onClick={() => setView('graph')}>
          <Network size={14} />
          Graph View
        </Tab>
        <Tab active={view === 'list'} onClick={() => setView('list')}>
          <List size={14} />
          List View
        </Tab>
      </TabList>

      {/* Graph view */}
      {view === 'graph' && (
        <div className="rounded-xl border border-border-light bg-card mb-6 overflow-hidden">
          <div className="p-4 border-b border-border-light flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedFriend
                ? `Showing connections for ${selectedFriend.name}`
                : nodes.length > 0
                  ? 'Click a node to filter connections'
                  : 'Add connections to see the social graph'}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {tierLegend.map(([label, color]) => (
                <span key={label} className="flex items-center gap-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {label}
                </span>
              ))}
              {selectedNodeId && (
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(null)}
                  className="ml-2 text-primary hover:text-primary/80"
                >
                  Clear filter
                </button>
              )}
            </div>
          </div>
          {nodes.length > 0 ? (
            <ConnectionGraph
              nodes={nodes}
              links={links}
              selectedNodeId={selectedNodeId}
              onNodeClick={id =>
                setSelectedNodeId(id === selectedNodeId ? null : id || null)
              }
            />
          ) : (
            <div style={{ height: 380 }} className="flex items-center">
              <EmptyState
                icon={Network}
                title="No connections yet"
                description="Add connections between friends to visualize your social graph."
                className="flex-1"
              />
            </div>
          )}
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="rounded-xl border border-border-light bg-card">
          <div className="p-4 border-b border-border-light flex items-center justify-between">
            <h3 className="font-semibold text-sm">
              {selectedFriend
                ? `Connections for ${selectedFriend.name}`
                : 'All Connections'}
              {selectedNodeId && (
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(null)}
                  className="ml-2 text-xs text-primary hover:text-primary/80 font-normal"
                >
                  Show all
                </button>
              )}
            </h3>
            <SearchInput
              placeholder="Search connections..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-64"
            />
          </div>
          {filteredConnections.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Friend A</TableHead>
                  <TableHead>Friend B</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Strength</TableHead>
                  <TableHead>How They Met</TableHead>
                  <TableHead className="text-right w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConnections.map(c => (
                  <ConnectionRow
                    key={c.id}
                    connection={c}
                    nameA={friendMap.get(c.friendAId) || 'Unknown'}
                    nameB={friendMap.get(c.friendBId) || 'Unknown'}
                  />
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={Network}
              title={
                connections.length === 0
                  ? 'No connections yet'
                  : 'No results found'
              }
              description={
                connections.length === 0
                  ? 'Add a connection above to get started.'
                  : 'No connections match your search.'
              }
            />
          )}
        </div>
      )}
    </div>
  )
}

function ConnectionRow({
  connection,
  nameA,
  nameB,
}: {
  connection: {
    id: string
    type: string | null
    strength: number | null
    howTheyMet: string | null
    friendAId: string
    friendBId: string
  }
  nameA: string
  nameB: string
}) {
  const [confirming, setConfirming] = useState(false)
  const strengthLabel =
    CONNECTION_STRENGTHS[(connection.strength ?? 3) - 1] || 'Unknown'

  return (
    <TableRow className="group">
      <TableCell className="font-medium">
        <Link
          to={`/friends/${connection.friendAId}`}
          className="text-primary hover:underline"
        >
          {nameA}
        </Link>
      </TableCell>
      <TableCell className="font-medium">
        <Link
          to={`/friends/${connection.friendBId}`}
          className="text-primary hover:underline"
        >
          {nameB}
        </Link>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {connection.type || '—'}
      </TableCell>
      <TableCell className="text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  i < (connection.strength ?? 3) ? 'bg-primary' : 'bg-border'
                }`}
              />
            ))}
          </span>
          <span className="text-xs">{strengthLabel}</span>
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {connection.howTheyMet || '—'}
      </TableCell>
      <TableCell className="text-right">
        {confirming ? (
          <div className="flex items-center justify-end gap-1">
            <Form method="post">
              <input type="hidden" name="intent" value="delete-connection" />
              <input type="hidden" name="connectionId" value={connection.id} />
              <button
                type="submit"
                className="text-destructive hover:text-destructive/80 transition-colors p-1"
                title="Confirm delete"
              >
                <Check size={14} />
              </button>
            </Form>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              title="Cancel"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-muted-foreground hover:text-destructive transition-colors p-1 opacity-0 group-hover:opacity-100"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        )}
      </TableCell>
    </TableRow>
  )
}
