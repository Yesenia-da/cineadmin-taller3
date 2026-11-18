import { API_URL } from '@/lib/config'

type QueryValue = string | number | boolean | null | undefined

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, QueryValue>
  signal?: AbortSignal
}

export class ApiError extends Error {
  readonly status: number
  readonly data: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'La solicitud no es válida.',
  401: 'No autorizado.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'El recurso solicitado no existe.',
  409: 'El recurso ya existe.',
  422: 'Los datos enviados no son válidos.',
  500: 'Error interno del servidor.',
  503: 'El servicio no está disponible.',
}

const LOCATION_PREFIXES = new Set(['body', 'query', 'path'])

function extractMessage(data: unknown, status: number): string {
  if (data && typeof data === 'object' && 'detail' in data) {
    const detail = (data as { detail: unknown }).detail
    if (typeof detail === 'string' && detail.trim()) return detail
    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((item) => {
          if (item && typeof item === 'object' && 'msg' in item) {
            const loc = Array.isArray(item.loc)
              ? item.loc.filter((part: unknown) => !LOCATION_PREFIXES.has(String(part))).join('.')
              : ''
            return loc ? `${loc}: ${item.msg}` : String(item.msg)
          }
          return String(item)
        })
        .join(' · ')
    }
  }
  if (typeof data === 'string' && data.trim() && data.length < 300) return data
  return STATUS_MESSAGES[status] ?? `Error HTTP ${status}`
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue
    params.append(key, String(value))
  }
  const qs = params.toString()
  return `${API_URL}${path}${qs ? `?${qs}` : ''}`
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const hasBody = options.body !== undefined
  let response: Response

  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers: hasBody
        ? { 'Content-Type': 'application/json', Accept: 'application/json' }
        : { Accept: 'application/json' },
      body: hasBody ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(
      `No se pudo conectar con la API (${API_URL}). Verifica que el servidor esté en ejecución y que permita CORS.`,
      0,
    )
  }

  if (response.status === 204) return undefined as T

  const contentType = response.headers.get('content-type') ?? ''
  const data: unknown = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null)

  if (!response.ok) {
    throw new ApiError(extractMessage(data, response.status), response.status, data)
  }

  return data as T
}

export async function fetchAllPages<T>(
  fetchPage: (skip: number, limit: number) => Promise<T[]>,
  pageSize = 100,
  maxItems = 5000,
): Promise<T[]> {
  const items: T[] = []
  let skip = 0
  while (skip < maxItems) {
    const page = await fetchPage(skip, pageSize)
    items.push(...page)
    if (page.length < pageSize) break
    skip += pageSize
  }
  return items
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Ocurrió un error inesperado.'
}
