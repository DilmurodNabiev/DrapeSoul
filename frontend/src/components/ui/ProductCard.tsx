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
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-brand-100 dark:bg-gray-800">
          {product.primary_image ? (
            <img
              src={product.primary_image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">No image</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          {product.is_new_arrival && (
            <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-gray-900 backdrop-blur-sm">
              New
            </span>
          )}
          <button
            className="absolute right-3 top-3 rounded-full bg-white/95 p-2 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100 dark:bg-gray-900/95"
            aria-label="Add to wishlist"
            onClick={(e) => e.preventDefault()}
          >
            <Heart size={16} />
          </button>
        </div>
        <div className="mt-3 space-y-1 px-0.5 md:mt-4">
          <h3 className="text-sm font-medium leading-snug text-gray-900 dark:text-white md:text-base">{product.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-white md:text-base">{formatPrice(product.price)}</span>
            {product.compare_at_price && (
              <span className="text-xs text-gray-400 line-through md:text-sm">
                {formatPrice(product.compare_at_price)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  )
}
