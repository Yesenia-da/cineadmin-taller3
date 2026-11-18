import { CLASIFICACIONES } from '@/types/api'

export type FieldErrors<T extends string> = Partial<Record<T, string>>

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const YEAR_MIN = 1888
export const YEAR_MAX = 2100

export interface UsuarioFormValues {
  nombre: string
  correo: string
}

export function validateUsuario(values: UsuarioFormValues): FieldErrors<keyof UsuarioFormValues> {
  const errors: FieldErrors<keyof UsuarioFormValues> = {}
  const nombre = values.nombre.trim()
  const correo = values.correo.trim()
  if (!nombre) errors.nombre = 'El nombre es obligatorio.'
  else if (nombre.length > 100) errors.nombre = 'El nombre no puede superar 100 caracteres.'
  if (!correo) errors.correo = 'El correo es obligatorio.'
  else if (!EMAIL_REGEX.test(correo)) errors.correo = 'Ingresa un correo electrónico válido (ej. nombre@dominio.com).'
  return errors
}

export interface PeliculaFormValues {
  titulo: string
  director: string
  genero: string
  duracion: string
  año: string
  clasificacion: string
  sinopsis: string
}

export function validatePelicula(values: PeliculaFormValues): FieldErrors<keyof PeliculaFormValues> {
  const errors: FieldErrors<keyof PeliculaFormValues> = {}
  const required = (value: string, max: number, label: string) => {
    const v = value.trim()
    if (!v) return `${label} es obligatorio.`
    if (v.length > max) return `${label} no puede superar ${max} caracteres.`
    return undefined
  }
  errors.titulo = required(values.titulo, 200, 'El título')
  errors.director = required(values.director, 150, 'El director')
  errors.genero = required(values.genero, 100, 'El género')

  const duracion = Number(values.duracion)
  if (!values.duracion.trim()) errors.duracion = 'La duración es obligatoria.'
  else if (!Number.isInteger(duracion) || duracion <= 0) errors.duracion = 'Ingresa minutos enteros mayores a 0.'

  const año = Number(values.año)
  if (!values.año.trim()) errors.año = 'El año es obligatorio.'
  else if (!Number.isInteger(año) || año < YEAR_MIN || año > YEAR_MAX)
    errors.año = `Ingresa un año entre ${YEAR_MIN} y ${YEAR_MAX}.`

  if (!(CLASIFICACIONES as readonly string[]).includes(values.clasificacion))
    errors.clasificacion = 'Selecciona una clasificación válida.'

  if (values.sinopsis.length > 1000) errors.sinopsis = 'La sinopsis no puede superar 1000 caracteres.'

  for (const key of Object.keys(errors) as (keyof PeliculaFormValues)[]) {
    if (!errors[key]) delete errors[key]
  }
  return errors
}

export function hasErrors(errors: Record<string, string | undefined>) {
  return Object.values(errors).some(Boolean)
}
