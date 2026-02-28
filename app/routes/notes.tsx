import { useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod/v4'
import { eq } from 'drizzle-orm'
import { NotebookPen, Plus } from 'lucide-react'
import {
  Form,
  Link,
  redirect,
  useActionData,
  useLoaderData,
} from 'react-router'
import { EmptyState } from '~/components/ui/empty-state'
import { FieldError } from '~/components/ui/field-error'
import { FormField } from '~/components/ui/form-field'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { SubmitButton } from '~/components/ui/submit-button'
import { APP_NAME } from '~/config'
import { db } from '~/db/index.server'
import { note } from '~/db/schema'
import { noteSchema } from '~/lib/schemas'
import { requireSession } from '~/lib/session.server'
import type { Route } from './+types/notes'

export function meta() {
  return [{ title: `Notes — ${APP_NAME}` }]
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)
  const notes = db
    .select()
    .from(note)
    .where(eq(note.authorId, session.user.id))
    .all()
  return { notes }
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireSession(request)
  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: noteSchema })

  if (submission.status !== 'success') {
    return submission.reply()
  }

  const { title, body } = submission.value

  const created = db
    .insert(note)
    .values({ title, body, authorId: session.user.id })
    .returning()
    .get()

  return redirect(`/notes/${created.id}`)
}

// TODO: Replace this example page with your own. This demonstrates the
// pattern for a list page with a create form (loader + action + Conform).
export default function Notes() {
  const { notes } = useLoaderData<typeof loader>()
  const lastResult = useActionData<typeof action>()
  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: noteSchema })
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  })

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notes</h1>
      </div>

      <div className="mb-8 rounded-lg border border-border bg-card p-4">
        <h2 className="font-semibold mb-3">New Note</h2>
        <Form method="post" id={form.id} onSubmit={form.onSubmit} noValidate>
          <div className="space-y-3">
            <FormField>
              <Label htmlFor={fields.title.id}>Title</Label>
              <Input
                id={fields.title.id}
                name={fields.title.name}
                placeholder="Note title"
                error={!!fields.title.errors}
              />
              <FieldError errors={fields.title.errors} />
            </FormField>

            <FormField>
              <Label htmlFor={fields.body.id}>Body</Label>
              <Input
                id={fields.body.id}
                name={fields.body.name}
                placeholder="Optional body text"
              />
            </FormField>

            <SubmitButton pendingText="Creating...">
              <Plus className="h-4 w-4" />
              Create Note
            </SubmitButton>
          </div>
        </Form>
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="No notes yet"
          description="Create your first note using the form above."
        />
      ) : (
        <ul className="space-y-2">
          {notes.map(n => (
            <li key={n.id}>
              <Link
                to={`/notes/${n.id}`}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:bg-accent"
              >
                <span className="font-medium">{n.title}</span>
                <span className="text-xs text-muted-foreground">
                  {n.createdAt.toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
