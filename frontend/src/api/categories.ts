import { api } from './client'
import type { Category, CategoryAdmin } from './types'

export async function fetchAdminCategories() {
  const { data } = await api.get<CategoryAdmin[]>('/categories/admin/all')
  return data
}

export async function createCategory(payload: {
  name: string
  description?: string
  sort_order?: number
  is_active?: boolean
}) {
  const { data } = await api.post<Category>('/categories', payload)
  return data
}

export async function updateCategory(id: number, payload: Record<string, unknown>) {
  const { data } = await api.patch<Category>(`/categories/${id}`, payload)
  return data
}

export async function deleteCategory(id: number) {
  await api.delete(`/categories/${id}`)
}

export async function uploadCategoryImage(categoryId: number, file: File) {
  const fd = new FormData()
  fd.append('file', file)
  const { data } = await api.post(`/categories/${categoryId}/image`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
