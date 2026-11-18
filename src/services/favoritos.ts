import type { FavoritoCreate, FavoritoRead, FavoritoWithDetails } from '@/types/api'
import { fetchAllPages, request } from './http'

function listar(skip = 0, limit = 100) {
  return request<FavoritoRead[]>('/api/favoritos/', { query: { skip, limit } })
}

export const favoritosService = {
  listar,
  listarTodos: () => fetchAllPages(listar),
  crear: (data: FavoritoCreate) => request<FavoritoRead>('/api/favoritos/', { method: 'POST', body: data }),
  obtener: (favoritoId: number) => request<FavoritoWithDetails>(`/api/favoritos/${favoritoId}`),
  eliminar: (favoritoId: number) => request<void>(`/api/favoritos/${favoritoId}`, { method: 'DELETE' }),
  porUsuario: (usuarioId: number) => request<FavoritoWithDetails[]>(`/api/favoritos/usuario/${usuarioId}`),
  porPelicula: (peliculaId: number) => request<FavoritoWithDetails[]>(`/api/favoritos/pelicula/${peliculaId}`),
  verificar: (usuarioId: number, peliculaId: number) =>
    request<unknown>(`/api/favoritos/verificar/${usuarioId}/${peliculaId}`),
  estadisticasGenerales: () => request<unknown>('/api/favoritos/estadisticas/generales'),
  eliminarTodosDeUsuario: (usuarioId: number) =>
    request<void>(`/api/favoritos/usuario/${usuarioId}/todos`, { method: 'DELETE' }),
  recomendaciones: (usuarioId: number, limit = 5) =>
    request<unknown[]>(`/api/favoritos/recomendaciones/${usuarioId}`, { query: { limit } }),
}
