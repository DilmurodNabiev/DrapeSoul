import { ArrowRight, CreditCard, Phone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createOrder } from '../../api/orders'
import { fetchCheckoutSettings } from '../../api/settings'
import { useCartStore } from '../../stores/cartStore'
import { useTelegramStore } from '../../stores/telegramStore'
import { formatPrice } from '../../utils/format'

type PaymentMethod = 'contact' | 'transfer'

export function CheckoutPage() {
  const navigate = useNavigate()
  const { items, total, clearCart } = useCartStore()
  const { initData, user } = useTelegramStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('contact')
  const [receipt, setReceipt] = useState<File | null>(null)
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')

  const [form, setForm] = useState({
    customer_name: user?.first_name || '',
    customer_phone: '',
    customer_address: '',
    telegram_username: user?.username || '',
    comment: '',
    delivery_method: 'delivery',
  })

  useEffect(() => {
    fetchCheckoutSettings()
      .then((s) => {
        setCardNumber(s.payment_card_number)
        setCardHolder(s.payment_card_holder)
      })
      .catch(() => {})
  }, [])

  if (items.length === 0) {
    navigate('/cart')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (paymentMethod === 'transfer' && !receipt) {
      setError('Please upload your payment receipt screenshot.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const order = await createOrder(
        {
          ...form,
          payment_method: paymentMethod,
          items: items.map((i) => ({
            product_id: i.productId,
            size: i.size,
            quantity: i.quantity,
          })),
          telegram_init_data: initData || undefined,
        },
        paymentMethod === 'transfer' ? receipt ?? undefined : undefined,
      )
      clearCart()
      navigate(`/order-confirmation/${order.order_number}`, { state: { order } })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(typeof msg === 'string' ? msg : 'Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="border-b border-brand-200/50 bg-brand-50 py-10 dark:border-gray-800 dark:bg-surface-dark md:py-14">
        <div className="mx-auto max-w-2xl px-4 text-center md:px-6">
          <p className="section-subheading">Complete Order</p>
          <h1 className="section-heading mt-3">Checkout</h1>
          <div className="luxury-divider mt-4" />
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-10">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <p className="mb-3 text-sm font-medium">How would you like to pay?</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('contact')}
              className={`card flex items-start gap-3 text-left transition-all ${
                paymentMethod === 'contact' ? 'ring-2 ring-gold-500' : ''
              }`}
            >
              <Phone size={20} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Contact to confirm</p>
                <p className="mt-1 text-sm text-gray-500">We will contact you to arrange payment and delivery.</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('transfer')}
              className={`card flex items-start gap-3 text-left transition-all ${
                paymentMethod === 'transfer' ? 'ring-2 ring-gold-500' : ''
              }`}
            >
              <CreditCard size={20} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Bank transfer</p>
                <p className="mt-1 text-sm text-gray-500">Transfer to our card and upload your receipt.</p>
              </div>
            </button>
          </div>
        </div>

        {paymentMethod === 'transfer' && (
          <div className="card space-y-4 border-brand-200 bg-brand-50/50 dark:border-brand-800 dark:bg-brand-900/20">
            <h3 className="font-medium">Transfer details</h3>
            <div className="rounded-2xl bg-white p-4 dark:bg-gray-900">
              <p className="text-xs uppercase tracking-wider text-gray-500">Card number</p>
              <p className="mt-1 font-mono text-lg font-semibold tracking-wider">{cardNumber || '8600 1234 5678 9012'}</p>
              <p className="mt-3 text-xs uppercase tracking-wider text-gray-500">Card holder</p>
              <p className="mt-1 font-medium">{cardHolder || 'DRAPESOUL LLC'}</p>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Transfer the total amount, then upload a screenshot of your payment receipt below.
            </p>
            <div>
              <label htmlFor="receipt" className="mb-2 block text-sm font-medium">Payment receipt *</label>
              <input
                id="receipt"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required={paymentMethod === 'transfer'}
                className="input-field"
                onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium">Full Name *</label>
          <input
            id="name"
            required
            className="input-field"
            value={form.customer_name}
            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-2 block text-sm font-medium">Phone *</label>
          <input
            id="phone"
            type="tel"
            required
            className="input-field"
            value={form.customer_phone}
            onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="address" className="mb-2 block text-sm font-medium">Delivery Address *</label>
          <textarea
            id="address"
            required
            rows={3}
            className="input-field resize-none"
            value={form.customer_address}
            onChange={(e) => setForm({ ...form, customer_address: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="telegram" className="mb-2 block text-sm font-medium">Telegram Username</label>
          <input
            id="telegram"
            className="input-field"
            placeholder="@username"
            value={form.telegram_username}
            onChange={(e) => setForm({ ...form, telegram_username: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="delivery" className="mb-2 block text-sm font-medium">Delivery Method</label>
          <select
            id="delivery"
            className="input-field"
            value={form.delivery_method}
            onChange={(e) => setForm({ ...form, delivery_method: e.target.value })}
          >
            <option value="delivery">Home Delivery</option>
            <option value="pickup">Store Pickup</option>
            <option value="express">Express Delivery</option>
          </select>
        </div>

        <div>
          <label htmlFor="comment" className="mb-2 block text-sm font-medium">Order Comment</label>
          <textarea
            id="comment"
            rows={2}
            className="input-field resize-none"
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
          />
        </div>

        <div className="card">
          <h3 className="mb-4 font-medium">Order Summary</h3>
          {items.map((item) => (
            <div key={`${item.productId}-${item.size}`} className="flex justify-between py-2 text-sm">
              <span>{item.name} ({item.size}) × {item.quantity}</span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="mt-4 flex justify-between border-t border-gray-200 pt-4 font-semibold dark:border-gray-700">
            <span>Total</span>
            <span>{formatPrice(total())}</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-500" role="alert">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-50">
          {loading ? 'Placing Order...' : (
            <>
              Place Order
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
      </div>
    </div>
  )
}
