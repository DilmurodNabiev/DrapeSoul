import { Menu, Search, ShoppingBag, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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
  const [scrolled, setScrolled] = useState(false)
  const [query, setQuery] = useState('')
  const itemCount = useCartStore((s) => s.itemCount())
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`)
      setSearchOpen(false)
      setQuery('')
      setMenuOpen(false)
    }
  }

  const headerClass = scrolled || !isHome
    ? 'border-b border-brand-200/60 bg-white/95 shadow-sm backdrop-blur-xl dark:border-gray-800 dark:bg-surface-dark/95'
    : 'border-b border-transparent bg-transparent'

  return (
    <>
      <header className={`sticky top-0 z-50 transition-all duration-300 ${headerClass}`}>
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:h-16 md:px-6">
          <button
            className="rounded-full p-2 transition-colors hover:bg-brand-100 dark:hover:bg-gray-800 md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <Logo />

          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium tracking-wide text-gray-600 transition-colors hover:text-gold-600 dark:text-gray-300 dark:hover:text-gold-400"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="rounded-full p-2.5 text-gray-600 transition-colors hover:bg-brand-100 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Search"
            >
              <Search size={20} />
            </button>
            <ThemeToggle />
            <Link
              to="/cart"
              className="relative rounded-full p-2.5 text-gray-600 transition-colors hover:bg-brand-100 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label={`Cart with ${itemCount} items`}
            >
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-brand-200/60 px-4 py-3 dark:border-gray-800">
            <form onSubmit={handleSearch} className="mx-auto flex max-w-xl gap-2">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="input-field flex-1"
                autoFocus
              />
              <button type="submit" className="btn-primary !px-5">Search</button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-[70] flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-300 dark:bg-surface-dark md:hidden ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-brand-200/60 p-4 dark:border-gray-800">
          <Logo />
          <button
            onClick={() => setMenuOpen(false)}
            className="rounded-full p-2 hover:bg-brand-100 dark:hover:bg-gray-800"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="block border-b border-brand-100 py-4 text-sm font-medium tracking-wide transition-colors hover:text-gold-600 dark:border-gray-800 dark:hover:text-gold-400"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-brand-200/60 p-4 dark:border-gray-800">
          <Link to="/cart" onClick={() => setMenuOpen(false)} className="btn-primary w-full justify-center">
            Cart {itemCount > 0 && `(${itemCount})`}
          </Link>
        </div>
      </aside>
    </>
  )
}
