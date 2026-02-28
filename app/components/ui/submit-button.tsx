'use client'

import { Loader2 } from 'lucide-react'
import { useNavigation } from 'react-router'
import { Button } from '~/components/ui/button'

function SubmitButton({
  children,
  pendingText,
  ...props
}: React.ComponentProps<typeof Button> & {
  pendingText?: string
}) {
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

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
