import { parseWithZod } from '@conform-to/zod/v4'
import { ArrowLeft } from 'lucide-react'
import { Form, Link, redirect, useActionData } from 'react-router'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { APP_NAME } from '~/config'
import { getActivities } from '~/lib/activity.server'
import { createEvent } from '~/lib/event.server'
import { EVENT_VIBE_LABELS, EVENT_VIBES, eventSchema } from '~/lib/schemas'
import { requireSession } from '~/lib/session.server'
import type { Route } from './+types/events.new'

export function meta() {
  return [{ title: `New Event — ${APP_NAME}` }]
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)
  const activities = getActivities(session.user.id)
  return { activities }
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireSession(request)
  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: eventSchema })

  if (submission.status !== 'success') {
    return submission.reply()
  }

  const evt = createEvent(submission.value, session.user.id)
  return redirect(`/events/${evt.id}`)
}

export default function EventNew({ loaderData }: Route.ComponentProps) {
  const { activities } = loaderData
  const lastResult = useActionData<typeof action>()

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to="/events"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Events
      </Link>

      <h2 className="text-2xl font-bold mb-6">New Event</h2>

      <Form method="post" className="space-y-5 rounded-xl border bg-card p-6">
        {/* Name */}
        <div>
          <Label htmlFor="name">
            Event Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            placeholder="e.g., Poker Night"
            error={
              !!(
                lastResult &&
                'error' in lastResult &&
                (lastResult.error as Record<string, unknown>)?.name
              )
            }
          />
        </div>

        {/* Activity */}
        <div>
          <Label htmlFor="activityId">Activity</Label>
          <select
            id="activityId"
            name="activityId"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">None</option>
            {activities.map(a => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" />
          </div>
          <div>
            <Label htmlFor="time">Time</Label>
            <Input id="time" name="time" type="time" />
          </div>
        </div>

        {/* Location */}
        <div>
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" placeholder="e.g., My place" />
        </div>

        {/* Capacity and Vibe */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="capacity">Capacity</Label>
            <Input
              id="capacity"
              name="capacity"
              type="number"
              min={1}
              max={1000}
              placeholder="e.g., 8"
            />
          </div>
          <div>
            <Label htmlFor="vibe">Vibe</Label>
            <select
              id="vibe"
              name="vibe"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">None</option>
              {EVENT_VIBES.map(v => (
                <option key={v} value={v}>
                  {EVENT_VIBE_LABELS[v]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit">Create Event</Button>
          <Button variant="outline" asChild>
            <Link to="/events">Cancel</Link>
          </Button>
        </div>
      </Form>
    </div>
  )
}
