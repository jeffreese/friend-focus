'use client'

import { Loader2 } from 'lucide-react'
import { useNavigation } from 'react-router'
import { Button } from '~/components/ui/button'

function SubmitButton({
  children,
  pendingText,
  formIntent,
  ...props
}: React.ComponentProps<typeof Button> & {
  pendingText?: string
  formIntent?: string
}) {
  const navigation = useNavigation()
  const isSubmitting = formIntent
    ? navigation.state === 'submitting' &&
      navigation.formData?.get('intent') === formIntent
    : navigation.state === 'submitting'

  return (
    <Button type="submit" disabled={isSubmitting} {...props}>
      {isSubmitting ? (
        <>
          <Loader2 className="animate-spin" />
          {pendingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  )
}

export { SubmitButton }
