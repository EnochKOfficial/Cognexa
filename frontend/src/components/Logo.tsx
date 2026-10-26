type LogoProps = {
  /** Hide the wordmark on very small screens if needed. */
  showWordmark?: boolean
  size?: number
}

/** Cognexa logo — a small radial mind-map glyph + wordmark. */
export default function Logo({ showWordmark = true, size = 32 }: LogoProps) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="#0a0e1a" />
        <path
          d="M32 32 L14 18 M32 32 L50 16 M32 32 L16 50 M32 32 L50 48"
          stroke="#475569"
          strokeWidth="2.5"
        />
        <circle cx="14" cy="18" r="5" fill="#8b5cf6" />
        <circle cx="50" cy="16" r="5" fill="#6366f1" />
        <circle cx="16" cy="50" r="5" fill="#3b82f6" />
        <circle cx="50" cy="48" r="5" fill="#8b5cf6" />
        <circle cx="32" cy="32" r="8.5" fill="url(#logo-grad)" />
      </svg>
      {showWordmark && (
        <span className="text-[17px] font-semibold tracking-tight text-white">
          Cognexa
        </span>
      )}
    </span>
  )
}
