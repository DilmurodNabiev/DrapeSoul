export interface ProductListItem {
  id: number
  name: string
  slug: string
  price: number
  compare_at_price?: number
  is_featured: boolean
  is_new_arrival: boolean
  is_best_seller: boolean
  category_slug?: string
  primary_image?: string
  in_stock: boolean
}

export interface AdminProductListItem extends ProductListItem {
  description?: string
  category_id?: number
  is_active: boolean
  size_stocks: ProductSizeStock[]
}

export interface ProductImage {
  id: number
  url: string
  alt_text?: string
  sort_order: number
  is_primary: boolean
}

export interface ProductSizeStock {
  size: string
  stock: number
}

export interface ProductDetail {
  id: number
  name: string
  slug: string
  description?: string
  price: number
  compare_at_price?: number
  is_featured: boolean
  is_new_arrival: boolean
  is_best_seller: boolean
  category_id?: number
  category_slug?: string
  category_name?: string
  images: ProductImage[]
  size_stocks: ProductSizeStock[]
  in_stock: boolean
  view_count: number
  created_at: string
}

export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  image_url?: string
  sort_order: number
}

export interface CategoryAdmin extends Category {
  is_active: boolean
}

export interface Poster {
  id: number
  title?: string
  image_url: string
  link_url?: string
  sort_order: number
}

export interface PosterAdmin extends Poster {
  is_active: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface CartItem {
  productId: number
  slug: string
  name: string
  price: number
  size: string
  quantity: number
  image?: string
}

export interface OrderItem {
  id: number
  product_id: number
  product_name: string
  size: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface OrderResponse {
  id: number
  order_number: string
  customer_name: string
  customer_phone: string
  customer_address: string
  telegram_username?: string
  comment?: string
  delivery_method: string
  payment_method: string
  payment_receipt_url?: string
  status: string
  total_amount: number
  items: OrderItem[]
  created_at: string
  updated_at: string
}

export interface AdminUser {
  id?: number
  username: string
  role: string
  permissions: string[]
  telegram_id?: number
}

export interface DashboardStats {
  total_orders: number
  pending_orders: number
  total_revenue: number
  total_products: number
  total_customers: number
  visits_today: number
}

export interface AnalyticsOverview {
  stats: DashboardStats
  recent_visits: { visit_date: string; page_path: string; visit_count: number }[]
  revenue_by_day: { date: string; revenue: number; order_count: number }[]
}
