import { useMemo, useState, type FormEvent } from 'react'
import { Film, Plus, Search, X } from 'lucide-react'
import { MovieCard, MovieGrid, MovieGridSkeleton } from '@/components/peliculas/movie-card'
import { MovieDetailDialog } from '@/components/peliculas/movie-detail-dialog'
import { MovieFormDialog } from '@/components/peliculas/movie-form-dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { PageHeader } from '@/components/shared/page-header'
import { Pagination } from '@/components/shared/pagination'
import { EmptyState, ErrorState } from '@/components/shared/states'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/form-controls'
import { useActiveUser, useFavoriteToggle } from '@/hooks/use-active-user'
import {
  AFFECTED,
  useApiAction,
  useBusquedaPeliculas,
  usePeliculasPagina,
  usePeliculasPorClasificacion,
} from '@/hooks/use-api'
import { cn } from '@/lib/utils'
import { YEAR_MAX, YEAR_MIN } from '@/lib/validation'
import { peliculasService } from '@/services/peliculas'
import { CLASIFICACIONES, type PeliculaBusqueda, type PeliculaRead } from '@/types/api'

const PAGE_SIZE = 20
const EMPTY_FILTERS = { titulo: '', director: '', genero: '', año: '' }

export function PeliculasPage() {
  const [draft, setDraft] = useState(EMPTY_FILTERS)
  const [search, setSearch] = useState<PeliculaBusqueda | null>(null)
  const [yearError, setYearError] = useState<string>()
  const [clasificacion, setClasificacion] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const [detail, setDetail] = useState<PeliculaRead | null>(null)
  const [editing, setEditing] = useState<PeliculaRead | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<PeliculaRead | null>(null)

  const { activeUserId } = useActiveUser()
  const { favoriteIds, toggle, pendingIds } = useFavoriteToggle(activeUserId)
  const { run, pending } = useApiAction()

  const mode = search ? 'buscar' : clasificacion ? 'clasificacion' : 'lista'

  // Server-side pagination; one extra item tells us whether a next page exists.
  const lista = usePeliculasPagina(mode === 'lista' ? (page - 1) * PAGE_SIZE : null, PAGE_SIZE + 1)
  const busqueda = useBusquedaPeliculas(mode === 'buscar' ? search : null)
  const porClasificacion = usePeliculasPorClasificacion(mode === 'clasificacion' ? clasificacion : null)

  const active = mode === 'lista' ? lista : mode === 'buscar' ? busqueda : porClasificacion

  const { items, hasNext, totalPages, total } = useMemo(() => {
    if (mode === 'lista') {
      const data = lista.data ?? []
      return { items: data.slice(0, PAGE_SIZE), hasNext: data.length > PAGE_SIZE, totalPages: undefined, total: undefined }
    }
    const all = (active.data ?? []).filter((p) => !clasificacion || p.clasificacion === clasificacion)
    const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE))
    return {
      items: all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      hasNext: page < pages,
      totalPages: pages,
      total: all.length,
    }
  }, [mode, lista.data, active.data, clasificacion, page])

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    const year = draft.año.trim()
    if (year && (!/^\d+$/.test(year) || Number(year) < YEAR_MIN || Number(year) > YEAR_MAX)) {
      setYearError(`Año entre ${YEAR_MIN} y ${YEAR_MAX}.`)
      return
    }
    setYearError(undefined)
    const params: PeliculaBusqueda = {}
    if (draft.titulo.trim()) params.titulo = draft.titulo.trim()
    if (draft.director.trim()) params.director = draft.director.trim()
    if (draft.genero.trim()) params.genero = draft.genero.trim()
    if (year) params.año = Number(year)
    setSearch(Object.keys(params).length ? params : null)
    setPage(1)
  }

  const clearSearch = () => {
    setDraft(EMPTY_FILTERS)
    setSearch(null)
    setYearError(undefined)
    setPage(1)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    const result = await run(() => peliculasService.eliminar(deleting.id), {
      success: `"${deleting.titulo}" se eliminó del catálogo.`,
      affects: AFFECTED.peliculaEliminada,
    })
    if (result.ok) {
      if (detail?.id === deleting.id) setDetail(null)
      setDeleting(null)
      if (items.length === 1 && page > 1) setPage(page - 1)
    }
  }

  const openEdit = (p: PeliculaRead) => {
    setDetail(null)
    setEditing(p)
    setFormOpen(true)
  }

  const openDelete = (p: PeliculaRead) => {
    setDetail(null)
    setDeleting(p)
  }

  const summary =
    total !== undefined
      ? `${total} ${total === 1 ? 'película encontrada' : 'películas encontradas'}`
      : items.length
        ? `Mostrando ${(page - 1) * PAGE_SIZE + 1}–${(page - 1) * PAGE_SIZE + items.length}`
        : undefined

  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Películas"
        description="Explora, busca y administra todos los títulos de la plataforma."
        actions={
          <Button
            size="lg"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus />
            Nueva película
          </Button>
        }
      />

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 md:p-5" aria-label="Búsqueda y filtros">
        <form onSubmit={handleSearch} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_120px_auto]" noValidate>
          <Field id="f-titulo" label="Título">
            <Input id="f-titulo" placeholder="Buscar por título" value={draft.titulo} onChange={(e) => setDraft({ ...draft, titulo: e.target.value })} />
          </Field>
          <Field id="f-director" label="Director">
            <Input id="f-director" placeholder="Nombre del director" value={draft.director} onChange={(e) => setDraft({ ...draft, director: e.target.value })} />
          </Field>
          <Field id="f-genero" label="Género">
            <Input id="f-genero" placeholder="Drama, Comedia…" value={draft.genero} onChange={(e) => setDraft({ ...draft, genero: e.target.value })} />
          </Field>
          <Field id="f-año" label="Año" error={yearError}>
            <Input
              id="f-año"
              inputMode="numeric"
              placeholder="2024"
              value={draft.año}
              aria-invalid={!!yearError || undefined}
              onChange={(e) => setDraft({ ...draft, año: e.target.value })}
            />
          </Field>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
            <Button type="submit" size="lg" className="h-10 flex-1 lg:flex-none">
              <Search />
              Buscar
            </Button>
            {search && (
              <Button type="button" variant="outline" size="lg" className="h-10" onClick={clearSearch}>
                <X />
                Limpiar
              </Button>
            )}
          </div>
        </form>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <span className="text-xs font-medium text-muted-foreground" id="clasif-label">
            Clasificación
          </span>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="clasif-label">
            {[null, ...CLASIFICACIONES].map((c) => (
              <button
                key={c ?? 'todas'}
                type="button"
                aria-pressed={clasificacion === c}
                onClick={() => {
                  setClasificacion(c)
                  setPage(1)
                }}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                  clasificacion === c
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
                )}
              >
                {c ?? 'Todas'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {!activeUserId && (
        <p className="text-xs text-muted-foreground">
          Consejo: selecciona un usuario activo en la sección de Favoritos para marcar películas desde el catálogo.
        </p>
      )}

      {active.error ? (
        <ErrorState error={active.error} onRetry={() => active.mutate()} />
      ) : active.isLoading ? (
        <MovieGridSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Film}
          title={mode === 'lista' ? 'El catálogo está vacío' : 'No se encontraron películas'}
          description={mode === 'lista' ? 'Agrega la primera película para comenzar.' : 'Prueba con otros criterios de búsqueda o clasificación.'}
          action={
            mode === 'lista' ? (
              <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
                <Plus />
                Nueva película
              </Button>
            ) : undefined
          }
        />
      ) : (
        <MovieGrid>
          {items.map((p) => (
            <MovieCard
              key={p.id}
              pelicula={p}
              onOpen={setDetail}
              onEdit={openEdit}
              onDelete={openDelete}
              favorite={
                activeUserId
                  ? { active: favoriteIds.has(p.id), pending: pendingIds.has(p.id), onToggle: () => toggle(p.id, p.titulo) }
                  : undefined
              }
            />
          ))}
        </MovieGrid>
      )}

      {!active.error && !active.isLoading && (
        <Pagination page={page} hasNext={hasNext} totalPages={totalPages} onChange={setPage} summary={summary} />
      )}

      <MovieDetailDialog
        peliculaId={detail?.id ?? null}
        initial={detail}
        onClose={() => setDetail(null)}
        onEdit={openEdit}
        onDelete={openDelete}
      />
      <MovieFormDialog open={formOpen} pelicula={editing} onClose={() => setFormOpen(false)} />
      <ConfirmDialog
        open={!!deleting}
        title="Eliminar película"
        description={`¿Seguro que deseas eliminar "${deleting?.titulo ?? ''}"? Esta acción no se puede deshacer y también puede afectar los favoritos asociados.`}
        pending={pending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  )
}
