import {
  BarChart3,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Package,
  Server,
  ShoppingCart,
  Users,
} from 'lucide-react'
import { useEffect } from 'react'
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

export function AdminLayout() {
  const { token, user, setAuth, logout, hasPermission } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    if (token && !user) {
      fetchAdminMe().then((u) => setAuth(token, u)).catch(() => logout())
    }
  }, [token, user, setAuth, logout])

  if (!token) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 flex-shrink-0 border-r border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900 md:block">
        <Logo />
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => {
            if (!hasPermission(item.perm)) return null
            const active = location.pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
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
        <button
          onClick={logout}
          className="mt-8 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800 md:hidden">
          <div className="flex items-center justify-between">
            <Logo />
            <button onClick={logout} className="text-sm text-gray-500">Logout</button>
          </div>
        </div>
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
