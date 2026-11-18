import { useMemo, useState, type FormEvent } from 'react'
import { Eye, Mail, Pencil, Plus, Search, Trash2, Users } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { DynamicData } from '@/components/shared/dynamic-data'
import { PageHeader } from '@/components/shared/page-header'
import { Pagination } from '@/components/shared/pagination'
import { EmptyState, ErrorState } from '@/components/shared/states'
import { Button } from '@/components/ui/button'
import { Badge, Skeleton, Spinner } from '@/components/ui/display'
import { Field, Input } from '@/components/ui/form-controls'
import { Modal } from '@/components/ui/modal'
import { AFFECTED, useApiAction, useEstadisticasUsuario, useFavoritosDeUsuario, useUsuario, useUsuarios } from '@/hooks/use-api'
import { formatDate, initials } from '@/lib/format'
import { hasErrors, validateUsuario, type FieldErrors, type UsuarioFormValues } from '@/lib/validation'
import { usuariosService } from '@/services/usuarios'
import type { UsuarioRead } from '@/types/api'

const PAGE_SIZE = 10

export function UsuariosPage() {
  const { data, error, isLoading, mutate } = useUsuarios()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<UsuarioRead | null>(null)
  const [viewing, setViewing] = useState<UsuarioRead | null>(null)
  const [deleting, setDeleting] = useState<UsuarioRead | null>(null)
  const { run, pending } = useApiAction()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = data ?? []
    return q ? list.filter((u) => u.nombre.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q)) : list
  }, [data, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const confirmDelete = async () => {
    if (!deleting) return
    const result = await run(() => usuariosService.eliminar(deleting.id), {
      success: `El usuario ${deleting.nombre} fue eliminado.`,
      affects: AFFECTED.usuarioEliminado,
    })
    if (result.ok) setDeleting(null)
  }

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Usuarios"
        description="Crea, consulta, edita y elimina las cuentas de la plataforma."
        actions={
          <Button size="lg" onClick={openCreate}>
            <Plus />
            Nuevo usuario
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <label htmlFor="buscar-usuario" className="sr-only">
          Buscar por nombre o correo
        </label>
        <Input
          id="buscar-usuario"
          type="search"
          placeholder="Buscar por nombre o correo…"
          className="pl-9"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(1)
          }}
        />
      </div>

      {error ? (
        <ErrorState error={error} onRetry={() => mutate()} />
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={query ? 'Sin coincidencias' : 'No hay usuarios registrados'}
          description={query ? `Ningún usuario coincide con "${query}".` : 'Crea el primer usuario para comenzar.'}
          action={!query ? <Button onClick={openCreate}><Plus />Nuevo usuario</Button> : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Usuario</th>
                <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">Correo</th>
                <th scope="col" className="hidden px-4 py-3 font-medium lg:table-cell">Registro</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary" aria-hidden="true">
                        {initials(u.nombre)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{u.nombre}</p>
                        <p className="truncate text-xs text-muted-foreground md:hidden">{u.correo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{u.correo}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{formatDate(u.fecha_registro)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setViewing(u)} aria-label={`Ver ${u.nombre}`}>
                        <Eye />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(u); setFormOpen(true) }} aria-label={`Editar ${u.nombre}`}>
                        <Pencil />
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => setDeleting(u)} aria-label={`Eliminar ${u.nombre}`}>
                        <Trash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!error && !isLoading && filtered.length > 0 && (
        <Pagination
          page={current}
          totalPages={totalPages}
          hasNext={current < totalPages}
          onChange={setPage}
          summary={`${filtered.length} ${filtered.length === 1 ? 'usuario' : 'usuarios'}`}
        />
      )}

      <UsuarioFormDialog open={formOpen} usuario={editing} onClose={() => setFormOpen(false)} />
      <UsuarioDetailDialog usuario={viewing} onClose={() => setViewing(null)} />
      <ConfirmDialog
        open={!!deleting}
        title="Eliminar usuario"
        description={`¿Seguro que deseas eliminar a ${deleting?.nombre ?? ''} (${deleting?.correo ?? ''})? Esta acción no se puede deshacer.`}
        pending={pending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  )
}

function UsuarioFormDialog({ open, usuario, onClose }: { open: boolean; usuario: UsuarioRead | null; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={usuario ? 'Editar usuario' : 'Nuevo usuario'} description={usuario ? `Actualiza los datos de ${usuario.nombre}.` : 'Registra una nueva cuenta en la plataforma.'}>
      {open && <UsuarioForm key={usuario?.id ?? 'new'} usuario={usuario} onClose={onClose} />}
    </Modal>
  )
}

function UsuarioForm({ usuario, onClose }: { usuario: UsuarioRead | null; onClose: () => void }) {
  const [values, setValues] = useState<UsuarioFormValues>({ nombre: usuario?.nombre ?? '', correo: usuario?.correo ?? '' })
  const [errors, setErrors] = useState<FieldErrors<keyof UsuarioFormValues>>({})
  const { run, pending } = useApiAction()

  const update = (key: keyof UsuarioFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const validation = validateUsuario(values)
    setErrors(validation)
    if (hasErrors(validation)) return
    const payload = { nombre: values.nombre.trim(), correo: values.correo.trim() }
    const result = await run(
      () => (usuario ? usuariosService.actualizar(usuario.id, payload) : usuariosService.crear(payload)),
      { success: usuario ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.', affects: AFFECTED.usuarioGuardado },
    )
    if (result.ok) onClose()
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <Field id="uf-nombre" label="Nombre" required error={errors.nombre}>
        <Input id="uf-nombre" autoComplete="name" maxLength={100} value={values.nombre} aria-invalid={!!errors.nombre || undefined} aria-describedby={errors.nombre ? 'uf-nombre-error' : undefined} onChange={(e) => update('nombre', e.target.value)} />
      </Field>
      <Field id="uf-correo" label="Correo electrónico" required error={errors.correo}>
        <Input id="uf-correo" type="email" autoComplete="email" placeholder="nombre@dominio.com" value={values.correo} aria-invalid={!!errors.correo || undefined} aria-describedby={errors.correo ? 'uf-correo-error' : undefined} onChange={(e) => update('correo', e.target.value)} />
      </Field>
      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" size="lg" onClick={onClose} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" size="lg" disabled={pending}>
          {pending && <Spinner className="size-3.5" />}
          {usuario ? 'Guardar cambios' : 'Crear usuario'}
        </Button>
      </div>
    </form>
  )
}

function UsuarioDetailDialog({ usuario, onClose }: { usuario: UsuarioRead | null; onClose: () => void }) {
  const id = usuario?.id ?? null
  const detalle = useUsuario(id)
  const favoritos = useFavoritosDeUsuario(id)
  const stats = useEstadisticasUsuario(id)
  const u = detalle.data ?? usuario

  return (
    <Modal open={!!usuario} onClose={onClose} title="Detalle del usuario" size="lg">
      {detalle.error && !u ? (
        <ErrorState error={detalle.error} onRetry={() => detalle.mutate()} />
      ) : u ? (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-lg font-semibold text-primary" aria-hidden="true">
              {initials(u.nombre)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-foreground">{u.nombre}</p>
              <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                <Mail className="size-3.5" aria-hidden="true" />
                {u.correo}
              </p>
              <p className="text-xs text-muted-foreground">
                ID {u.id} · Registrado el {formatDate(u.fecha_registro, true)}
              </p>
            </div>
          </div>

          <section className="flex flex-col gap-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              Películas favoritas {favoritos.data && <Badge variant="muted">{favoritos.data.length}</Badge>}
            </h3>
            {favoritos.error ? (
              <p className="text-sm text-destructive">No se pudieron cargar los favoritos.</p>
            ) : favoritos.isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : !favoritos.data?.length ? (
              <p className="text-sm text-muted-foreground">Este usuario no tiene favoritos.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {favoritos.data.map((p) => (
                  <li key={p.id} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs">
                    {p.titulo} <span className="text-muted-foreground">({p.año})</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-3 border-t border-border pt-4">
            <h3 className="text-sm font-semibold">Estadísticas del usuario</h3>
            {stats.error ? (
              <p className="text-sm text-destructive">No se pudieron cargar las estadísticas.</p>
            ) : stats.isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <DynamicData data={stats.data} />
            )}
          </section>
        </div>
      ) : null}
    </Modal>
  )
}
