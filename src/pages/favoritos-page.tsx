import { useMemo, useState } from 'react'
import { Heart, HeartOff, Search, Trash2, Users } from 'lucide-react'
import { MovieCard, MovieGrid, MovieGridSkeleton } from '@/components/peliculas/movie-card'
import { MovieDetailDialog } from '@/components/peliculas/movie-detail-dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState, ErrorState } from '@/components/shared/states'
import { UserSelect } from '@/components/shared/user-select'
import { Button } from '@/components/ui/button'
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton, Spinner } from '@/components/ui/display'
import { Input } from '@/components/ui/form-controls'
import { useActiveUser, useFavoriteToggle } from '@/hooks/use-active-user'
import { AFFECTED, useApiAction, useFavoritos, usePeliculas, useUsuarios } from '@/hooks/use-api'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { favoritosService } from '@/services/favoritos'
import type { PeliculaRead } from '@/types/api'

export function FavoritosPage() {
  const { activeUserId } = useActiveUser()
  const usuarios = useUsuarios()
  const activeUser = usuarios.data?.find((u) => u.id === activeUserId)
  const [detail, setDetail] = useState<PeliculaRead | null>(null)

  return (
    <>
      <PageHeader
        eyebrow="Colecciones"
        title="Favoritos"
        description="Selecciona un usuario para consultar y gestionar sus películas favoritas."
      />

      <Card>
        <CardContent className="flex flex-col gap-4 pt-5 md:flex-row md:items-end">
          <UserSelect className="md:max-w-md md:flex-1" />
          {activeUser && (
            <p className="text-sm text-muted-foreground">
              Gestionando favoritos de <span className="font-medium text-foreground">{activeUser.nombre}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {activeUserId ? (
        <UserFavorites usuarioId={activeUserId} usuarioNombre={activeUser?.nombre} onOpen={setDetail} />
      ) : (
        <EmptyState icon={Users} title="Selecciona un usuario" description="Elige un usuario para ver y marcar sus películas favoritas." />
      )}

      <GeneralFavorites onOpen={setDetail} />

      <MovieDetailDialog peliculaId={detail?.id ?? null} initial={detail} onClose={() => setDetail(null)} />
    </>
  )
}

function UserFavorites({ usuarioId, usuarioNombre, onOpen }: { usuarioId: number; usuarioNombre?: string; onOpen: (p: PeliculaRead) => void }) {
  const { favoritos, favoriteIds, toggle, pendingIds, isLoading } = useFavoriteToggle(usuarioId)
  const peliculas = usePeliculas()
  const [query, setQuery] = useState('')
  const [clearing, setClearing] = useState(false)
  const { run, pending } = useApiAction()

  const disponibles = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (peliculas.data ?? [])
      .filter((p) => !favoriteIds.has(p.id))
      .filter((p) => !q || p.titulo.toLowerCase().includes(q) || p.director.toLowerCase().includes(q) || p.genero.toLowerCase().includes(q))
  }, [peliculas.data, favoriteIds, query])

  const clearAll = async () => {
    const result = await run(() => favoritosService.eliminarTodosDeUsuario(usuarioId), {
      success: 'Se eliminaron todos los favoritos del usuario.',
      affects: AFFECTED.favorito,
    })
    if (result.ok) setClearing(false)
  }

  return (
    <>
      <section className="flex flex-col gap-4" aria-labelledby="mis-favoritos">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="mis-favoritos" className="flex items-center gap-2 text-lg font-semibold">
            <Heart className="size-5 fill-primary text-primary" aria-hidden="true" />
            Favoritas {usuarioNombre ? `de ${usuarioNombre}` : ''}
            {favoritos && <Badge variant="muted">{favoritos.length}</Badge>}
          </h2>
          {!!favoritos?.length && (
            <Button variant="outline" onClick={() => setClearing(true)}>
              <Trash2 />
              Quitar todas
            </Button>
          )}
        </div>
        {isLoading ? (
          <MovieGridSkeleton count={5} />
        ) : !favoritos?.length ? (
          <EmptyState icon={HeartOff} title="Sin favoritos" description="Marca películas del listado inferior para agregarlas." />
        ) : (
          <MovieGrid>
            {favoritos.map((p) => (
              <MovieCard
                key={p.id}
                pelicula={p}
                onOpen={onOpen}
                favorite={{ active: true, pending: pendingIds.has(p.id), onToggle: () => toggle(p.id, p.titulo) }}
              />
            ))}
          </MovieGrid>
        )}
      </section>

      <Card>
        <CardHeader className="flex-col sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1">
            <CardTitle>Agregar a favoritos</CardTitle>
            <CardDescription>Solo se muestran películas que aún no son favoritas, evitando duplicados.</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <label htmlFor="buscar-disp" className="sr-only">Filtrar películas disponibles</label>
            <Input id="buscar-disp" type="search" placeholder="Filtrar…" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {peliculas.error ? (
            <ErrorState error={peliculas.error} onRetry={() => peliculas.mutate()} />
          ) : peliculas.isLoading || isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : disponibles.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No hay más películas disponibles para marcar.</p>
          ) : (
            <ul className="scrollbar-thin max-h-96 divide-y divide-border overflow-y-auto rounded-lg border border-border">
              {disponibles.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <button type="button" onClick={() => onOpen(p)} className="min-w-0 text-left hover:underline">
                    <p className="truncate text-sm font-medium">{p.titulo}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.director} · {p.año} · {p.genero}
                    </p>
                  </button>
                  <Button size="sm" variant="outline" disabled={pendingIds.has(p.id)} onClick={() => toggle(p.id, p.titulo)}>
                    {pendingIds.has(p.id) ? <Spinner className="size-3" /> : <Heart />}
                    Marcar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={clearing}
        title="Quitar todos los favoritos"
        description={`Se eliminarán todas las películas favoritas${usuarioNombre ? ` de ${usuarioNombre}` : ''}. ¿Deseas continuar?`}
        confirmLabel="Quitar todas"
        pending={pending}
        onConfirm={clearAll}
        onClose={() => setClearing(false)}
      />
    </>
  )
}

function GeneralFavorites({ onOpen }: { onOpen: (p: PeliculaRead) => void }) {
  const favoritos = useFavoritos()
  const peliculas = usePeliculas()
  const usuarios = useUsuarios()
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const grouped = useMemo(() => {
    const byMovie = new Map<number, { pelicula?: PeliculaRead; usuarioIds: { id: number; fecha: string }[] }>()
    const movies = new Map((peliculas.data ?? []).map((p) => [p.id, p]))
    for (const f of favoritos.data ?? []) {
      const entry = byMovie.get(f.id_pelicula) ?? { pelicula: movies.get(f.id_pelicula), usuarioIds: [] }
      entry.usuarioIds.push({ id: f.id_usuario, fecha: f.fecha_marcado })
      byMovie.set(f.id_pelicula, entry)
    }
    return [...byMovie.entries()].map(([id, v]) => ({ id, ...v })).sort((a, b) => b.usuarioIds.length - a.usuarioIds.length)
  }, [favoritos.data, peliculas.data])

  const userMap = useMemo(() => new Map((usuarios.data ?? []).map((u) => [u.id, u])), [usuarios.data])
  const selected = grouped.find((g) => g.id === selectedId) ?? grouped[0]
  const loading = favoritos.isLoading || peliculas.isLoading

  return (
    <section className="flex flex-col gap-4" aria-labelledby="fav-generales">
      <div className="flex flex-col gap-1">
        <h2 id="fav-generales" className="text-lg font-semibold">Favoritos generales</h2>
        <p className="text-sm text-muted-foreground">
          Todas las películas marcadas en la plataforma. Selecciona una para ver qué usuarios la marcaron.
        </p>
      </div>
      {favoritos.error ? (
        <ErrorState error={favoritos.error} onRetry={() => favoritos.mutate()} />
      ) : loading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : grouped.length === 0 ? (
        <EmptyState icon={Heart} title="Aún no hay favoritos" description="Cuando los usuarios marquen películas aparecerán aquí." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <ul className="scrollbar-thin flex max-h-[28rem] flex-col gap-1 overflow-y-auto rounded-xl border border-border bg-card p-2">
            {grouped.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(g.id)}
                  aria-pressed={selected?.id === g.id}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                    selected?.id === g.id ? 'bg-accent' : 'hover:bg-muted/40',
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{g.pelicula?.titulo ?? `Película #${g.id}`}</span>
                    {g.pelicula && <span className="block truncate text-xs text-muted-foreground">{g.pelicula.director} · {g.pelicula.año}</span>}
                  </span>
                  <Badge>
                    <Heart className="size-3 fill-current" aria-hidden="true" />
                    {g.usuarioIds.length}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
          {selected && (
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-1">
                  <CardTitle>{selected.pelicula?.titulo ?? `Película #${selected.id}`}</CardTitle>
                  <CardDescription>
                    {selected.usuarioIds.length} {selected.usuarioIds.length === 1 ? 'usuario la marcó' : 'usuarios la marcaron'} como favorita
                  </CardDescription>
                </div>
                {selected.pelicula && (
                  <Button variant="outline" size="sm" onClick={() => onOpen(selected.pelicula as PeliculaRead)}>
                    Ver detalle
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {selected.usuarioIds.map(({ id, fecha }) => {
                    const u = userMap.get(id)
                    return (
                      <li key={id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{u?.nombre ?? `Usuario #${id}`}</p>
                          {u && <p className="truncate text-xs text-muted-foreground">{u.correo}</p>}
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">{formatDate(fecha)}</span>
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </section>
  )
}
