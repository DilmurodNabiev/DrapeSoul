import { Menu, Search, ShoppingBag, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCartStore } from '../../stores/cartStore'
import { Logo } from '../ui/Logo'
import { ThemeToggle } from '../ui/ThemeToggle'

const navLinks = [
  { to: '/shop', label: 'Shop' },
  { to: '/shop?featured=true', label: 'Featured' },
  { to: '/shop?new_arrival=true', label: 'New Arrivals' },
  { to: '/shop?best_seller=true', label: 'Best Sellers' },
]

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const itemCount = useCartStore((s) => s.itemCount())
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`)
      setSearchOpen(false)
      setQuery('')
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-lg dark:border-gray-800 dark:bg-surface-dark/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:h-20 md:px-6">
        <button
          className="rounded-full p-2 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Logo />

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="rounded-full p-2.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Search"
          >
            <Search size={20} />
          </button>
          <ThemeToggle />
          <Link
            to="/cart"
            className="relative rounded-full p-2.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label={`Cart with ${itemCount} items`}
          >
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white dark:bg-white dark:text-gray-900">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
          <form onSubmit={handleSearch} className="mx-auto flex max-w-xl gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="input-field flex-1"
              autoFocus
            />
            <button type="submit" className="btn-primary px-4">Search</button>
          </form>
        </div>
      )}

      {menuOpen && (
        <nav className="border-t border-gray-100 px-4 py-4 md:hidden dark:border-gray-800">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="block py-3 text-sm font-medium"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
