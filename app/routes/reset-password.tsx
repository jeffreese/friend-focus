import { useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod/v4'
import {
  Form,
  Link,
  redirect,
  useActionData,
  useLoaderData,
} from 'react-router'
import { Button } from '~/components/ui/button'
import { FieldError } from '~/components/ui/field-error'
import { FormError } from '~/components/ui/form-error'
import { FormField } from '~/components/ui/form-field'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { APP_NAME } from '~/config'
import { auth } from '~/lib/auth.server'
import { resetPasswordSchema } from '~/lib/schemas'
import type { Route } from './+types/reset-password'

export function meta() {
  return [{ title: `Reset Password — ${APP_NAME}` }]
}

export function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')

  if (!token) {
    throw redirect('/forgot-password')
  }

  return { token }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: resetPasswordSchema })

  if (submission.status !== 'success') {
    return submission.reply()
  }

  const { password, token } = submission.value

  try {
    await auth.api.resetPassword({
      body: { newPassword: password, token },
    })
  } catch {
    return submission.reply({
      formErrors: [
        'Failed to reset password. The link may have expired. Please request a new one.',
      ],
    })
  }

  return redirect('/login')
}

export default function ResetPassword() {
  const { token } = useLoaderData<typeof loader>()
  const lastResult = useActionData<typeof action>()
  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: resetPasswordSchema })
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  })

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold mb-2">Reset password</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Enter your new password below.
      </p>

      <Form method="post" id={form.id} onSubmit={form.onSubmit} noValidate>
        <FormError errors={form.errors} className="mb-4" />

        <input type="hidden" name="token" value={token} />

        <div className="space-y-4">
          <FormField>
            <Label htmlFor={fields.password.id}>New Password</Label>
            <Input
              id={fields.password.id}
              name={fields.password.name}
              type="password"
              autoComplete="new-password"
              error={!!fields.password.errors}
            />
            <FieldError errors={fields.password.errors} />
          </FormField>

          <FormField>
            <Label htmlFor={fields.confirmPassword.id}>Confirm Password</Label>
            <Input
              id={fields.confirmPassword.id}
              name={fields.confirmPassword.name}
              type="password"
              autoComplete="new-password"
              error={!!fields.confirmPassword.errors}
            />
            <FieldError errors={fields.confirmPassword.errors} />
          </FormField>

          <Button type="submit" className="w-full">
            Reset password
          </Button>
        </div>
      </Form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link to="/login" className="text-primary hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  )
}
