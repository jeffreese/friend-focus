import { useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod/v4'
import {
  Form,
  Link,
  redirect,
  useActionData,
  useSearchParams,
} from 'react-router'
import { FieldError } from '~/components/ui/field-error'
import { FormField } from '~/components/ui/form-field'
import { GoogleSignInButton } from '~/components/ui/google-button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { SubmitButton } from '~/components/ui/submit-button'
import { APP_NAME } from '~/config'
import { auth, isGoogleEnabled } from '~/lib/auth.server'
import { registerSchema } from '~/lib/schemas'
import type { Route } from './+types/register'

export function meta() {
  return [{ title: `Register — ${APP_NAME}` }]
}

export async function loader() {
  return { isGoogleEnabled }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: registerSchema })

  if (submission.status !== 'success') {
    return submission.reply()
  }

  const { name, email, password } = submission.value

  const result = await auth.api.signUpEmail({
    body: { name, email, password },
    asResponse: true,
  })

  if (!result.ok) {
    const data = await result.json().catch(() => null)
    return submission.reply({
      formErrors: [
        data?.message || 'Registration failed. Email may already be in use.',
      ],
    })
  }

  // Forward set-cookie headers from better-auth
  const headers = new Headers()
  const setCookie = result.headers.get('set-cookie')
  if (setCookie) {
    headers.set('set-cookie', setCookie)
  }

  return redirect('/', { headers })
}

export default function Register({ loaderData }: Route.ComponentProps) {
  const lastResult = useActionData<typeof action>()
  const [searchParams] = useSearchParams()
  const oauthError = searchParams.get('error')
  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: registerSchema })
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  })

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold mb-6">Create an account</h1>

      {oauthError && (
        <div className="mb-4 rounded-lg bg-destructive-light px-4 py-3 text-sm text-destructive">
          <p>
            {oauthError === 'access_denied'
              ? 'Google sign-in was cancelled.'
              : 'Something went wrong with Google sign-in. Please try again.'}
          </p>
        </div>
      )}

      {loaderData.isGoogleEnabled && (
        <>
          <GoogleSignInButton callbackURL="/" />
          <p className="mt-2 text-xs text-muted-foreground">
            Google sign-in requests access to your calendar and contacts so
            Friend Focus can help you create events and import contacts.
          </p>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>
        </>
      )}

      <Form method="post" id={form.id} onSubmit={form.onSubmit} noValidate>
        {form.errors && (
          <div className="mb-4 rounded-lg bg-destructive-light px-4 py-3 text-sm text-destructive">
            {form.errors.map((error, i) => (
              <p key={i}>{error}</p>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <FormField>
            <Label htmlFor={fields.name.id}>Name</Label>
            <Input
              id={fields.name.id}
              name={fields.name.name}
              type="text"
              placeholder="Your name"
              autoComplete="name"
              error={!!fields.name.errors}
            />
            <FieldError errors={fields.name.errors} />
          </FormField>

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

          <FormField>
            <Label htmlFor={fields.password.id}>Password</Label>
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

          <SubmitButton className="w-full" pendingText="Creating account...">
            Create account
          </SubmitButton>
        </div>
      </Form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Login
        </Link>
      </p>
    </div>
  )
}
