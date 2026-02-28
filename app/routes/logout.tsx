import { redirect } from 'react-router'
import { auth } from '~/lib/auth.server'
import type { Route } from './+types/logout'

export async function action({ request }: Route.ActionArgs) {
  await auth.api.signOut({ headers: request.headers })
  return redirect('/login')
}

export function loader() {
  return redirect('/')
}
