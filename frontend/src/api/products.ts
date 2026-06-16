import { api } from './client'
import type { AdminProductListItem, PaginatedResponse, ProductDetail, ProductListItem, ProductSizeStock } from './types'

export interface ProductFilters {
  page?: number
  page_size?: number
  search?: string
  category?: string
  min_price?: number
  max_price?: number
  size?: string
  in_stock?: boolean
  featured?: boolean
  new_arrival?: boolean
  best_seller?: boolean
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular'
}

export async function fetchProducts(filters: ProductFilters = {}) {
  const { data } = await api.get<PaginatedResponse<ProductListItem>>('/products', { params: filters })
  return data
}

export async function fetchProduct(slug: string) {
  const { data } = await api.get<ProductDetail>(`/products/${slug}`)
  return data
}

export async function fetchCategories() {
  const { data } = await api.get('/categories')
  return data
}

export async function fetchAdminProducts(page = 1, search?: string, categoryId?: number) {
  const { data } = await api.get<PaginatedResponse<AdminProductListItem>>('/products/admin/list', {
    params: {
      page,
      page_size: 100,
      search: search || undefined,
      category_id: categoryId || undefined,
      include_inactive: true,
    },
  })
  return data
}

export async function fetchAdminProduct(id: number) {
  const { data } = await api.get<ProductDetail>(`/products/admin/${id}`)
  return data
}

export async function createProduct(payload: Record<string, unknown>) {
  const { data } = await api.post<ProductDetail>('/products', payload)
  return data
}

export async function updateProduct(id: number, payload: Record<string, unknown>) {
  const { data } = await api.patch<ProductDetail>(`/products/${id}`, payload)
  return data
}

export async function deleteProduct(id: number) {
  await api.delete(`/products/${id}`)
}

export async function uploadProductImage(productId: number, file: File, isPrimary = true) {
  const fd = new FormData()
  fd.append('file', file)
  const { data } = await api.post(`/products/${productId}/images?is_primary=${isPrimary}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export function sizeStocksToForm(sizeStocks: ProductSizeStock[]) {
  return {
    sizes: sizeStocks.map((s) => s.size).join(','),
    stocks: sizeStocks.map((s) => s.stock).join(','),
  }
}
