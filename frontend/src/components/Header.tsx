import { Link, useLocation } from 'react-router-dom'
import { UploadCloud } from 'lucide-react'
import Logo from './Logo'

/**
 * Sticky top bar used on every page. On the landing page it links to the
 * workspace; elsewhere it also offers a "New mind map" action.
 */
export default function Header() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" aria-label="Cognexa home" className="rounded-lg">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-2">
          {!isHome && (
            <Link to="/" className="btn-ghost hidden sm:inline-flex">
              Home
            </Link>
          )}
          <Link
            to="/workspace"
            className={
              isHome
                ? 'btn-primary'
                : 'btn-primary'
            }
          >
            <UploadCloud className="h-4 w-4" aria-hidden="true" />
            {isHome ? 'Create a Mind Map' : 'New mind map'}
          </Link>
        </nav>
      </div>
    </header>
  )
}
