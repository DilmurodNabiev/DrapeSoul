import { Link } from 'react-router-dom'
import { Logo } from '../ui/Logo'

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-gray-500 dark:text-gray-400">
              Premium fashion curated for the modern wardrobe. Quality craftsmanship meets timeless design.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider">Shop</h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><Link to="/shop" className="hover:text-gray-900 dark:hover:text-white">All Products</Link></li>
              <li><Link to="/shop?new_arrival=true" className="hover:text-gray-900 dark:hover:text-white">New Arrivals</Link></li>
              <li><Link to="/shop?best_seller=true" className="hover:text-gray-900 dark:hover:text-white">Best Sellers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider">Support</h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">Contact</a></li>
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">Shipping</a></li>
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">Returns</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200 pt-8 text-center text-sm text-gray-400 dark:border-gray-800">
          © {new Date().getFullYear()} DrapeSoul. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
