import type { LucideIcon } from 'lucide-react'
import { Film } from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/shared/states'
import { Skeleton } from '@/components/ui/display'
import type { PeliculaRead } from '@/types/api'
import { MoviePoster } from './movie-poster'

interface MovieRailProps {
  title: string
  icon: LucideIcon
  peliculas: PeliculaRead[] | undefined
  loading: boolean
  error: unknown
  onRetry: () => void
  onOpen: (pelicula: PeliculaRead) => void
  ranked?: boolean
}

export function MovieRail({ title, icon: Icon, peliculas, loading, error, onRetry, onOpen, ranked }: MovieRailProps) {
  return (
    <section className="flex flex-col gap-4" aria-labelledby={`rail-${title}`}>
      <h2 id={`rail-${title}`} className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <Icon className="size-5 text-primary" aria-hidden="true" />
        {title}
      </h2>
      {error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : loading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="aspect-[2/3] w-36 shrink-0 rounded-lg md:w-40" />
          ))}
        </div>
      ) : !peliculas?.length ? (
        <EmptyState icon={Film} title="Sin películas" description="Aún no hay datos para esta sección." />
      ) : (
        <ul className="scrollbar-thin -mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-3">
          {peliculas.map((p, i) => (
            <li key={p.id} className="w-36 shrink-0 snap-start md:w-40">
              <button
                type="button"
                onClick={() => onOpen(p)}
                className="group flex w-full flex-col gap-2 rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring"
                aria-label={`Ver detalles de ${p.titulo}`}
              >
                <div className="relative">
                  <MoviePoster
                    titulo={p.titulo}
                    año={p.año}
                    genero={p.genero}
                    className="transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  {ranked && (
                    <span className="absolute top-1 left-2 font-display text-5xl leading-none text-white drop-shadow-[0_2px_6px_rgb(0_0_0/0.8)]">
                      {i + 1}
                    </span>
                  )}
                </div>
                <span className="line-clamp-1 text-sm font-medium text-foreground">{p.titulo}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
