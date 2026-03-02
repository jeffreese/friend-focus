import { Link2, Search } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { SearchInput } from '~/components/ui/search-input'
import type { CachedContactWithStatus } from '~/lib/google-contacts-sync.server'

interface GoogleContactLinkDialogProps {
  open: boolean
  friendName: string
  contacts: CachedContactWithStatus[]
  suggestedContacts: CachedContactWithStatus[]
  onLink: (resourceName: string) => void
  onCancel: () => void
}

export function GoogleContactLinkDialog({
  open,
  friendName,
  contacts,
  suggestedContacts,
  onLink,
  onCancel,
}: GoogleContactLinkDialogProps) {
  const [search, setSearch] = useState('')

  const filteredContacts = search
    ? contacts.filter(c => {
        const q = search.toLowerCase()
        return (
          c.displayName?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.includes(q)
        )
      })
    : []

  const showSuggestions = !search && suggestedContacts.length > 0

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Link {friendName} to Google Contact</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground mb-3">
          Choose a Google contact to link with this friend. Linked contacts will
          sync data automatically.
        </p>

        <SearchInput
          value={search}
          placeholder="Search Google contacts..."
          onChange={e => setSearch(e.target.value)}
        />

        <div className="mt-3 max-h-72 overflow-y-auto space-y-1">
          {showSuggestions && (
            <>
              <p className="text-xs text-muted-foreground font-medium px-1 mb-2">
                Suggested Matches
              </p>
              {suggestedContacts.map(contact => (
                <ContactRow
                  key={contact.resourceName}
                  contact={contact}
                  matchReason={
                    contact.suggestedReasons.length > 0
                      ? contact.suggestedReasons.join(', ')
                      : undefined
                  }
                  onLink={() => onLink(contact.resourceName)}
                />
              ))}
            </>
          )}

          {search && filteredContacts.length === 0 && (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Search size={14} className="mr-2" />
              No contacts match &ldquo;{search}&rdquo;
            </div>
          )}

          {search && filteredContacts.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground font-medium px-1 mb-2">
                Search Results
              </p>
              {filteredContacts.slice(0, 20).map(contact => (
                <ContactRow
                  key={contact.resourceName}
                  contact={contact}
                  onLink={() => onLink(contact.resourceName)}
                />
              ))}
              {filteredContacts.length > 20 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Showing 20 of {filteredContacts.length} results. Refine your
                  search.
                </p>
              )}
            </>
          )}

          {!search && suggestedContacts.length === 0 && (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Search size={14} className="mr-2" />
              Type to search your Google contacts
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ContactRow({
  contact,
  matchReason,
  onLink,
}: {
  contact: CachedContactWithStatus
  matchReason?: string
  onLink: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-2.5 hover:bg-muted/50 transition-colors">
      <Avatar name={contact.displayName || '?'} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">
          {contact.displayName || 'Unnamed'}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {contact.email && <span className="truncate">{contact.email}</span>}
          {contact.phone && <span>{contact.phone}</span>}
        </div>
        {matchReason && (
          <p className="text-xs text-primary mt-0.5">{matchReason}</p>
        )}
      </div>
      <Button size="xs" variant="outline" onClick={onLink}>
        <Link2 size={12} className="mr-1" />
        Link
      </Button>
    </div>
  )
}
