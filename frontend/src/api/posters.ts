import { api } from './client'
import type { Poster, PosterAdmin } from './types'

export async function fetchPosters() {
  const { data } = await api.get<Poster[]>('/posters')
  return data
}

export async function fetchAdminPosters() {
  const { data } = await api.get<PosterAdmin[]>('/posters/admin/all')
  return data
}

export async function createPoster(
  file: File,
  payload?: { title?: string; link_url?: string; sort_order?: number; is_active?: boolean },
) {
  const fd = new FormData()
  fd.append('file', file)
  if (payload?.title) fd.append('title', payload.title)
  if (payload?.link_url) fd.append('link_url', payload.link_url)
  fd.append('sort_order', String(payload?.sort_order ?? 0))
  fd.append('is_active', String(payload?.is_active ?? true))
  const { data } = await api.post<PosterAdmin>('/posters', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function updatePoster(id: number, payload: Record<string, unknown>) {
  const { data } = await api.patch<PosterAdmin>(`/posters/${id}`, payload)
  return data
}

export async function deletePoster(id: number) {
  await api.delete(`/posters/${id}`)
}

export async function uploadPosterImage(posterId: number, file: File) {
  const fd = new FormData()
  fd.append('file', file)
  const { data } = await api.post(`/posters/${posterId}/image`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
