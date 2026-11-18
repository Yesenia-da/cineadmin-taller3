import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import useSWR, { mutate } from 'swr'
import { favoritosService } from '@/services/favoritos'
import { getErrorMessage } from '@/services/http'
import { peliculasService } from '@/services/peliculas'
import { sistemaService } from '@/services/sistema'
import { usuariosService } from '@/services/usuarios'
import type { PeliculaBusqueda } from '@/types/api'

/**
 * Every SWR key is an array whose first item is a "domain". Mutations revalidate
 * only the domains they can affect, so unrelated data is never refetched.
 */
export type Domain = 'usuarios' | 'peliculas' | 'favoritos' | 'ranking' | 'stats' | 'recomendaciones' | 'health'

export const AFFECTED = {
  usuarioGuardado: ['usuarios'],
  usuarioEliminado: ['usuarios', 'favoritos', 'ranking', 'stats', 'recomendaciones'],
  peliculaGuardada: ['peliculas', 'favoritos', 'ranking', 'recomendaciones'],
  peliculaEliminada: ['peliculas', 'favoritos', 'ranking', 'stats', 'recomendaciones'],
  favorito: ['favoritos', 'ranking', 'stats', 'recomendaciones'],
} satisfies Record<string, Domain[]>

export function revalidate(domains: readonly Domain[]) {
  return mutate((key) => Array.isArray(key) && domains.includes(key[0] as Domain))
}

// Usuarios
export const useUsuarios = () => useSWR(['usuarios', 'todos'], () => usuariosService.listarTodos())

export const useUsuario = (id: number | null) =>
  useSWR(id ? ['usuarios', 'detalle', id] : null, () => usuariosService.obtener(id as number))

export const useFavoritosDeUsuario = (id: number | null) =>
  useSWR(id ? ['favoritos', 'usuario-peliculas', id] : null, () => usuariosService.favoritos(id as number))

export const useEstadisticasUsuario = (id: number | null) =>
  useSWR(id ? ['stats', 'usuario', id] : null, () => usuariosService.estadisticas(id as number))

// Películas
export const usePeliculas = () => useSWR(['peliculas', 'todas'], () => peliculasService.listarTodas())

export const usePeliculasPagina = (skip: number | null, limit: number) =>
  useSWR(skip !== null ? ['peliculas', 'pagina', skip, limit] : null, () =>
    peliculasService.listar(skip as number, limit),
  )

export const usePelicula = (id: number | null) =>
  useSWR(id ? ['peliculas', 'detalle', id] : null, () => peliculasService.obtener(id as number))

export const useBusquedaPeliculas = (params: PeliculaBusqueda | null) =>
  useSWR(params ? ['peliculas', 'buscar', JSON.stringify(params)] : null, () =>
    peliculasService.buscar(params as PeliculaBusqueda),
  )

export const usePeliculasPorClasificacion = (clasificacion: string | null) =>
  useSWR(clasificacion ? ['peliculas', 'clasificacion', clasificacion] : null, () =>
    peliculasService.porClasificacion(clasificacion as string),
  )

export const usePopulares = (limit = 10) =>
  useSWR(['ranking', 'populares', limit], () => peliculasService.populares(limit))

export const useRecientes = (limit = 10) =>
  useSWR(['peliculas', 'recientes', limit], () => peliculasService.recientes(limit))

// Favoritos
export const useFavoritos = () => useSWR(['favoritos', 'todos'], () => favoritosService.listarTodos())

export const useFavoritosDePelicula = (id: number | null) =>
  useSWR(id ? ['favoritos', 'pelicula', id] : null, () => favoritosService.porPelicula(id as number))

export const useEstadisticasGenerales = () =>
  useSWR(['stats', 'generales'], () => favoritosService.estadisticasGenerales())

export const useRecomendaciones = (usuarioId: number | null, limit: number) =>
  useSWR(usuarioId ? ['recomendaciones', usuarioId, limit] : null, () =>
    favoritosService.recomendaciones(usuarioId as number, limit),
  )

// Sistema
export const useHealth = () =>
  useSWR(['health'], () => sistemaService.health(), { refreshInterval: 60_000, shouldRetryOnError: false })

interface ActionOptions {
  success?: string
  affects?: readonly Domain[]
}

export function useApiAction() {
  const [pending, setPending] = useState(false)

  const run = useCallback(async <T>(action: () => Promise<T>, options: ActionOptions = {}) => {
    setPending(true)
    try {
      const data = await action()
      if (options.success) toast.success(options.success)
      if (options.affects) await revalidate(options.affects)
      return { ok: true as const, data }
    } catch (error) {
      toast.error(getErrorMessage(error))
      return { ok: false as const, error }
    } finally {
      setPending(false)
    }
  }, [])

  return { run, pending }
}
