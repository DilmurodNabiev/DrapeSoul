import { useEffect, useState } from 'react'
import { api } from '../../api/client'

interface Admin {
  id: number
  username: string
  permissions: string[]
  is_active: boolean
}

const ALL_PERMS = [
  'manage_products',
  'manage_orders',
  'publish_products',
  'view_statistics',
  'view_logs',
  'manage_admins',
  'developer_access',
]

export function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [form, setForm] = useState({ username: '', password: '', permissions: ['manage_orders', 'manage_products'] })

  const load = () => {
    api.get<Admin[]>('/admins').then((res) => setAdmins(res.data)).catch(() => {})
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.post('/admins', form)
    setForm({ username: '', password: '', permissions: ['manage_orders', 'manage_products'] })
    load()
  }

  const togglePerm = (perm: string) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter((p) => p !== perm)
        : [...f.permissions, perm],
    }))
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Manage Admins</h1>

      <form onSubmit={handleCreate} className="card mt-8 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <input
            required
            placeholder="Username"
            className="input-field"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <input
            required
            type="password"
            placeholder="Password"
            className="input-field"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {ALL_PERMS.map((perm) => (
            <button
              key={perm}
              type="button"
              onClick={() => togglePerm(perm)}
              className={`rounded-full px-3 py-1 text-xs ${
                form.permissions.includes(perm)
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              {perm}
            </button>
          ))}
        </div>
        <button type="submit" className="btn-primary">Create Admin</button>
      </form>

      <div className="mt-8 space-y-3">
        {admins.map((a) => (
          <div key={a.id} className="card">
            <p className="font-medium">{a.username}</p>
            <p className="mt-1 text-sm text-gray-500">{a.permissions.join(', ')}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
