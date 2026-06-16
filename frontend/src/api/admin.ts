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

export interface SystemStats {
  status: string
  database: string
  timestamp: string
  storage: {
    backend: string
    used_bytes: number
    used_human: string
    object_count: number
    free_limit_bytes: number
    free_limit_human: string
    free_remaining_bytes: number
    free_remaining_human: string
    used_percent: number
  }
  server: {
    cpu_percent: number
    memory_total_mb: number
    memory_used_mb: number
    memory_available_mb: number
    memory_percent: number
    disk_total_gb: number
    disk_used_gb: number
    disk_free_gb: number
    disk_percent: number
    load_average?: { '1m': number; '5m': number; '15m': number }
  }
  counts: {
    orders: number
    products: number
    customers: number
    visit_analytics: number
    audit_logs: number
    system_logs: number
  }
}

export async function fetchSystemStats() {
  const { data } = await api.get<SystemStats>('/system/stats')
  return data
}

export interface ClearDataPayload {
  confirm_text: string
  clear_orders: boolean
  clear_analytics: boolean
  clear_logs: boolean
  clear_customers: boolean
  clear_r2: boolean
}

export async function clearSystemData(payload: ClearDataPayload) {
  const { data } = await api.post('/system/clear', payload)
  return data
}

export async function trackVisit(pagePath: string, source?: string) {
  await api.post('/analytics/track', null, { params: { page_path: pagePath, source } })
}

export async function verifyTelegramInitData(initData: string) {
  const { data } = await api.post('/telegram/verify-init-data', { init_data: initData })
  return data
}
