import { useState } from 'react'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Label } from '~/components/ui/label'

interface ContactWithMultiValues {
  displayName: string | null
  email: string | null
  phone: string | null
  address: string | null
  _rawEmails?: Array<{ value: string; type?: string }>
  _rawPhones?: Array<{ value: string; type?: string }>
  _rawAddresses?: Array<{ formattedValue?: string; type?: string }>
}

interface ContactImportDialogProps {
  open: boolean
  contact: ContactWithMultiValues
  onConfirm: (selectedFields: {
    email?: string
    phone?: string
    address?: string
  }) => void
  onCancel: () => void
}

export function ContactImportDialog({
  open,
  contact,
  onConfirm,
  onCancel,
}: ContactImportDialogProps) {
  const emails = contact._rawEmails || []
  const phones = contact._rawPhones || []
  const addresses = (contact._rawAddresses || []).filter(a => a.formattedValue)

  const [selectedEmail, setSelectedEmail] = useState(emails[0]?.value || '')
  const [selectedPhone, setSelectedPhone] = useState(phones[0]?.value || '')
  const [selectedAddress, setSelectedAddress] = useState(
    addresses[0]?.formattedValue || '',
  )

  function handleConfirm() {
    onConfirm({
      email: selectedEmail || undefined,
      phone: selectedPhone || undefined,
      address: selectedAddress || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import {contact.displayName || 'Contact'}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground mb-4">
          This contact has multiple values for some fields. Choose which ones to
          use.
        </p>

        <div className="space-y-5">
          {/* Emails */}
          {emails.length > 1 && (
            <fieldset>
              <Label className="mb-2 block">Email</Label>
              <div className="space-y-2">
                {emails.map((email, i) => (
                  <label
                    key={`email-${i}`}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="email"
                      value={email.value}
                      checked={selectedEmail === email.value}
                      onChange={() => setSelectedEmail(email.value)}
                      className="accent-primary"
                    />
                    <span>{email.value}</span>
                    {email.type && (
                      <span className="text-xs text-muted-foreground">
                        ({email.type})
                      </span>
                    )}
                  </label>
                ))}
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="email"
                    value=""
                    checked={selectedEmail === ''}
                    onChange={() => setSelectedEmail('')}
                    className="accent-primary"
                  />
                  <span className="text-muted-foreground">None</span>
                </label>
              </div>
            </fieldset>
          )}

          {/* Phones */}
          {phones.length > 1 && (
            <fieldset>
              <Label className="mb-2 block">Phone</Label>
              <div className="space-y-2">
                {phones.map((phone, i) => (
                  <label
                    key={`phone-${i}`}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="phone"
                      value={phone.value}
                      checked={selectedPhone === phone.value}
                      onChange={() => setSelectedPhone(phone.value)}
                      className="accent-primary"
                    />
                    <span>{phone.value}</span>
                    {phone.type && (
                      <span className="text-xs text-muted-foreground">
                        ({phone.type})
                      </span>
                    )}
                  </label>
                ))}
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="phone"
                    value=""
                    checked={selectedPhone === ''}
                    onChange={() => setSelectedPhone('')}
                    className="accent-primary"
                  />
                  <span className="text-muted-foreground">None</span>
                </label>
              </div>
            </fieldset>
          )}

          {/* Addresses */}
          {addresses.length > 1 && (
            <fieldset>
              <Label className="mb-2 block">Address</Label>
              <div className="space-y-2">
                {addresses.map((addr, i) => (
                  <label
                    key={`addr-${i}`}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="address"
                      value={addr.formattedValue || ''}
                      checked={selectedAddress === addr.formattedValue}
                      onChange={() =>
                        setSelectedAddress(addr.formattedValue || '')
                      }
                      className="accent-primary"
                    />
                    <span className="truncate">{addr.formattedValue}</span>
                    {addr.type && (
                      <span className="text-xs text-muted-foreground">
                        ({addr.type})
                      </span>
                    )}
                  </label>
                ))}
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="address"
                    value=""
                    checked={selectedAddress === ''}
                    onChange={() => setSelectedAddress('')}
                    className="accent-primary"
                  />
                  <span className="text-muted-foreground">None</span>
                </label>
              </div>
            </fieldset>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleConfirm}>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
