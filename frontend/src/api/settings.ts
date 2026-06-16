import { api } from './client'

export interface CheckoutSettings {
  payment_card_number: string
  payment_card_holder: string
}

export async function fetchCheckoutSettings() {
  const { data } = await api.get<CheckoutSettings>('/settings/checkout')
  return data
}
