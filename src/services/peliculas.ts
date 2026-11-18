import type { PeliculaBusqueda, PeliculaCreate, PeliculaRead, PeliculaUpdate } from '@/types/api'
import { fetchAllPages, request } from './http'

function listar(skip = 0, limit = 100) {
  return request<PeliculaRead[]>('/api/peliculas/', { query: { skip, limit } })
}

export const peliculasService = {
  listar,
  listarTodas: () => fetchAllPages(listar),
  obtener: (peliculaId: number) => request<PeliculaRead>(`/api/peliculas/${peliculaId}`),
  crear: (data: PeliculaCreate) => request<PeliculaRead>('/api/peliculas/', { method: 'POST', body: data }),
  actualizar: (peliculaId: number, data: PeliculaUpdate) =>
    request<PeliculaRead>(`/api/peliculas/${peliculaId}`, { method: 'PUT', body: data }),
  eliminar: (peliculaId: number) => request<void>(`/api/peliculas/${peliculaId}`, { method: 'DELETE' }),
  buscar: (params: PeliculaBusqueda) =>
    request<PeliculaRead[]>('/api/peliculas/buscar/', {
      query: {
        titulo: params.titulo,
        director: params.director,
        genero: params.genero,
        año: params.año,
        año_min: params.año_min,
        año_max: params.año_max,
      },
    }),
  populares: (limit = 10) => request<PeliculaRead[]>('/api/peliculas/populares/top', { query: { limit } }),
  porClasificacion: (clasificacion: string, limit = 100) =>
    request<PeliculaRead[]>(`/api/peliculas/clasificacion/${encodeURIComponent(clasificacion)}`, {
      query: { limit },
    }),
  recientes: (limit = 10) => request<PeliculaRead[]>('/api/peliculas/recientes/nuevas', { query: { limit } }),
}
