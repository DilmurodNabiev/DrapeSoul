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

  const pageTitle = featured
    ? 'Featured'
    : newArrival
      ? 'New Arrivals'
      : bestSeller
        ? 'Best Sellers'
        : search
          ? `Results for "${search}"`
          : 'Shop'

  return (
    <div className="animate-fade-in">
      <div className="border-b border-brand-200/50 bg-brand-50 py-10 dark:border-gray-800 dark:bg-surface-dark md:py-14">
        <div className="mx-auto max-w-7xl px-4 text-center md:px-6">
          <p className="section-subheading">Collection</p>
          <h1 className="section-heading mt-3">{pageTitle}</h1>
          <div className="luxury-divider mt-4" />
          <p className="mt-3 text-sm text-gray-500">{total} products</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <select
            value={category || ''}
            onChange={(e) => updateParam('category', e.target.value)}
            className="input-field flex-1 sm:max-w-[200px]"
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
            className="input-field flex-1 sm:max-w-[200px]"
            aria-label="Sort products"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="popular">Popular</option>
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-brand-200 dark:bg-gray-800" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="py-20 text-center text-gray-500">No products found.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
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
                className={`h-10 w-10 rounded-full text-sm font-medium transition-all duration-300 ${
                  p === page
                    ? 'bg-gray-900 text-white dark:bg-gold-500'
                    : 'bg-brand-100 text-gray-600 hover:bg-brand-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
