import { ImagePlus, Pencil, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  createCategory,
  deleteCategory,
  fetchAdminCategories,
  updateCategory,
  uploadCategoryImage,
} from '../../api/categories'
import type { CategoryAdmin } from '../../api/types'

const emptyForm = {
  name: '',
  description: '',
  sort_order: '0',
  is_active: true,
}

export function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryAdmin[]>([])
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
      setCategories(await fetchAdminCategories())
    } catch {
      setError('Failed to load categories.')
      setCategories([])
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

  const openEdit = (cat: CategoryAdmin) => {
    setForm({
      name: cat.name,
      description: cat.description || '',
      sort_order: String(cat.sort_order),
      is_active: cat.is_active,
    })
    setEditingId(cat.id)
    setShowForm(true)
    setImageFile(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')
    const payload = {
      name: form.name,
      description: form.description || undefined,
      sort_order: parseInt(form.sort_order) || 0,
      is_active: form.is_active,
    }
    try {
      let categoryId = editingId
      if (editingId) {
        await updateCategory(editingId, payload)
        setMessage(`Category "${form.name}" updated.`)
      } else {
        const created = await createCategory(payload)
        categoryId = created.id
        setMessage(`Category "${form.name}" created.`)
      }
      if (imageFile && categoryId) {
        await uploadCategoryImage(categoryId, imageFile)
        setMessage((m) => `${m} Image uploaded.`)
      }
      resetForm()
      load()
    } catch {
      setError(editingId ? 'Failed to update category.' : 'Failed to create category.')
    }
  }

  const handleDelete = async (cat: CategoryAdmin) => {
    if (!confirm(`Delete category "${cat.name}"?`)) return
    setError('')
    try {
      await deleteCategory(cat.id)
      setMessage(`"${cat.name}" deleted.`)
      if (editingId === cat.id) resetForm()
      load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(typeof msg === 'string' ? msg : 'Failed to delete category.')
    }
  }

  const handleImageUpload = async (categoryId: number, file: File) => {
    setUploadingId(categoryId)
    setError('')
    try {
      await uploadCategoryImage(categoryId, file)
      setMessage('Category image uploaded.')
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
          <h1 className="font-display text-3xl font-semibold">Categories</h1>
          <p className="mt-1 text-sm text-gray-500">{categories.length} category(ies)</p>
        </div>
        <button onClick={() => (showForm && !editingId ? resetForm() : setShowForm(true))} className="btn-primary">
          {showForm && !editingId ? 'Cancel' : 'Add Category'}
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
            <h2 className="font-medium">{editingId ? 'Edit Category' : 'New Category'}</h2>
            <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
          <input
            required
            placeholder="Category name *"
            className="input-field"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <textarea
            placeholder="Description"
            className="input-field"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
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
            <label className="mb-2 block text-sm font-medium">Category image</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="input-field"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <button type="submit" className="btn-primary">
            {editingId ? 'Save Changes' : 'Create Category'}
          </button>
        </form>
      )}

      <div className="mt-8 space-y-3">
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-3xl bg-gray-200 dark:bg-gray-800" />
            ))}
          </div>
        )}
        {!loading && categories.map((cat) => (
          <div key={cat.id} className={`card flex flex-wrap items-center justify-between gap-4 ${!cat.is_active ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-4">
              {cat.image_url ? (
                <img src={cat.image_url} alt={cat.name} className="h-16 w-20 rounded-xl object-cover" />
              ) : (
                <div className="flex h-16 w-20 items-center justify-center rounded-xl bg-gray-100 text-xs text-gray-400 dark:bg-gray-800">
                  No img
                </div>
              )}
              <div>
                <p className="font-medium">{cat.name}</p>
                <p className="text-sm text-gray-500">/{cat.slug} · order {cat.sort_order}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => openEdit(cat)} className="btn-secondary gap-1 text-xs">
                <Pencil size={14} />
                Edit
              </button>
              <label className="btn-secondary cursor-pointer gap-1 text-xs">
                <ImagePlus size={14} />
                {uploadingId === cat.id ? 'Uploading...' : 'Image'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploadingId === cat.id}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(cat.id, file)
                  }}
                />
              </label>
              <button onClick={() => handleDelete(cat)} className="btn-secondary gap-1 text-xs text-red-500">
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        ))}
        {!loading && categories.length === 0 && (
          <p className="text-gray-500">No categories yet.</p>
        )}
      </div>
    </div>
  )
}
