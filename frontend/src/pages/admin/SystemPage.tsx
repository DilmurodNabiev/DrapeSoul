import { useEffect, useState } from 'react'
import { fetchSystemHealth } from '../../api/admin'

export function SystemPage() {
  const [health, setHealth] = useState<Record<string, string> | null>(null)

  useEffect(() => {
    fetchSystemHealth().then(setHealth).catch(() => setHealth({ status: 'error' }))
  }, [])

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">System Health</h1>
      <div className="card mt-8">
        {health ? (
          <dl className="space-y-3">
            {Object.entries(health).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <dt className="text-gray-500 capitalize">{key.replace('_', ' ')}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-gray-500">Loading...</p>
        )}
      </div>
    </div>
  )
}
