export interface UsuarioRead {
  id: number
  nombre: string
  correo: string
  fecha_registro: string
}

export interface UsuarioCreate {
  nombre: string
  correo: string
}

export interface UsuarioUpdate {
  nombre?: string | null
  correo?: string | null
}

export interface PeliculaRead {
  id: number
  titulo: string
  director: string
  genero: string
  duracion: number
  año: number
  clasificacion: string
  sinopsis: string | null
  fecha_creacion: string
}

export interface PeliculaCreate {
  titulo: string
  director: string
  genero: string
  duracion: number
  año: number
  clasificacion: string
  sinopsis?: string | null
}

export interface PeliculaUpdate {
  titulo?: string | null
  director?: string | null
  genero?: string | null
  duracion?: number | null
  año?: number | null
  clasificacion?: string | null
  sinopsis?: string | null
}

export interface PeliculaBusqueda {
  titulo?: string
  director?: string
  genero?: string
  año?: number
  año_min?: number
  año_max?: number
}

export interface FavoritoCreate {
  id_usuario: number
  id_pelicula: number
}

export interface FavoritoRead {
  id: number
  id_usuario: number
  id_pelicula: number
  fecha_marcado: string
}

export interface FavoritoWithDetails extends FavoritoRead {
  usuario: UsuarioRead
  pelicula: PeliculaRead
}

export interface ValidationErrorItem {
  loc: (string | number)[]
  msg: string
  type: string
}

export interface HTTPValidationError {
  detail?: ValidationErrorItem[]
}

export const CLASIFICACIONES = ['G', 'PG', 'PG-13', 'R', 'NC-17'] as const
export type Clasificacion = (typeof CLASIFICACIONES)[number]
