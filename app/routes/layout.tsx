import {
  Calendar,
  GitFork,
  Home,
  LogIn,
  LogOut,
  Notebook,
  Settings,
  UserPlus,
  Users,
} from 'lucide-react'
import { NavLink, Outlet, useLoaderData } from 'react-router'
import { APP_INITIALS, APP_NAME } from '~/config'
import { getOptionalSession } from '~/lib/session.server'
import { cn } from '~/lib/utils'
import { useUIStore } from '~/stores/ui-store'
import type { Route } from './+types/layout'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getOptionalSession(request)
  return {
    user: session?.user ?? null,
  }
}

function SidebarLink({
  to,
  icon: Icon,
  children,
}: {
  to: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
          isActive
            ? 'nav-link-active'
            : 'text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text',
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{children}</span>
    </NavLink>
  )
}

export default function Layout() {
  const { user } = useLoaderData<typeof loader>()
  const collapsed = useUIStore(s => s.sidebarCollapsed)
  const toggleSidebar = useUIStore(s => s.toggleSidebar)

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={cn(
          'flex flex-col bg-sidebar transition-all duration-200',
          collapsed ? 'w-0 overflow-hidden' : 'w-64',
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
            {APP_INITIALS}
          </div>
          <span className="text-sm font-semibold text-white">{APP_NAME}</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <SidebarLink to="/" icon={Home}>
            Dashboard
          </SidebarLink>
          <SidebarLink to="/friends" icon={Users}>
            Friends
          </SidebarLink>
          <SidebarLink to="/events" icon={Calendar}>
            Events
          </SidebarLink>
          <SidebarLink to="/relationships" icon={GitFork}>
            Relationships
          </SidebarLink>
          <SidebarLink to="/journal" icon={Notebook}>
            Journal
          </SidebarLink>
          <SidebarLink to="/settings" icon={Settings}>
            Settings
          </SidebarLink>
        </nav>

        <div className="border-t border-white/10 p-3 space-y-1">
          {user ? (
            <>
              <div className="px-3 py-2 text-xs text-sidebar-text-muted truncate">
                {user.email}
              </div>
              <form action="/logout" method="post">
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-text-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-text"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Logout</span>
                </button>
              </form>
            </>
          ) : (
            <>
              <SidebarLink to="/login" icon={LogIn}>
                Login
              </SidebarLink>
              <SidebarLink to="/register" icon={UserPlus}>
                Register
              </SidebarLink>
            </>
          )}
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center border-b border-border px-4">
          <button
            type="button"
            onClick={toggleSidebar}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
