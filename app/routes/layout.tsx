import {
  Calendar,
  ChevronsLeft,
  ChevronsRight,
  CircleUser,
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
  collapsed,
  children,
}: {
  to: string
  icon: React.ComponentType<{ className?: string }>
  collapsed: boolean
  children: React.ReactNode
}) {
  return (
    <NavLink
      to={to}
      end
      title={collapsed ? String(children) : undefined}
      className={({ isActive }) =>
        cn(
          'flex items-center rounded-lg text-sm transition-colors',
          collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
          isActive
            ? 'nav-link-active'
            : 'text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text',
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{children}</span>}
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
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        <div
          className={cn(
            'flex items-center border-b border-white/10',
            collapsed ? 'h-14 justify-center px-2' : 'h-14 px-4',
          )}
        >
          {collapsed ? (
            <span className="text-sm font-bold text-sidebar-text">
              {APP_INITIALS}
            </span>
          ) : (
            <div>
              <h1 className="text-sm font-bold text-sidebar-text">
                {APP_NAME}
              </h1>
              <p className="text-[10px] text-sidebar-text-muted">
                Plan. Connect. Remember.
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          <SidebarLink to="/" icon={Home} collapsed={collapsed}>
            Dashboard
          </SidebarLink>
          <SidebarLink to="/friends" icon={Users} collapsed={collapsed}>
            Friends
          </SidebarLink>
          <SidebarLink to="/events" icon={Calendar} collapsed={collapsed}>
            Events
          </SidebarLink>
          <SidebarLink to="/relationships" icon={GitFork} collapsed={collapsed}>
            Relationships
          </SidebarLink>
          <SidebarLink to="/journal" icon={Notebook} collapsed={collapsed}>
            Journal
          </SidebarLink>
          <SidebarLink to="/settings" icon={Settings} collapsed={collapsed}>
            Settings
          </SidebarLink>
        </nav>

        <div className="border-t border-white/10 p-2 space-y-1">
          {user ? (
            <>
              {!collapsed && (
                <div className="px-3 py-2 text-xs text-sidebar-text-muted truncate">
                  {user.email}
                </div>
              )}
              <SidebarLink
                to="/profile"
                icon={CircleUser}
                collapsed={collapsed}
              >
                Profile
              </SidebarLink>
              <form action="/logout" method="post">
                <button
                  type="submit"
                  title={collapsed ? 'Logout' : undefined}
                  className={cn(
                    'flex w-full items-center rounded-lg text-sm text-sidebar-text-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-text',
                    collapsed
                      ? 'justify-center px-2 py-2.5'
                      : 'gap-3 px-3 py-2.5',
                  )}
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>Logout</span>}
                </button>
              </form>
            </>
          ) : (
            <>
              <SidebarLink to="/login" icon={LogIn} collapsed={collapsed}>
                Login
              </SidebarLink>
              <SidebarLink to="/register" icon={UserPlus} collapsed={collapsed}>
                Register
              </SidebarLink>
            </>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'flex w-full items-center rounded-lg text-sm text-sidebar-text-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-text',
              collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
            )}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4 shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
