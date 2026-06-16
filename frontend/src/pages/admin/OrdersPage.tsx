import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { deleteOrder, fetchOrders, updateOrderStatus } from '../../api/orders'
import type { OrderResponse } from '../../api/types'
import { formatDate, formatPrice } from '../../utils/format'

const STATUSES = ['pending', 'accepted', 'preparing', 'delivered', 'rejected', 'cancelled']
const PAGE_SIZE = 100

export function OrdersPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, paymentFilter, debouncedSearch])

  const load = () => {
    setLoading(true)
    setError('')
    fetchOrders({
      page,
      page_size: PAGE_SIZE,
      status: statusFilter || undefined,
      payment_method: paymentFilter || undefined,
      search: debouncedSearch || undefined,
    })
      .then((res) => {
        setOrders(res.items)
        setTotal(res.total)
        setPages(res.pages)
      })
      .catch(() => {
        setOrders([])
        setError('Failed to load orders.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [statusFilter, paymentFilter, debouncedSearch, page])

  const handleStatusChange = async (orderId: number, status: string) => {
    await updateOrderStatus(orderId, status)
    load()
  }

  const handleDelete = async (order: OrderResponse) => {
    if (!confirm(`Delete order ${order.order_number}? This will also remove the payment receipt file if present.`)) return
    setDeletingId(order.id)
    setMessage('')
    setError('')
    try {
      await deleteOrder(order.id)
      setMessage(`Order ${order.order_number} deleted.`)
      load()
    } catch {
      setError('Failed to delete order.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Orders</h1>
          <p className="mt-1 text-sm text-gray-500">{total} order(s) total</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            type="search"
            placeholder="Search order ID or number..."
            className="input-field w-56"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">All Payments</option>
            <option value="contact">Contact</option>
            <option value="transfer">Bank Transfer</option>
          </select>
        </div>
      </div>

      {message && (
        <p className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">{message}</p>
      )}
      {error && (
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-300" role="alert">{error}</p>
      )}

      {loading ? (
        <div className="mt-8 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-3xl bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <p className="mt-8 text-gray-500">No orders found.</p>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{order.order_number}</p>
                  <p className="text-sm text-gray-500">#{order.id} · {order.customer_name} · {order.customer_phone}</p>
                  <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Payment: {order.payment_method === 'transfer' ? 'Bank transfer' : 'Contact to confirm'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="font-semibold">{formatPrice(order.total_amount)}</p>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className="input-field w-auto text-sm"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleDelete(order)}
                    disabled={deletingId === order.id}
                    className="btn-secondary gap-1 text-xs text-red-500 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                    {deletingId === order.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
              {order.payment_receipt_url && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium">Payment receipt</p>
                  <a href={order.payment_receipt_url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={order.payment_receipt_url}
                      alt="Payment receipt"
                      className="max-h-48 rounded-xl border border-gray-200 dark:border-gray-700"
                    />
                  </a>
                </div>
              )}
              <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                {order.items.map((item) => (
                  <p key={item.id} className="text-sm text-gray-600 dark:text-gray-400">
                    {item.product_name} ({item.size}) × {item.quantity} — {formatPrice(item.subtotal)}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn-secondary disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {page} of {pages}</span>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="btn-secondary disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
