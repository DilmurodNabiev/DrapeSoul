import { useEffect, useState } from 'react'
import { fetchAnalytics } from '../../api/admin'
import type { AnalyticsOverview } from '../../api/types'
import { formatPrice } from '../../utils/format'
import { useAuthStore } from '../../stores/authStore'
import { Navigate } from 'react-router-dom'

export function DashboardPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const [data, setData] = useState<AnalyticsOverview | null>(null)

  useEffect(() => {
    fetchAnalytics().then(setData).catch(() => {})
  }, [])

  if (!hasPermission('view_statistics')) {
    return <Navigate to="/admin/orders" replace />
  }

  const stats = data?.stats

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-gray-500">Overview of your store performance</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Orders" value={stats?.total_orders ?? '—'} />
        <StatCard label="Pending Orders" value={stats?.pending_orders ?? '—'} />
        <StatCard label="Revenue" value={stats ? formatPrice(stats.total_revenue) : '—'} />
        <StatCard label="Products" value={stats?.total_products ?? '—'} />
        <StatCard label="Customers" value={stats?.total_customers ?? '—'} />
        <StatCard label="Visits Today" value={stats?.visits_today ?? '—'} />
      </div>

      {data?.revenue_by_day && data.revenue_by_day.length > 0 && (
        <div className="card mt-8">
          <h2 className="mb-4 font-medium">Revenue (Last 7 Days)</h2>
          <div className="space-y-2">
            {data.revenue_by_day.map((d) => (
              <div key={d.date} className="flex justify-between text-sm">
                <span>{d.date}</span>
                <span>{formatPrice(d.revenue)} ({d.order_count} orders)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}
