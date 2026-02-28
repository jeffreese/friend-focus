import { useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod/v4'
import { Form, Link, useActionData } from 'react-router'
import { Button } from '~/components/ui/button'
import { FieldError } from '~/components/ui/field-error'
import { FormField } from '~/components/ui/form-field'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { APP_NAME } from '~/config'
import { auth } from '~/lib/auth.server'
import { forgotPasswordSchema } from '~/lib/schemas'
import type { Route } from './+types/forgot-password'

export function meta() {
  return [{ title: `Forgot Password — ${APP_NAME}` }]
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: forgotPasswordSchema })

  if (submission.status !== 'success') {
    return submission.reply()
  }

  const { email } = submission.value

  // Always succeed — don't reveal whether the email exists
  try {
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: '/reset-password' },
    })
  } catch {
    // Silently ignore errors to avoid email enumeration
  }

  return { sent: true }
}

export default function ForgotPassword() {
  const actionData = useActionData<typeof action>()
  const sent = actionData && 'sent' in actionData && actionData.sent
  const lastResult = sent ? undefined : (actionData as never)

  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: forgotPasswordSchema })
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  })

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold mb-2">Forgot password</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      {sent ? (
        <div className="rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
          <p>
            If an account exists with that email, we&apos;ve sent a password
            reset link. Check your inbox.
          </p>
        </div>
      ) : (
        <Form method="post" id={form.id} onSubmit={form.onSubmit} noValidate>
          <div className="space-y-4">
            <FormField>
              <Label htmlFor={fields.email.id}>Email</Label>
              <Input
                id={fields.email.id}
                name={fields.email.name}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                error={!!fields.email.errors}
              />
              <FieldError errors={fields.email.errors} />
            </FormField>

            <Button type="submit" className="w-full">
              Send reset link
            </Button>
          </div>
        </Form>
      )}

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link to="/login" className="text-primary hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  )
}
