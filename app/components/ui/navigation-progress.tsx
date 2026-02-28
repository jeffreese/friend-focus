'use client'

import { useNavigation } from 'react-router'
import { cn } from '~/lib/utils'

function NavigationProgress() {
  const navigation = useNavigation()
  const isNavigating = navigation.state !== 'idle'

  return (
    <div
      role="progressbar"
      aria-hidden={!isNavigating}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 h-0.5 transition-opacity duration-200',
        isNavigating ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div
        className={cn('h-full bg-primary', isNavigating && 'animate-progress')}
      />
    </div>
  )
}

export { NavigationProgress }
