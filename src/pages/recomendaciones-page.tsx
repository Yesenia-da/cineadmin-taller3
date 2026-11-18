import { useId, useState } from 'react'
import { Sparkles, UserRound } from 'lucide-react'
import { MovieCard, MovieGrid, MovieGridSkeleton } from '@/components/peliculas/movie-card'
import { MovieDetailDialog } from '@/components/peliculas/movie-detail-dialog'
import { DynamicData } from '@/components/shared/dynamic-data'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState, ErrorState } from '@/components/shared/states'
import { UserSelect } from '@/components/shared/user-select'
import { Card, CardContent } from '@/components/ui/display'
import { Select } from '@/components/ui/form-controls'
import { useActiveUser, useFavoriteToggle } from '@/hooks/use-active-user'
import { useRecomendaciones } from '@/hooks/use-api'
import type { PeliculaRead } from '@/types/api'

/** The recommendations endpoint has no documented schema; treat items as movies only if they have that shape. */
function isPelicula(value: unknown): value is PeliculaRead {
  return !!value && typeof value === 'object' && 'id' in value && 'titulo' in value && 'año' in value
}

export function RecomendacionesPage() {
  const limitId = useId()
  const { activeUserId } = useActiveUser()
  const [limit, setLimit] = useState(10)
  const { data, error, isLoading, mutate } = useRecomendaciones(activeUserId, limit)
  const { favoriteIds, toggle, pendingIds } = useFavoriteToggle(activeUserId)
  const [detail, setDetail] = useState<PeliculaRead | null>(null)

  const allMovies = Array.isArray(data) && data.every(isPelicula)

  return (
    <>
      <PageHeader
        eyebrow="Para ti"
        title="Recomendaciones"
        description="Sugerencias de películas generadas por la API según los favoritos del usuario."
      />

      <Card>
        <CardContent className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-end">
          <UserSelect className="sm:max-w-md sm:flex-1" />
          <div className="flex flex-col gap-1.5 sm:w-40">
            <label htmlFor={limitId} className="text-xs font-medium text-muted-foreground">
              Cantidad
            </label>
            <Select id={limitId} value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              {[5, 10, 20].map((n) => (
                <option key={n} value={n}>
                  {n} películas
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {!activeUserId ? (
        <EmptyState icon={UserRound} title="Selecciona un usuario" description="Elige un usuario para obtener recomendaciones personalizadas." />
      ) : error ? (
        <ErrorState error={error} onRetry={() => mutate()} />
      ) : isLoading ? (
        <MovieGridSkeleton count={limit > 10 ? 10 : limit} />
      ) : !data?.length ? (
        <EmptyState icon={Sparkles} title="Sin recomendaciones" description="La API no devolvió recomendaciones. Marca más favoritos para mejorar las sugerencias." />
      ) : allMovies ? (
        <MovieGrid>
          {(data as PeliculaRead[]).map((p) => (
            <MovieCard
              key={p.id}
              pelicula={p}
              onOpen={setDetail}
              favorite={{ active: favoriteIds.has(p.id), pending: pendingIds.has(p.id), onToggle: () => toggle(p.id, p.titulo) }}
            />
          ))}
        </MovieGrid>
      ) : (
        <DynamicData data={data} />
      )}

      <MovieDetailDialog peliculaId={detail?.id ?? null} initial={detail} onClose={() => setDetail(null)} />
    </>
  )
}
