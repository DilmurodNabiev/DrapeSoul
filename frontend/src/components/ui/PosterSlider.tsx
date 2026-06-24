import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Poster } from '../../api/types'

interface Props {
  posters: Poster[]
}

export function PosterSlider({ posters }: Props) {
  const slides = posters.filter((p) => p.image_url)
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
    const timer = setInterval(next, 4500)
    return () => clearInterval(timer)
  }, [next, slides.length])

  if (!slides.length) return null

  const current = slides[index]

  const SlideWrapper = ({ poster, children }: { poster: Poster; children: React.ReactNode }) => {
    if (poster.link_url) {
      const isExternal = poster.link_url.startsWith('http')
      if (isExternal) {
        return (
          <a href={poster.link_url} target="_blank" rel="noopener noreferrer" className="absolute inset-0">
            {children}
          </a>
        )
      }
      return (
        <Link to={poster.link_url} className="absolute inset-0">
          {children}
        </Link>
      )
    }
    return <div className="absolute inset-0">{children}</div>
  }

  return (
    <section className="relative bg-brand-50 dark:bg-surface-dark">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <div className="group relative aspect-[16/7] overflow-hidden rounded-2xl bg-gray-200 shadow-lg dark:bg-gray-800 sm:aspect-[21/8] md:rounded-3xl">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ${i === index ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            >
              <SlideWrapper poster={slide}>
                <img
                  src={slide.image_url}
                  alt={slide.title || 'Promotional poster'}
                  className={`h-full w-full object-cover ${i === index ? 'animate-ken-burns' : ''}`}
                />
              </SlideWrapper>
            </div>
          ))}

          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2.5 shadow-md backdrop-blur transition-all hover:bg-white active:scale-95 dark:bg-gray-900/90 dark:hover:bg-gray-900 sm:left-5"
                aria-label="Previous poster"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2.5 shadow-md backdrop-blur transition-all hover:bg-white active:scale-95 dark:bg-gray-900/90 dark:hover:bg-gray-900 sm:right-5"
                aria-label="Next poster"
              >
                <ChevronRight size={20} />
              </button>
              <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === index ? 'w-8 bg-gold-400' : 'w-4 bg-white/60'
                    }`}
                    aria-label={`Go to poster ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          {current.title && (
            <div className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-black/30 px-4 py-1.5 text-xs font-medium tracking-wide text-white backdrop-blur-sm sm:bottom-auto sm:left-6 sm:top-6">
              {current.title}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
