import { eq } from 'drizzle-orm'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { Form, Link, redirect, useLoaderData } from 'react-router'
import { SubmitButton } from '~/components/ui/submit-button'
import { APP_NAME } from '~/config'
import { db } from '~/db/index.server'
import { note } from '~/db/schema'
import { requireSession } from '~/lib/session.server'
import type { Route } from './+types/notes.$noteId'

export function meta({ data }: Route.MetaArgs) {
  const title = data?.note.title ?? 'Note'
  return [{ title: `${title} — ${APP_NAME}` }]
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireSession(request)

  const found = db
    .select()
    .from(note)
    .where(eq(note.id, Number(params.noteId)))
    .get()

  if (!found || found.authorId !== session.user.id) {
    throw new Response('Not Found', { status: 404 })
  }

  return { note: found }
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await requireSession(request)
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'delete') {
    const found = db
      .select()
      .from(note)
      .where(eq(note.id, Number(params.noteId)))
      .get()

    if (found && found.authorId === session.user.id) {
      db.delete(note).where(eq(note.id, found.id)).run()
    }

    return redirect('/notes')
  }

  return null
}

// TODO: Replace this example page with your own. This demonstrates the
// pattern for a parameterized route with detail view and delete action.
export default function NoteDetail() {
  const { note: n } = useLoaderData<typeof loader>()

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/notes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to notes
      </Link>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-bold">{n.title}</h1>
          <Form method="post">
            <input type="hidden" name="intent" value="delete" />
            <SubmitButton variant="ghost" size="icon" pendingText="">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </SubmitButton>
          </Form>
        </div>

        {n.body && <p className="text-foreground mb-4">{n.body}</p>}

        <p className="text-xs text-muted-foreground">
          Created {n.createdAt.toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}
