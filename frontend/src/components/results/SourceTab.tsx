import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, FileImage, ImageIcon, Sparkles } from 'lucide-react'
import type { StudyMaterial } from '../../types/api'
import { formatBytes, sourceImageUrl } from '../../lib/api'

export default function SourceTab({ result }: { result: StudyMaterial }) {
  const source = result.source_image
  const [failed, setFailed] = useState(false)

  const details = [
    { label: 'Filename', value: source.filename },
    { label: 'Dimensions', value: `${source.width} × ${source.height} px` },
    { label: 'Size', value: formatBytes(source.size_bytes) },
    { label: 'Type', value: source.content_type },
    { label: 'Upload ID', value: source.upload_id },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="flex items-center gap-2 font-semibold text-white">
            <FileImage className="h-5 w-5 text-accent-strong" aria-hidden="true" />
            Uploaded page
          </h2>
          <span className="chip">
            <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {source.content_type.replace('image/', '').toUpperCase()}
          </span>
        </div>
        <div className="bg-navy-950/60 p-4">
          {failed ? (
            <div
              role="alert"
              className="flex items-center gap-3 rounded-xl border border-danger/40 bg-danger-dim px-4 py-6 text-sm text-danger"
            >
              <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
              The source image is no longer available (demo storage is in-memory and clears on
              backend restart).
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sourceImageUrl(source.url)}
              alt={`Uploaded textbook page: ${source.filename}`}
              onError={() => setFailed(true)}
              className="mx-auto max-h-[560px] w-auto rounded-lg object-contain"
            />
          )}
        </div>
      </section>

      <section className="space-y-5">
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">File details</h2>
          <dl className="space-y-3">
            {details.map(({ label, value }) => (
              <div
                key={label}
                className="flex items-baseline justify-between gap-4 border-b border-line/60 pb-3 text-sm last:border-0 last:pb-0"
              >
                <dt className="shrink-0 text-muted">{label}</dt>
                <dd className="truncate text-right font-medium text-slate-200" title={value}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="card p-6">
          <h2 className="mb-2 text-lg font-semibold text-white">What’s next?</h2>
          <p className="mb-4 text-sm leading-relaxed text-muted">
            Head back to the workspace to map another page — or switch tabs to revisit your mind
            map, summary and quiz. Everything stays exactly as you left it.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/workspace" className="btn-primary">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to workspace
            </Link>
            <Link to="/workspace" className="btn-secondary">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              New mind map
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
