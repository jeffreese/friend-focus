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
import type { FriendForLinking } from './google-contacts-list'

interface FriendLinkDialogProps {
  open: boolean
  contactDisplayName: string
  friends: FriendForLinking[]
  onLink: (friendId: string) => void
  onCancel: () => void
}

export function FriendLinkDialog({
  open,
  contactDisplayName,
  friends,
  onLink,
  onCancel,
}: FriendLinkDialogProps) {
  const [search, setSearch] = useState('')

  // Only show friends that aren't already linked to a Google contact
  const unlinkedFriends = friends.filter(f => !f.googleContactResourceName)

  const filteredFriends = search
    ? unlinkedFriends.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()),
      )
    : unlinkedFriends

  // Show all unlinked friends when not searching (if reasonable count)
  const showAllByDefault = !search && unlinkedFriends.length <= 50

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Link {contactDisplayName} to a Friend</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground mb-3">
          Choose a friend to link with this Google contact. Linked contacts will
          sync data automatically.
        </p>

        <SearchInput
          value={search}
          placeholder="Search friends..."
          onChange={e => setSearch(e.target.value)}
        />

        <div className="mt-3 max-h-72 overflow-y-auto space-y-1">
          {showAllByDefault && unlinkedFriends.length === 0 && (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              No unlinked friends available
            </div>
          )}

          {showAllByDefault && unlinkedFriends.length > 0 && (
            <>
              {unlinkedFriends.map(friend => (
                <FriendRow
                  key={friend.id}
                  friend={friend}
                  onLink={() => onLink(friend.id)}
                />
              ))}
            </>
          )}

          {!showAllByDefault && !search && (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Search size={14} className="mr-2" />
              Type to search your friends
            </div>
          )}

          {search && filteredFriends.length === 0 && (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Search size={14} className="mr-2" />
              No friends match &ldquo;{search}&rdquo;
            </div>
          )}

          {search && filteredFriends.length > 0 && (
            <>
              {filteredFriends.slice(0, 20).map(friend => (
                <FriendRow
                  key={friend.id}
                  friend={friend}
                  onLink={() => onLink(friend.id)}
                />
              ))}
              {filteredFriends.length > 20 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Showing 20 of {filteredFriends.length} results. Refine your
                  search.
                </p>
              )}
            </>
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

function FriendRow({
  friend,
  onLink,
}: {
  friend: FriendForLinking
  onLink: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-2.5 hover:bg-muted/50 transition-colors">
      <Avatar
        name={friend.name}
        src={friend.photo ? `/api/photos/${friend.photo}` : undefined}
        color={friend.tierColor || undefined}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{friend.name}</p>
        {friend.tierLabel && (
          <span className="text-xs text-muted-foreground">
            {friend.tierLabel}
          </span>
        )}
      </div>
      <Button size="xs" variant="outline" onClick={onLink}>
        <Link2 size={12} className="mr-1" />
        Link
      </Button>
    </div>
  )
}
