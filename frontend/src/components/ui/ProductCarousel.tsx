import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef } from 'react'
import { ProductCard } from './ProductCard'
import type { ProductListItem } from '../../api/types'

interface Props {
  title: string
  products: ProductListItem[]
}

export function ProductCarousel({ title, products }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' })
  }

  if (!products.length) return null

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        {title ? <h3 className="font-display text-xl font-semibold">{title}</h3> : <span />}
        <div className="flex gap-2">
          <button type="button" onClick={() => scroll('left')} className="btn-secondary p-2" aria-label="Scroll left">
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={() => scroll('right')} className="btn-secondary p-2" aria-label="Scroll right">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => (
          <div key={p.id} className="w-[160px] flex-shrink-0 sm:w-[200px] md:w-[240px]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  )
}
