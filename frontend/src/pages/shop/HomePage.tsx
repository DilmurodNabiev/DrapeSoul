import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { trackVisit } from '../../api/admin'
import { fetchPosters } from '../../api/posters'
import { fetchCategories, fetchProducts } from '../../api/products'
import type { Category, Poster, ProductListItem } from '../../api/types'
import { HeroSlider } from '../../components/ui/HeroSlider'
import { PosterSlider } from '../../components/ui/PosterSlider'
import { ProductCard } from '../../components/ui/ProductCard'
import { ProductCarousel } from '../../components/ui/ProductCarousel'

export function HomePage() {
  const [featured, setFeatured] = useState<ProductListItem[]>([])
  const [newArrivals, setNewArrivals] = useState<ProductListItem[]>([])
  const [bestSellers, setBestSellers] = useState<ProductListItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [posters, setPosters] = useState<Poster[]>([])

  useEffect(() => {
    trackVisit('/', 'web').catch(() => {})
    Promise.all([
      fetchProducts({ featured: true, page_size: 8 }),
      fetchProducts({ new_arrival: true, page_size: 8 }),
      fetchProducts({ best_seller: true, page_size: 8 }),
      fetchCategories(),
      fetchPosters(),
    ]).then(([f, n, b, c, p]) => {
      setFeatured(f.items)
      setNewArrivals(n.items)
      setBestSellers(b.items)
      setCategories(c)
      setPosters(p)
    }).catch(() => {})
  }, [])

  const sliderProducts = featured.length ? featured : [...newArrivals, ...bestSellers]

  return (
    <div className="animate-fade-in">
      {/* Editorial Hero */}
      <section className="relative min-h-[85vh] overflow-hidden bg-brand-50 dark:bg-surface-dark md:min-h-[90vh]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-50/50 to-brand-50 dark:via-surface-dark/50 dark:to-surface-dark" />

        <div className="relative mx-auto flex min-h-[85vh] max-w-7xl flex-col justify-end px-4 pb-10 pt-24 md:min-h-[90vh] md:justify-center md:px-6 md:pb-0 md:pt-0">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
            <div className="order-2 space-y-6 md:order-1 md:space-y-8">
              <p className="section-subheading animate-slide-up">New Collection 2026</p>
              <h1 className="font-display text-[2.5rem] font-medium leading-[1.1] tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl lg:text-7xl">
                Elevate Your
                <br />
                <span className="italic text-gold-600 dark:text-gold-400">Everyday Style</span>
              </h1>
              <div className="luxury-divider !mx-0" />
              <p className="max-w-md text-base leading-relaxed text-gray-600 dark:text-gray-400 md:text-lg">
                Discover curated pieces that blend luxury craftsmanship with modern minimalism.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Link to="/shop" className="btn-primary gap-2">
                  Shop Collection <ArrowRight size={18} />
                </Link>
                <Link to="/shop?new_arrival=true" className="btn-secondary">
                  New Arrivals
                </Link>
              </div>
            </div>

            <div className="order-1 md:order-2">
              <HeroSlider products={sliderProducts} />
            </div>
          </div>
        </div>
      </section>

      {/* Posters */}
      <PosterSlider posters={posters} />

      {/* Categories */}
      {categories.length > 0 && (
        <section className="bg-white py-12 dark:bg-gray-950 md:py-20">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="mb-8 text-center md:mb-12">
              <p className="section-subheading">Collections</p>
              <h2 className="section-heading mt-3">Shop by Category</h2>
              <div className="luxury-divider mt-4" />
            </div>
            <div className="hide-scrollbar flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/shop?category=${cat.slug}`}
                  className="group relative aspect-[3/4] w-[72vw] flex-shrink-0 overflow-hidden rounded-2xl bg-brand-100 dark:bg-gray-800 sm:w-[48vw] md:w-auto"
                >
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900 dark:to-brand-800">
                      <span className="font-display text-2xl text-brand-700 dark:text-brand-300">{cat.name}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-500 group-hover:from-black/80" />
                  <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gold-300">Explore</p>
                    <span className="mt-1 block font-display text-xl text-white md:text-2xl">{cat.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <ProductSection title="Featured" subtitle="Curated Selection" products={featured} link="/shop?featured=true" />
      <ProductSection title="New Arrivals" subtitle="Just Landed" products={newArrivals} link="/shop?new_arrival=true" />
      <ProductSection title="Best Sellers" subtitle="Most Loved" products={bestSellers} link="/shop?best_seller=true" />

      {/* CTA Banner */}
      <section className="bg-gray-900 py-16 text-white dark:bg-black md:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center md:px-6">
          <p className="section-subheading !text-gold-400">Exclusive</p>
          <h2 className="mt-4 font-display text-3xl font-medium md:text-5xl">Timeless Elegance Awaits</h2>
          <p className="mx-auto mt-4 max-w-lg text-gray-400">
            Every piece is thoughtfully selected to elevate your wardrobe with sophistication and grace.
          </p>
          <Link to="/shop" className="btn-gold mt-8 gap-2">
            Explore the Collection <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}

function ProductSection({
  title,
  subtitle,
  products,
  link,
}: {
  title: string
  subtitle: string
  products: ProductListItem[]
  link: string
}) {
  if (!products.length) return null
  return (
    <section className="border-t border-brand-200/50 py-12 dark:border-gray-800 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-8 flex items-end justify-between gap-4 md:mb-12">
          <div>
            <p className="section-subheading">{subtitle}</p>
            <h2 className="section-heading mt-2">{title}</h2>
          </div>
          <Link
            to={link}
            className="hidden shrink-0 text-sm font-medium tracking-wide text-gray-500 transition-colors hover:text-gold-600 dark:text-gray-400 dark:hover:text-gold-400 sm:block"
          >
            View All →
          </Link>
        </div>
        <ProductCarousel title="" products={products} />
        <Link
          to={link}
          className="mt-6 block text-center text-sm font-medium tracking-wide text-gray-500 transition-colors hover:text-gold-600 dark:text-gray-400 dark:hover:text-gold-400 sm:hidden"
        >
          View All {title} →
        </Link>
      </div>
    </section>
  )
}
