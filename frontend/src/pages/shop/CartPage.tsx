import { Minus, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCartStore } from '../../stores/cartStore'
import { formatPrice } from '../../utils/format'

export function CartPage() {
  const { items, updateQuantity, removeItem, total } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center md:py-24">
        <h1 className="font-display text-3xl font-semibold">Your Cart</h1>
        <p className="mt-4 text-gray-500">Your cart is empty.</p>
        <Link to="/shop" className="btn-primary mt-8 inline-flex">
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
      <h1 className="mb-8 font-display text-3xl font-semibold">Your Cart</h1>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.size}`}
            className="card flex gap-4 md:gap-6"
          >
            <div className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 md:h-32 md:w-28">
              {item.image ? (
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-gray-400">No img</div>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-between">
              <div className="flex justify-between">
                <div>
                  <Link to={`/product/${item.slug}`} className="font-medium hover:underline">
                    {item.name}
                  </Link>
                  <p className="mt-1 text-sm text-gray-500">Size: {item.size}</p>
                </div>
                <button
                  onClick={() => removeItem(item.productId, item.size)}
                  className="text-gray-400 hover:text-red-500"
                  aria-label="Remove item"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700">
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

      <div className="card mt-8">
        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{formatPrice(total())}</span>
        </div>
        <Link to="/checkout" className="btn-primary mt-6 w-full">
          Proceed to Checkout
        </Link>
      </div>
    </div>
  )
}
