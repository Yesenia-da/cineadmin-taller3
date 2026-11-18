import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Film, Flame, Heart, Sparkles, Users } from 'lucide-react'
import { MovieDetailDialog } from '@/components/peliculas/movie-detail-dialog'
import { MovieRail } from '@/components/peliculas/movie-rail'
import { NAV_ITEMS } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { useFavoritos, usePeliculas, usePopulares, useRecientes, useUsuarios } from '@/hooks/use-api'
import type { PeliculaRead } from '@/types/api'

export function DashboardPage() {
  const usuarios = useUsuarios()
  const peliculas = usePeliculas()
  const favoritos = useFavoritos()
  const populares = usePopulares(10)
  const recientes = useRecientes(10)
  const [selected, setSelected] = useState<PeliculaRead | null>(null)

  return (
    <>
      <PageHeader
        eyebrow="Bienvenido"
        title="Panel principal"
        description="Resumen en tiempo real de usuarios, catálogo y favoritos de la plataforma."
      />

      <section aria-label="Estadísticas generales" className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Usuarios" value={usuarios.data?.length} icon={Users} loading={usuarios.isLoading} error={!!usuarios.error} hint="Registrados en la plataforma" />
        <StatCard label="Películas" value={peliculas.data?.length} icon={Film} loading={peliculas.isLoading} error={!!peliculas.error} hint="Disponibles en el catálogo" />
        <StatCard label="Favoritos" value={favoritos.data?.length} icon={Heart} loading={favoritos.isLoading} error={!!favoritos.error} hint="Marcados por los usuarios" />
      </section>

      <MovieRail
        title="Películas populares"
        icon={Flame}
        ranked
        peliculas={populares.data}
        loading={populares.isLoading}
        error={populares.error}
        onRetry={() => populares.mutate()}
        onOpen={setSelected}
      />

      <MovieRail
        title="Agregadas recientemente"
        icon={Sparkles}
        peliculas={recientes.data}
        loading={recientes.isLoading}
        error={recientes.error}
        onRetry={() => recientes.mutate()}
        onOpen={setSelected}
      />

      <section aria-labelledby="accesos" className="flex flex-col gap-4">
        <h2 id="accesos" className="text-lg font-semibold text-foreground">
          Accesos rápidos
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {NAV_ITEMS.filter((item) => item.to !== '/').map(({ to, label, description, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent"
            >
              <div className="flex items-center justify-between">
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-primary">
                  <Icon className="size-4" aria-hidden="true" />
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <MovieDetailDialog peliculaId={selected?.id ?? null} initial={selected} onClose={() => setSelected(null)} />
    </>
  )
}
