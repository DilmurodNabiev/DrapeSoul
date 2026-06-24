import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ProductListItem } from '../../api/types'
import { formatPrice } from '../../utils/format'

interface Props {
  products: ProductListItem[]
}

export function HeroSlider({ products }: Props) {
  const slides = products.filter((p) => p.primary_image).slice(0, 5)
  const [index, setIndex] = useState(0)

  const next = useCallback(() => {
    if (!slides.length) return
    setIndex((i) => (i + 1) % slides.length)
  }, [slides.length])

  const prev = useCallback(() => {
    if (!slides.length) return
    setIndex((i) => (i - 1 + slides.length) % slides.length)
  }, [slides.length])

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(next, 6000)
    return () => clearInterval(timer)
  }, [next, slides.length])

  if (!slides.length) {
    return (
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 shadow-xl dark:from-brand-900 dark:to-brand-800 md:rounded-3xl">
        <div className="flex h-full items-center justify-center">
          <span className="font-display text-4xl text-brand-700 dark:text-brand-300">DrapeSoul</span>
        </div>
      </div>
    )
  }

  return (
    <div className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-gray-200 shadow-xl dark:bg-gray-800 md:rounded-3xl">
      {slides.map((slide, i) => (
        <Link
          key={slide.id}
          to={`/product/${slide.slug}`}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === index ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        >
          <img
            src={slide.primary_image}
            alt={slide.name}
            className={`h-full w-full object-cover ${i === index ? 'animate-ken-burns' : ''}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white md:p-8">
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-gold-300">Featured</p>
            <h3 className="mt-2 font-display text-xl font-medium md:text-3xl">{slide.name}</h3>
            <p className="mt-1 text-sm text-white/80 md:text-base">{formatPrice(slide.price)}</p>
          </div>
        </Link>
      ))}

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); prev() }}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 opacity-0 shadow-md backdrop-blur transition-all group-hover:opacity-100 dark:bg-gray-900/90 md:left-4"
            aria-label="Previous slide"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); next() }}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 opacity-0 shadow-md backdrop-blur transition-all group-hover:opacity-100 dark:bg-gray-900/90 md:right-4"
            aria-label="Next slide"
          >
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-4 right-5 flex gap-1.5 md:bottom-6 md:right-8">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === index ? 'w-6 bg-gold-400' : 'w-1.5 bg-white/50'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
