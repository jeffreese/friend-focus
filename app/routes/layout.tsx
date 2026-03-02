import {
  Calendar,
  CircleUser,
  GitFork,
  Home,
  LogIn,
  LogOut,
  Menu,
  Notebook,
  Settings,
  UserPlus,
  Users,
} from 'lucide-react'
import { useEffect } from 'react'
import { NavLink, Outlet, useLoaderData, useLocation } from 'react-router'
import { Sheet, SheetContent } from '~/components/ui/sheet'
import { APP_NAME } from '~/config'
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
  onClick,
}: {
  to: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <NavLink
      to={to}
      end
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
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

function SidebarNav({
  user,
  onLinkClick,
}: {
  user: { email: string } | null
  onLinkClick?: () => void
}) {
  return (
    <>
      <div className="flex h-14 items-center border-b border-white/10 px-4">
        <div>
          <h1 className="text-sm font-bold text-sidebar-text">{APP_NAME}</h1>
          <p className="text-[10px] text-sidebar-text-muted">
            Plan. Connect. Remember.
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        <SidebarLink to="/" icon={Home} onClick={onLinkClick}>
          Dashboard
        </SidebarLink>
        <SidebarLink to="/friends" icon={Users} onClick={onLinkClick}>
          Friends
        </SidebarLink>
        <SidebarLink to="/events" icon={Calendar} onClick={onLinkClick}>
          Events
        </SidebarLink>
        <SidebarLink to="/relationships" icon={GitFork} onClick={onLinkClick}>
          Relationships
        </SidebarLink>
        <SidebarLink to="/journal" icon={Notebook} onClick={onLinkClick}>
          Journal
        </SidebarLink>
        <SidebarLink to="/settings" icon={Settings} onClick={onLinkClick}>
          Settings
        </SidebarLink>
      </nav>

      <div className="border-t border-white/10 p-2 space-y-1">
        {user ? (
          <>
            <div className="px-3 py-2 text-xs text-sidebar-text-muted truncate">
              {user.email}
            </div>
            <SidebarLink to="/profile" icon={CircleUser} onClick={onLinkClick}>
              Profile
            </SidebarLink>
            <form action="/logout" method="post">
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-text-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-text"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span>Logout</span>
              </button>
            </form>
          </>
        ) : (
          <>
            <SidebarLink to="/login" icon={LogIn} onClick={onLinkClick}>
              Login
            </SidebarLink>
            <SidebarLink to="/register" icon={UserPlus} onClick={onLinkClick}>
              Register
            </SidebarLink>
          </>
        )}
      </div>
    </>
  )
}

export default function Layout() {
  const { user } = useLoaderData<typeof loader>()
  const mobileNavOpen = useUIStore(s => s.mobileNavOpen)
  const setMobileNavOpen = useUIStore(s => s.setMobileNavOpen)
  const location = useLocation()

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname, setMobileNavOpen])

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col bg-sidebar">
        <SidebarNav user={user} />
      </aside>

      {/* Mobile sheet */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-64 gap-0 p-0 bg-sidebar border-none"
        >
          <SidebarNav user={user} onLinkClick={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex md:hidden h-14 items-center gap-3 border-b border-border-light bg-card px-4">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="-ml-1.5 rounded-lg p-1.5 transition-colors hover:bg-accent"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold">{APP_NAME}</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
