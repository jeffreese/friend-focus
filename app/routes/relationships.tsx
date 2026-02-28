import { parseWithZod } from '@conform-to/zod/v4'
import { Check, GitFork, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Form, useNavigation } from 'react-router'
import { ConnectionGraph } from '~/components/connection-graph'
import { Button } from '~/components/ui/button'
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  // Build graph nodes from friends
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

  const filteredConnections = selectedNodeId
    ? connections.filter(
        c => c.friendAId === selectedNodeId || c.friendBId === selectedNodeId,
      )
    : connections

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Relationships</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border bg-muted p-0.5">
            <button
              type="button"
              onClick={() => setView('graph')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                view === 'graph'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              Graph
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                view === 'list'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              List
            </button>
          </div>
          <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={14} className="mr-1" />
            Add Connection
          </Button>
        </div>
      </div>

      {/* Add connection form */}
      {showAddForm && (
        <Form
          method="post"
          className="rounded-xl border bg-card p-4 mb-6 space-y-3"
          onSubmit={() => setShowAddForm(false)}
        >
          <input type="hidden" name="intent" value="add-connection" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label
                htmlFor="friendAId"
                className="text-xs font-medium text-muted-foreground"
              >
                Friend A
              </label>
              <select
                name="friendAId"
                id="friendAId"
                className="w-full mt-1 px-2 py-1.5 text-sm rounded-md border border-input bg-transparent"
                required
              >
                <option value="">Select...</option>
                {friendOptions.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="friendBId"
                className="text-xs font-medium text-muted-foreground"
              >
                Friend B
              </label>
              <select
                name="friendBId"
                id="friendBId"
                className="w-full mt-1 px-2 py-1.5 text-sm rounded-md border border-input bg-transparent"
                required
              >
                <option value="">Select...</option>
                {friendOptions.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="type"
                className="text-xs font-medium text-muted-foreground"
              >
                Type
              </label>
              <select
                name="type"
                id="type"
                className="w-full mt-1 px-2 py-1.5 text-sm rounded-md border border-input bg-transparent"
              >
                <option value="">None</option>
                {CONNECTION_TYPES.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="strength"
                className="text-xs font-medium text-muted-foreground"
              >
                Strength
              </label>
              <select
                name="strength"
                id="strength"
                defaultValue="3"
                className="w-full mt-1 px-2 py-1.5 text-sm rounded-md border border-input bg-transparent"
              >
                {CONNECTION_STRENGTHS.map((s, i) => (
                  <option key={s} value={i + 1}>
                    {i + 1} — {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="howTheyMet"
                className="text-xs font-medium text-muted-foreground"
              >
                How they met
              </label>
              <input
                type="text"
                name="howTheyMet"
                id="howTheyMet"
                className="w-full mt-1 px-2 py-1.5 text-sm rounded-md border border-input bg-transparent"
              />
            </div>
            <div>
              <label
                htmlFor="startDate"
                className="text-xs font-medium text-muted-foreground"
              >
                Since
              </label>
              <input
                type="date"
                name="startDate"
                id="startDate"
                className="w-full mt-1 px-2 py-1.5 text-sm rounded-md border border-input bg-transparent"
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

      {/* Graph view */}
      {view === 'graph' && nodes.length > 0 && (
        <div className="mb-6">
          <ConnectionGraph
            nodes={nodes}
            links={links}
            selectedNodeId={selectedNodeId}
            onNodeClick={id => setSelectedNodeId(id || null)}
          />
          {selectedNodeId && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Showing connections for{' '}
                <strong>{friendMap.get(selectedNodeId)}</strong>
              </span>
              <button
                type="button"
                className="text-xs underline"
                onClick={() => setSelectedNodeId(null)}
              >
                Clear filter
              </button>
            </div>
          )}
        </div>
      )}

      {view === 'graph' && nodes.length === 0 && (
        <div className="text-center py-16 mb-6">
          <GitFork size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No connections yet</h3>
          <p className="text-sm text-muted-foreground">
            Add connections between friends to see a social graph.
          </p>
        </div>
      )}

      {/* List view or filtered list under graph */}
      {(view === 'list' || selectedNodeId) && (
        <div className="space-y-2">
          {filteredConnections.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No connections found.
            </p>
          ) : (
            filteredConnections.map(c => {
              const nameA = friendMap.get(c.friendAId) || 'Unknown'
              const nameB = friendMap.get(c.friendBId) || 'Unknown'
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span>{nameA}</span>
                      <GitFork size={12} className="text-muted-foreground" />
                      <span>{nameB}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {c.type && <span>{c.type}</span>}
                      <span className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(v => (
                          <span
                            key={v}
                            className={`w-1.5 h-1.5 rounded-full ${
                              v <= (c.strength ?? 3) ? 'bg-primary' : 'bg-muted'
                            }`}
                          />
                        ))}
                        <span className="ml-1">
                          {CONNECTION_STRENGTHS[(c.strength ?? 3) - 1]}
                        </span>
                      </span>
                      {c.howTheyMet && <span>{c.howTheyMet}</span>}
                    </div>
                  </div>
                  {confirmDeleteId === c.id ? (
                    <div className="flex items-center gap-1">
                      <Form method="post">
                        <input
                          type="hidden"
                          name="intent"
                          value="delete-connection"
                        />
                        <input type="hidden" name="connectionId" value={c.id} />
                        <button
                          type="submit"
                          className="p-1 text-destructive hover:bg-destructive/10 rounded"
                        >
                          <Check size={14} />
                        </button>
                      </Form>
                      <button
                        type="button"
                        className="p-1 text-muted-foreground hover:bg-accent rounded"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="p-1 text-muted-foreground hover:text-destructive rounded"
                      onClick={() => setConfirmDeleteId(c.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
