import { Outlet } from 'react-router-dom'
import { useTelegram } from '../../hooks/useTelegram'
import { Footer } from './Footer'
import { MobileNav } from './MobileNav'
import { Navbar } from './Navbar'

export function ShopLayout() {
  useTelegram()

  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
