import { request } from './http'

export const sistemaService = {
  root: () => request<unknown>('/'),
  health: () => request<unknown>('/health'),
}
