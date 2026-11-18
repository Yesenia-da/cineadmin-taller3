const rawApiUrl = import.meta.env.VITE_API_URL as string | undefined

export const API_URL = (rawApiUrl && rawApiUrl.trim() ? rawApiUrl.trim() : 'http://127.0.0.1:8000').replace(/\/+$/, '')
