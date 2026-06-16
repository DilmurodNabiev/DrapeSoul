import {
  BarChart3,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Server,
  ShoppingCart,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { fetchAdminMe } from '../../api/admin'
import { useAuthStore } from '../../stores/authStore'
import { Logo } from '../ui/Logo'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', perm: 'view_statistics' },
  { to: '/admin/orders', icon: ShoppingCart, label: 'Orders', perm: 'manage_orders' },
  { to: '/admin/products', icon: Package, label: 'Products', perm: 'manage_products' },
  { to: '/admin/categories', icon: FolderOpen, label: 'Categories', perm: 'manage_products' },
  { to: '/admin/admins', icon: Users, label: 'Admins', perm: 'manage_admins' },
  { to: '/admin/logs', icon: BarChart3, label: 'Logs', perm: 'view_logs' },
  { to: '/admin/system', icon: Server, label: 'System', perm: 'developer_access' },
]

function SidebarNav({
  location,
  hasPermission,
  onNavigate,
}: {
  location: { pathname: string }
  hasPermission: (perm: string) => boolean
  onNavigate?: () => void
}) {
  return (
    <nav className="mt-8 space-y-1">
      {navItems.map((item) => {
        if (!hasPermission(item.perm)) return null
        const active = location.pathname === item.to
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
              active
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function AdminLayout() {
  const { token, user, setAuth, logout, hasPermission } = useAuthStore()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (token && !user) {
      fetchAdminMe().then((u) => setAuth(token, u)).catch(() => logout())
    }
  }, [token, user, setAuth, logout])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  if (!token) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900 md:block">
        <Logo />
        <SidebarNav location={location} hasPermission={hasPermission} />
        <button
          onClick={logout}
          className="mt-8 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      {/* Mobile drawer overlay */}
      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={closeMenu}
          aria-label="Close menu"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-gray-200 bg-gray-50 p-6 shadow-xl transition-transform duration-300 dark:border-gray-800 dark:bg-gray-900 md:hidden ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <Logo />
          <button
            type="button"
            onClick={closeMenu}
            className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav location={location} hasPermission={hasPermission} onNavigate={closeMenu} />
        </div>
        <button
          onClick={() => {
            closeMenu()
            logout()
          }}
          className="mt-4 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-800 md:hidden">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="rounded-xl p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <Logo />
            <button onClick={logout} className="text-sm text-gray-500">Logout</button>
          </div>
        </div>
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
