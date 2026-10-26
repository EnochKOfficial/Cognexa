import { useState } from 'react'
import { Check, Copy, ScrollText } from 'lucide-react'
import type { StudyMaterial } from '../../types/api'
import { copyTextToClipboard } from '../../lib/export'

/** Build the plain-text summary (also used for clipboard export). */
export function buildSummaryText(result: StudyMaterial): string {
  const lines: string[] = []
  lines.push(`${result.main_topic.label} — Summary`)
  lines.push(
    result.is_demo
      ? '(DEMO DATA — mock generation, no AI model was invoked)'
      : '(AI-generated with Gemma 4 via Google AI Studio)',
  )
  lines.push('')
  lines.push('OVERVIEW')
  lines.push(result.summary.overview)
  lines.push('')
  result.summary.sections.forEach((section) => {
    lines.push(section.title.toUpperCase())
    lines.push(section.content)
    lines.push('')
  })
  lines.push('KEY TERMS')
  result.key_terms.forEach((term) => {
    lines.push(`• ${term.term}: ${term.definition}`)
  })
  return lines.join('\n')
}

export default function SummaryTab({ result }: { result: StudyMaterial }) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)

  const handleCopy = async () => {
    try {
      await copyTextToClipboard(buildSummaryText(result))
      setCopied(true)
      setCopyError(null)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopyError('Clipboard unavailable — select the text and copy manually.')
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {result.is_demo
            ? 'Written by the backend’s mock generator — handcrafted demo content.'
            : 'Generated from your uploaded page by Gemma 4.'}
        </p>
        <div className="flex items-center gap-3">
          {copyError && <span className="text-xs text-danger">{copyError}</span>}
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="btn-secondary px-3 py-2 text-xs"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {copied ? 'Copied!' : 'Copy summary'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Overview + sections */}
        <div className="space-y-5">
          <section className="card p-6 sm:p-7">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
              <ScrollText className="h-5 w-5 text-accent-strong" aria-hidden="true" />
              Overview
            </h2>
            <p className="text-[15px] leading-relaxed text-slate-300">{result.summary.overview}</p>
          </section>

          <div className="grid gap-5 sm:grid-cols-2">
            {result.summary.sections.map((section, index) => (
              <section key={section.title} className="card p-5">
                <div className="mb-2.5 flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-xs font-bold text-accent-strong">
                    {index + 1}
                  </span>
                  <h3 className="font-semibold text-white">{section.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted">{section.content}</p>
              </section>
            ))}
          </div>
        </div>

        {/* Key terms */}
        <section className="card h-fit p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Key terms</h2>
          <dl className="space-y-3.5">
            {result.key_terms.map((term) => (
              <div key={term.term} className="border-b border-line/60 pb-3.5 last:border-0 last:pb-0">
                <dt className="text-sm font-semibold text-accent-strong">{term.term}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted">{term.definition}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  )
}
