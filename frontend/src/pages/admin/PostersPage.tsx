import { ImagePlus, Pencil, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  createPoster,
  deletePoster,
  fetchAdminPosters,
  updatePoster,
  uploadPosterImage,
} from '../../api/posters'
import type { PosterAdmin } from '../../api/types'

const emptyForm = {
  title: '',
  link_url: '',
  sort_order: '0',
  is_active: true,
}

export function PostersPage() {
  const [posters, setPosters] = useState<PosterAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploadingId, setUploadingId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      setPosters(await fetchAdminPosters())
    } catch {
      setError('Failed to load posters.')
      setPosters([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const resetForm = () => {
    setForm(emptyForm)
    setImageFile(null)
    setEditingId(null)
    setShowForm(false)
  }

  const openEdit = (poster: PosterAdmin) => {
    setForm({
      title: poster.title || '',
      link_url: poster.link_url || '',
      sort_order: String(poster.sort_order),
      is_active: poster.is_active,
    })
    setEditingId(poster.id)
    setShowForm(true)
    setImageFile(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')

    try {
      if (editingId) {
        await updatePoster(editingId, {
          title: form.title || undefined,
          link_url: form.link_url || undefined,
          sort_order: parseInt(form.sort_order) || 0,
          is_active: form.is_active,
        })
        if (imageFile) {
          await uploadPosterImage(editingId, imageFile)
        }
        setMessage('Poster updated.')
      } else {
        if (!imageFile) {
          setError('Please select a poster image.')
          return
        }
        await createPoster(imageFile, {
          title: form.title || undefined,
          link_url: form.link_url || undefined,
          sort_order: parseInt(form.sort_order) || 0,
          is_active: form.is_active,
        })
        setMessage('Poster created.')
      }
      resetForm()
      load()
    } catch {
      setError(editingId ? 'Failed to update poster.' : 'Failed to create poster.')
    }
  }

  const handleDelete = async (poster: PosterAdmin) => {
    if (!confirm(`Delete poster${poster.title ? ` "${poster.title}"` : ''}?`)) return
    setError('')
    try {
      await deletePoster(poster.id)
      setMessage('Poster deleted.')
      if (editingId === poster.id) resetForm()
      load()
    } catch {
      setError('Failed to delete poster.')
    }
  }

  const handleImageUpload = async (posterId: number, file: File) => {
    setUploadingId(posterId)
    setError('')
    try {
      await uploadPosterImage(posterId, file)
      setMessage('Poster image updated.')
      load()
    } catch {
      setError('Image upload failed.')
    } finally {
      setUploadingId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Posters</h1>
          <p className="mt-1 text-sm text-gray-500">
            {posters.length} poster(s) · shown on homepage after hero
          </p>
        </div>
        <button onClick={() => (showForm && !editingId ? resetForm() : setShowForm(true))} className="btn-primary">
          {showForm && !editingId ? 'Cancel' : 'Add Poster'}
        </button>
      </div>

      {message && (
        <p className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">{message}</p>
      )}
      {error && (
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-300" role="alert">{error}</p>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">{editingId ? 'Edit Poster' : 'New Poster'}</h2>
            <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
          <input
            placeholder="Title (optional, for alt text)"
            className="input-field"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            placeholder="Link URL (optional, e.g. /shop?featured=true)"
            className="input-field"
            value={form.link_url}
            onChange={(e) => setForm({ ...form, link_url: e.target.value })}
          />
          <input
            type="number"
            placeholder="Sort order"
            className="input-field"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active (visible on storefront)
          </label>
          <div>
            <label className="mb-2 block text-sm font-medium">
              Poster image {editingId ? '(optional — replace current)' : '*'}
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="input-field"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <button type="submit" className="btn-primary">
            {editingId ? 'Save Changes' : 'Upload Poster'}
          </button>
        </form>
      )}

      <div className="mt-8 space-y-3">
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-3xl bg-gray-200 dark:bg-gray-800" />
            ))}
          </div>
        )}
        {!loading && posters.map((poster) => (
          <div key={poster.id} className={`card flex flex-wrap items-center justify-between gap-4 ${!poster.is_active ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-4">
              <img src={poster.image_url} alt={poster.title || 'Poster'} className="h-20 w-32 rounded-xl object-cover" />
              <div>
                <p className="font-medium">{poster.title || `Poster #${poster.id}`}</p>
                <p className="text-sm text-gray-500">
                  order {poster.sort_order}
                  {poster.link_url ? ` · ${poster.link_url}` : ''}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => openEdit(poster)} className="btn-secondary gap-1 text-xs">
                <Pencil size={14} />
                Edit
              </button>
              <label className="btn-secondary cursor-pointer gap-1 text-xs">
                <ImagePlus size={14} />
                {uploadingId === poster.id ? 'Uploading...' : 'Replace'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploadingId === poster.id}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(poster.id, file)
                  }}
                />
              </label>
              <button onClick={() => handleDelete(poster)} className="btn-secondary gap-1 text-xs text-red-500">
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        ))}
        {!loading && posters.length === 0 && (
          <p className="text-gray-500">No posters yet. Add one to show on the homepage slider.</p>
        )}
      </div>
    </div>
  )
}
