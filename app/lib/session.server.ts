import { redirect } from 'react-router'
import { auth } from './auth.server'

export async function getOptionalSession(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })
  return session
}

export async function requireSession(request: Request) {
  const session = await getOptionalSession(request)
  if (!session) {
    throw redirect('/login')
  }
  return session
}
