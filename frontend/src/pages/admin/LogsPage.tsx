import { useEffect, useState } from 'react'
import { fetchAuditLogs } from '../../api/admin'

interface AuditLog {
  id: number
  action: string
  actor_type: string
  actor_id?: string
  resource_type?: string
  resource_id?: string
  created_at: string
}

export function LogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])

  useEffect(() => {
    fetchAuditLogs(100).then(setLogs).catch(() => {})
  }, [])

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Audit Logs</h1>
      <div className="mt-8 space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="card text-sm">
            <div className="flex justify-between">
              <span className="font-medium">{log.action}</span>
              <span className="text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
            </div>
            <p className="text-gray-500">
              {log.actor_type} {log.actor_id} · {log.resource_type} {log.resource_id}
            </p>
          </div>
        ))}
        {logs.length === 0 && <p className="text-gray-500">No logs yet.</p>}
      </div>
    </div>
  )
}
