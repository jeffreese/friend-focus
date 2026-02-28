import { Heart } from 'lucide-react'
import { useState } from 'react'
import { Form, Link } from 'react-router'
import { ActivityRating } from '~/components/activity-rating'
import { Button } from '~/components/ui/button'
import { FieldError } from '~/components/ui/field-error'
import { FormField } from '~/components/ui/form-field'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select } from '~/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Textarea } from '~/components/ui/textarea'

interface FriendFormProps {
  friend?: {
    id: string
    name: string
    phone: string | null
    email: string | null
    socialHandles: string | null
    birthday: string | null
    location: string | null
    loveLanguage: string | null
    favoriteFood: string | null
    dietaryRestrictions: string | null
    employer: string | null
    occupation: string | null
    personalNotes: string | null
    closenessTierId: string | null
    careModeActive: boolean
    careModeNote: string | null
    careModeReminder: string | null
  }
  tiers: Array<{ id: string; label: string; friendCount: number }>
  activities?: Array<{ id: string; name: string; icon: string | null }>
  activityRatings?: Array<{
    activityId: string
    rating: number
  }>
  errors?: Record<string, string[]>
}

export function FriendForm({
  friend,
  tiers,
  activities,
  activityRatings,
  errors,
}: FriendFormProps) {
  const isEditing = !!friend

  return (
    <Form method="post" className="space-y-6">
      {/* Name */}
      <FormField>
        <Label htmlFor="name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          defaultValue={friend?.name || ''}
          required
          error={!!errors?.name}
        />
        <FieldError errors={errors?.name} />
      </FormField>

      {/* Closeness Tier */}
      <FormField>
        <Label htmlFor="closenessTierId">Closeness</Label>
        <Select
          id="closenessTierId"
          name="closenessTierId"
          defaultValue={friend?.closenessTierId || ''}
        >
          <option value="">Select a tier...</option>
          {tiers.map(tier => (
            <option key={tier.id} value={tier.id}>
              {tier.label}
            </option>
          ))}
        </Select>
      </FormField>

      {/* Contact info */}
      <div className="grid grid-cols-2 gap-4">
        <FormField>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={friend?.phone || ''}
          />
        </FormField>
        <FormField>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={friend?.email || ''}
            error={!!errors?.email}
          />
          <FieldError errors={errors?.email} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField>
          <Label htmlFor="birthday">Birthday</Label>
          <Input
            id="birthday"
            name="birthday"
            type="date"
            defaultValue={friend?.birthday || ''}
          />
        </FormField>
        <FormField>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            defaultValue={friend?.location || ''}
            placeholder="e.g. Denver, CO"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField>
          <Label htmlFor="employer">Employer</Label>
          <Input
            id="employer"
            name="employer"
            defaultValue={friend?.employer || ''}
          />
        </FormField>
        <FormField>
          <Label htmlFor="occupation">Occupation</Label>
          <Input
            id="occupation"
            name="occupation"
            defaultValue={friend?.occupation || ''}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField>
          <Label htmlFor="loveLanguage">Love Language</Label>
          <Select
            id="loveLanguage"
            name="loveLanguage"
            defaultValue={friend?.loveLanguage || ''}
          >
            <option value="">Select...</option>
            <option value="Words of Affirmation">Words of Affirmation</option>
            <option value="Quality Time">Quality Time</option>
            <option value="Receiving Gifts">Receiving Gifts</option>
            <option value="Acts of Service">Acts of Service</option>
            <option value="Physical Touch">Physical Touch</option>
          </Select>
        </FormField>
        <FormField>
          <Label htmlFor="favoriteFood">Favorite Food</Label>
          <Input
            id="favoriteFood"
            name="favoriteFood"
            defaultValue={friend?.favoriteFood || ''}
          />
        </FormField>
      </div>

      <FormField>
        <Label htmlFor="dietaryRestrictions">Dietary Restrictions</Label>
        <Input
          id="dietaryRestrictions"
          name="dietaryRestrictions"
          defaultValue={friend?.dietaryRestrictions || ''}
          placeholder="e.g. Vegetarian, Gluten-free"
        />
      </FormField>

      <FormField>
        <Label htmlFor="socialHandles">Social Handles</Label>
        <Input
          id="socialHandles"
          name="socialHandles"
          defaultValue={friend?.socialHandles || ''}
          placeholder="e.g. @username"
        />
      </FormField>

      {/* Personal Notes */}
      <FormField>
        <Label htmlFor="personalNotes">Personal Notes</Label>
        <Textarea
          id="personalNotes"
          name="personalNotes"
          defaultValue={friend?.personalNotes || ''}
          rows={4}
          placeholder="Anything you want to remember about this person..."
        />
      </FormField>

      {/* Care Mode */}
      <CareModeSection
        defaultActive={friend?.careModeActive ?? false}
        defaultNote={friend?.careModeNote ?? ''}
        defaultReminder={friend?.careModeReminder ?? ''}
      />

      {/* Activity Ratings */}
      {activities && activities.length > 0 && (
        <div>
          <Label>Activity Interests</Label>
          <p className="text-xs text-muted-foreground mb-3">
            Rate how much this person enjoys each activity (1 = Loves it, 5 =
            Definitely not)
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity</TableHead>
                <TableHead>Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map(act => {
                const existingRating = activityRatings?.find(
                  r => r.activityId === act.id,
                )
                return (
                  <TableRow key={act.id}>
                    <TableCell className="font-medium w-28">
                      {act.name}
                    </TableCell>
                    <TableCell>
                      <ActivityRating
                        activityId={act.id}
                        activityName={act.name}
                        defaultRating={existingRating?.rating}
                        hideLabel
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit">
          {isEditing ? 'Save Changes' : 'Add Friend'}
        </Button>
        <Button variant="outline" asChild>
          <Link to={isEditing ? `/friends/${friend.id}` : '/friends'}>
            Cancel
          </Link>
        </Button>
      </div>
    </Form>
  )
}

function CareModeSection({
  defaultActive,
  defaultNote,
  defaultReminder,
}: {
  defaultActive: boolean
  defaultNote: string
  defaultReminder: string
}) {
  const [active, setActive] = useState(defaultActive)

  return (
    <div className="rounded-lg border p-4">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          name="careModeActive"
          checked={active}
          onChange={e => setActive(e.target.checked)}
          className="rounded border-input"
        />
        <Heart
          size={16}
          className={active ? 'text-pink-500' : 'text-muted-foreground'}
        />
        <span className="text-sm font-medium">Care Mode</span>
        <span className="text-xs text-muted-foreground">
          Flag this friend as needing extra attention
        </span>
      </label>

      {active && (
        <div className="mt-3 space-y-3 pl-6">
          <FormField>
            <Label htmlFor="careModeNote">Care Note</Label>
            <Textarea
              id="careModeNote"
              name="careModeNote"
              defaultValue={defaultNote}
              rows={2}
              placeholder="What's going on? e.g. Going through a breakup..."
            />
          </FormField>
          <FormField>
            <Label htmlFor="careModeReminder">Reminder Cadence</Label>
            <Select
              id="careModeReminder"
              name="careModeReminder"
              defaultValue={defaultReminder}
            >
              <option value="">No reminder</option>
              <option value="daily">Daily</option>
              <option value="every_3_days">Every 3 Days</option>
              <option value="weekly">Weekly</option>
            </Select>
          </FormField>
        </div>
      )}
    </div>
  )
}
