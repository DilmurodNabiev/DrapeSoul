import { Heart, Minus, Plus, ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchProduct } from '../../api/products'
import type { ProductDetail } from '../../api/types'
import { useCartStore } from '../../stores/cartStore'
import { formatPrice } from '../../utils/format'

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  useEffect(() => {
    if (slug) {
      fetchProduct(slug).then(setProduct).catch(() => setProduct(null))
    }
  }, [slug])

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="mx-auto aspect-[3/4] max-w-lg animate-pulse rounded-2xl bg-brand-200 dark:bg-gray-800" />
      </div>
    )
  }

  const images = product.images.length
    ? product.images
    : [{ id: 0, url: '', alt_text: product.name, sort_order: 0, is_primary: true }]

  const handleAddToCart = () => {
    if (!selectedSize) return
    const image = images.find((i) => i.is_primary)?.url || images[0]?.url
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: Number(product.price),
      size: selectedSize,
      image,
      quantity,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="animate-slide-up">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-3 md:space-y-4">
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-brand-100 dark:bg-gray-800 md:rounded-3xl">
              {images[activeImage]?.url ? (
                <img
                  src={images[activeImage].url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">No image</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={`h-16 w-14 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-colors sm:h-20 sm:w-16 ${
                      i === activeImage ? 'border-gold-500' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center space-y-6 lg:space-y-8">
            {product.category_name && (
              <p className="section-subheading">{product.category_name}</p>
            )}
            <h1 className="font-display text-3xl font-medium leading-tight md:text-4xl lg:text-5xl">{product.name}</h1>
            <div className="luxury-divider !mx-0" />
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-semibold md:text-3xl">{formatPrice(product.price)}</span>
              {product.compare_at_price && (
                <span className="text-lg text-gray-400 line-through">
                  {formatPrice(product.compare_at_price)}
                </span>
              )}
            </div>

            {product.description && (
              <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">{product.description}</p>
            )}

            <div>
              <p className="mb-3 text-sm font-medium uppercase tracking-wider">Select Size</p>
              <div className="flex flex-wrap gap-2">
                {product.size_stocks.map((s) => (
                  <button
                    key={s.size}
                    onClick={() => setSelectedSize(s.size)}
                    className={`min-w-[52px] rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                      selectedSize === s.size
                        ? 'border-gray-900 bg-gray-900 text-white dark:border-gold-500 dark:bg-gold-500'
                        : 'border-brand-200 hover:border-gray-900 dark:border-gray-700 dark:hover:border-gold-500'
                    }`}
                  >
                    {s.size}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <p className="text-sm font-medium uppercase tracking-wider">Qty</p>
              <div className="flex items-center rounded-full border border-brand-200 dark:border-gray-700">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 transition-colors hover:bg-brand-50 dark:hover:bg-gray-800"
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <span className="w-10 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 transition-colors hover:bg-brand-50 dark:hover:bg-gray-800"
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={!selectedSize}
                className="btn-primary flex-1 gap-2 disabled:opacity-50"
              >
                <ShoppingBag size={18} />
                {added ? 'Added!' : 'Add to Cart'}
              </button>
              <button className="btn-secondary !px-4" aria-label="Add to wishlist">
                <Heart size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
