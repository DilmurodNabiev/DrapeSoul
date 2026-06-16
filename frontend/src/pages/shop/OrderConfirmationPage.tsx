import { CheckCircle } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import type { OrderResponse } from '../../api/types'
import { formatPrice } from '../../utils/format'

export function OrderConfirmationPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>()
  const location = useLocation()
  const order = (location.state as { order?: OrderResponse })?.order

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center md:py-24 animate-slide-up">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <CheckCircle className="text-green-600 dark:text-green-400" size={32} />
      </div>
      <h1 className="font-display text-3xl font-semibold">Order Confirmed!</h1>
      <p className="mt-4 text-gray-500">
        Thank you for your purchase. We'll notify you when your order is ready.
      </p>

      {order && (
        <div className="card mt-8 text-left">
          <p className="text-sm text-gray-500">Order Number</p>
          <p className="text-lg font-semibold">{order.order_number || orderNumber}</p>
          <p className="mt-4 text-sm text-gray-500">Total</p>
          <p className="text-lg font-semibold">{formatPrice(order.total_amount)}</p>
          <p className="mt-4 text-sm text-gray-500">Payment</p>
          <p className="capitalize">
            {order.payment_method === 'transfer' ? 'Bank transfer — receipt submitted' : 'We will contact you to confirm'}
          </p>
        </div>
      )}

      <Link to="/shop" className="btn-primary mt-8 inline-flex">
        Continue Shopping
      </Link>
    </div>
  )
}
