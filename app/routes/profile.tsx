import { useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod/v4'
import { Form, useActionData, useLoaderData } from 'react-router'
import { FieldError } from '~/components/ui/field-error'
import { FormError } from '~/components/ui/form-error'
import { FormField } from '~/components/ui/form-field'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { PageHeader } from '~/components/ui/page-header'
import { SectionCard } from '~/components/ui/section-card'
import { SubmitButton } from '~/components/ui/submit-button'
import { APP_NAME } from '~/config'
import { auth } from '~/lib/auth.server'
import { changePasswordSchema, updateNameSchema } from '~/lib/schemas'
import { requireSession } from '~/lib/session.server'
import type { Route } from './+types/profile'

export function meta() {
  return [{ title: `Profile — ${APP_NAME}` }]
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)
  return {
    user: {
      name: session.user.name,
      email: session.user.email,
    },
  }
}

export async function action({ request }: Route.ActionArgs) {
  await requireSession(request)
  const formData = await request.formData()
  const intent = formData.get('intent')

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
  const { user } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()

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

  const [passwordForm, passwordFields] = useForm({
    id: 'change-password',
    lastResult: isSuccess ? undefined : (actionData as never),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: changePasswordSchema })
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

        <SectionCard title="Change password">
          {passwordSuccess && (
            <div className="mb-4">
              <SuccessBanner>Password changed successfully.</SuccessBanner>
            </div>
          )}

          <Form
            method="post"
            id={passwordForm.id}
            onSubmit={passwordForm.onSubmit}
            noValidate
            key={passwordSuccess ? 'reset' : 'form'}
          >
            <input type="hidden" name="intent" value="change-password" />
            <FormError errors={passwordForm.errors} className="mb-4" />

            <div className="space-y-4">
              <FormField>
                <Label htmlFor={passwordFields.currentPassword.id}>
                  Current password
                </Label>
                <Input
                  id={passwordFields.currentPassword.id}
                  name={passwordFields.currentPassword.name}
                  type="password"
                  autoComplete="current-password"
                  error={!!passwordFields.currentPassword.errors}
                />
                <FieldError errors={passwordFields.currentPassword.errors} />
              </FormField>

              <FormField>
                <Label htmlFor={passwordFields.newPassword.id}>
                  New password
                </Label>
                <Input
                  id={passwordFields.newPassword.id}
                  name={passwordFields.newPassword.name}
                  type="password"
                  autoComplete="new-password"
                  error={!!passwordFields.newPassword.errors}
                />
                <FieldError errors={passwordFields.newPassword.errors} />
              </FormField>

              <FormField>
                <Label htmlFor={passwordFields.confirmNewPassword.id}>
                  Confirm new password
                </Label>
                <Input
                  id={passwordFields.confirmNewPassword.id}
                  name={passwordFields.confirmNewPassword.name}
                  type="password"
                  autoComplete="new-password"
                  error={!!passwordFields.confirmNewPassword.errors}
                />
                <FieldError errors={passwordFields.confirmNewPassword.errors} />
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
      </div>
    </div>
  )
}
