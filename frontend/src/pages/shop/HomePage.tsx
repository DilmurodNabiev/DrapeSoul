import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { trackVisit } from '../../api/admin'
import { fetchCategories, fetchProducts } from '../../api/products'
import type { Category, ProductListItem } from '../../api/types'
import { HeroSlider } from '../../components/ui/HeroSlider'
import { ProductCard } from '../../components/ui/ProductCard'
import { ProductCarousel } from '../../components/ui/ProductCarousel'

export function HomePage() {
  const [featured, setFeatured] = useState<ProductListItem[]>([])
  const [newArrivals, setNewArrivals] = useState<ProductListItem[]>([])
  const [bestSellers, setBestSellers] = useState<ProductListItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    trackVisit('/', 'web').catch(() => {})
    Promise.all([
      fetchProducts({ featured: true, page_size: 8 }),
      fetchProducts({ new_arrival: true, page_size: 8 }),
      fetchProducts({ best_seller: true, page_size: 8 }),
      fetchCategories(),
    ]).then(([f, n, b, c]) => {
      setFeatured(f.items)
      setNewArrivals(n.items)
      setBestSellers(b.items)
      setCategories(c)
    }).catch(() => {})
  }, [])

  const sliderProducts = featured.length ? featured : [...newArrivals, ...bestSellers]

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-brand-100 dark:from-gray-900 dark:via-surface-dark dark:to-gray-900">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-16 md:grid-cols-2 md:px-6 md:py-24">
          <div className="space-y-6">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
              New Collection 2026
            </p>
            <h1 className="font-display text-4xl font-semibold leading-tight md:text-5xl lg:text-6xl">
              Elevate Your
              <br />
              <span className="text-brand-600 dark:text-brand-400">Everyday Style</span>
            </h1>
            <p className="max-w-md text-gray-600 dark:text-gray-400">
              Discover curated pieces that blend luxury craftsmanship with modern minimalism.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/shop" className="btn-primary gap-2">
                Shop Collection <ArrowRight size={18} />
              </Link>
              <Link to="/shop?new_arrival=true" className="btn-secondary">
                New Arrivals
              </Link>
            </div>
          </div>
          <HeroSlider products={sliderProducts} />
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <h2 className="mb-8 font-display text-2xl font-semibold md:text-3xl">Shop by Category</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/shop?category=${cat.slug}`}
                className="group relative aspect-[4/3] w-[70vw] flex-shrink-0 overflow-hidden rounded-3xl bg-gray-100 dark:bg-gray-800 sm:w-[45vw] md:w-auto"
              >
                {cat.image_url ? (
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900 dark:to-brand-800">
                    <span className="font-display text-xl">{cat.name}</span>
                  </div>
                )}
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-black/20 to-transparent p-6 transition-opacity group-hover:from-black/70">
                  <span className="text-lg font-medium text-white">{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <ProductSection title="Featured" products={featured} link="/shop?featured=true" carousel />
      <ProductSection title="New Arrivals" products={newArrivals} link="/shop?new_arrival=true" carousel />
      <ProductSection title="Best Sellers" products={bestSellers} link="/shop?best_seller=true" carousel />
    </div>
  )
}

function ProductSection({
  title,
  products,
  link,
  carousel = false,
}: {
  title: string
  products: ProductListItem[]
  link: string
  carousel?: boolean
}) {
  if (!products.length) return null
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold md:text-3xl">{title}</h2>
        <Link to={link} className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          View All →
        </Link>
      </div>
      {carousel ? (
        <ProductCarousel title="" products={products} />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  )
}
