import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  FileImage,
  ImagePlus,
  Loader2,
  Network,
  Replace,
  Sparkles,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import Header from '../components/Header'
import { ACCEPTED_MIME_TYPES, ApiError, MAX_UPLOAD_BYTES, formatBytes, generateStudyMaterial, uploadImage } from '../lib/api'
import { isDemoMode, useServerInfo } from '../lib/serverInfo'

const ACCEPTED_EXTENSIONS = '.png,.jpg,.jpeg'

interface SelectedImage {
  file: File
  previewUrl: string
  width: number | null
  height: number | null
}

type Phase = 'idle' | 'processing' | 'error'

const STAGES = [
  { key: 'upload', label: 'Uploading image', detail: 'Sending your page to the backend' },
  { key: 'validate', label: 'Validating file', detail: 'Format and size checks on the server' },
  { key: 'generate', label: 'Generating demo study material', detail: 'Mock generator — no AI model is invoked' },
  { key: 'prepare', label: 'Preparing your workspace', detail: 'Building the mind map, summary and quiz' },
]

/** Validate a picked file on the client before any upload happens. */
function validateFile(file: File): string | null {
  const extension = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : ''
  const extensionOk = ['png', 'jpg', 'jpeg'].includes(extension)
  const mimeOk = ACCEPTED_MIME_TYPES.includes(file.type)

  if (!extensionOk || !mimeOk) {
    return `“${file.name}” is not a supported format. Please upload a PNG, JPG or JPEG image.`
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `“${file.name}” is ${formatBytes(file.size)}, which exceeds the ${formatBytes(
      MAX_UPLOAD_BYTES,
    )} limit. Please upload a smaller image.`
  }
  if (file.size === 0) {
    return 'That file is empty. Please choose a textbook image.'
  }
  return null
}

export default function WorkspacePage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  const [image, setImage] = useState<SelectedImage | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const serverInfo = useServerInfo()
  const demoMode = isDemoMode(serverInfo)
  const [phase, setPhase] = useState<Phase>('idle')
  const [activeStage, setActiveStage] = useState(0)
  const [doneStages, setDoneStages] = useState<number[]>([])
  const [requestError, setRequestError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const submittingRef = useRef(false)

  // Clean up object URLs to avoid memory leaks.
  useEffect(() => {
    return () => {
      if (image) URL.revokeObjectURL(image.previewUrl)
    }
  }, [image]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectFile = useCallback((file: File) => {
    const error = validateFile(file)
    if (error) {
      setValidationError(error)
      setImage(null)
      return
    }
    setValidationError(null)
    setRequestError(null)
    const previewUrl = URL.createObjectURL(file)

    // Read dimensions where the browser can provide them.
    const probe = new Image()
    probe.onload = () => {
      setImage((current) =>
        current && current.file === file
          ? { ...current, width: probe.naturalWidth, height: probe.naturalHeight }
          : current,
      )
    }
    probe.src = previewUrl

    setImage({ file, previewUrl, width: null, height: null })
  }, [])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) selectFile(file)
    event.target.value = '' // allow re-picking the same file
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setDragActive(false)
    const file = event.dataTransfer.files?.[0]
    if (file) selectFile(file)
  }

  const removeImage = () => {
    if (image) URL.revokeObjectURL(image.previewUrl)
    setImage(null)
    setValidationError(null)
    setRequestError(null)
  }

  const handleGenerate = async () => {
    if (!image || submittingRef.current) return
    submittingRef.current = true // hard guard against duplicate submissions
    setPhase('processing')
    setRequestError(null)
    setActiveStage(0)
    setDoneStages([])

    const startedAt = Date.now()
    try {
      // Stage 1+2: upload + server-side validation
      const uploaded = await uploadImage(image.file)
      setDoneStages([0, 1])
      setActiveStage(2)

      // Stage 3: mock generation via the backend service layer
      const material = await generateStudyMaterial(uploaded.upload_id)
      setDoneStages([0, 1, 2])
      setActiveStage(3)

      // Small dwell so the final stage is visible even when the API is fast.
      const elapsed = Date.now() - startedAt
      if (elapsed < 900) await new Promise((resolve) => setTimeout(resolve, 900 - elapsed))

      setDoneStages([0, 1, 2, 3])
      navigate(`/results/${material.result_id}`)
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Could not reach the backend. Make sure the API server is running on port 8000.'
      setRequestError(message)
      setPhase('error')
    } finally {
      submittingRef.current = false
    }
  }

  const isProcessing = phase === 'processing'

  const stages = STAGES.map((stage) =>
    stage.key === 'generate'
      ? demoMode
        ? stage
        : {
            ...stage,
            label: 'Analysing your page with Gemma 4',
            detail: 'Google AI Studio · gemma-4-31b-it — this can take up to two minutes',
          }
      : stage,
  )

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Upload a textbook page
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-muted">
            Drop in a photo or screenshot of a single page. We’ll turn it into a mind map, summary
            and revision quiz.
          </p>
        </div>

        {phase !== 'processing' && (
          <div className="card animate-fade-up p-6 sm:p-8">
            {!image ? (
              /* ------------------------- Dropzone ------------------------- */
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload a textbook image: press Enter to browse, or drop a file here"
                onClick={() => inputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    inputRef.current?.click()
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault()
                  setDragActive(true)
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors duration-150 ${
                  dragActive
                    ? 'border-accent-strong bg-accent/10'
                    : 'border-line-strong bg-navy-900/40 hover:border-accent/60 hover:bg-accent/5'
                }`}
              >
                <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/25 to-blue/25 text-accent-strong">
                  <UploadCloud className="h-8 w-8" aria-hidden="true" />
                </span>
                <p className="text-lg font-semibold text-white">
                  Drag &amp; drop your textbook page
                </p>
                <p className="mt-1.5 text-sm text-muted">
                  or <span className="font-medium text-accent-strong">browse your files</span> —
                  PNG, JPG or JPEG, up to {formatBytes(MAX_UPLOAD_BYTES)}
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPTED_EXTENSIONS}
                  onChange={handleInputChange}
                  className="sr-only"
                  aria-label="Choose a textbook image"
                />
              </div>
            ) : (
              /* ------------------------- Preview ------------------------- */
              <div>
                <div className="overflow-hidden rounded-2xl border border-line bg-navy-950/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.previewUrl}
                    alt="Preview of the selected textbook page"
                    className="mx-auto max-h-[420px] w-auto object-contain"
                  />
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-navy-800/70 text-accent-strong">
                    <FileImage className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-200" title={image.file.name}>
                      {image.file.name}
                    </p>
                    <p className="text-xs text-muted">
                      {image.width && image.height
                        ? `${image.width} × ${image.height} px · `
                        : 'Dimensions unavailable · '}
                      {formatBytes(image.file.size)} · {image.file.type || 'unknown type'}
                    </p>
                  </div>
                  <span
                    className="hidden shrink-0 items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success sm:inline-flex"
                    title="Selected and validated — ready to upload"
                  >
                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                    Ready
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="btn-secondary px-3 py-2 text-xs"
                    >
                      <Replace className="h-3.5 w-3.5" aria-hidden="true" />
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="btn-secondary px-3 py-2 text-xs text-danger hover:border-danger/40"
                      aria-label="Remove selected image"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPTED_EXTENSIONS}
                  onChange={handleInputChange}
                  className="sr-only"
                  aria-label="Choose a textbook image"
                />
              </div>
            )}

            {validationError && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-3 rounded-xl border border-danger/40 bg-danger-dim px-4 py-3 text-sm text-danger"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{validationError}</span>
              </div>
            )}

            {requestError && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-3 rounded-xl border border-danger/40 bg-danger-dim px-4 py-3 text-sm text-danger"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-medium">Generation failed</p>
                  <p className="mt-0.5 text-danger/90">{requestError}</p>
                </div>
              </div>
            )}

            {image && (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted">
                  {demoMode
                    ? 'Results are clearly labelled demo data — no AI model is invoked in this build.'
                    : 'Your page is sent to Google AI Studio and analysed by Gemma 4 (gemma-4-31b-it).'}
                </p>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isProcessing}
                  className="btn-primary px-6 py-3"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                  )}
                  Generate Mind Map
                </button>
              </div>
            )}
          </div>
        )}

        {/* ---------------------- Processing screen ---------------------- */}
        {phase === 'processing' && (
          <div
            className="card animate-fade-up p-8 text-center sm:p-10"
            role="status"
            aria-live="polite"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/30 to-blue/30">
              <Network className="animate-spin-slow h-8 w-8 text-accent-strong" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-semibold text-white">Creating your study kit</h2>

            {demoMode ? (
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber/40 bg-amber/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-amber">
                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                DEMO PROCESSING · MOCK GENERATOR, NO AI MODEL
              </span>
            ) : (
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-accent-strong">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                LIVE GENERATION · GEMMA 4 · GOOGLE AI STUDIO
              </span>
            )}

            <ol className="mx-auto mt-8 max-w-md space-y-3 text-left">
              {stages.map((stage, index) => {
                const done = doneStages.includes(index)
                const active = activeStage === index && !done
                return (
                  <li
                    key={stage.key}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors duration-300 ${
                      active
                        ? 'border-accent/50 bg-accent/10'
                        : done
                          ? 'border-line bg-navy-800/50'
                          : 'border-line/60 bg-navy-900/30 opacity-50'
                    }`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                      {done ? (
                        <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />
                      ) : active ? (
                        <Loader2 className="h-4 w-4 animate-spin text-accent-strong" aria-hidden="true" />
                      ) : (
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-600" aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium ${done || active ? 'text-slate-100' : 'text-slate-500'}`}>
                        {stage.label}
                      </p>
                      <p className="text-xs text-muted">{stage.detail}</p>
                    </div>
                  </li>
                )
              })}
            </ol>

            <p className="mt-6 text-xs text-muted">
              {demoMode
                ? 'This build uses the backend’s mock generator to return handcrafted demo content (photosynthesis & water cycle). No AI model is invoked.'
                : 'Gemma 4 reads your uploaded page and returns study material. Other models are never substituted; failures are reported honestly.'}
            </p>
          </div>
        )}

        {/* ------------------------- Info strip ------------------------- */}
        {phase !== 'processing' && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" /> PNG · JPG · JPEG
            </span>
            <span>Max {formatBytes(MAX_UPLOAD_BYTES)}</span>
            <span>One page per image works best</span>
            <span>Nothing is kept after your session ends</span>
          </div>
        )}
      </main>
    </div>
  )
}
