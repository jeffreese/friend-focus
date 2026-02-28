import { parseWithZod } from '@conform-to/zod/v4'
import { Form, Link, redirect, useActionData } from 'react-router'
import { BackLink } from '~/components/ui/back-link'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select } from '~/components/ui/select'
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
      <BackLink to="/events">Back to Events</BackLink>

      <h2 className="text-2xl font-bold mb-6">New Event</h2>

      <Form
        method="post"
        className="space-y-5 rounded-xl border border-border-light bg-card p-6"
      >
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
          <Select id="activityId" name="activityId">
            <option value="">None</option>
            {activities.map(a => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
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
            <Select id="vibe" name="vibe">
              <option value="">None</option>
              {EVENT_VIBES.map(v => (
                <option key={v} value={v}>
                  {EVENT_VIBE_LABELS[v]}
                </option>
              ))}
            </Select>
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
