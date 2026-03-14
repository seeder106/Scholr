import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  User,
  BookOpen,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { AvatarSm } from '@/components/AvatarRenderer'
import { DEFAULT_AVATAR_CONFIG, type AvatarConfig } from '@/data/avatarItems'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// ─── Props ────────────────────────────────────────────────────────────────────
interface NavbarProps {
  dark: boolean
  onToggleDark: () => void
}

// ─── Nav avatar — uses AvatarRenderer for custom SVG avatars ─────────────────
function NavAvatar({ username }: { username: string }) {
  const { profile } = useAuth()
  const config = (profile?.avatar_config as AvatarConfig | null) ?? DEFAULT_AVATAR_CONFIG
  const rep    = profile?.reputation ?? 0

  return (
    <AvatarSm
      config={config}
      rep={rep}
      alt={username}
    />
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Navbar({ dark, onToggleDark }: NavbarProps) {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [navigate])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const handleSignOut = async () => {
    setDropdownOpen(false)
    setMobileOpen(false)
    try {
      await signOut()
      toast.success('Signed out successfully')
      navigate('/')
    } catch {
      toast.error('Failed to sign out')
    }
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'text-sm font-medium transition-colors duration-150 px-1 py-0.5 rounded',
      isActive
        ? 'text-primary dark:text-dark-primary'
        : 'text-text-secondary hover:text-text-primary dark:text-gray-400 dark:hover:text-dark-text'
    )

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-card/95 dark:bg-dark-card/95 backdrop-blur border-b border-border dark:border-gray-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">

            {/* ── Logo ───────────────────────────────────────────────────── */}
            <Link
              to={user ? '/communities' : '/'}
              className="flex items-center gap-2 no-underline hover:no-underline group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm group-hover:bg-btn-hover transition-colors">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-text-primary dark:text-dark-text tracking-tight">
                Scholr
              </span>
            </Link>

            {/* ── Desktop nav ────────────────────────────────────────────── */}
            <nav className="hidden md:flex items-center gap-6">
              {user ? (
                <NavLink to="/communities" className={navLinkClass}>
                  Communities
                </NavLink>
              ) : (
                <>
                  <a href="#features" className="text-sm font-medium text-text-secondary hover:text-text-primary dark:text-gray-400 dark:hover:text-dark-text transition-colors">
                    Features
                  </a>
                  <a href="#how-it-works" className="text-sm font-medium text-text-secondary hover:text-text-primary dark:text-gray-400 dark:hover:text-dark-text transition-colors">
                    How it works
                  </a>
                </>
              )}
            </nav>

            {/* ── Right side controls ─────────────────────────────────────── */}
            <div className="flex items-center gap-2">

              {/* Dark mode toggle */}
              <button
                onClick={onToggleDark}
                className="btn-ghost btn btn-sm w-8 h-8 p-0 rounded-full"
                aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={dark ? 'Light mode' : 'Dark mode'}
              >
                {dark
                  ? <Sun className="w-4 h-4 text-accent" />
                  : <Moon className="w-4 h-4" />
                }
              </button>

              {user ? (
                /* ── User dropdown ──────────────────────────────────────── */
                <div className="relative hidden md:block" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((o) => !o)}
                    className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-haspopup="true"
                    aria-expanded={dropdownOpen}
                  >
                    <NavAvatar
                      username={profile?.username ?? 'U'}
                    />
                    <span className="text-sm font-medium text-text-primary dark:text-dark-text max-w-[120px] truncate">
                      {profile?.username ?? 'You'}
                    </span>
                    <ChevronDown
                      className={clsx(
                        'w-3.5 h-3.5 text-text-secondary transition-transform duration-200',
                        dropdownOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  {/* Dropdown menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 card shadow-card-hover animate-fade-in py-1 z-50">
                      {/* Profile header */}
                      <div className="px-4 py-2.5 border-b border-border dark:border-gray-700">
                        <p className="text-sm font-semibold text-text-primary dark:text-dark-text truncate">
                          {profile?.username}
                        </p>
                        <p className="text-xs text-text-secondary dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                        {(profile?.reputation ?? 0) > 0 && (
                          <span className="badge-rep mt-1">
                            ⭐ {profile?.reputation} rep
                          </span>
                        )}
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-text-primary dark:text-dark-text hover:bg-gray-50 dark:hover:bg-gray-700 no-underline transition-colors"
                      >
                        <User className="w-4 h-4 text-text-secondary" />
                        My Profile
                      </Link>

                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-error hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Auth CTA buttons (desktop) ─────────────────────────── */
                <div className="hidden md:flex items-center gap-2">
                  <Link to="/login" className="btn btn-secondary btn-sm">
                    Sign in
                  </Link>
                  <Link
                    to="/login"
                    state={{ tab: 'signup' }}
                    className="btn btn-primary btn-sm"
                  >
                    Get started
                  </Link>
                </div>
              )}

              {/* ── Mobile hamburger ──────────────────────────────────────── */}
              <button
                className="md:hidden btn-ghost btn btn-sm w-8 h-8 p-0 rounded-full"
                onClick={() => setMobileOpen((o) => !o)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
              >
                {mobileOpen
                  ? <X className="w-5 h-5" />
                  : <Menu className="w-5 h-5" />
                }
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile menu overlay ─────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile menu drawer ──────────────────────────────────────────────── */}
      <aside
        className={clsx(
          'fixed top-14 left-0 right-0 z-30 md:hidden',
          'bg-card dark:bg-dark-card border-b border-border dark:border-gray-700',
          'shadow-lg animate-slide-down',
          mobileOpen ? 'block' : 'hidden'
        )}
      >
        <div className="px-4 py-4 flex flex-col gap-1">
          {user ? (
            <>
              {/* User info strip */}
              <div className="flex items-center gap-3 px-2 py-3 mb-2 border-b border-border dark:border-gray-700">
                <NavAvatar
                  username={profile?.username ?? 'U'}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary dark:text-dark-text truncate">
                    {profile?.username}
                  </p>
                  {(profile?.reputation ?? 0) > 0 && (
                    <p className="text-xs text-text-secondary">
                      ⭐ {profile?.reputation} rep
                    </p>
                  )}
                </div>
              </div>

              <MobileNavLink to="/communities" onClick={() => setMobileOpen(false)}>
                Communities
              </MobileNavLink>

              <MobileNavLink to="/profile" onClick={() => setMobileOpen(false)}>
                <User className="w-4 h-4" />
                My Profile
              </MobileNavLink>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-error hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-1"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <a
                href="#features"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-text-primary dark:text-dark-text hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors no-underline"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-text-primary dark:text-dark-text hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors no-underline"
              >
                How it works
              </a>
              <div className="flex flex-col gap-2 pt-3 mt-1 border-t border-border dark:border-gray-700">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="btn btn-secondary w-full"
                >
                  Sign in
                </Link>
                <Link
                  to="/login"
                  state={{ tab: 'signup' }}
                  onClick={() => setMobileOpen(false)}
                  className="btn btn-primary w-full"
                >
                  Get started
                </Link>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  )
}

// ─── Mobile nav link helper ───────────────────────────────────────────────────
function MobileNavLink({
  to,
  onClick,
  children,
}: {
  to: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors no-underline',
          isActive
            ? 'bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-dark-primary'
            : 'text-text-primary dark:text-dark-text hover:bg-gray-100 dark:hover:bg-gray-700'
        )
      }
    >
      {children}
    </NavLink>
  )
}
