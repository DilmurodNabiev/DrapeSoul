import { Home, Search, ShoppingBag, User } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useCartStore } from '../../stores/cartStore'

const items = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/shop', icon: Search, label: 'Shop' },
  { to: '/cart', icon: ShoppingBag, label: 'Cart' },
  { to: '/admin', icon: User, label: 'Admin' },
]

export function MobileNav() {
  const location = useLocation()
  const itemCount = useCartStore((s) => s.itemCount())

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white/90 backdrop-blur-lg md:hidden dark:border-gray-800 dark:bg-surface-dark/90"
      aria-label="Mobile navigation"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around py-2">
        {items.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
          return (
            <Link
              key={to}
              to={to}
              className={`relative flex flex-col items-center gap-0.5 px-4 py-2 text-xs transition-colors ${
                active ? 'text-gray-900 dark:text-white' : 'text-gray-400'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
              {to === '/cart' && itemCount > 0 && (
                <span className="absolute right-2 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-[9px] text-white dark:bg-white dark:text-gray-900">
                  {itemCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
