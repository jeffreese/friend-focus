import { getValidGoogleAccessToken, hasGoogleScopes } from '~/lib/google.server'

// ─── Constants ──────────────────────────────────────────────────────────────

const PEOPLE_API_BASE = 'https://people.googleapis.com/v1'

const CONTACT_PERSON_FIELDS = [
  'names',
  'emailAddresses',
  'phoneNumbers',
  'addresses',
  'photos',
  'birthdays',
  'organizations',
  'metadata',
].join(',')

const CONTACTS_READONLY_SCOPE =
  'https://www.googleapis.com/auth/contacts.readonly'

const CONTACTS_WRITE_SCOPE = 'https://www.googleapis.com/auth/contacts'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GoogleContactEmail {
  value: string
  type?: string
}

export interface GoogleContactPhone {
  value: string
  type?: string
}

export interface GoogleContactAddress {
  formattedValue?: string
  streetAddress?: string
  city?: string
  region?: string
  postalCode?: string
  country?: string
  type?: string
}

export interface GoogleContactOrganization {
  name?: string
  title?: string
}

export interface GoogleContactBirthday {
  date?: { year?: number; month?: number; day?: number }
}

export interface GoogleContactPhoto {
  url: string
  default?: boolean
}

export interface GoogleContact {
  resourceName: string
  etag: string
  displayName: string | null
  emails: GoogleContactEmail[]
  phoneNumbers: GoogleContactPhone[]
  addresses: GoogleContactAddress[]
  photos: GoogleContactPhoto[]
  birthdays: GoogleContactBirthday[]
  organizations: GoogleContactOrganization[]
}

export interface GoogleContactsListResult {
  contacts: GoogleContact[]
  nextPageToken?: string
  nextSyncToken?: string
  totalPeople?: number
}

// ─── Response parsing ───────────────────────────────────────────────────────

interface PeopleApiPerson {
  resourceName?: string
  etag?: string
  names?: Array<{ displayName?: string }>
  emailAddresses?: Array<{ value?: string; type?: string }>
  phoneNumbers?: Array<{ value?: string; type?: string }>
  addresses?: Array<{
    formattedValue?: string
    streetAddress?: string
    city?: string
    region?: string
    postalCode?: string
    country?: string
    type?: string
  }>
  photos?: Array<{ url?: string; default?: boolean }>
  birthdays?: Array<{
    date?: { year?: number; month?: number; day?: number }
  }>
  organizations?: Array<{ name?: string; title?: string }>
  metadata?: { deleted?: boolean }
}

export function parseGoogleContact(person: PeopleApiPerson): GoogleContact {
  return {
    resourceName: person.resourceName || '',
    etag: person.etag || '',
    displayName: person.names?.[0]?.displayName || null,
    emails: (person.emailAddresses || [])
      .filter((e): e is { value: string; type?: string } => !!e.value)
      .map(e => ({ value: e.value, type: e.type })),
    phoneNumbers: (person.phoneNumbers || [])
      .filter((p): p is { value: string; type?: string } => !!p.value)
      .map(p => ({ value: p.value, type: p.type })),
    addresses: (person.addresses || []).map(a => ({
      formattedValue: a.formattedValue,
      streetAddress: a.streetAddress,
      city: a.city,
      region: a.region,
      postalCode: a.postalCode,
      country: a.country,
      type: a.type,
    })),
    photos: (person.photos || [])
      .filter((p): p is { url: string; default?: boolean } => !!p.url)
      .map(p => ({ url: p.url, default: p.default })),
    birthdays: (person.birthdays || []).map(b => ({
      date: b.date,
    })),
    organizations: (person.organizations || []).map(o => ({
      name: o.name,
      title: o.title,
    })),
  }
}

// ─── Scope helpers ──────────────────────────────────────────────────────────

export function hasContactsReadScope(userId: string): boolean {
  return hasGoogleScopes(userId, [CONTACTS_READONLY_SCOPE])
}

export function hasContactsWriteScope(userId: string): boolean {
  return hasGoogleScopes(userId, [CONTACTS_WRITE_SCOPE])
}

// ─── Error classes ──────────────────────────────────────────────────────────

export class GoogleContactNotFoundError extends Error {
  constructor(resourceName: string) {
    super(
      `Google Contact ${resourceName} not found (likely deleted on Google's side)`,
    )
    this.name = 'GoogleContactNotFoundError'
  }
}

export class GoogleAuthError extends Error {
  constructor(message?: string) {
    super(
      message ||
        'Google account not connected or token refresh failed. Try reconnecting Google on your Profile page.',
    )
    this.name = 'GoogleAuthError'
  }
}

// ─── Read operations ────────────────────────────────────────────────────────

/**
 * Fetch a paginated list of Google Contacts.
 * Supports both full fetch (pageToken) and incremental sync (syncToken).
 */
export async function fetchGoogleContactsList(
  userId: string,
  options?: { pageToken?: string; syncToken?: string; pageSize?: number },
): Promise<GoogleContactsListResult> {
  const accessToken = await getValidGoogleAccessToken(userId)
  if (!accessToken) throw new GoogleAuthError()

  const params = new URLSearchParams({
    personFields: CONTACT_PERSON_FIELDS,
    pageSize: String(options?.pageSize || 100),
  })

  if (options?.syncToken) {
    params.set('syncToken', options.syncToken)
    params.set('requestSyncToken', 'true')
  } else {
    params.set('requestSyncToken', 'true')
    if (options?.pageToken) {
      params.set('pageToken', options.pageToken)
    }
  }

  const response = await fetch(
    `${PEOPLE_API_BASE}/people/me/connections?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  )

  if (!response.ok) {
    const errorBody = await response.text()

    // If sync token is invalid (410 Gone), caller should retry without it
    if (response.status === 410) {
      return { contacts: [], nextSyncToken: undefined }
    }

    throw new Error(
      `Google People API error (${response.status}): ${errorBody}`,
    )
  }

  const data = (await response.json()) as {
    connections?: PeopleApiPerson[]
    nextPageToken?: string
    nextSyncToken?: string
    totalPeople?: number
  }

  return {
    contacts: (data.connections || [])
      .filter(p => !p.metadata?.deleted)
      .map(parseGoogleContact),
    nextPageToken: data.nextPageToken,
    nextSyncToken: data.nextSyncToken,
    totalPeople: data.totalPeople,
  }
}

/**
 * Fetch a single Google Contact by resourceName.
 * Returns null if the contact was deleted (404/410).
 */
export async function fetchGoogleContact(
  userId: string,
  resourceName: string,
): Promise<GoogleContact | null> {
  const accessToken = await getValidGoogleAccessToken(userId)
  if (!accessToken) throw new GoogleAuthError()

  const params = new URLSearchParams({
    personFields: CONTACT_PERSON_FIELDS,
  })

  const response = await fetch(`${PEOPLE_API_BASE}/${resourceName}?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (response.status === 404 || response.status === 410) {
    return null
  }

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(
      `Google People API error (${response.status}): ${errorBody}`,
    )
  }

  const person = (await response.json()) as PeopleApiPerson
  return parseGoogleContact(person)
}

/**
 * Download a contact photo. Google Contact photos require authentication.
 * Returns the photo as a Buffer, or null if the download fails.
 */
export async function downloadContactPhoto(
  userId: string,
  photoUrl: string,
): Promise<Buffer | null> {
  const accessToken = await getValidGoogleAccessToken(userId)
  if (!accessToken) return null

  try {
    const response = await fetch(photoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!response.ok) return null

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch {
    return null
  }
}

// ─── Write operations (require contacts write scope) ────────────────────────

/**
 * Create a new Google Contact from friend data.
 * Requires the `contacts` (write) scope.
 */
export async function createGoogleContact(
  userId: string,
  data: {
    name: string
    email?: string | null
    phone?: string | null
    address?: string | null
    birthday?: string | null
    employer?: string | null
    occupation?: string | null
  },
): Promise<{ resourceName: string; etag: string }> {
  const accessToken = await getValidGoogleAccessToken(userId)
  if (!accessToken) throw new GoogleAuthError()

  const person: Record<string, unknown> = {
    names: [{ givenName: data.name }],
  }

  if (data.email) {
    person.emailAddresses = [{ value: data.email }]
  }
  if (data.phone) {
    person.phoneNumbers = [{ value: data.phone }]
  }
  if (data.address) {
    person.addresses = [{ formattedValue: data.address }]
  }
  if (data.birthday) {
    const [year, month, day] = data.birthday.split('-').map(Number)
    if (month && day) {
      person.birthdays = [{ date: { year: year || undefined, month, day } }]
    }
  }
  if (data.employer || data.occupation) {
    person.organizations = [
      { name: data.employer || undefined, title: data.occupation || undefined },
    ]
  }

  const response = await fetch(
    `${PEOPLE_API_BASE}/people:createContact?personFields=${CONTACT_PERSON_FIELDS}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(person),
    },
  )

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(
      `Google People API create error (${response.status}): ${errorBody}`,
    )
  }

  const result = (await response.json()) as PeopleApiPerson
  return {
    resourceName: result.resourceName || '',
    etag: result.etag || '',
  }
}

/**
 * Update fields on an existing Google Contact.
 * Requires the `contacts` (write) scope.
 */
export async function updateGoogleContact(
  userId: string,
  resourceName: string,
  etag: string,
  fields: Partial<{
    name: string
    email: string | null
    phone: string | null
    address: string | null
    birthday: string | null
    employer: string | null
    occupation: string | null
  }>,
): Promise<{ etag: string }> {
  const accessToken = await getValidGoogleAccessToken(userId)
  if (!accessToken) throw new GoogleAuthError()

  const person: Record<string, unknown> = { etag }
  const updateMask: string[] = []

  if (fields.name !== undefined) {
    person.names = [{ givenName: fields.name }]
    updateMask.push('names')
  }
  if (fields.email !== undefined) {
    person.emailAddresses = fields.email ? [{ value: fields.email }] : []
    updateMask.push('emailAddresses')
  }
  if (fields.phone !== undefined) {
    person.phoneNumbers = fields.phone ? [{ value: fields.phone }] : []
    updateMask.push('phoneNumbers')
  }
  if (fields.address !== undefined) {
    person.addresses = fields.address
      ? [{ formattedValue: fields.address }]
      : []
    updateMask.push('addresses')
  }
  if (fields.birthday !== undefined) {
    if (fields.birthday) {
      const [year, month, day] = fields.birthday.split('-').map(Number)
      if (month && day) {
        person.birthdays = [{ date: { year: year || undefined, month, day } }]
      }
    } else {
      person.birthdays = []
    }
    updateMask.push('birthdays')
  }
  if (fields.employer !== undefined || fields.occupation !== undefined) {
    person.organizations = [
      {
        name: fields.employer || undefined,
        title: fields.occupation || undefined,
      },
    ]
    updateMask.push('organizations')
  }

  if (updateMask.length === 0) {
    return { etag }
  }

  const params = new URLSearchParams({
    updatePersonFields: updateMask.join(','),
    personFields: CONTACT_PERSON_FIELDS,
  })

  const response = await fetch(
    `${PEOPLE_API_BASE}/${resourceName}:updateContact?${params}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(person),
    },
  )

  if (response.status === 404 || response.status === 410) {
    throw new GoogleContactNotFoundError(resourceName)
  }

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(
      `Google People API update error (${response.status}): ${errorBody}`,
    )
  }

  const result = (await response.json()) as PeopleApiPerson
  return { etag: result.etag || '' }
}

/**
 * Delete a Google Contact.
 * Requires the `contacts` (write) scope.
 */
export async function deleteGoogleContact(
  userId: string,
  resourceName: string,
): Promise<void> {
  const accessToken = await getValidGoogleAccessToken(userId)
  if (!accessToken) throw new GoogleAuthError()

  const response = await fetch(
    `${PEOPLE_API_BASE}/${resourceName}:deleteContact`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  )

  if (response.status === 404 || response.status === 410) {
    // Already deleted — treat as success
    return
  }

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(
      `Google People API delete error (${response.status}): ${errorBody}`,
    )
  }
}
