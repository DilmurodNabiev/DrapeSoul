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
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next, slides.length])

  if (!slides.length) {
    return (
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900 dark:to-brand-800">
        <div className="flex h-full items-center justify-center">
          <span className="font-display text-3xl text-brand-700 dark:text-brand-300">DrapeSoul</span>
        </div>
      </div>
    )
  }

  const current = slides[index]

  return (
    <div className="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-gray-200 dark:bg-gray-800">
      {slides.map((slide, i) => (
        <Link
          key={slide.id}
          to={`/product/${slide.slug}`}
          className={`absolute inset-0 transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <img
            src={slide.primary_image}
            alt={slide.name}
            className="h-full w-full object-cover transition-transform duration-[8000ms] ease-linear group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <p className="text-sm uppercase tracking-widest opacity-90">Featured</p>
            <h3 className="mt-1 font-display text-2xl font-semibold">{slide.name}</h3>
            <p className="mt-1 text-lg">{formatPrice(slide.price)}</p>
          </div>
        </Link>
      ))}

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); prev() }}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 opacity-0 shadow transition-opacity group-hover:opacity-100 dark:bg-gray-900/90"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); next() }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 opacity-0 shadow transition-opacity group-hover:opacity-100 dark:bg-gray-900/90"
            aria-label="Next slide"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-4 right-6 flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}

      <div className="pointer-events-none absolute left-6 top-6 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur">
        {current.name}
      </div>
    </div>
  )
}
