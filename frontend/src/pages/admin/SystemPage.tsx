import { AlertTriangle, Cpu, Database, HardDrive, RefreshCw, Server } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { clearSystemData, fetchSystemStats, type SystemStats } from '../../api/admin'

function UsageBar({ percent, color = 'bg-brand-600' }: { percent: number; color?: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
      <div
        className={`h-full rounded-full transition-all ${percent > 85 ? 'bg-red-500' : percent > 70 ? 'bg-amber-500' : color}`}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

export function SystemPage() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [clearing, setClearing] = useState(false)
  const [options, setOptions] = useState({
    clear_orders: true,
    clear_analytics: true,
    clear_logs: true,
    clear_customers: true,
    clear_r2: true,
  })

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    fetchSystemStats()
      .then(setStats)
      .catch(() => setError('Failed to load system stats.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleClear = async () => {
    if (confirmText !== 'DELETE ALL DATA') {
      setError('Type DELETE ALL DATA to confirm.')
      return
    }
    if (!confirm('This permanently deletes selected data. Products are kept unless you clear R2 (which removes product images too). Continue?')) return

    setClearing(true)
    setError('')
    setMessage('')
    try {
      const result = await clearSystemData({ confirm_text: confirmText, ...options })
      setMessage(`Data cleared: ${JSON.stringify(result.details)}`)
      setConfirmText('')
      load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(typeof msg === 'string' ? msg : 'Clear operation failed.')
    } finally {
      setClearing(false)
    }
  }

  if (loading && !stats) {
    return <p className="text-gray-500">Loading system report...</p>
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">System</h1>
          <p className="mt-1 text-sm text-gray-500">Server resources, storage usage, and maintenance</p>
        </div>
        <button type="button" onClick={load} className="btn-secondary gap-2" disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-300" role="alert">{error}</p>
      )}
      {message && (
        <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">{message}</p>
      )}

      {stats && (
        <>
          <section>
            <h2 className="mb-4 flex items-center gap-2 font-medium">
              <Server size={18} />
              Server (container)
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="CPU usage" value={`${stats.server.cpu_percent}%`} />
              <StatCard
                label="RAM"
                value={`${stats.server.memory_used_mb} / ${stats.server.memory_total_mb} MB`}
                sub={`${stats.server.memory_percent}% used · ${stats.server.memory_available_mb} MB free`}
              />
              <StatCard
                label="Disk"
                value={`${stats.server.disk_used_gb} / ${stats.server.disk_total_gb} GB`}
                sub={`${stats.server.disk_free_gb} GB free`}
              />
              <StatCard
                label="Database"
                value={stats.database === 'healthy' ? 'Healthy' : stats.database}
              />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="card">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="flex items-center gap-2"><Cpu size={14} /> Memory</span>
                  <span>{stats.server.memory_percent}%</span>
                </div>
                <UsageBar percent={stats.server.memory_percent} />
              </div>
              <div className="card">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="flex items-center gap-2"><HardDrive size={14} /> Disk</span>
                  <span>{stats.server.disk_percent}%</span>
                </div>
                <UsageBar percent={stats.server.disk_percent} />
              </div>
            </div>
            {stats.server.load_average && (
              <p className="mt-3 text-sm text-gray-500">
                Load average: {stats.server.load_average['1m']} / {stats.server.load_average['5m']} / {stats.server.load_average['15m']} (1m / 5m / 15m)
              </p>
            )}
          </section>

          <section>
            <h2 className="mb-4 flex items-center gap-2 font-medium">
              <Database size={18} />
              R2 / Storage ({stats.storage.backend.toUpperCase()})
            </h2>
            <div className="card space-y-4">
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <span>Used: <strong>{stats.storage.used_human}</strong> of {stats.storage.free_limit_human} free tier</span>
                <span>{stats.storage.free_remaining_human} remaining</span>
              </div>
              <UsageBar percent={stats.storage.used_percent} color="bg-blue-600" />
              <p className="text-sm text-gray-500">
                {stats.storage.object_count} file(s) in storage · {stats.storage.used_percent}% of free limit
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-medium">Database records</h2>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {Object.entries(stats.counts).map(([key, value]) => (
                <StatCard key={key} label={key.replace(/_/g, ' ')} value={String(value)} />
              ))}
            </div>
          </section>

          <section className="card border-red-200 dark:border-red-900/50">
            <h2 className="mb-2 flex items-center gap-2 font-medium text-red-600 dark:text-red-400">
              <AlertTriangle size={18} />
              Clear old data
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Permanently remove old records and files. Products in the database are kept unless you clear R2 storage (which deletes all uploaded images including product photos).
            </p>
            <div className="mb-4 grid gap-2 sm:grid-cols-2">
              {([
                ['clear_orders', 'All orders + payment receipt screenshots'],
                ['clear_analytics', 'Visit analytics'],
                ['clear_logs', 'Audit & system logs'],
                ['clear_customers', 'Customer records'],
                ['clear_r2', 'All R2/local files (product images too!)'],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={options[key]}
                    onChange={(e) => setOptions({ ...options, [key]: e.target.checked })}
                  />
                  {label}
                </label>
              ))}
            </div>
            <input
              type="text"
              placeholder='Type DELETE ALL DATA to confirm'
              className="input-field mb-4"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
            <button
              type="button"
              onClick={handleClear}
              disabled={clearing}
              className="btn-secondary border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
            >
              {clearing ? 'Clearing...' : 'Clear selected data'}
            </button>
          </section>
        </>
      )}
    </div>
  )
}
