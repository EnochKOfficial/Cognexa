import { toPng } from 'html-to-image'

/**
 * Export utilities. Every button wired to these actually works — no decorative
 * controls anywhere in the UI.
 */

/** Download the mind map pane as a high-resolution PNG. */
export async function downloadMindMapPng(element: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: '#04060d',
    // Skip UI chrome (controls, minimap, hints) and anything marked no-export.
    filter: (node) => {
      if (!(node instanceof HTMLElement)) return true
      return !node.classList?.contains('no-export')
    },
  })
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}

/** Copy text to the clipboard, with a textarea fallback when the async
 *  Clipboard API is unavailable or blocked (e.g. missing document focus). */
export async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // Fall through to the legacy path below.
    }
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}

/** Trigger a client-side text file download. */
export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = filename
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}

/** Safe filename fragment derived from arbitrary text. */
export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'cognexa'
  )
}
