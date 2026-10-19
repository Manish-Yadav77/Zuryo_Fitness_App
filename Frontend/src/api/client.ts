import axios from 'axios'
import { env } from '@/config/env'
import { tokenStorage } from '@/lib/storage'
import type { FieldErrors } from '@/lib/validation'

export const AUTH_LOGOUT_EVENT = 'zuryo:auth-logout'

export const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 30_000, // generous: a free Render server can take a while to wake up
})

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// If the server says our token is no longer valid, tell the app to log out.
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && tokenStorage.get()) {
      window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT))
    }
    return Promise.reject(error)
  },
)

interface ApiErrorBody {
  error?: {
    code?: string
    message?: string
    details?: Array<{ path: string; message: string }>
  }
}

export interface ParsedApiError {
  message: string
  code: string | null
  fieldErrors: FieldErrors
}

/** Converts anything thrown by an API call into a friendly message + per-field errors. */
export function parseApiError(err: unknown): ParsedApiError {
  if (axios.isAxiosError<ApiErrorBody>(err)) {
    if (!err.response) {
      return {
        message: 'Cannot reach the server. Check your connection and try again.',
        code: 'NETWORK_ERROR',
        fieldErrors: {},
      }
    }
    const body = err.response.data?.error
    const fieldErrors: FieldErrors = {}
    for (const d of body?.details ?? []) {
      if (d.path && !(d.path in fieldErrors)) fieldErrors[d.path] = d.message
    }
    return {
      message: body?.message ?? 'Something went wrong. Please try again.',
      code: body?.code ?? null,
      fieldErrors,
    }
  }
  return { message: 'Something went wrong. Please try again.', code: null, fieldErrors: {} }
}