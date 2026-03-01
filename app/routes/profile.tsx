import { useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod/v4'
import { and, eq } from 'drizzle-orm'
import { Form, useActionData, useLoaderData, useNavigation } from 'react-router'
import { Button } from '~/components/ui/button'
import { FieldError } from '~/components/ui/field-error'
import { FormError } from '~/components/ui/form-error'
import { FormField } from '~/components/ui/form-field'
import { GoogleIcon, GoogleSignInButton } from '~/components/ui/google-button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { PageHeader } from '~/components/ui/page-header'
import { SectionCard } from '~/components/ui/section-card'
import { SubmitButton } from '~/components/ui/submit-button'
import { APP_NAME } from '~/config'
import { db } from '~/db/index.server'
import { account } from '~/db/schema'
import { auth, isGoogleEnabled } from '~/lib/auth.server'
import {
  changePasswordSchema,
  setPasswordSchema,
  updateNameSchema,
} from '~/lib/schemas'
import { requireSession } from '~/lib/session.server'
import type { Route } from './+types/profile'

export function meta() {
  return [{ title: `Profile — ${APP_NAME}` }]
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)

  const hasPassword = !!db
    .select({ id: account.id })
    .from(account)
    .where(
      and(
        eq(account.userId, session.user.id),
        eq(account.providerId, 'credential'),
      ),
    )
    .get()

  const googleConnected = !!db
    .select({ id: account.id })
    .from(account)
    .where(
      and(
        eq(account.userId, session.user.id),
        eq(account.providerId, 'google'),
      ),
    )
    .get()

  return {
    user: {
      name: session.user.name,
      email: session.user.email,
    },
    hasPassword,
    googleConnected,
    isGoogleEnabled,
  }
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireSession(request)
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'unlink-google') {
    const hasPassword = !!db
      .select({ id: account.id })
      .from(account)
      .where(
        and(
          eq(account.userId, session.user.id),
          eq(account.providerId, 'credential'),
        ),
      )
      .get()

    if (!hasPassword) {
      return { error: 'You must set a password before disconnecting Google.' }
    }

    db.delete(account)
      .where(
        and(
          eq(account.userId, session.user.id),
          eq(account.providerId, 'google'),
        ),
      )
      .run()

    return { success: 'google-unlinked' as const }
  }

  if (intent === 'update-name') {
    const submission = parseWithZod(formData, { schema: updateNameSchema })
    if (submission.status !== 'success') return submission.reply()

    try {
      await auth.api.updateUser({
        body: { name: submission.value.name },
        headers: request.headers,
      })
    } catch {
      return submission.reply({ formErrors: ['Failed to update name.'] })
    }

    return { success: 'name' as const }
  }

  if (intent === 'change-password') {
    const submission = parseWithZod(formData, { schema: changePasswordSchema })
    if (submission.status !== 'success') return submission.reply()

    try {
      await auth.api.changePassword({
        body: {
          currentPassword: submission.value.currentPassword,
          newPassword: submission.value.newPassword,
        },
        headers: request.headers,
      })
    } catch {
      return submission.reply({
        formErrors: ['Current password is incorrect.'],
      })
    }

    return { success: 'password' as const }
  }

  if (intent === 'set-password') {
    const submission = parseWithZod(formData, { schema: setPasswordSchema })
    if (submission.status !== 'success') return submission.reply()

    try {
      await auth.api.setPassword({
        body: { newPassword: submission.value.newPassword },
        headers: request.headers,
      })
    } catch {
      return submission.reply({
        formErrors: ['Failed to set password. Please try again.'],
      })
    }

    return { success: 'password' as const }
  }

  return null
}

function SuccessBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
      <p>{children}</p>
    </div>
  )
}

export default function Profile() {
  const {
    user,
    hasPassword,
    googleConnected,
    isGoogleEnabled: googleEnabled,
  } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const isSuccess = actionData && 'success' in actionData
  const nameSuccess = isSuccess && actionData.success === 'name'
  const passwordSuccess = isSuccess && actionData.success === 'password'

  const [nameForm, nameFields] = useForm({
    id: 'update-name',
    lastResult: isSuccess ? undefined : (actionData as never),
    defaultValue: { name: user.name },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: updateNameSchema })
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  })

  const [changePasswordForm, changePasswordFields] = useForm({
    id: 'change-password',
    lastResult: isSuccess ? undefined : (actionData as never),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: changePasswordSchema })
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  })

  const [setPasswordForm, setPasswordFields] = useForm({
    id: 'set-password',
    lastResult: isSuccess ? undefined : (actionData as never),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: setPasswordSchema })
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  })

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Profile" />

      <div className="space-y-6">
        <SectionCard title="Name">
          {nameSuccess && (
            <div className="mb-4">
              <SuccessBanner>Name updated successfully.</SuccessBanner>
            </div>
          )}

          <Form
            method="post"
            id={nameForm.id}
            onSubmit={nameForm.onSubmit}
            noValidate
          >
            <input type="hidden" name="intent" value="update-name" />
            <FormError errors={nameForm.errors} className="mb-4" />

            <div className="space-y-4">
              <FormField>
                <Label>Email</Label>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </FormField>

              <FormField>
                <Label htmlFor={nameFields.name.id}>Display name</Label>
                <Input
                  id={nameFields.name.id}
                  name={nameFields.name.name}
                  type="text"
                  defaultValue={nameFields.name.initialValue}
                  autoComplete="name"
                  error={!!nameFields.name.errors}
                />
                <FieldError errors={nameFields.name.errors} />
              </FormField>

              <SubmitButton formIntent="update-name" pendingText="Saving...">
                Save name
              </SubmitButton>
            </div>
          </Form>
        </SectionCard>

        {hasPassword ? (
          <SectionCard title="Change password">
            {passwordSuccess && (
              <div className="mb-4">
                <SuccessBanner>Password changed successfully.</SuccessBanner>
              </div>
            )}

            <Form
              method="post"
              id={changePasswordForm.id}
              onSubmit={changePasswordForm.onSubmit}
              noValidate
              key={passwordSuccess ? 'reset' : 'form'}
            >
              <input type="hidden" name="intent" value="change-password" />
              <FormError errors={changePasswordForm.errors} className="mb-4" />

              <div className="space-y-4">
                <FormField>
                  <Label htmlFor={changePasswordFields.currentPassword.id}>
                    Current password
                  </Label>
                  <Input
                    id={changePasswordFields.currentPassword.id}
                    name={changePasswordFields.currentPassword.name}
                    type="password"
                    autoComplete="current-password"
                    error={!!changePasswordFields.currentPassword.errors}
                  />
                  <FieldError
                    errors={changePasswordFields.currentPassword.errors}
                  />
                </FormField>

                <FormField>
                  <Label htmlFor={changePasswordFields.newPassword.id}>
                    New password
                  </Label>
                  <Input
                    id={changePasswordFields.newPassword.id}
                    name={changePasswordFields.newPassword.name}
                    type="password"
                    autoComplete="new-password"
                    error={!!changePasswordFields.newPassword.errors}
                  />
                  <FieldError
                    errors={changePasswordFields.newPassword.errors}
                  />
                </FormField>

                <FormField>
                  <Label htmlFor={changePasswordFields.confirmNewPassword.id}>
                    Confirm new password
                  </Label>
                  <Input
                    id={changePasswordFields.confirmNewPassword.id}
                    name={changePasswordFields.confirmNewPassword.name}
                    type="password"
                    autoComplete="new-password"
                    error={!!changePasswordFields.confirmNewPassword.errors}
                  />
                  <FieldError
                    errors={changePasswordFields.confirmNewPassword.errors}
                  />
                </FormField>

                <SubmitButton
                  formIntent="change-password"
                  pendingText="Changing..."
                >
                  Change password
                </SubmitButton>
              </div>
            </Form>
          </SectionCard>
        ) : (
          <SectionCard title="Set password">
            <p className="text-sm text-muted-foreground mb-4">
              You signed in with Google. Set a password to also be able to log
              in with your email and password.
            </p>

            {passwordSuccess && (
              <div className="mb-4">
                <SuccessBanner>Password set successfully.</SuccessBanner>
              </div>
            )}

            <Form
              method="post"
              id={setPasswordForm.id}
              onSubmit={setPasswordForm.onSubmit}
              noValidate
              key={passwordSuccess ? 'reset' : 'form'}
            >
              <input type="hidden" name="intent" value="set-password" />
              <FormError errors={setPasswordForm.errors} className="mb-4" />

              <div className="space-y-4">
                <FormField>
                  <Label htmlFor={setPasswordFields.newPassword.id}>
                    Password
                  </Label>
                  <Input
                    id={setPasswordFields.newPassword.id}
                    name={setPasswordFields.newPassword.name}
                    type="password"
                    autoComplete="new-password"
                    error={!!setPasswordFields.newPassword.errors}
                  />
                  <FieldError errors={setPasswordFields.newPassword.errors} />
                </FormField>

                <FormField>
                  <Label htmlFor={setPasswordFields.confirmNewPassword.id}>
                    Confirm password
                  </Label>
                  <Input
                    id={setPasswordFields.confirmNewPassword.id}
                    name={setPasswordFields.confirmNewPassword.name}
                    type="password"
                    autoComplete="new-password"
                    error={!!setPasswordFields.confirmNewPassword.errors}
                  />
                  <FieldError
                    errors={setPasswordFields.confirmNewPassword.errors}
                  />
                </FormField>

                <SubmitButton
                  formIntent="set-password"
                  pendingText="Setting password..."
                >
                  Set password
                </SubmitButton>
              </div>
            </Form>
          </SectionCard>
        )}

        <SectionCard title="Connected accounts">
          <p className="text-sm text-muted-foreground mb-4">
            Connect external accounts to unlock additional features.
          </p>

          <div className="rounded-lg border border-border-light bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GoogleIcon className="size-5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Google</p>
                  <p className="text-xs text-muted-foreground">
                    {googleConnected
                      ? 'Connected — calendar and contacts access enabled'
                      : 'Connect to enable calendar events and contact import'}
                  </p>
                </div>
              </div>

              <div className="shrink-0 ml-4">
                {googleConnected ? (
                  <Form method="post">
                    <input type="hidden" name="intent" value="unlink-google" />
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      disabled={!hasPassword || isSubmitting}
                    >
                      Disconnect
                    </Button>
                  </Form>
                ) : googleEnabled ? (
                  <GoogleSignInButton mode="link" callbackURL="/profile" />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Not configured
                  </p>
                )}
              </div>
            </div>

            {googleConnected && !hasPassword && (
              <p className="mt-3 text-xs text-warning">
                Set a password above before disconnecting Google, or you will be
                locked out.
              </p>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
