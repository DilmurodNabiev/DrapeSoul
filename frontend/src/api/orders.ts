import { api } from './client'
import type { OrderResponse } from './types'

export interface CreateOrderPayload {
  customer_name: string
  customer_phone: string
  customer_address: string
  telegram_username?: string
  comment?: string
  delivery_method: string
  payment_method: 'contact' | 'transfer'
  items: { product_id: number; size: string; quantity: number }[]
  telegram_init_data?: string
}

export async function createOrder(payload: CreateOrderPayload, receipt?: File) {
  if (receipt) {
    const fd = new FormData()
    fd.append('order', JSON.stringify(payload))
    fd.append('receipt', receipt)
    const { data } = await api.post<OrderResponse>('/orders', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  }
  const { data } = await api.post<OrderResponse>('/orders', payload)
  return data
}

export interface OrderFilters {
  page?: number
  status?: string
  payment_method?: string
  search?: string
}

export async function fetchOrders(filters: OrderFilters = {}) {
  const { data } = await api.get('/orders', { params: filters })
  return data
}

export async function updateOrderStatus(orderId: number, status: string) {
  const { data } = await api.patch(`/orders/${orderId}/status`, { status })
  return data
}
