const BASE_URL = '/api'

export class ApiError extends Error {
  status: number
  errors: unknown[]

  constructor(message: string, status: number, errors: unknown[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const text = await res.text()
  let body: { message?: string; errors?: unknown[] } | null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = null
  }
  if (!res.ok) {
    throw new ApiError(
      body?.message ?? `${res.status} ${res.statusText}`,
      res.status,
      Array.isArray(body?.errors) ? body.errors : [],
    )
  }
  return body as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
}
