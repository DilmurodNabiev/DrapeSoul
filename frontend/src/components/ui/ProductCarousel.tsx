import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef } from 'react'
import type { ProductListItem } from '../../api/types'
import { ProductCard } from './ProductCard'

interface Props {
  title: string
  products: ProductListItem[]
}

export function ProductCarousel({ title, products }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const amount = el.clientWidth * 0.75
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  if (!products.length) return null

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        {title ? <h3 className="font-display text-xl font-medium">{title}</h3> : <span />}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="rounded-full border border-brand-200 p-2 transition-colors hover:bg-brand-100 dark:border-gray-700 dark:hover:bg-gray-800"
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="rounded-full border border-brand-200 p-2 transition-colors hover:bg-brand-100 dark:border-gray-700 dark:hover:bg-gray-800"
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="hide-scrollbar flex gap-3 overflow-x-auto pb-2 scroll-smooth sm:gap-4"
      >
        {products.map((p) => (
          <div key={p.id} className="w-[44vw] flex-shrink-0 sm:w-[38vw] md:w-[240px] lg:w-[260px]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  )
}
