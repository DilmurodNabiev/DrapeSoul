import { useEffect } from 'react'
import { verifyTelegramInitData } from '../api/admin'
import { useTelegramStore } from '../stores/telegramStore'

export function useTelegram() {
  const { isTelegram, initData, user, customerId, init, setVerified } = useTelegramStore()

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    if (initData && !customerId) {
      verifyTelegramInitData(initData).then((res) => {
        if (res.valid && res.customer_id && res.telegram_id) {
          setVerified(res.customer_id, {
            id: res.telegram_id,
            first_name: res.first_name,
            username: res.username,
          })
        }
      }).catch(() => {})
    }
  }, [initData, customerId, setVerified])

  return { isTelegram, initData, user, customerId }
}
