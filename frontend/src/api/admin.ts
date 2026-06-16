import { api } from './client'
import type { AdminUser, AnalyticsOverview } from './types'

export async function adminLogin(username: string, password: string) {
  const { data } = await api.post<{ access_token: string }>('/admin/login', { username, password })
  return data
}

export async function fetchAdminMe() {
  const { data } = await api.get<AdminUser>('/admin/me')
  return data
}

export async function fetchAnalytics() {
  const { data } = await api.get<AnalyticsOverview>('/analytics/overview')
  return data
}

export async function fetchAuditLogs(limit = 50) {
  const { data } = await api.get('/logs/audit', { params: { limit } })
  return data
}

export async function fetchSystemHealth() {
  const { data } = await api.get('/system/health')
  return data
}

export async function trackVisit(pagePath: string, source?: string) {
  await api.post('/analytics/track', null, { params: { page_path: pagePath, source } })
}

export async function verifyTelegramInitData(initData: string) {
  const { data } = await api.post('/telegram/verify-init-data', { init_data: initData })
  return data
}
