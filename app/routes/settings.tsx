import { ChevronDown, ChevronUp, Edit3, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Form, useNavigation } from 'react-router'
import { Button } from '~/components/ui/button'
import { APP_NAME } from '~/config'
import {
  createActivity,
  deleteActivity,
  getActivities,
  reorderActivities,
  updateActivity,
} from '~/lib/activity.server'
import {
  createClosenessTier,
  deleteClosenessTier,
  getClosenessTiers,
  reorderClosenessTiers,
  updateClosenessTier,
} from '~/lib/closeness.server'
import { requireSession } from '~/lib/session.server'
import type { Route } from './+types/settings'

export function meta() {
  return [{ title: `Settings — ${APP_NAME}` }]
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)
  const userId = session.user.id
  const tiers = getClosenessTiers(userId)
  const activities = getActivities(userId)
  return { tiers, activities }
}

function moveItem<T>(arr: T[], fromIndex: number, direction: -1 | 1): T[] {
  const toIndex = fromIndex + direction
  if (toIndex < 0 || toIndex >= arr.length) return arr
  const copy = [...arr]
  ;[copy[fromIndex], copy[toIndex]] = [copy[toIndex], copy[fromIndex]]
  return copy
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireSession(request)
  const userId = session.user.id
  const formData = await request.formData()
  const intent = formData.get('intent')

  // Closeness Tiers
  if (intent === 'create-tier') {
    const label = (formData.get('label') as string)?.trim()
    const color = (formData.get('color') as string) || null
    if (!label) return { error: 'Label is required' }
    createClosenessTier({ label, color }, userId)
    return { ok: true }
  }

  if (intent === 'update-tier') {
    const id = formData.get('tierId') as string
    const label = (formData.get('label') as string)?.trim()
    const color = (formData.get('color') as string) || null
    if (id && label) updateClosenessTier(id, { label, color }, userId)
    return { ok: true }
  }

  if (intent === 'delete-tier') {
    const id = formData.get('tierId') as string
    if (id) deleteClosenessTier(id, userId)
    return { ok: true }
  }

  if (intent === 'reorder-tiers') {
    const orderedIds = JSON.parse(
      (formData.get('orderedIds') as string) || '[]',
    )
    if (Array.isArray(orderedIds)) reorderClosenessTiers(orderedIds, userId)
    return { ok: true }
  }

  // Activities
  if (intent === 'create-activity') {
    const name = (formData.get('name') as string)?.trim()
    if (!name) return { error: 'Name is required' }
    createActivity({ name }, userId)
    return { ok: true }
  }

  if (intent === 'update-activity') {
    const id = formData.get('activityId') as string
    const name = (formData.get('name') as string)?.trim()
    if (id && name) updateActivity(id, { name }, userId)
    return { ok: true }
  }

  if (intent === 'delete-activity') {
    const id = formData.get('activityId') as string
    if (id) deleteActivity(id, userId)
    return { ok: true }
  }

  if (intent === 'reorder-activities') {
    const orderedIds = JSON.parse(
      (formData.get('orderedIds') as string) || '[]',
    )
    if (Array.isArray(orderedIds)) reorderActivities(orderedIds, userId)
    return { ok: true }
  }

  return { ok: false }
}

export default function Settings({ loaderData }: Route.ComponentProps) {
  const { tiers, activities } = loaderData
  const [tab, setTab] = useState<'tiers' | 'activities'>('tiers')
  const [editingTierId, setEditingTierId] = useState<string | null>(null)
  const [editingActivityId, setEditingActivityId] = useState<string | null>(
    null,
  )
  const [showAddTier, setShowAddTier] = useState(false)
  const [showAddActivity, setShowAddActivity] = useState(false)
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  function handleTierReorder(index: number, direction: -1 | 1) {
    const reordered = moveItem(tiers, index, direction)
    const form = document.createElement('form')
    form.method = 'post'
    form.style.display = 'none'
    const intentInput = document.createElement('input')
    intentInput.name = 'intent'
    intentInput.value = 'reorder-tiers'
    const idsInput = document.createElement('input')
    idsInput.name = 'orderedIds'
    idsInput.value = JSON.stringify(reordered.map(t => t.id))
    form.appendChild(intentInput)
    form.appendChild(idsInput)
    document.body.appendChild(form)
    form.submit()
  }

  function handleActivityReorder(index: number, direction: -1 | 1) {
    const reordered = moveItem(activities, index, direction)
    const form = document.createElement('form')
    form.method = 'post'
    form.style.display = 'none'
    const intentInput = document.createElement('input')
    intentInput.name = 'intent'
    intentInput.value = 'reorder-activities'
    const idsInput = document.createElement('input')
    idsInput.name = 'orderedIds'
    idsInput.value = JSON.stringify(reordered.map(a => a.id))
    form.appendChild(intentInput)
    form.appendChild(idsInput)
    document.body.appendChild(form)
    form.submit()
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      {/* Tabs */}
      <div className="flex items-center gap-3 mb-6 border-b">
        <button
          type="button"
          onClick={() => setTab('tiers')}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'tiers'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Closeness Tiers
        </button>
        <button
          type="button"
          onClick={() => setTab('activities')}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'activities'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Activities
        </button>
      </div>

      {/* Closeness Tiers tab */}
      {tab === 'tiers' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Define closeness tiers to categorize your friendships.
            </p>
            <Button size="sm" onClick={() => setShowAddTier(!showAddTier)}>
              <Plus size={14} className="mr-1" />
              Add Tier
            </Button>
          </div>

          {showAddTier && (
            <Form
              method="post"
              className="flex items-end gap-2 mb-4 p-3 rounded-lg border bg-card"
              onSubmit={() => setShowAddTier(false)}
            >
              <input type="hidden" name="intent" value="create-tier" />
              <div>
                <label
                  htmlFor="tier-color"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Color
                </label>
                <input
                  type="color"
                  name="color"
                  id="tier-color"
                  defaultValue="#6b7280"
                  className="block mt-1 w-8 h-8 rounded border border-input cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="tier-label"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Label
                </label>
                <input
                  type="text"
                  name="label"
                  id="tier-label"
                  required
                  className="w-full mt-1 px-2 py-1.5 text-sm rounded-md border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                Save
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddTier(false)}
              >
                Cancel
              </Button>
            </Form>
          )}

          <div className="space-y-2">
            {tiers.map((tier, index) => {
              const isEditing = editingTierId === tier.id
              return (
                <div
                  key={tier.id}
                  className="flex items-center gap-2 rounded-lg border bg-card p-3"
                >
                  {/* Reorder buttons */}
                  <div className="flex flex-col">
                    <button
                      type="button"
                      disabled={index === 0 || isSubmitting}
                      onClick={() => handleTierReorder(index, -1)}
                      className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={index === tiers.length - 1 || isSubmitting}
                      onClick={() => handleTierReorder(index, 1)}
                      className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  {isEditing ? (
                    <Form
                      method="post"
                      className="flex items-end gap-2 flex-1"
                      onSubmit={() => setEditingTierId(null)}
                    >
                      <input type="hidden" name="intent" value="update-tier" />
                      <input type="hidden" name="tierId" value={tier.id} />
                      <input
                        type="color"
                        name="color"
                        defaultValue={tier.color || '#6b7280'}
                        className="w-8 h-8 rounded border border-input cursor-pointer"
                      />
                      <input
                        type="text"
                        name="label"
                        defaultValue={tier.label}
                        required
                        className="flex-1 px-2 py-1.5 text-sm rounded-md border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <Button type="submit" size="sm" disabled={isSubmitting}>
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTierId(null)}
                      >
                        Cancel
                      </Button>
                    </Form>
                  ) : (
                    <>
                      <div
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{
                          backgroundColor: tier.color || '#6b7280',
                        }}
                      />
                      <span className="text-sm font-medium flex-1">
                        {tier.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {tier.friendCount} friend
                        {tier.friendCount !== 1 ? 's' : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingTierId(tier.id)}
                        className="p-1 text-muted-foreground hover:text-foreground rounded"
                      >
                        <Edit3 size={13} />
                      </button>
                      <Form method="post">
                        <input
                          type="hidden"
                          name="intent"
                          value="delete-tier"
                        />
                        <input type="hidden" name="tierId" value={tier.id} />
                        <button
                          type="submit"
                          className="p-1 text-muted-foreground hover:text-destructive rounded"
                          disabled={isSubmitting}
                        >
                          <Trash2 size={13} />
                        </button>
                      </Form>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Activities tab */}
      {tab === 'activities' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Manage activities that friends can be rated on.
            </p>
            <Button
              size="sm"
              onClick={() => setShowAddActivity(!showAddActivity)}
            >
              <Plus size={14} className="mr-1" />
              Add Activity
            </Button>
          </div>

          {showAddActivity && (
            <Form
              method="post"
              className="flex items-end gap-2 mb-4 p-3 rounded-lg border bg-card"
              onSubmit={() => setShowAddActivity(false)}
            >
              <input type="hidden" name="intent" value="create-activity" />
              <div className="flex-1">
                <label
                  htmlFor="activity-name"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="activity-name"
                  required
                  className="w-full mt-1 px-2 py-1.5 text-sm rounded-md border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                Save
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddActivity(false)}
              >
                Cancel
              </Button>
            </Form>
          )}

          <div className="space-y-2">
            {activities.map((act, index) => {
              const isEditing = editingActivityId === act.id
              return (
                <div
                  key={act.id}
                  className="flex items-center gap-2 rounded-lg border bg-card p-3"
                >
                  {/* Reorder buttons */}
                  <div className="flex flex-col">
                    <button
                      type="button"
                      disabled={index === 0 || isSubmitting}
                      onClick={() => handleActivityReorder(index, -1)}
                      className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={index === activities.length - 1 || isSubmitting}
                      onClick={() => handleActivityReorder(index, 1)}
                      className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  {isEditing ? (
                    <Form
                      method="post"
                      className="flex items-end gap-2 flex-1"
                      onSubmit={() => setEditingActivityId(null)}
                    >
                      <input
                        type="hidden"
                        name="intent"
                        value="update-activity"
                      />
                      <input type="hidden" name="activityId" value={act.id} />
                      <input
                        type="text"
                        name="name"
                        defaultValue={act.name}
                        required
                        className="flex-1 px-2 py-1.5 text-sm rounded-md border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <Button type="submit" size="sm" disabled={isSubmitting}>
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingActivityId(null)}
                      >
                        Cancel
                      </Button>
                    </Form>
                  ) : (
                    <>
                      <span className="text-sm font-medium flex-1">
                        {act.name}
                      </span>
                      {act.isDefault && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                          Default
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {act.ratingCount} rating
                        {act.ratingCount !== 1 ? 's' : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingActivityId(act.id)}
                        className="p-1 text-muted-foreground hover:text-foreground rounded"
                      >
                        <Edit3 size={13} />
                      </button>
                      <Form method="post">
                        <input
                          type="hidden"
                          name="intent"
                          value="delete-activity"
                        />
                        <input type="hidden" name="activityId" value={act.id} />
                        <button
                          type="submit"
                          className="p-1 text-muted-foreground hover:text-destructive rounded"
                          disabled={isSubmitting}
                        >
                          <Trash2 size={13} />
                        </button>
                      </Form>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
