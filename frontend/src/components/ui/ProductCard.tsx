import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ProductListItem } from '../../api/types'
import { formatPrice } from '../../utils/format'

interface Props {
  product: ProductListItem
}

export function ProductCard({ product }: Props) {
  return (
    <article className="group animate-fade-in">
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-gray-100 dark:bg-gray-800">
          {product.primary_image ? (
            <img
              src={product.primary_image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">No image</div>
          )}
          {product.is_new_arrival && (
            <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium dark:bg-gray-900/90">
              New
            </span>
          )}
          <button
            className="absolute right-3 top-3 rounded-full bg-white/90 p-2 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-gray-900/90"
            aria-label="Add to wishlist"
            onClick={(e) => e.preventDefault()}
          >
            <Heart size={18} />
          </button>
        </div>
        <div className="mt-4 space-y-1">
          <h3 className="font-medium text-gray-900 dark:text-white">{product.name}</h3>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{formatPrice(product.price)}</span>
            {product.compare_at_price && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.compare_at_price)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  )
}
