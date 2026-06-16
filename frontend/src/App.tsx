import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './components/admin/AdminLayout'
import { ShopLayout } from './components/layout/ShopLayout'
import { AdminsPage } from './pages/admin/AdminsPage'
import { AdminLoginPage } from './pages/admin/LoginPage'
import { CategoriesPage } from './pages/admin/CategoriesPage'
import { DashboardPage } from './pages/admin/DashboardPage'
import { LogsPage } from './pages/admin/LogsPage'
import { OrdersPage } from './pages/admin/OrdersPage'
import { ProductsPage } from './pages/admin/ProductsPage'
import { SystemPage } from './pages/admin/SystemPage'
import { CartPage } from './pages/shop/CartPage'
import { CheckoutPage } from './pages/shop/CheckoutPage'
import { HomePage } from './pages/shop/HomePage'
import { OrderConfirmationPage } from './pages/shop/OrderConfirmationPage'
import { ProductPage } from './pages/shop/ProductPage'
import { ShopPage } from './pages/shop/ShopPage'
import { useThemeStore } from './stores/themeStore'

export default function App() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<ShopLayout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="product/:slug" element={<ProductPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
        </Route>

        <Route path="admin/login" element={<AdminLoginPage />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="admins" element={<AdminsPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="system" element={<SystemPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
