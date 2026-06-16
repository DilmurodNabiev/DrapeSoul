import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '../api/types'

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (productId: number, size: string) => void
  updateQuantity: (productId: number, size: string, quantity: number) => void
  clearCart: () => void
  total: () => number
  itemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const qty = item.quantity ?? 1
        const existing = get().items.find((i) => i.productId === item.productId && i.size === item.size)
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === item.productId && i.size === item.size
                ? { ...i, quantity: i.quantity + qty }
                : i,
            ),
          })
        } else {
          set({ items: [...get().items, { ...item, quantity: qty }] })
        }
      },
      removeItem: (productId, size) => {
        set({ items: get().items.filter((i) => !(i.productId === productId && i.size === size)) })
      },
      updateQuantity: (productId, size, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, size)
          return
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId && i.size === size ? { ...i, quantity } : i,
          ),
        })
      },
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'drapesoul-cart' },
  ),
)
