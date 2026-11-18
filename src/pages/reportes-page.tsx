import { useMemo } from 'react'
import { BarChart3, Flame, Sparkles, UserRound } from 'lucide-react'
import { DataBarChart, DynamicData } from '@/components/shared/dynamic-data'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState, ErrorState } from '@/components/shared/states'
import { UserSelect } from '@/components/shared/user-select'
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components/ui/display'
import { useActiveUser } from '@/hooks/use-active-user'
import { useEstadisticasGenerales, useEstadisticasUsuario, useFavoritos, usePeliculas, usePopulares, useRecientes } from '@/hooks/use-api'
import { formatDate } from '@/lib/format'

export function ReportesPage() {
  const generales = useEstadisticasGenerales()
  const populares = usePopulares(10)
  const recientes = useRecientes(10)
  const peliculas = usePeliculas()
  const favoritos = useFavoritos()
  const { activeUserId } = useActiveUser()
  const porUsuario = useEstadisticasUsuario(activeUserId)

  const favoritosPorPelicula = useMemo(() => {
    const titles = new Map((peliculas.data ?? []).map((p) => [p.id, p.titulo]))
    const counts = new Map<number, number>()
    for (const f of favoritos.data ?? []) counts.set(f.id_pelicula, (counts.get(f.id_pelicula) ?? 0) + 1)
    return [...counts.entries()]
      .map(([id, total]) => ({ titulo: titles.get(id) ?? `Película #${id}`, total }))
      .sort((a, b) => b.total - a.total)
  }, [favoritos.data, peliculas.data])

  const porClasificacion = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of peliculas.data ?? []) counts.set(p.clasificacion, (counts.get(p.clasificacion) ?? 0) + 1)
    return [...counts.entries()].map(([clasificacion, total]) => ({ clasificacion, total }))
  }, [peliculas.data])

  return (
    <>
      <PageHeader eyebrow="Análisis" title="Reportes y estadísticas" description="Indicadores de favoritos, popularidad y actividad por usuario." />

      <section className="flex flex-col gap-4" aria-labelledby="stats-gen">
        <h2 id="stats-gen" className="flex items-center gap-2 text-lg font-semibold">
          <BarChart3 className="size-5 text-primary" aria-hidden="true" />
          Estadísticas generales de favoritos
        </h2>
        {generales.error ? (
          <ErrorState error={generales.error} onRetry={() => generales.mutate()} />
        ) : generales.isLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : (
          <DynamicData data={generales.data} />
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-1">
              <CardTitle>Favoritos por película</CardTitle>
              <CardDescription>Calculado a partir de los favoritos registrados.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {favoritos.error ? (
              <ErrorState error={favoritos.error} onRetry={() => favoritos.mutate()} />
            ) : favoritos.isLoading || peliculas.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : favoritosPorPelicula.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Aún no hay favoritos registrados.</p>
            ) : (
              <DataBarChart data={favoritosPorPelicula} labelKey="titulo" valueKey="total" height={280} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-1">
              <CardTitle>Películas por clasificación</CardTitle>
              <CardDescription>Distribución del catálogo actual.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {peliculas.error ? (
              <ErrorState error={peliculas.error} onRetry={() => peliculas.mutate()} />
            ) : peliculas.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : porClasificacion.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">El catálogo está vacío.</p>
            ) : (
              <DataBarChart data={porClasificacion} labelKey="clasificacion" valueKey="total" height={280} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RankingList title="Populares" icon={Flame} query={populares} />
        <RankingList title="Recientes" icon={Sparkles} query={recientes} showDate />
      </div>

      <section className="flex flex-col gap-4" aria-labelledby="stats-user">
        <h2 id="stats-user" className="flex items-center gap-2 text-lg font-semibold">
          <UserRound className="size-5 text-primary" aria-hidden="true" />
          Estadísticas por usuario
        </h2>
        <UserSelect className="max-w-md" />
        {!activeUserId ? (
          <EmptyState icon={UserRound} title="Selecciona un usuario" description="Elige un usuario para consultar sus estadísticas." />
        ) : porUsuario.error ? (
          <ErrorState error={porUsuario.error} onRetry={() => porUsuario.mutate()} />
        ) : porUsuario.isLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : (
          <DynamicData data={porUsuario.data} />
        )}
      </section>
    </>
  )
}

function RankingList({
  title,
  icon: Icon,
  query,
  showDate,
}: {
  title: string
  icon: typeof Flame
  query: ReturnType<typeof usePopulares>
  showDate?: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-4 text-primary" aria-hidden="true" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {query.error ? (
          <ErrorState error={query.error} onRetry={() => query.mutate()} />
        ) : query.isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : !query.data?.length ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Sin datos.</p>
        ) : (
          <ol className="divide-y divide-border">
            {query.data.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5">
                <span className="w-6 font-display text-xl text-muted-foreground tabular-nums">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.titulo}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.director} · {p.año}
                    {showDate && ` · ${formatDate(p.fecha_creacion)}`}
                  </p>
                </div>
                <Badge variant="outline">{p.clasificacion}</Badge>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
