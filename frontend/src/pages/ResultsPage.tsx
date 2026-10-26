import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  AlertTriangle,
  FileImage,
  ListChecks,
  Loader2,
  Network,
  RotateCcw,
  ScrollText,
  Sparkles,
} from 'lucide-react'
import Header from '../components/Header'
import DemoBadge from '../components/DemoBadge'
import { ApiError, fetchResult } from '../lib/api'
import type { StudyMaterial } from '../types/api'
import MindMapTab from '../components/results/MindMapTab'
import SummaryTab from '../components/results/SummaryTab'
import QuizTab from '../components/results/QuizTab'
import SourceTab from '../components/results/SourceTab'

type TabKey = 'map' | 'summary' | 'quiz' | 'source'

const TABS: { key: TabKey; label: string; icon: typeof Network }[] = [
  { key: 'map', label: 'Mind Map', icon: Network },
  { key: 'summary', label: 'Summary', icon: ScrollText },
  { key: 'quiz', label: 'Quiz', icon: ListChecks },
  { key: 'source', label: 'Source Image', icon: FileImage },
]

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; result: StudyMaterial }

export default function ResultsPage() {
  const { resultId } = useParams<{ resultId: string }>()
  const navigate = useNavigate()
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [activeTab, setActiveTab] = useState<TabKey>('map')
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const load = useCallback(async () => {
    if (!resultId) return
    setState({ status: 'loading' })
    try {
      const result = await fetchResult(resultId)
      setState({ status: 'ready', result })
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Could not reach the backend. Make sure the API server is running on port 8000.'
      setState({ status: 'error', message })
    }
  }, [resultId])

  useEffect(() => {
    void load()
  }, [load])

  /** Tab list keyboard support: Left/Right/Home/End move between tabs. */
  const handleTabKeyDown = (event: React.KeyboardEvent, index: number) => {
    let nextIndex: number | null = null
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % TABS.length
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + TABS.length) % TABS.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = TABS.length - 1
    if (nextIndex !== null) {
      event.preventDefault()
      const next = TABS[nextIndex].key
      setActiveTab(next)
      tabRefs.current[nextIndex]?.focus()
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* ------------------------- Loading ------------------------- */}
      {state.status === 'loading' && (
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-24">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-accent-strong" aria-hidden="true" />
          <p className="text-muted">Loading your study kit…</p>
          <div className="mt-8 h-12 w-full max-w-md animate-shimmer rounded-xl" />
          <div className="mt-3 h-12 w-full max-w-md animate-shimmer rounded-xl" />
        </main>
      )}

      {/* ------------------------- Error ------------------------- */}
      {state.status === 'error' && (
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
          <div className="card w-full p-8">
            <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-dim">
              <AlertTriangle className="h-7 w-7 text-danger" aria-hidden="true" />
            </span>
            <h1 className="text-xl font-semibold text-white">Couldn’t load this result</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">{state.message}</p>
            <p className="mt-1 text-xs text-muted/80">
              Demo results live in memory — a backend restart clears them. Generating again takes
              seconds.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={() => void load()} className="btn-secondary">
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Try again
              </button>
              <Link to="/workspace" className="btn-primary">
                Back to workspace
              </Link>
            </div>
          </div>
        </main>
      )}

      {/* ------------------------- Ready ------------------------- */}
      {state.status === 'ready' && (
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          {/* Toolbar */}
          <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3">
            <Link
              to="/workspace"
              className="btn-ghost -ml-2 px-2 text-sm"
              aria-label="Back to workspace"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Workspace
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="truncate text-2xl font-bold tracking-tight text-white">
                  {state.result.main_topic.label}
                </h1>
                {state.result.is_demo ? (
                  <DemoBadge />
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold tracking-wide text-accent-strong"
                    title="Generated from your page by Gemma 4 via Google AI Studio."
                  >
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    {state.result.generator === 'gemma4' ? 'GEMMA 4 · AI-GENERATED' : 'AI-GENERATED'}
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-sm text-muted">
                {state.result.summary.overview.slice(0, 110)}…
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/workspace')}
              className="btn-primary shrink-0"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              New mind map
            </button>
          </div>

          {/* Tabs */}
          <div
            role="tablist"
            aria-label="Study material sections"
            className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-line bg-navy-900/60 p-1"
          >
            {TABS.map(({ key, label, icon: Icon }, index) => {
              const selected = activeTab === key
              return (
                <button
                  key={key}
                  ref={(el) => {
                    tabRefs.current[index] = el
                  }}
                  role="tab"
                  id={`tab-${key}`}
                  aria-selected={selected}
                  aria-controls={`panel-${key}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveTab(key)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                  className={`flex min-w-fit flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-150 ${
                    selected
                      ? 'bg-gradient-to-r from-accent/90 to-indigo-600/90 text-white shadow-[0_6px_18px_rgba(124,58,237,0.3)]'
                      : 'text-muted hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </button>
              )
            })}
          </div>

          {/* Panels — all stay mounted so tab switches preserve state */}
          <div className="animate-fade-up">
            <div
              role="tabpanel"
              id="panel-map"
              aria-labelledby="tab-map"
              hidden={activeTab !== 'map'}
            >
              <MindMapTab result={state.result} isActive={activeTab === 'map'} />
            </div>
            <div
              role="tabpanel"
              id="panel-summary"
              aria-labelledby="tab-summary"
              hidden={activeTab !== 'summary'}
            >
              <SummaryTab result={state.result} />
            </div>
            <div role="tabpanel" id="panel-quiz" aria-labelledby="tab-quiz" hidden={activeTab !== 'quiz'}>
              <QuizTab result={state.result} />
            </div>
            <div
              role="tabpanel"
              id="panel-source"
              aria-labelledby="tab-source"
              hidden={activeTab !== 'source'}
            >
              <SourceTab result={state.result} />
            </div>
          </div>
        </main>
      )}
    </div>
  )
}
