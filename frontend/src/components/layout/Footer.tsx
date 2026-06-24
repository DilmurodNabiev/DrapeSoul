import { Github } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Logo } from '../ui/Logo'

const GITHUB_URL = 'https://github.com/DilmurodNabiev'

export function Footer() {
  return (
    <footer className="border-t border-brand-200/60 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4 md:gap-8">
          <div className="sm:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              Premium fashion curated for the modern wardrobe. Quality craftsmanship meets timeless design.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold-600 dark:text-gold-400">Shop</h4>
            <ul className="space-y-2.5 text-sm text-gray-500 dark:text-gray-400">
              <li><Link to="/shop" className="transition-colors hover:text-gray-900 dark:hover:text-white">All Products</Link></li>
              <li><Link to="/shop?new_arrival=true" className="transition-colors hover:text-gray-900 dark:hover:text-white">New Arrivals</Link></li>
              <li><Link to="/shop?best_seller=true" className="transition-colors hover:text-gray-900 dark:hover:text-white">Best Sellers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold-600 dark:text-gold-400">Support</h4>
            <ul className="space-y-2.5 text-sm text-gray-500 dark:text-gray-400">
              <li><a href="#" className="transition-colors hover:text-gray-900 dark:hover:text-white">Contact</a></li>
              <li><a href="#" className="transition-colors hover:text-gray-900 dark:hover:text-white">Shipping</a></li>
              <li><a href="#" className="transition-colors hover:text-gray-900 dark:hover:text-white">Returns</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center gap-3 border-t border-brand-200/60 pt-8 dark:border-gray-800">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} DrapeSoul. All rights reserved.</p>
          <p className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            Created by{' '}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-gray-700 transition-colors hover:text-gold-600 dark:text-gray-300 dark:hover:text-gold-400"
            >
              Dilmurod
              <Github size={16} aria-hidden />
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
