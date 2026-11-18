import { Calendar, Clock, Heart, Pencil, Tag, Trash2, User, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge, Skeleton, Spinner } from '@/components/ui/display'
import { Modal } from '@/components/ui/modal'
import { ErrorState } from '@/components/shared/states'
import { useActiveUser, useFavoriteToggle } from '@/hooks/use-active-user'
import { useFavoritosDePelicula, usePelicula } from '@/hooks/use-api'
import { formatDate, formatDuration } from '@/lib/format'
import type { PeliculaRead } from '@/types/api'
import { MoviePoster } from './movie-poster'

interface MovieDetailDialogProps {
  peliculaId: number | null
  initial?: PeliculaRead | null
  onClose: () => void
  onEdit?: (pelicula: PeliculaRead) => void
  onDelete?: (pelicula: PeliculaRead) => void
}

export function MovieDetailDialog({ peliculaId, initial, onClose, onEdit, onDelete }: MovieDetailDialogProps) {
  const { data, error, isLoading, mutate } = usePelicula(peliculaId)
  const pelicula = data ?? (initial && initial.id === peliculaId ? initial : undefined)

  return (
    <Modal open={peliculaId !== null} onClose={onClose} title={pelicula?.titulo ?? 'Detalle de película'} size="xl">
      {error && !pelicula ? (
        <ErrorState error={error} onRetry={() => mutate()} />
      ) : !pelicula ? (
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <Skeleton className="aspect-[2/3]" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      ) : (
        <MovieDetail pelicula={pelicula} refreshing={isLoading} onEdit={onEdit} onDelete={onDelete} />
      )}
    </Modal>
  )
}

function MovieDetail({
  pelicula,
  refreshing,
  onEdit,
  onDelete,
}: {
  pelicula: PeliculaRead
  refreshing: boolean
  onEdit?: (p: PeliculaRead) => void
  onDelete?: (p: PeliculaRead) => void
}) {
  const { activeUserId } = useActiveUser()
  const { favoriteIds, toggle, pendingIds } = useFavoriteToggle(activeUserId)
  const fans = useFavoritosDePelicula(pelicula.id)
  const isFavorite = favoriteIds.has(pelicula.id)

  const facts = [
    { icon: User, label: 'Director', value: pelicula.director },
    { icon: Tag, label: 'Género', value: pelicula.genero },
    { icon: Calendar, label: 'Año', value: String(pelicula.año) },
    { icon: Clock, label: 'Duración', value: formatDuration(pelicula.duracion) },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <MoviePoster titulo={pelicula.titulo} año={pelicula.año} genero={pelicula.genero} className="mx-auto w-48 md:w-full" />
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{pelicula.clasificacion}</Badge>
          <Badge variant="outline">ID {pelicula.id}</Badge>
          <span className="text-xs text-muted-foreground">Agregada el {formatDate(pelicula.fecha_creacion)}</span>
          {refreshing && <Spinner className="size-3 text-muted-foreground" />}
        </div>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {facts.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-3">
              <dt className="flex items-center gap-1.5 text-[0.7rem] tracking-wide text-muted-foreground uppercase">
                <Icon className="size-3" aria-hidden="true" />
                {label}
              </dt>
              <dd className="truncate text-sm font-medium text-foreground" title={value}>
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">Sinopsis</h3>
          <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
            {pelicula.sinopsis?.trim() || 'Esta película no tiene sinopsis registrada.'}
          </p>
        </section>

        <div className="flex flex-wrap gap-2">
          <Button
            size="lg"
            variant={isFavorite ? 'default' : 'outline'}
            disabled={!activeUserId || pendingIds.has(pelicula.id)}
            onClick={() => toggle(pelicula.id, pelicula.titulo)}
            title={!activeUserId ? 'Selecciona un usuario activo en Favoritos' : undefined}
          >
            {pendingIds.has(pelicula.id) ? <Spinner className="size-3.5" /> : <Heart className={isFavorite ? 'fill-current' : ''} />}
            {!activeUserId ? 'Selecciona un usuario para marcar' : isFavorite ? 'En favoritos' : 'Marcar como favorita'}
          </Button>
          {onEdit && (
            <Button size="lg" variant="secondary" onClick={() => onEdit(pelicula)}>
              <Pencil />
              Editar
            </Button>
          )}
          {onDelete && (
            <Button size="lg" variant="destructive" onClick={() => onDelete(pelicula)}>
              <Trash2 />
              Eliminar
            </Button>
          )}
        </div>

        <section className="flex flex-col gap-3 border-t border-border pt-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Users className="size-4 text-primary" aria-hidden="true" />
            Usuarios que la marcaron como favorita
            {fans.data && <Badge variant="muted">{fans.data.length}</Badge>}
          </h3>
          {fans.error ? (
            <p className="text-sm text-destructive">No se pudieron cargar los usuarios.</p>
          ) : fans.isLoading ? (
            <div className="flex gap-2">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-28" />
            </div>
          ) : !fans.data?.length ? (
            <p className="text-sm text-muted-foreground">Ningún usuario la ha marcado todavía.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {fans.data.map((fav) => (
                <li key={fav.id} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-foreground" title={fav.usuario.correo}>
                  {fav.usuario.nombre}
                  <span className="ml-1.5 text-muted-foreground">{formatDate(fav.fecha_marcado)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
