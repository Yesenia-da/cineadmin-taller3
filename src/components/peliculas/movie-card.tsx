import { Clock, Heart, Pencil, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge, Spinner } from '@/components/ui/display'
import { formatDuration } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { PeliculaRead } from '@/types/api'
import { MoviePoster } from './movie-poster'

interface MovieCardProps {
  pelicula: PeliculaRead
  onOpen?: (pelicula: PeliculaRead) => void
  onEdit?: (pelicula: PeliculaRead) => void
  onDelete?: (pelicula: PeliculaRead) => void
  favorite?: { active: boolean; pending: boolean; onToggle: () => void }
  footer?: ReactNode
}

export function MovieCard({ pelicula, onOpen, onEdit, onDelete, favorite, footer }: MovieCardProps) {
  return (
    <article className="group relative flex flex-col gap-3">
      <div className="relative">
        <button
          type="button"
          onClick={() => onOpen?.(pelicula)}
          className="block w-full rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring"
          aria-label={`Ver detalles de ${pelicula.titulo}`}
        >
          <MoviePoster
            titulo={pelicula.titulo}
            año={pelicula.año}
            genero={pelicula.genero}
            className="transition-transform duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl group-hover:shadow-black/50"
          />
        </button>
        <Badge variant="muted" className="absolute top-2 left-2 bg-black/60 text-white backdrop-blur">
          {pelicula.clasificacion}
        </Badge>
        {favorite && (
          <button
            type="button"
            onClick={favorite.onToggle}
            disabled={favorite.pending}
            aria-pressed={favorite.active}
            aria-label={favorite.active ? `Quitar ${pelicula.titulo} de favoritos` : `Agregar ${pelicula.titulo} a favoritos`}
            className={cn(
              'absolute right-2 bottom-2 flex size-9 items-center justify-center rounded-full backdrop-blur transition-colors',
              favorite.active ? 'bg-primary text-primary-foreground' : 'bg-black/60 text-white hover:bg-black/80',
            )}
          >
            {favorite.pending ? (
              <Spinner className="size-3.5" />
            ) : (
              <Heart className={cn('size-4', favorite.active && 'fill-current')} />
            )}
          </button>
        )}
        {(onEdit || onDelete) && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-100 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(pelicula)}
                className="flex size-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80"
                aria-label={`Editar ${pelicula.titulo}`}
              >
                <Pencil className="size-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(pelicula)}
                className="flex size-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-destructive"
                aria-label={`Eliminar ${pelicula.titulo}`}
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5 px-0.5">
        <h3 className="line-clamp-1 text-sm font-semibold text-foreground" title={pelicula.titulo}>
          {pelicula.titulo}
        </h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">{pelicula.director}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{pelicula.año}</span>
          <span aria-hidden="true">·</span>
          <Clock className="size-3" aria-hidden="true" />
          <span>{formatDuration(pelicula.duracion)}</span>
        </p>
        {footer}
      </div>
    </article>
  )
}

export function MovieGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="aspect-[2/3] animate-pulse rounded-lg bg-muted" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

export function MovieGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">{children}</div>
}
