import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AdminUser } from '../api/types'

interface AuthState {
  token: string | null
  user: AdminUser | null
  setAuth: (token: string, user: AdminUser) => void
  logout: () => void
  hasPermission: (perm: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => {
        localStorage.setItem('admin_token', token)
        set({ token, user })
      },
      logout: () => {
        localStorage.removeItem('admin_token')
        set({ token: null, user: null })
      },
      hasPermission: (perm) => {
        const user = get().user
        if (!user) return false
        if (user.role === 'owner') return true
        return user.permissions.includes(perm)
      },
    }),
    { name: 'drapesoul-auth' },
  ),
)
