import type { ApiErrorBody, HealthResponse, StudyMaterial, UploadResponse } from '../types/api'

/**
 * API base URL.
 *
 * Development: same-origin `/api`, proxied to FastAPI by the Vite dev server.
 *
 * Production: the backend is a separate service on Render. Vercel only serves
 * static files (no API routes, no proxy), so a same-origin `/api/...` request
 * would be answered by Vercel with `404 NOT_FOUND` and never reach FastAPI.
 * Override per-deployment with `VITE_API_BASE_URL` (must include `/api`).
 */
const PRODUCTION_API_BASE = 'https://cognexa-p9yo.onrender.com/api'

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD ? PRODUCTION_API_BASE : '/api')
).replace(/\/+$/, '')

/** Frontend upload constraints — mirrored by the backend (10 MB, PNG/JPEG). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
export const ACCEPTED_MIME_TYPES = ['image/png', 'image/jpeg']

export class ApiError extends Error {
  code: string
  status: number

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function parseError(response: Response): Promise<ApiError> {
  let code = 'unknown_error'
  let message =
    response.status >= 500
      ? 'The backend is unavailable or returned an unexpected error. Please try again.'
      : `Request failed with status ${response.status}.`
  try {
    const body = (await response.json()) as Partial<ApiErrorBody>
    if (body?.error?.code) code = body.error.code
    if (body?.error?.message) message = body.error.message
  } catch {
    // Non-JSON error body — keep defaults.
  }
  return new ApiError(response.status, code, message)
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE}/health`)
  if (!response.ok) throw await parseError(response)
  return response.json()
}

export async function uploadImage(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  })
  if (!response.ok) throw await parseError(response)
  return response.json()
}

export async function generateStudyMaterial(uploadId: string): Promise<StudyMaterial> {
  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ upload_id: uploadId }),
  })
  if (!response.ok) throw await parseError(response)
  return response.json()
}

export async function fetchResult(resultId: string): Promise<StudyMaterial> {
  const response = await fetch(`${API_BASE}/results/${encodeURIComponent(resultId)}`)
  if (!response.ok) throw await parseError(response)
  return response.json()
}

/**
 * Absolute URL for the uploaded source image.
 *
 * The backend returns fully-prefixed paths like `/api/uploads/{id}`, so the
 * `/api` prefix is stripped before re-attaching the configured base — otherwise
 * an absolute base such as `https://host/api` would produce `/api/api/...`.
 * Relative bases keep working through the same-origin Vite proxy.
 */
export function sourceImageUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  const base = API_BASE.startsWith('/') ? window.location.origin + API_BASE : API_BASE
  const suffix = path.startsWith('/api/') ? path.slice('/api'.length) : path
  return `${base.replace(/\/$/, '')}${suffix}`
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
