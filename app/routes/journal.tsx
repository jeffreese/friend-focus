import { BookOpen, Calendar, Edit3, Plus, Trash2, User } from 'lucide-react'
import { useState } from 'react'
import { Form, Link, useSearchParams } from 'react-router'
import { Button } from '~/components/ui/button'
import { APP_NAME } from '~/config'
import { formatRelativeDate } from '~/lib/format'
import { createNote, deleteNote, getNotes, updateNote } from '~/lib/note.server'
import { requireSession } from '~/lib/session.server'
import type { Route } from './+types/journal'

export function meta() {
  return [{ title: `Journal — ${APP_NAME}` }]
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)
  const url = new URL(request.url)
  const type = url.searchParams.get('type') || undefined
  const search = url.searchParams.get('search') || undefined
  const notes = getNotes(session.user.id, { type, search })
  return { notes }
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireSession(request)
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'add-note') {
    const content = (formData.get('content') as string)?.trim()
    if (!content) return { error: 'Content is required' }
    createNote({ content, type: 'journal' }, session.user.id)
    return { ok: true }
  }

  if (intent === 'update-note') {
    const noteId = formData.get('noteId') as string
    const content = (formData.get('content') as string)?.trim()
    if (noteId && content) {
      updateNote(noteId, content, session.user.id)
    }
    return { ok: true }
  }

  if (intent === 'delete-note') {
    const noteId = formData.get('noteId') as string
    if (noteId) deleteNote(noteId, session.user.id)
    return { ok: true }
  }

  return { ok: false }
}

const TYPE_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Friends', value: 'friend' },
  { label: 'Events', value: 'event' },
  { label: 'Journal', value: 'journal' },
]

function getEntryIcon(type: string) {
  if (type === 'friend')
    return { icon: User, color: 'bg-blue-100 text-blue-600' }
  if (type === 'event')
    return { icon: Calendar, color: 'bg-green-100 text-green-600' }
  return { icon: BookOpen, color: 'bg-purple-100 text-purple-600' }
}

export default function Journal({ loaderData }: Route.ComponentProps) {
  const { notes } = loaderData
  const [searchParams, setSearchParams] = useSearchParams()
  const currentType = searchParams.get('type') || ''
  const [showNewForm, setShowNewForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Journal</h2>
        <Button size="sm" onClick={() => setShowNewForm(!showNewForm)}>
          <Plus size={14} className="mr-1" />
          New Entry
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        {TYPE_FILTERS.map(f => (
          <button
            key={f.value}
            type="button"
            onClick={() => {
              const params = new URLSearchParams(searchParams)
              if (f.value) {
                params.set('type', f.value)
              } else {
                params.delete('type')
              }
              setSearchParams(params, { replace: true })
            }}
            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
              currentType === f.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* New journal entry form */}
      {showNewForm && (
        <Form
          method="post"
          className="rounded-xl border bg-card p-4 mb-6"
          onSubmit={() => setShowNewForm(false)}
        >
          <input type="hidden" name="intent" value="add-note" />
          <textarea
            name="content"
            rows={3}
            required
            placeholder="Write a journal entry..."
            className="w-full px-3 py-2 text-sm rounded-md border border-input bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="flex gap-2 mt-2">
            <Button type="submit" size="sm">
              Save
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowNewForm(false)}
            >
              Cancel
            </Button>
          </div>
        </Form>
      )}

      {/* Notes timeline */}
      {notes.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No entries yet</h3>
          <p className="text-sm text-muted-foreground">
            {currentType
              ? 'No entries match your filter.'
              : 'Start journaling to track your thoughts and interactions.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(n => {
            const { icon: Icon, color } = getEntryIcon(n.type)
            const isEditing = editingId === n.id
            const isConfirmingDelete = confirmDeleteId === n.id

            return (
              <div
                key={n.id}
                className="flex gap-3 rounded-xl border bg-card p-4 group"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}
                >
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  {/* Subject */}
                  {n.type === 'friend' && n.friendName && (
                    <Link
                      to={`/friends/${n.friendId}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {n.friendName}
                    </Link>
                  )}
                  {n.type === 'event' && n.eventName && (
                    <Link
                      to={`/events/${n.eventId}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {n.eventName}
                    </Link>
                  )}

                  {/* Content */}
                  {isEditing ? (
                    <Form method="post" onSubmit={() => setEditingId(null)}>
                      <input type="hidden" name="intent" value="update-note" />
                      <input type="hidden" name="noteId" value={n.id} />
                      <textarea
                        name="content"
                        defaultValue={n.content}
                        rows={2}
                        required
                        className="w-full mt-1 px-2 py-1.5 text-sm rounded-md border border-input bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <div className="flex gap-1 mt-1">
                        <Button type="submit" size="sm" variant="ghost">
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </Form>
                  ) : (
                    <p className="text-sm mt-0.5 whitespace-pre-wrap">
                      {n.content}
                    </p>
                  )}

                  <span className="text-xs text-muted-foreground mt-1 block">
                    {n.createdAt ? formatRelativeDate(n.createdAt) : ''}
                  </span>
                </div>

                {/* Actions */}
                {!isEditing && (
                  <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      className="p-1 text-muted-foreground hover:text-foreground rounded"
                      onClick={() => setEditingId(n.id)}
                    >
                      <Edit3 size={13} />
                    </button>
                    {isConfirmingDelete ? (
                      <Form method="post">
                        <input
                          type="hidden"
                          name="intent"
                          value="delete-note"
                        />
                        <input type="hidden" name="noteId" value={n.id} />
                        <button
                          type="submit"
                          className="p-1 text-destructive hover:bg-destructive/10 rounded"
                        >
                          <Trash2 size={13} />
                        </button>
                      </Form>
                    ) : (
                      <button
                        type="button"
                        className="p-1 text-muted-foreground hover:text-destructive rounded"
                        onClick={() => setConfirmDeleteId(n.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
