import { create } from 'zustand'

interface TelegramUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
}

interface TelegramState {
  isTelegram: boolean
  initData: string | null
  user: TelegramUser | null
  customerId: number | null
  init: () => void
  setVerified: (customerId: number, user: TelegramUser) => void
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string
        initDataUnsafe: { user?: TelegramUser }
        ready: () => void
        expand: () => void
        close: () => void
        themeParams: Record<string, string>
        colorScheme: 'light' | 'dark'
        MainButton: {
          text: string
          show: () => void
          hide: () => void
          onClick: (cb: () => void) => void
          offClick: (cb: () => void) => void
        }
      }
    }
  }
}

export const useTelegramStore = create<TelegramState>((set) => ({
  isTelegram: false,
  initData: null,
  user: null,
  customerId: null,
  init: () => {
    const tg = window.Telegram?.WebApp
    if (tg?.initData) {
      tg.ready()
      tg.expand()
      set({
        isTelegram: true,
        initData: tg.initData,
        user: tg.initDataUnsafe?.user ?? null,
      })
    }
  },
  setVerified: (customerId, user) => set({ customerId, user }),
}))
