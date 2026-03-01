import { z } from 'zod'

// ─── Auth schemas ────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// ─── Profile schemas ────────────────────────────────────────────────────────

export const updateNameSchema = z.object({
  intent: z.literal('update-name'),
  name: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
})

export const changePasswordSchema = z
  .object({
    intent: z.literal('change-password'),
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine(data => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  })

// ─── Friend schemas ──────────────────────────────────────────────────────────

export const friendSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  photo: z.string().optional(),
  phone: z.string().max(50).optional(),
  email: z
    .string()
    .email('Invalid email')
    .max(200)
    .optional()
    .or(z.literal('')),
  socialHandles: z.string().optional(),
  birthday: z.string().optional(),
  location: z.string().max(200).optional(),
  loveLanguage: z.string().max(100).optional(),
  favoriteFood: z.string().max(200).optional(),
  dietaryRestrictions: z.string().max(200).optional(),
  employer: z.string().max(200).optional(),
  occupation: z.string().max(200).optional(),
  personalNotes: z.string().optional(),
  closenessTierId: z.string().optional(),
  careModeActive: z
    .string()
    .transform(v => v === 'on' || v === 'true')
    .or(z.boolean())
    .optional()
    .default(false),
  careModeNote: z.string().max(500).optional(),
  careModeReminder: z
    .enum(['daily', 'every_3_days', 'weekly'])
    .or(z.literal(''))
    .optional(),
  careModeStartedAt: z.string().optional(),
})

export type FriendInput = z.infer<typeof friendSchema>

// ─── Closeness tier schemas ──────────────────────────────────────────────────

export const closenessTierSchema = z.object({
  label: z.string().min(1, 'Label is required').max(50),
  sortOrder: z.coerce.number().int().min(0),
  color: z.string().optional(),
})

export type ClosenessTierInput = z.infer<typeof closenessTierSchema>

// ─── Activity schemas ────────────────────────────────────────────────────────

export const activitySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  icon: z.string().max(50).optional(),
  isDefault: z
    .string()
    .transform(v => v === 'on' || v === 'true')
    .or(z.boolean())
    .optional()
    .default(false),
})

export type ActivityInput = z.infer<typeof activitySchema>

export const friendActivitySchema = z.object({
  friendId: z.string().min(1),
  activityId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
})

export type FriendActivityInput = z.infer<typeof friendActivitySchema>

export const ACTIVITY_RATING_LABELS: Record<number, string> = {
  1: 'Loves it',
  2: 'Interested',
  3: 'Maybe',
  4: 'Probably not',
  5: 'Definitely not',
}

// ─── Availability schemas ────────────────────────────────────────────────────

export const availabilitySchema = z.object({
  label: z.string().min(1, 'Label is required').max(200),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
})

export type AvailabilityInput = z.infer<typeof availabilitySchema>

// ─── Friend connection schemas ───────────────────────────────────────────────

export const CONNECTION_TYPES = [
  'Friends',
  'Dating',
  'Engaged',
  'Married',
  'Siblings',
  'Family',
  'Coworkers',
  'Roommates',
  'Exes',
] as const

export const CONNECTION_TYPE_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  Friends: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  Dating: {
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-200',
  },
  Engaged: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  Married: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  Siblings: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  Family: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
  },
  Coworkers: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
  Roommates: {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
  },
  Exes: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' },
}

export const CONNECTION_STRENGTHS = [
  'Acquaintances',
  'Casual',
  'Friendly',
  'Close',
  'Inseparable',
] as const

export const friendConnectionSchema = z
  .object({
    friendAId: z.string().min(1, 'Friend A is required'),
    friendBId: z.string().min(1, 'Friend B is required'),
    type: z.string().max(50).optional().or(z.literal('')),
    strength: z.coerce.number().int().min(1).max(5).default(3),
    howTheyMet: z.string().max(200).optional().or(z.literal('')),
    startDate: z.string().optional().or(z.literal('')),
    endDate: z.string().optional().or(z.literal('')),
    notes: z.string().max(500).optional().or(z.literal('')),
  })
  .refine(data => data.friendAId !== data.friendBId, {
    message: 'Cannot connect a friend to themselves',
    path: ['friendBId'],
  })

export type FriendConnectionInput = z.infer<typeof friendConnectionSchema>

// ─── Gift idea schemas ───────────────────────────────────────────────────────

export const giftIdeaSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  url: z.string().url('Invalid URL').max(2000).optional().or(z.literal('')),
  price: z.string().max(50).optional(),
})

export type GiftIdeaInput = z.infer<typeof giftIdeaSchema>

// ─── Event schemas ───────────────────────────────────────────────────────────

export const EVENT_VIBES = [
  'tight_knit',
  'mixer',
  'activity_focused',
  'balanced',
] as const

export const EVENT_VIBE_LABELS: Record<string, string> = {
  tight_knit: 'Tight-knit',
  mixer: 'Mixer',
  activity_focused: 'Activity-focused',
  balanced: 'Balanced',
}

export const EVENT_STATUSES = [
  'planning',
  'finalized',
  'completed',
  'cancelled',
] as const

export const INVITATION_STATUSES = [
  'not_invited',
  'invited',
  'attending',
  'declined',
] as const

export const INVITATION_STATUS_LABELS: Record<string, string> = {
  not_invited: 'Not Invited',
  invited: 'Invited',
  attending: 'Attending',
  declined: 'Declined',
}

export const ATTENDED_LABELS: Record<string, string> = {
  '': '\u2014',
  true: 'Yes',
  false: 'No',
}

export const eventSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  activityId: z.string().optional().or(z.literal('')),
  date: z.string().optional().or(z.literal('')),
  time: z.string().optional().or(z.literal('')),
  location: z.string().max(200).optional().or(z.literal('')),
  capacity: z.coerce.number().int().min(1).max(1000).optional(),
  vibe: z.enum(EVENT_VIBES).optional().or(z.literal('')),
  status: z.enum(EVENT_STATUSES).optional().default('planning'),
})

export type EventInput = z.infer<typeof eventSchema>

export const eventInvitationSchema = z.object({
  friendId: z.string().min(1, 'Friend is required'),
  status: z.enum(INVITATION_STATUSES).optional().default('not_invited'),
  attended: z.boolean().nullable().optional().default(null),
  mustInvite: z.boolean().optional().default(false),
  mustExclude: z.boolean().optional().default(false),
})

export type EventInvitationInput = z.infer<typeof eventInvitationSchema>

// ─── Note schemas ────────────────────────────────────────────────────────────

export const NOTE_TYPES = ['friend', 'event', 'journal'] as const

export const noteSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000),
})

export type NoteInput = z.infer<typeof noteSchema>
