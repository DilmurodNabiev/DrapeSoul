import { Link } from 'react-router-dom'
import { useThemeStore } from '../../stores/themeStore'

export function Logo({ className = '' }: { className?: string }) {
  const theme = useThemeStore((s) => s.theme)
  const src = theme === 'dark' ? '/assets/logos/logo-dark.svg' : '/assets/logos/logo-light.svg'

  return (
    <Link to="/" className={`inline-flex items-center ${className}`} aria-label="DrapeSoul Home">
      <img src={src} alt="DrapeSoul" className="h-8 w-auto md:h-10" />
    </Link>
  )
}
