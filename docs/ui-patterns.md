# UI Patterns

This guide covers the common UI patterns available in the template and how to
use them. All patterns are built on [shadcn/ui](https://ui.shadcn.com/)
components, which use Radix UI primitives underneath for accessibility.

## Adding New shadcn Components

```bash
pnpm dlx shadcn@latest add <component-name>
```

This generates the component into `app/components/ui/`. You own the code and
can customize it freely. See the [shadcn/ui docs](https://ui.shadcn.com/) for
the full component catalog.

## Toast Notifications

Use the `toast()` function from Sonner anywhere in your client code:

```tsx
import { toast } from 'sonner'

// Basic
toast('Changes saved')

// Variants
toast.success('Account created')
toast.error('Failed to save')
toast.warning('Session expiring soon')
toast.info('New version available')

// With description
toast.success('Account created', {
  description: 'Check your email to verify.',
})

// With action
toast('File deleted', {
  action: {
    label: 'Undo',
    onClick: () => restoreFile(),
  },
})
```

The `<Toaster />` component is already rendered in `app/root.tsx`.

## Forms

### FormField — Field Wrapper

Wraps a label, input, and error message with consistent vertical spacing.
Always use this instead of a bare `<div>` around form fields:

```tsx
import { FormField } from '~/components/ui/form-field'
import { FieldError } from '~/components/ui/field-error'

<FormField>
  <Label htmlFor={fields.email.id}>Email</Label>
  <Input
    id={fields.email.id}
    name={fields.email.name}
    error={!!fields.email.errors}
  />
  <FieldError errors={fields.email.errors} />
</FormField>
```

Accepts `className` for overrides.

### FormError — Form-Level Errors

Displays a banner for errors that apply to the entire form (e.g., "Invalid
credentials"):

```tsx
import { FormError } from '~/components/ui/form-error'

<FormError errors={form.errors} />
```

Renders nothing when `errors` is undefined or empty.

### FieldError — Field-Level Errors

Displays a single error message below a form field. Shows only the first
error. Renders nothing when there are no errors.

### Input Error State

The `Input` component accepts an `error` boolean prop that applies destructive
border styling:

```tsx
<Input error={!!fields.email.errors} />
```

## Confirmation Dialogs

### ConfirmDialog — Simple Wrapper

For common confirm/cancel patterns:

```tsx
import { ConfirmDialog } from '~/components/ui/confirm-dialog'

const [showConfirm, setShowConfirm] = useState(false)

<ConfirmDialog
  open={showConfirm}
  title="Delete this item?"
  description="This action cannot be undone."
  confirmText="Delete"
  variant="destructive"
  onConfirm={() => {
    deleteItem()
    setShowConfirm(false)
  }}
  onCancel={() => setShowConfirm(false)}
/>
```

### Dialog — Full Control

For more complex modals, use the Dialog components directly:

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '~/components/ui/dialog'

<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Edit Profile</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogDescription>Update your display name and bio.</DialogDescription>
    </DialogHeader>
    {/* form content */}
    <DialogFooter>
      <Button type="submit">Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Loading States

### NavigationProgress — Route Transition Bar

A thin animated bar at the top of the viewport that shows during route
transitions. It's rendered in `app/root.tsx` and requires no configuration:

```tsx
import { NavigationProgress } from '~/components/ui/navigation-progress'

// Already rendered in root.tsx Layout — you don't need to add this yourself
<NavigationProgress />
```

Uses `useNavigation()` from React Router to detect loading state. The bar
animates with a CSS keyframe defined in `app/app.css` and fades in/out with
opacity transitions.

### SubmitButton — Button with Pending State

Automatically shows a spinner and disables itself during form submission:

```tsx
import { SubmitButton } from '~/components/ui/submit-button'

<SubmitButton className="w-full">Save Changes</SubmitButton>
<SubmitButton pendingText="Creating...">Create Account</SubmitButton>
```

Uses `useNavigation()` from React Router to detect submission state.

### Skeleton — Content Placeholder

For loading states where you know the layout:

```tsx
import { Skeleton } from '~/components/ui/skeleton'

// Single element
<Skeleton className="h-4 w-48" />

// Card placeholder
<div className="space-y-3">
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
  <Skeleton className="h-4 w-5/6" />
</div>
```

## Empty States

For when there's no data to display:

```tsx
import { Inbox } from 'lucide-react'
import { EmptyState } from '~/components/ui/empty-state'
import { Button } from '~/components/ui/button'

<EmptyState
  icon={Inbox}
  title="No messages"
  description="You haven't received any messages yet."
  action={<Button>Compose</Button>}
/>
```

All props except `title` are optional.

## Data Tables

A sortable table with built-in empty state:

```tsx
import { DataTable, type Column } from '~/components/ui/data-table'

type User = { id: string; name: string; email: string; role: string }

const columns: Column<User>[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  {
    key: 'role',
    label: 'Role',
    render: (row) => (
      <span className="rounded bg-muted px-2 py-0.5 text-xs">{row.role}</span>
    ),
  },
]

<DataTable
  columns={columns}
  data={users}
  sortBy={searchParams.get('sortBy') ?? undefined}
  sortDir={(searchParams.get('sortDir') as 'asc' | 'desc') ?? undefined}
  onSort={(key) => {
    // Update URL search params for server-side sorting
  }}
  emptyTitle="No users"
  emptyDescription="No users match your search."
/>
```

### Column Definition

Each column can have:
- `key` — Property name on the data object
- `label` — Header text
- `sortable` — Whether the column header is clickable for sorting
- `render` — Custom render function for cell content

### Sorting

Sorting is controlled externally via `sortBy`/`sortDir`/`onSort` props. This
makes it compatible with URL search params for server-side sorting, or local
state for client-side sorting.

## Component Architecture

All components follow these conventions:
- Live in `app/components/ui/`
- Accept a `className` prop for customization via `cn()`
- Use `data-slot` attributes for CSS targeting
- Export named functions (not default exports)
- shadcn components use Radix UI primitives for accessibility

See [Decision 010](./decisions/010-component-library.md) for why we chose
shadcn/ui.
