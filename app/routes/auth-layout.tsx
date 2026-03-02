import { Outlet } from 'react-router'

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <Outlet />
    </div>
  )
}
