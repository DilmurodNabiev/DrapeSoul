import { Minus, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCartStore } from '../../stores/cartStore'
import { formatPrice } from '../../utils/format'

export function CartPage() {
  const { items, updateQuantity, removeItem, total } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center md:py-32">
        <p className="section-subheading">Your Bag</p>
        <h1 className="section-heading mt-3">Cart is Empty</h1>
        <div className="luxury-divider mt-4" />
        <p className="mt-4 text-gray-500">Discover our curated collection.</p>
        <Link to="/shop" className="btn-primary mt-8 inline-flex">
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="border-b border-brand-200/50 bg-brand-50 py-10 dark:border-gray-800 dark:bg-surface-dark md:py-14">
        <div className="mx-auto max-w-4xl px-4 text-center md:px-6">
          <p className="section-subheading">Your Bag</p>
          <h1 className="section-heading mt-3">Shopping Cart</h1>
          <div className="luxury-divider mt-4" />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-10">
        <div className="space-y-3 md:space-y-4">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.size}`}
              className="card flex gap-3 md:gap-6"
            >
              <div className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-brand-100 dark:bg-gray-800 md:h-32 md:w-28 md:rounded-2xl">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-gray-400">No img</div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between py-0.5">
                <div className="flex justify-between gap-2">
                  <div>
                    <Link to={`/product/${item.slug}`} className="font-medium leading-snug hover:text-gold-600 dark:hover:text-gold-400">
                      {item.name}
                    </Link>
                    <p className="mt-1 text-xs text-gray-500 md:text-sm">Size: {item.size}</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId, item.size)}
                    className="shrink-0 text-gray-400 transition-colors hover:text-red-500"
                    aria-label="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-brand-200 dark:border-gray-700">
                    <button
                      onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                      className="p-2"
                      aria-label="Decrease"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                      className="p-2"
                      aria-label="Increase"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card mt-6 md:mt-8">
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>{formatPrice(total())}</span>
          </div>
          <Link to="/checkout" className="btn-primary mt-6 w-full justify-center">
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  )
}
