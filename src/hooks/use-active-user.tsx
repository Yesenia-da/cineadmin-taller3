import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { AFFECTED, revalidate, useFavoritosDeUsuario } from '@/hooks/use-api'
import { getErrorMessage } from '@/services/http'
import { usuariosService } from '@/services/usuarios'

interface ActiveUserContextValue {
  activeUserId: number | null
  setActiveUserId: (id: number | null) => void
}

const ActiveUserContext = createContext<ActiveUserContextValue | null>(null)

export function ActiveUserProvider({ children }: { children: ReactNode }) {
  const [activeUserId, setActiveUserId] = useState<number | null>(null)
  const value = useMemo(() => ({ activeUserId, setActiveUserId }), [activeUserId])
  return <ActiveUserContext.Provider value={value}>{children}</ActiveUserContext.Provider>
}

export function useActiveUser() {
  const ctx = useContext(ActiveUserContext)
  if (!ctx) throw new Error('useActiveUser debe usarse dentro de ActiveUserProvider')
  return ctx
}

/** Favorites of a given user plus a toggle that never sends duplicates. */
export function useFavoriteToggle(usuarioId: number | null) {
  const { data, isLoading } = useFavoritosDeUsuario(usuarioId)
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set())

  const favoriteIds = useMemo(() => new Set((data ?? []).map((p) => p.id)), [data])

  const toggle = useCallback(
    async (peliculaId: number, titulo?: string) => {
      if (!usuarioId) {
        toast.error('Selecciona un usuario para gestionar favoritos.')
        return
      }
      if (pendingIds.has(peliculaId) || isLoading) return
      const isFavorite = favoriteIds.has(peliculaId)
      setPendingIds((prev) => new Set(prev).add(peliculaId))
      try {
        if (isFavorite) {
          await usuariosService.desmarcarFavorito(usuarioId, peliculaId)
          toast.success(titulo ? `"${titulo}" se quitó de favoritos.` : 'Favorito eliminado.')
        } else {
          await usuariosService.marcarFavorito(usuarioId, peliculaId)
          toast.success(titulo ? `"${titulo}" se agregó a favoritos.` : 'Favorito agregado.')
        }
        await revalidate(AFFECTED.favorito)
      } catch (error) {
        toast.error(getErrorMessage(error))
        await revalidate(['favoritos'])
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev)
          next.delete(peliculaId)
          return next
        })
      }
    },
    [usuarioId, favoriteIds, pendingIds, isLoading],
  )

  return { favoriteIds, toggle, pendingIds, isLoading, favoritos: data }
}
