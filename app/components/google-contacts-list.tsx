import { ArrowRight, Check, Link2, RefreshCw, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useRevalidator } from 'react-router'
import { SyncDiffDialog } from '~/components/google-sync-diff'
import { Avatar } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { EmptyState } from '~/components/ui/empty-state'
import { SearchInput } from '~/components/ui/search-input'
import type {
  CachedContactWithStatus,
  FieldDiff,
} from '~/lib/google-contacts-sync.server'
import { ContactImportDialog } from './contact-import-dialog'

interface GoogleContactsListProps {
  contacts: CachedContactWithStatus[]
  lastBulkSyncAt: string | null
  hasGoogleWrite?: boolean
}

export function GoogleContactsList({
  contacts,
  lastBulkSyncAt,
  hasGoogleWrite,
}: GoogleContactsListProps) {
  const revalidator = useRevalidator()
  const [syncing, setSyncing] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [search, setSearch] = useState('')
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const [importContact, setImportContact] =
    useState<CachedContactWithStatus | null>(null)

  // Link-with-sync state
  const [linkingContact, setLinkingContact] =
    useState<CachedContactWithStatus | null>(null)
  const [linkDiffs, setLinkDiffs] = useState<FieldDiff[] | null>(null)
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null)

  const phoneCount = contacts.filter(c => c.phone).length
  const displayContacts = contacts
    .filter(c => showAll || c.phone)
    .filter(c => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        c.displayName?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q)
      )
    })

  // Split into suggested matches and other contacts
  const suggestedMatches = displayContacts.filter(
    c =>
      !c.linkedFriendId && c.suggestedFriendId && c.suggestedConfidence >= 0.5,
  )
  const otherContacts = displayContacts.filter(
    c => !suggestedMatches.includes(c),
  )

  async function handleBulkSync() {
    setSyncing(true)
    try {
      await fetch('/api/google-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: 'bulk-sync' }),
      })
      revalidator.revalidate()
    } finally {
      setSyncing(false)
    }
  }

  async function handleImport(
    contact: CachedContactWithStatus,
    selectedFields?: {
      email?: string
      phone?: string
      address?: string
    },
  ) {
    setActionInProgress(contact.resourceName)
    try {
      await fetch('/api/google-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'import',
          resourceName: contact.resourceName,
          selectedEmail: selectedFields?.email,
          selectedPhone: selectedFields?.phone,
          selectedAddress: selectedFields?.address,
        }),
      })
      revalidator.revalidate()
    } finally {
      setActionInProgress(null)
      setImportContact(null)
    }
  }

  async function handleLinkAndReview(contact: CachedContactWithStatus) {
    if (!contact.suggestedFriendId) return
    setActionInProgress(contact.resourceName)
    setLinkingContact(contact)
    setLinkSuccess(null)

    try {
      // Step 1: Link the friend to the Google contact
      await fetch('/api/google-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'link',
          resourceName: contact.resourceName,
          friendId: contact.suggestedFriendId,
        }),
      })

      // Step 2: Immediately sync to detect field differences
      // forceCompare skips the etag check since we just stored the etag
      // during linking and need to compare the actual field values
      const syncRes = await fetch('/api/google-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'sync-friend',
          friendId: contact.suggestedFriendId,
          forceCompare: true,
        }),
      })
      const syncResult = await syncRes.json()

      if (
        syncResult.status === 'changes-detected' &&
        syncResult.diffs?.length > 0
      ) {
        const diffs = syncResult.diffs as FieldDiff[]

        // Check if all diffs are non-conflicting (one side empty, other has data)
        const allNonConflicting = diffs.every(
          d => (!d.appValue && d.googleValue) || (d.appValue && !d.googleValue),
        )

        if (allNonConflicting) {
          // Auto-apply: fill empty fields from whichever side has data
          const autoResolutions = diffs.map(d => ({
            field: d.field,
            action: (d.appValue ? 'keep-app' : 'use-google') as
              | 'use-google'
              | 'keep-app',
            value: d.appValue || d.googleValue || undefined,
          }))
          await handleLinkDiffApply(autoResolutions)
          setLinkSuccess(contact.suggestedFriendName || 'friend')
          // Auto-dismiss success after 3s
          setTimeout(() => setLinkSuccess(null), 3000)
        } else {
          // Has real conflicts — show the diff dialog for user review
          setLinkDiffs(diffs)
        }
      } else {
        // No diffs — show success and revalidate
        setLinkSuccess(contact.suggestedFriendName || 'friend')
        setLinkingContact(null)
        revalidator.revalidate()
        // Auto-dismiss success after 3s
        setTimeout(() => setLinkSuccess(null), 3000)
      }
    } catch {
      // If something fails, still revalidate to show current state
      setLinkingContact(null)
      revalidator.revalidate()
    } finally {
      setActionInProgress(null)
    }
  }

  async function handleLinkDiffApply(
    resolutions: Array<{
      field: string
      action: 'use-google' | 'keep-app' | 'push-to-google' | 'skip'
      value?: string
    }>,
  ) {
    if (!linkingContact?.suggestedFriendId) return

    try {
      await fetch('/api/google-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'resolve-diffs',
          friendId: linkingContact.suggestedFriendId,
          resolutions,
        }),
      })
    } finally {
      setLinkDiffs(null)
      setLinkingContact(null)
      revalidator.revalidate()
    }
  }

  async function checkMultiValueAndImport(contact: CachedContactWithStatus) {
    // Check if the contact has multiple values for any field
    try {
      const res = await fetch('/api/google-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'get-contact-details',
          resourceName: contact.resourceName,
        }),
      })
      const data = await res.json()

      const hasMultiEmails = data.emails?.length > 1
      const hasMultiPhones = data.phoneNumbers?.length > 1
      const hasMultiAddresses = data.addresses?.length > 1

      if (hasMultiEmails || hasMultiPhones || hasMultiAddresses) {
        // Show the import dialog for multi-value selection
        setImportContact({
          ...contact,
          _rawEmails: data.emails,
          _rawPhones: data.phoneNumbers,
          _rawAddresses: data.addresses,
        } as CachedContactWithStatus & {
          _rawEmails?: Array<{ value: string; type?: string }>
          _rawPhones?: Array<{ value: string; type?: string }>
          _rawAddresses?: Array<{ formattedValue?: string; type?: string }>
        })
      } else {
        // No multi-value fields, import directly
        handleImport(contact)
      }
    } catch {
      // On error, try importing with defaults
      handleImport(contact)
    }
  }

  return (
    <div>
      {/* Header controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className={`text-sm ${showAll ? 'text-muted-foreground' : 'text-primary font-medium'}`}
            onClick={() => setShowAll(false)}
          >
            With phone ({phoneCount})
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            type="button"
            className={`text-sm ${showAll ? 'text-primary font-medium' : 'text-muted-foreground'}`}
            onClick={() => setShowAll(true)}
          >
            All ({contacts.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          {lastBulkSyncAt && (
            <span className="text-xs text-muted-foreground">
              Last synced: {new Date(lastBulkSyncAt).toLocaleDateString()}
              {Date.now() - new Date(lastBulkSyncAt).getTime() >
                7 * 24 * 60 * 60 * 1000 && (
                <span className="text-warning ml-1">· May be outdated</span>
              )}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkSync}
            disabled={syncing}
          >
            <RefreshCw
              size={14}
              className={`mr-2 ${syncing ? 'animate-spin' : ''}`}
            />
            {syncing ? 'Syncing...' : 'Refresh from Google'}
          </Button>
        </div>
      </div>

      {/* Search */}
      <SearchInput
        className="mb-4"
        value={search}
        placeholder="Search contacts..."
        onChange={e => setSearch(e.target.value)}
      />

      {/* Link success banner */}
      {linkSuccess && (
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-3 mb-4 text-sm text-success">
          <Check size={14} />
          Linked to {linkSuccess} — all data is in sync.
        </div>
      )}

      {/* Contact list */}
      {displayContacts.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title={
            contacts.length === 0
              ? 'No Google Contacts cached'
              : search
                ? 'No contacts match your search'
                : 'No contacts with phone numbers'
          }
          description={
            contacts.length === 0
              ? 'Click "Refresh from Google" to load your contacts.'
              : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Section 1: Suggested Matches */}
          {suggestedMatches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold">Suggested Matches</h3>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  {suggestedMatches.length}
                </span>
              </div>
              <div className="space-y-2">
                {suggestedMatches.map(contact => (
                  <div
                    key={contact.resourceName}
                    className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3"
                  >
                    <Avatar name={contact.displayName || '?'} size="sm" />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {contact.displayName || 'Unnamed'}
                        </p>
                        <ArrowRight
                          size={12}
                          className="text-muted-foreground shrink-0"
                        />
                        <p className="text-sm font-medium text-primary truncate">
                          {contact.suggestedFriendName}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {contact.email && (
                            <span className="truncate">{contact.email}</span>
                          )}
                          {contact.phone && <span>{contact.phone}</span>}
                        </div>
                        {contact.suggestedReasons.length > 0 && (
                          <div className="flex items-center gap-1">
                            {contact.suggestedReasons.map(reason => (
                              <span
                                key={reason}
                                className="text-[10px] bg-primary/10 text-primary/80 px-1.5 py-0.5 rounded"
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Button
                        size="xs"
                        disabled={actionInProgress === contact.resourceName}
                        onClick={() => handleLinkAndReview(contact)}
                      >
                        <Link2 size={12} className="mr-1" />
                        {actionInProgress === contact.resourceName
                          ? 'Linking...'
                          : 'Link & Review'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: All Contacts */}
          {otherContacts.length > 0 && (
            <div>
              {suggestedMatches.length > 0 && (
                <h3 className="text-sm font-semibold mb-3">All Contacts</h3>
              )}
              <div className="space-y-2">
                {otherContacts.map(contact => (
                  <div
                    key={contact.resourceName}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                  >
                    <Avatar name={contact.displayName || '?'} size="sm" />

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {contact.displayName || 'Unnamed'}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {contact.email && (
                          <span className="truncate">{contact.email}</span>
                        )}
                        {contact.phone && <span>{contact.phone}</span>}
                        {contact.address && (
                          <span className="truncate">{contact.address}</span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {contact.linkedFriendId ? (
                        <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
                          <Link2 size={12} />
                          Linked to {contact.linkedFriendName}
                        </span>
                      ) : (
                        <Button
                          size="xs"
                          variant="outline"
                          disabled={actionInProgress === contact.resourceName}
                          onClick={() => checkMultiValueAndImport(contact)}
                        >
                          <UserPlus size={12} className="mr-1" />
                          Import
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Multi-value import dialog */}
      {importContact && (
        <ContactImportDialog
          open={!!importContact}
          contact={importContact}
          onConfirm={selectedFields =>
            handleImport(importContact, selectedFields)
          }
          onCancel={() => setImportContact(null)}
        />
      )}

      {/* Link-with-sync diff dialog */}
      {linkDiffs && linkingContact && (
        <SyncDiffDialog
          open={!!linkDiffs}
          friendName={linkingContact.suggestedFriendName || 'Friend'}
          diffs={linkDiffs}
          hasGoogleWrite={hasGoogleWrite}
          onApply={handleLinkDiffApply}
          onCancel={() => {
            setLinkDiffs(null)
            setLinkingContact(null)
            revalidator.revalidate()
          }}
        />
      )}
    </div>
  )
}
