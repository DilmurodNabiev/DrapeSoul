import { Home, Search, ShoppingBag } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useCartStore } from '../../stores/cartStore'

const items = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/shop', icon: Search, label: 'Shop' },
  { to: '/cart', icon: ShoppingBag, label: 'Cart' },
]

export function MobileNav() {
  const location = useLocation()
  const itemCount = useCartStore((s) => s.itemCount())

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-brand-200/60 bg-white/95 backdrop-blur-xl md:hidden dark:border-gray-800 dark:bg-surface-dark/95"
      aria-label="Mobile navigation"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around py-1.5">
        {items.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
          return (
            <Link
              key={to}
              to={to}
              className={`relative flex flex-col items-center gap-0.5 px-6 py-2 text-[10px] font-medium tracking-wide transition-colors ${
                active ? 'text-gold-600 dark:text-gold-400' : 'text-gray-400'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label}</span>
              {to === '/cart' && itemCount > 0 && (
                <span className="absolute right-4 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold-500 text-[9px] font-bold text-white">
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
