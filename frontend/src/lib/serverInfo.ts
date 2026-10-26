import { useEffect, useState } from 'react'
import { fetchHealth } from './api'
import type { HealthResponse } from '../types/api'

/**
 * Reads `/api/health` once so UI copy can be honest about whether results are
 * mock demo data or real Gemma 4 output. Returns null while loading (or if the
 * backend is unreachable), and `isDemoMode` treats "unknown" as demo.
 */
export function useServerInfo(): HealthResponse | null {
  const [info, setInfo] = useState<HealthResponse | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchHealth()
      .then((health) => {
        if (!cancelled) setInfo(health)
      })
      .catch(() => {
        // Non-fatal: the workspace still works and falls back to demo wording.
      })
    return () => {
      cancelled = true
    }
  }, [])

  return info
}

export function isDemoMode(info: HealthResponse | null): boolean {
  return info ? info.ai_provider === 'mock' || info.demo_mode : true
}
