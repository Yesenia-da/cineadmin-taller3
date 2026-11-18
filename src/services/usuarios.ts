import type { PeliculaRead, UsuarioCreate, UsuarioRead, UsuarioUpdate } from '@/types/api'
import { fetchAllPages, request } from './http'

function listar(skip = 0, limit = 100) {
  return request<UsuarioRead[]>('/api/usuarios/', { query: { skip, limit } })
}

export const usuariosService = {
  listar,
  listarTodos: () => fetchAllPages(listar),
  obtener: (usuarioId: number) => request<UsuarioRead>(`/api/usuarios/${usuarioId}`),
  crear: (data: UsuarioCreate) => request<UsuarioRead>('/api/usuarios/', { method: 'POST', body: data }),
  actualizar: (usuarioId: number, data: UsuarioUpdate) =>
    request<UsuarioRead>(`/api/usuarios/${usuarioId}`, { method: 'PUT', body: data }),
  eliminar: (usuarioId: number) => request<void>(`/api/usuarios/${usuarioId}`, { method: 'DELETE' }),
  favoritos: (usuarioId: number) => request<PeliculaRead[]>(`/api/usuarios/${usuarioId}/favoritos`),
  marcarFavorito: (usuarioId: number, peliculaId: number) =>
    request<unknown>(`/api/usuarios/${usuarioId}/favoritos/${peliculaId}`, { method: 'POST' }),
  desmarcarFavorito: (usuarioId: number, peliculaId: number) =>
    request<void>(`/api/usuarios/${usuarioId}/favoritos/${peliculaId}`, { method: 'DELETE' }),
  estadisticas: (usuarioId: number) => request<unknown>(`/api/usuarios/${usuarioId}/estadisticas`),
}
