import { ApiError } from './client'

const BASE_URL = '/api'

export type ContactPostCreateResponse = {
  id: number
  presetAttached: boolean
}

export type ContactPostSummary = {
  id: number
  title: string
  nickname: string
  secret: boolean
  presetAttached: boolean
  readable: boolean
  createdAt: string
}

export type ContactAttachment = {
  id: number
  filename: string
  contentType: string
  sizeBytes: number
  downloadUrl: string
}

export type ContactPostDetail = ContactPostSummary & {
  content: string
  presetNickname?: string
  presetConfigJson?: string
  attachments: ContactAttachment[]
}

async function parseResponse<T>(res: Response): Promise<T> {
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

export async function createContactPost(formData: FormData) {
  const res = await fetch(`${BASE_URL}/v1/contact/posts`, {
    method: 'POST',
    body: formData,
  })
  return parseResponse<ContactPostCreateResponse>(res)
}

export async function listContactPosts(adminKey: string) {
  const res = await fetch(`${BASE_URL}/v1/contact/admin/posts`, {
    headers: { 'X-Analytics-Key': adminKey },
  })
  return parseResponse<ContactPostSummary[]>(res)
}

export async function listPublicContactPosts() {
  const res = await fetch(`${BASE_URL}/v1/contact/posts`)
  return parseResponse<ContactPostSummary[]>(res)
}

export async function getContactPost(id: number, adminKey: string) {
  const res = await fetch(`${BASE_URL}/v1/contact/admin/posts/${id}`, {
    headers: { 'X-Analytics-Key': adminKey },
  })
  return parseResponse<ContactPostDetail>(res)
}

export async function getPublicContactPost(id: number, nickname?: string, presetCode?: string) {
  const params = new URLSearchParams()
  if (nickname) params.set('nickname', nickname)
  if (presetCode) params.set('presetCode', presetCode)
  const query = params.toString()
  const res = await fetch(`${BASE_URL}/v1/contact/posts/${id}${query ? `?${query}` : ''}`)
  return parseResponse<ContactPostDetail>(res)
}

export async function downloadContactAttachment(id: number, adminKey: string) {
  const res = await fetch(`${BASE_URL}/v1/contact/admin/attachments/${id}`, {
    headers: { 'X-Analytics-Key': adminKey },
  })
  if (!res.ok) {
    await parseResponse<never>(res)
  }
  return res.blob()
}

export async function downloadPublicContactAttachment(id: number, nickname?: string, presetCode?: string) {
  const params = new URLSearchParams()
  if (nickname) params.set('nickname', nickname)
  if (presetCode) params.set('presetCode', presetCode)
  const query = params.toString()
  const res = await fetch(`${BASE_URL}/v1/contact/attachments/${id}${query ? `?${query}` : ''}`)
  if (!res.ok) {
    await parseResponse<never>(res)
  }
  return res.blob()
}
