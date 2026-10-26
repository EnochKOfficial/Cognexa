import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BrainCircuit,
  FileImage,
  ListChecks,
  Network,
  Sparkles,
  UploadCloud,
} from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { isDemoMode, useServerInfo } from '../lib/serverInfo'

/** Decorative mini mind-map used as the hero's interactive-feeling preview. */
function MindMapPreview() {
  return (
    <div
      className="card relative overflow-hidden p-6 sm:p-8"
      role="img"
      aria-label="Preview: a mind map with a central topic connected to subtopics"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_260px_at_70%_0%,rgba(139,92,246,0.14),transparent_65%)]" />

      {/* Source image thumbnail chip */}
      <div className="relative mb-6 flex items-center gap-3 rounded-xl border border-line bg-navy-800/70 px-3 py-2.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent/25 to-blue/25">
          <FileImage className="h-5 w-5 text-accent-strong" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-200">photosynthesis-page.jpg</p>
          <p className="text-xs text-muted">Uploaded · 1600 × 2200 · 2.4 MB</p>
        </div>
        <span className="ml-auto hidden shrink-0 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success sm:inline">
          Ready
        </span>
      </div>

      {/* Mini map */}
      <svg viewBox="0 0 420 250" className="relative w-full" aria-hidden="true">
        <defs>
          <linearGradient id="center-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <g stroke="rgba(148,163,184,0.35)" strokeWidth="1.6">
          <path d="M210 125 L70 55" />
          <path d="M210 125 L360 50" />
          <path d="M210 125 L55 190" />
          <path d="M210 125 L355 195" />
          <path d="M70 55 L24 24" strokeDasharray="4 4" />
          <path d="M360 50 L404 22" strokeDasharray="4 4" />
        </g>

        <g className="animate-soft-pulse">
          <circle cx="210" cy="125" r="40" fill="url(#center-grad)" opacity="0.16" />
          <rect x="150" y="107" width="120" height="36" rx="12" fill="url(#center-grad)" />
          <text x="210" y="130" textAnchor="middle" fontSize="13" fontWeight="600" fill="#fff">
            Photosynthesis
          </text>
        </g>

        {[
          { x: 70, y: 55, w: 108, label: 'Light Reactions' },
          { x: 360, y: 50, w: 104, label: 'Calvin Cycle' },
          { x: 55, y: 190, w: 118, label: 'Inputs & Outputs' },
          { x: 355, y: 195, w: 96, label: 'Rate Factors' },
        ].map((node) => (
          <g key={node.label}>
            <rect
              x={node.x - node.w / 2}
              y={node.y - 15}
              width={node.w}
              height="30"
              rx="10"
              fill="#101a33"
              stroke="rgba(139,92,246,0.5)"
            />
            <text
              x={node.x}
              y={node.y + 4}
              textAnchor="middle"
              fontSize="11"
              fill="#e2e8f0"
              fontWeight="500"
            >
              {node.label}
            </text>
          </g>
        ))}

        {[
          { x: 24, y: 24, label: 'ATP & NADPH' },
          { x: 404, y: 22, label: 'RuBisCO' },
        ].map((leaf) => (
          <g key={leaf.label}>
            <rect
              x={leaf.x - 44}
              y={leaf.y - 11}
              width="88"
              height="22"
              rx="8"
              fill="#0f1630"
              stroke="rgba(148,163,184,0.25)"
            />
            <text x={leaf.x} y={leaf.y + 4} textAnchor="middle" fontSize="9.5" fill="#94a3b8">
              {leaf.label}
            </text>
          </g>
        ))}
      </svg>

      <div className="relative mt-6 grid grid-cols-3 gap-3 text-center">
        {[
          { label: 'Mind map', icon: Network },
          { label: 'Summary', icon: Sparkles },
          { label: 'Quiz', icon: ListChecks },
        ].map(({ label, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-line bg-navy-800/60 px-2 py-3 transition-colors hover:border-line-strong"
          >
            <Icon className="mx-auto mb-1 h-4 w-4 text-accent-strong" aria-hidden="true" />
            <p className="text-xs font-medium text-slate-300">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const STEPS = [
  {
    step: '01',
    title: 'Upload',
    icon: UploadCloud,
    text: 'Snap or screenshot a textbook page and drop in a PNG or JPG (up to 10 MB). The file is validated before anything happens.',
  },
  {
    step: '02',
    title: 'Visualize',
    icon: Network,
    text: 'The page becomes an interactive mind map — a central topic, subtopics and concepts you can pan, zoom and rearrange.',
  },
  {
    step: '03',
    title: 'Revise',
    icon: BrainCircuit,
    text: 'Read the concise summary, drill the key terms, then test yourself with revision questions and instant explanations.',
  },
]

const FEATURES = [
  {
    title: 'Interactive mind maps',
    icon: Network,
    text: 'Pan, zoom, select and drag nodes into the layout that makes sense to you. Export the map as a PNG for your notes.',
  },
  {
    title: 'Concise summaries',
    icon: Sparkles,
    text: 'Every page is distilled into an overview, structured sections and a key-terms glossary — copy it to your notes in one click.',
  },
  {
    title: 'Revision questions',
    icon: ListChecks,
    text: 'Multiple-choice questions with instant scoring and short explanations, downloadable as a text file for spaced repetition.',
  },
]

export default function LandingPage() {
  const serverInfo = useServerInfo()
  const demoMode = isDemoMode(serverInfo)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* ---------------- Hero ---------------- */}
        <section className="relative overflow-hidden">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 md:pt-24 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
            <div className="animate-fade-up">
              <span className="chip mb-6 border-accent/30 bg-accent/10 text-accent-strong">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {demoMode
                  ? 'HackFest 2.0 · Demo build with mock study data'
                  : 'HackFest 2.0 · Powered by Gemma 4 · Google AI Studio'}
              </span>
              <h1 className="text-balance text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.6rem]">
                Your textbook.
                <br />
                <span className="bg-gradient-to-r from-accent-strong via-indigo-300 to-blue bg-clip-text text-transparent">
                  One clear mind map.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted">
                Photograph a dense textbook page and Cognexa turns it into visual revision
                material: an interactive mind map, a concise summary and practice questions — so
                you revise the way your brain actually remembers.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link to="/workspace" className="btn-primary px-6 py-3 text-base">
                  Create a Mind Map
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a href="#how-it-works" className="btn-secondary px-5 py-3 text-base">
                  See how it works
                </a>
              </div>

              <p className="mt-6 text-sm text-muted/80">
                {demoMode
                  ? 'No sign-up · PNG & JPG up to 10 MB · Current build serves clearly-labelled demo content (no AI keys)'
                  : 'No sign-up · PNG & JPG up to 10 MB · Pages are analysed by Gemma 4 via Google AI Studio'}
              </p>
            </div>

            <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
              <MindMapPreview />
            </div>
          </div>
        </section>

        {/* ---------------- How it works ---------------- */}
        <section id="how-it-works" className="border-y border-line bg-navy-950/40 py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="mb-12 max-w-2xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent-strong">
                How it works
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Three steps from page to progress
              </h2>
              <p className="mt-4 text-lg text-muted">
                Upload, visualize, revise. The whole flow takes under a minute.
              </p>
            </div>

            <ol className="grid gap-6 md:grid-cols-3">
              {STEPS.map(({ step, title, icon: Icon, text }, index) => (
                <li
                  key={step}
                  className="card group relative p-7 transition-transform duration-200 hover:-translate-y-1"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <div className="mb-5 flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent/25 to-blue/25 text-accent-strong">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-sm font-semibold text-slate-600">{step}</span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------------- Features ---------------- */}
        <section className="py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="mb-12 max-w-2xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent-strong">
                What you get
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Everything a revision session needs
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {FEATURES.map(({ title, icon: Icon, text }) => (
                <div key={title} className="card p-7">
                  <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-navy-800/70 text-accent-strong">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{text}</p>
                </div>
              ))}
            </div>

            <div className="card mt-10 flex flex-col items-start justify-between gap-6 bg-gradient-to-r from-accent/10 to-blue/10 p-8 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-xl font-semibold text-white">Ready to map your first page?</h3>
                <p className="mt-1.5 text-sm text-muted">
                  Upload a textbook photo and get your study kit in under a minute.
                </p>
              </div>
              <Link to="/workspace" className="btn-primary shrink-0 px-6 py-3">
                Create a Mind Map
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
