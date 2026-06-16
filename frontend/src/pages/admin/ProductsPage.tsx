import { ImagePlus, Pencil, Send, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import {
  createProduct,
  deleteProduct,
  fetchAdminProducts,
  fetchCategories,
  sizeStocksToForm,
  updateProduct,
  uploadProductImage,
} from '../../api/products'
import type { AdminProductListItem, Category } from '../../api/types'
import { formatPrice } from '../../utils/format'

const emptyForm = {
  name: '',
  price: '',
  description: '',
  category_id: '',
  sizes: 'S,M,L',
  stocks: '5,5,5',
  is_featured: false,
  is_new_arrival: false,
  is_best_seller: false,
  is_active: true,
}

export function ProductsPage() {
  const [products, setProducts] = useState<AdminProductListItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [uploadingId, setUploadingId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetchAdminProducts(
        1,
        debouncedSearch || undefined,
        categoryFilter ? parseInt(categoryFilter) : undefined,
      )
      setProducts(res.items)
    } catch {
      setError('Failed to load products. Make sure you are logged in.')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    fetchCategories().then(setCategories).catch(() => {})
  }, [debouncedSearch, categoryFilter])

  const resetForm = () => {
    setForm(emptyForm)
    setImageFile(null)
    setEditingId(null)
    setShowForm(false)
  }

  const openCreate = () => {
    resetForm()
    setShowForm(true)
  }

  const openEdit = (p: AdminProductListItem) => {
    const { sizes, stocks } = sizeStocksToForm(p.size_stocks || [])
    setForm({
      name: p.name,
      price: String(p.price),
      description: p.description || '',
      category_id: p.category_id ? String(p.category_id) : '',
      sizes: sizes || 'S,M,L',
      stocks: stocks || '5,5,5',
      is_featured: p.is_featured,
      is_new_arrival: p.is_new_arrival,
      is_best_seller: p.is_best_seller,
      is_active: p.is_active,
    })
    setEditingId(p.id)
    setShowForm(true)
    setImageFile(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const parseSizeStocks = () => {
    const sizes = form.sizes.split(',').map((s) => s.trim()).filter(Boolean)
    const stocks = form.stocks.split(',').map((s) => parseInt(s.trim()) || 0)
    return sizes.map((size, i) => ({ size, stock: stocks[i] ?? 0 }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')

    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      category_id: form.category_id ? parseInt(form.category_id) : null,
      is_featured: form.is_featured,
      is_new_arrival: form.is_new_arrival,
      is_best_seller: form.is_best_seller,
      is_active: form.is_active,
      size_stocks: parseSizeStocks(),
    }

    try {
      let productId = editingId
      if (editingId) {
        await updateProduct(editingId, payload)
        setMessage(`Product "${form.name}" updated.`)
      } else {
        const created = await createProduct(payload)
        productId = created.id
        setMessage(`Product "${form.name}" created.`)
      }

      if (imageFile && productId) {
        await uploadProductImage(productId, imageFile)
        setMessage((m) => `${m} Image uploaded.`)
      }

      resetForm()
      load()
    } catch {
      setError(editingId ? 'Failed to update product.' : 'Failed to create product.')
    }
  }

  const handleDelete = async (p: AdminProductListItem) => {
    if (!confirm(`Permanently delete "${p.name}"? This cannot be undone.`)) return
    setError('')
    try {
      await deleteProduct(p.id)
      setMessage(`"${p.name}" permanently deleted.`)
      if (editingId === p.id) resetForm()
      load()
    } catch {
      setError('Failed to delete product.')
    }
  }

  const handleImageUpload = async (productId: number, file: File) => {
    setUploadingId(productId)
    setError('')
    try {
      await uploadProductImage(productId, file)
      setMessage('Image uploaded.')
      load()
    } catch {
      setError('Image upload failed.')
    } finally {
      setUploadingId(null)
    }
  }

  const handlePublish = async (id: number) => {
    setError('')
    setMessage('')
    try {
      const { data } = await api.post<{ published: boolean; detail?: string }>(`/products/${id}/publish-channel`)
      if (data.published) {
        setMessage(data.detail ? `Published to Telegram channel! ${data.detail}` : 'Published to Telegram channel!')
      } else {
        setError(data.detail || 'Publish failed — check bot token and channel ID.')
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(typeof msg === 'string' ? msg : 'Publish failed.')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Products</h1>
          <p className="mt-1 text-sm text-gray-500">{products.length} product(s)</p>
        </div>
        <button onClick={() => (showForm && !editingId ? resetForm() : openCreate())} className="btn-primary">
          {showForm && !editingId ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {message && (
        <p className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">{message}</p>
      )}
      {error && (
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-300" role="alert">{error}</p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search by name..."
          className="input-field max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input-field w-auto"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">{editingId ? 'Edit Product' : 'New Product'}</h2>
            <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <input
            required
            placeholder="Product name *"
            className="input-field"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            required
            type="number"
            step="0.01"
            min="0"
            placeholder="Price (UZS) *"
            className="input-field"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <textarea
            placeholder="Description"
            className="input-field"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <select
            className="input-field"
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="Sizes: S,M,L,XL"
              className="input-field"
              value={form.sizes}
              onChange={(e) => setForm({ ...form, sizes: e.target.value })}
            />
            <input
              placeholder="Stock per size: 5,5,5,2"
              className="input-field"
              value={form.stocks}
              onChange={(e) => setForm({ ...form, stocks: e.target.value })}
            />
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Active (visible in shop)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
              Featured
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_new_arrival} onChange={(e) => setForm({ ...form, is_new_arrival: e.target.checked })} />
              New Arrival
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_best_seller} onChange={(e) => setForm({ ...form, is_best_seller: e.target.checked })} />
              Best Seller
            </label>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">
              {editingId ? 'Replace / add image' : 'Product image'} (jpg, png, webp — max 5MB)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="input-field"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <button type="submit" className="btn-primary">
            {editingId ? 'Save Changes' : 'Create Product'}
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

        {!loading && products.map((p) => (
          <div
            key={p.id}
            className={`card flex flex-wrap items-center justify-between gap-4 ${!p.is_active ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center gap-4">
              {p.primary_image ? (
                <img src={p.primary_image} alt={p.name} className="h-16 w-14 rounded-xl object-cover" />
              ) : (
                <div className="flex h-16 w-14 items-center justify-center rounded-xl bg-gray-100 text-xs text-gray-400 dark:bg-gray-800">
                  No img
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{p.name}</p>
                  {!p.is_active && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/40">Inactive</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {formatPrice(p.price)}
                  {p.category_slug && ` · ${p.category_slug}`}
                </p>
                {p.size_stocks?.length > 0 && (
                  <p className="mt-1 text-xs text-gray-400">
                    {p.size_stocks.map((s) => `${s.size}:${s.stock}`).join(' · ')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => openEdit(p)} className="btn-secondary gap-1 text-xs">
                <Pencil size={14} />
                Edit
              </button>
              <label className="btn-secondary cursor-pointer gap-1 text-xs">
                <ImagePlus size={14} />
                {uploadingId === p.id ? 'Uploading...' : 'Image'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploadingId === p.id}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(p.id, file)
                  }}
                />
              </label>
              <button onClick={() => handlePublish(p.id)} className="btn-secondary gap-1 text-xs">
                <Send size={14} />
                Publish
              </button>
              <button onClick={() => handleDelete(p)} className="btn-secondary gap-1 text-xs text-red-500 hover:text-red-600">
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        ))}

        {!loading && products.length === 0 && (
          <p className="text-gray-500">No products yet. Click &quot;Add Product&quot; to create one.</p>
        )}
      </div>
    </div>
  )
}
