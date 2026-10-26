import type { ApiErrorBody, HealthResponse, StudyMaterial, UploadResponse } from '../types/api'

/**
 * API base URL. In dev, Vite proxies /api to the FastAPI backend, so the
 * default is same-origin. Override with VITE_API_BASE_URL for other setups.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

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

/** Absolute URL for the uploaded source image (works through the Vite proxy). */
export function sourceImageUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  // The backend already returns fully-prefixed paths like /api/uploads/{id}.
  if (path.startsWith(`${API_BASE}/`) || path === API_BASE) return path
  const base = API_BASE.startsWith('/') ? window.location.origin + API_BASE : API_BASE
  return `${base.replace(/\/$/, '')}${path}`
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
