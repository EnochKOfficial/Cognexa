import { FlaskConical } from 'lucide-react'

/**
 * Honest indicator shown wherever mock results appear: nothing on this screen
 * was produced by an AI model.
 */
export default function DemoBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-amber/40 bg-amber/10 px-3 py-1 text-xs font-semibold tracking-wide text-amber ${className}`}
      title="Study material on this page is handcrafted demo content served by the backend's mock generator. No AI model was invoked."
    >
      <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
      DEMO DATA · MOCK GENERATION
    </span>
  )
}
