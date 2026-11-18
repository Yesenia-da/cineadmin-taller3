import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/display'
import { Field, Input, Select, Textarea } from '@/components/ui/form-controls'
import { Modal } from '@/components/ui/modal'
import { AFFECTED, useApiAction } from '@/hooks/use-api'
import { hasErrors, validatePelicula, YEAR_MAX, YEAR_MIN, type FieldErrors, type PeliculaFormValues } from '@/lib/validation'
import { peliculasService } from '@/services/peliculas'
import { CLASIFICACIONES, type PeliculaCreate, type PeliculaRead } from '@/types/api'

interface MovieFormDialogProps {
  open: boolean
  pelicula: PeliculaRead | null
  onClose: () => void
  onSaved?: (pelicula: PeliculaRead) => void
}

function toValues(pelicula: PeliculaRead | null): PeliculaFormValues {
  return {
    titulo: pelicula?.titulo ?? '',
    director: pelicula?.director ?? '',
    genero: pelicula?.genero ?? '',
    duracion: pelicula ? String(pelicula.duracion) : '',
    año: pelicula ? String(pelicula.año) : '',
    clasificacion: pelicula?.clasificacion ?? '',
    sinopsis: pelicula?.sinopsis ?? '',
  }
}

export function MovieFormDialog({ open, pelicula, onClose, onSaved }: MovieFormDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={pelicula ? 'Editar película' : 'Nueva película'}
      description={pelicula ? `Actualiza la información de "${pelicula.titulo}".` : 'Agrega un título al catálogo.'}
      size="lg"
    >
      {open && <MovieForm key={pelicula?.id ?? 'new'} pelicula={pelicula} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  )
}

function MovieForm({ pelicula, onClose, onSaved }: Omit<MovieFormDialogProps, 'open'>) {
  const [values, setValues] = useState(() => toValues(pelicula))
  const [errors, setErrors] = useState<FieldErrors<keyof PeliculaFormValues>>({})
  const { run, pending } = useApiAction()

  const update = (key: keyof PeliculaFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const validation = validatePelicula(values)
    setErrors(validation)
    if (hasErrors(validation)) return

    const payload: PeliculaCreate = {
      titulo: values.titulo.trim(),
      director: values.director.trim(),
      genero: values.genero.trim(),
      duracion: Number(values.duracion),
      año: Number(values.año),
      clasificacion: values.clasificacion,
      sinopsis: values.sinopsis.trim() ? values.sinopsis.trim() : null,
    }

    const result = await run(
      () => (pelicula ? peliculasService.actualizar(pelicula.id, payload) : peliculasService.crear(payload)),
      {
        success: pelicula ? 'Película actualizada correctamente.' : 'Película creada correctamente.',
        affects: AFFECTED.peliculaGuardada,
      },
    )
    if (result.ok) {
      onSaved?.(result.data)
      onClose()
    }
  }

  const invalid = (key: keyof PeliculaFormValues) => ({
    'aria-invalid': !!errors[key] || undefined,
    'aria-describedby': errors[key] ? `pf-${key}-error` : undefined,
  })

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="pf-titulo" label="Título" required error={errors.titulo} className="sm:col-span-2">
          <Input id="pf-titulo" value={values.titulo} maxLength={200} onChange={(e) => update('titulo', e.target.value)} {...invalid('titulo')} />
        </Field>
        <Field id="pf-director" label="Director" required error={errors.director}>
          <Input id="pf-director" value={values.director} maxLength={150} onChange={(e) => update('director', e.target.value)} {...invalid('director')} />
        </Field>
        <Field id="pf-genero" label="Género" required error={errors.genero}>
          <Input id="pf-genero" value={values.genero} maxLength={100} placeholder="Drama, Acción…" onChange={(e) => update('genero', e.target.value)} {...invalid('genero')} />
        </Field>
        <Field id="pf-duracion" label="Duración (minutos)" required error={errors.duracion}>
          <Input id="pf-duracion" type="number" inputMode="numeric" min={1} value={values.duracion} onChange={(e) => update('duracion', e.target.value)} {...invalid('duracion')} />
        </Field>
        <Field id="pf-año" label="Año" required error={errors.año}>
          <Input id="pf-año" type="number" inputMode="numeric" min={YEAR_MIN} max={YEAR_MAX} value={values.año} onChange={(e) => update('año', e.target.value)} {...invalid('año')} />
        </Field>
        <Field id="pf-clasificacion" label="Clasificación" required error={errors.clasificacion} className="sm:col-span-2">
          <Select id="pf-clasificacion" value={values.clasificacion} onChange={(e) => update('clasificacion', e.target.value)} {...invalid('clasificacion')}>
            <option value="">Selecciona una clasificación</option>
            {CLASIFICACIONES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          id="pf-sinopsis"
          label="Sinopsis"
          error={errors.sinopsis}
          hint={`${values.sinopsis.length}/1000 caracteres`}
          className="sm:col-span-2"
        >
          <Textarea id="pf-sinopsis" value={values.sinopsis} maxLength={1000} onChange={(e) => update('sinopsis', e.target.value)} {...invalid('sinopsis')} />
        </Field>
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" size="lg" onClick={onClose} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" size="lg" disabled={pending}>
          {pending && <Spinner className="size-3.5" />}
          {pelicula ? 'Guardar cambios' : 'Crear película'}
        </Button>
      </div>
    </form>
  )
}
