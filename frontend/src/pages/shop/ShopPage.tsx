import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchCategories, fetchProducts } from '../../api/products'
import type { Category, ProductListItem } from '../../api/types'
import { ProductCard } from '../../components/ui/ProductCard'

export function ShopPage() {
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const page = parseInt(params.get('page') || '1')
  const search = params.get('search') || undefined
  const category = params.get('category') || undefined
  const sort = (params.get('sort') as 'newest' | 'price_asc' | 'price_desc' | 'popular') || 'newest'
  const featured = params.get('featured') === 'true' ? true : undefined
  const newArrival = params.get('new_arrival') === 'true' ? true : undefined
  const bestSeller = params.get('best_seller') === 'true' ? true : undefined

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchProducts({
      page,
      search,
      category,
      sort,
      featured,
      new_arrival: newArrival,
      best_seller: bestSeller,
    })
      .then((res) => {
        setProducts(res.items)
        setTotal(res.total)
        setPages(res.pages)
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [page, search, category, sort, featured, newArrival, bestSeller])

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setParams(next)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold md:text-4xl">Shop</h1>
        <p className="mt-2 text-gray-500">{total} products</p>
      </div>

      <div className="mb-8 flex flex-wrap gap-4">
        <select
          value={category || ''}
          onChange={(e) => updateParam('category', e.target.value)}
          className="input-field w-auto min-w-[140px]"
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => updateParam('sort', e.target.value)}
          className="input-field w-auto min-w-[140px]"
          aria-label="Sort products"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="popular">Popular</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="py-16 text-center text-gray-500">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="mt-12 flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => {
                const next = new URLSearchParams(params)
                next.set('page', String(p))
                setParams(next)
              }}
              className={`h-10 w-10 rounded-full text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
