import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'signin' | 'signup'

interface FormErrors {
  email?: string
  password?: string
  username?: string
  confirm?: string
}

// ─── Validation ───────────────────────────────────────────────────────────────
function validateSignIn(email: string, password: string): FormErrors {
  const errors: FormErrors = {}
  if (!email.trim()) errors.email = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address'
  if (!password) errors.password = 'Password is required'
  return errors
}

function validateSignUp(
  email: string,
  password: string,
  username: string,
  confirm: string
): FormErrors {
  const errors: FormErrors = {}

  if (!email.trim()) errors.email = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address'

  if (!username.trim()) errors.username = 'Username is required'
  else if (username.trim().length < 3) errors.username = 'Username must be at least 3 characters'
  else if (username.trim().length > 30) errors.username = 'Username must be 30 characters or fewer'
  else if (!/^[a-zA-Z0-9_-]+$/.test(username.trim()))
    errors.username = 'Only letters, numbers, underscores and hyphens allowed'

  if (!password) errors.password = 'Password is required'
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters'

  if (!confirm) errors.confirm = 'Please confirm your password'
  else if (password !== confirm) errors.confirm = 'Passwords do not match'

  return errors
}

// ─── Google button ────────────────────────────────────────────────────────────
function GoogleButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded border border-border dark:border-gray-600 bg-white dark:bg-gray-800 text-text-primary dark:text-dark-text text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
    >
      {loading ? (
        <span className="spinner w-4 h-4" />
      ) : (
        /* Google "G" SVG mark */
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      Continue with Google
    </button>
  )
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {error && (
        <p className="field-error flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

// ─── Password input with show/hide ────────────────────────────────────────────
function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  error,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Password'}
        disabled={disabled}
        autoComplete={id === 'confirm' ? 'new-password' : id === 'password' ? 'current-password' : 'new-password'}
        className={clsx('input pl-9 pr-10', error && 'input-error')}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
        aria-label={show ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Login() {
  const { signIn, signUp, signInWithGoogle, actionLoading } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  // Respect ?tab=signup or state.tab from Landing CTAs
  const stateTab = (location.state as { tab?: string } | null)?.tab
  const [tab, setTab] = useState<Tab>(stateTab === 'signup' ? 'signup' : 'signin')

  // ── Form state ──────────────────────────────────────────────────────────────
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [errors,   setErrors]   = useState<FormErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)

  // Clear errors and api error when switching tabs
  useEffect(() => {
    setErrors({})
    setApiError(null)
    setPassword('')
    setConfirm('')
  }, [tab])

  // Where to redirect after successful auth
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/communities'

  // ── Sign in ─────────────────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)
    const errs = validateSignIn(email, password)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    try {
      await signIn(email, password)
      toast.success('Welcome back!')
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed'
      if (msg.toLowerCase().includes('invalid login credentials')) {
        setApiError('Incorrect email or password. Please try again.')
      } else if (msg.toLowerCase().includes('email not confirmed')) {
        setApiError('Please check your inbox and confirm your email first.')
      } else {
        setApiError(msg)
      }
    }
  }

  // ── Sign up ─────────────────────────────────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)
    const errs = validateSignUp(email, password, username, confirm)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    try {
      await signUp(email, password, username)
      toast.success('Account created! Check your inbox to confirm your email.')
      // Don't auto-navigate — user needs to confirm email first
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign up failed'
      if (msg.toLowerCase().includes('already registered')) {
        setApiError('An account with this email already exists. Try signing in.')
      } else if (msg.toLowerCase().includes('username')) {
        setApiError(msg) // username taken message from AuthContext
      } else {
        setApiError(msg)
      }
    }
  }

  // ── Google OAuth ────────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setApiError(null)
    try {
      await signInWithGoogle()
      // Browser redirects — no further action needed
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed'
      setApiError(msg)
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-10 bg-background dark:bg-dark-bg">
      <div className="w-full max-w-md animate-fade-in">

        {/* ── Logo header ───────────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-2 no-underline group">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg group-hover:bg-btn-hover transition-colors">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold text-text-primary dark:text-dark-text tracking-tight">
              Scholr
            </span>
          </Link>
          <p className="mt-2 text-text-secondary dark:text-gray-400 text-sm">
            {tab === 'signin'
              ? 'Welcome back — sign in to your account'
              : 'Create your free account and start learning together'}
          </p>
        </div>

        <div className="card shadow-card-hover p-6 sm:p-8">

          {/* ── Tab switcher ─────────────────────────────────────────────── */}
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 mb-6" role="tablist">
            {(['signin', 'signup'] as Tab[]).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={clsx(
                  'flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200',
                  tab === t
                    ? 'bg-white dark:bg-dark-card text-primary dark:text-dark-primary shadow-sm'
                    : 'text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-dark-text'
                )}
              >
                {t === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          {/* ── Google OAuth ─────────────────────────────────────────────── */}
          <GoogleButton onClick={handleGoogle} loading={actionLoading} />

          {/* ── Divider ──────────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border dark:bg-gray-700" />
            <span className="text-xs text-text-secondary dark:text-gray-400 font-medium uppercase tracking-wide">
              or continue with email
            </span>
            <div className="flex-1 h-px bg-border dark:bg-gray-700" />
          </div>

          {/* ── API error banner ──────────────────────────────────────────── */}
          {apiError && (
            <div className="flex items-start gap-2 p-3 mb-5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-error animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          {/* ── Sign In form ──────────────────────────────────────────────── */}
          {tab === 'signin' && (
            <form onSubmit={handleSignIn} className="flex flex-col gap-4" noValidate>
              <Field id="email" label="Email address" error={errors.email}>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                    autoComplete="email"
                    disabled={actionLoading}
                    className={clsx('input pl-9', errors.email && 'input-error')}
                  />
                </div>
              </Field>

              <Field id="password" label="Password" error={errors.password}>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={setPassword}
                  disabled={actionLoading}
                  error={!!errors.password}
                />
              </Field>

              <button
                type="submit"
                disabled={actionLoading}
                className="btn btn-primary w-full mt-1"
              >
                {actionLoading
                  ? <><span className="spinner w-4 h-4" /> Signing in…</>
                  : 'Sign in'
                }
              </button>

              <p className="text-center text-sm text-text-secondary dark:text-gray-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setTab('signup')}
                  className="text-primary dark:text-dark-primary font-medium hover:underline"
                >
                  Sign up free
                </button>
              </p>
            </form>
          )}

          {/* ── Sign Up form ──────────────────────────────────────────────── */}
          {tab === 'signup' && (
            <form onSubmit={handleSignUp} className="flex flex-col gap-4" noValidate>
              <Field id="signup-username" label="Username" error={errors.username}>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                  <input
                    id="signup-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your_username"
                    autoComplete="username"
                    disabled={actionLoading}
                    maxLength={30}
                    className={clsx('input pl-9', errors.username && 'input-error')}
                  />
                </div>
                <p className="text-xs text-text-secondary dark:text-gray-500">
                  Letters, numbers, underscores and hyphens only
                </p>
              </Field>

              <Field id="signup-email" label="Email address" error={errors.email}>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                  <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                    autoComplete="email"
                    disabled={actionLoading}
                    className={clsx('input pl-9', errors.email && 'input-error')}
                  />
                </div>
              </Field>

              <Field id="signup-password" label="Password" error={errors.password}>
                <PasswordInput
                  id="signup-password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Min. 8 characters"
                  disabled={actionLoading}
                  error={!!errors.password}
                />
              </Field>

              <Field id="confirm" label="Confirm password" error={errors.confirm}>
                <PasswordInput
                  id="confirm"
                  value={confirm}
                  onChange={setConfirm}
                  placeholder="Repeat your password"
                  disabled={actionLoading}
                  error={!!errors.confirm}
                />
              </Field>

              {/* Password strength hint */}
              {password.length > 0 && (
                <PasswordStrength password={password} />
              )}

              <button
                type="submit"
                disabled={actionLoading}
                className="btn btn-primary w-full mt-1"
              >
                {actionLoading
                  ? <><span className="spinner w-4 h-4" /> Creating account…</>
                  : 'Create account'
                }
              </button>

              <p className="text-center text-xs text-text-secondary dark:text-gray-400">
                By signing up you agree to our{' '}
                <span className="text-primary dark:text-dark-primary cursor-pointer hover:underline">
                  Terms
                </span>{' '}
                and{' '}
                <span className="text-primary dark:text-dark-primary cursor-pointer hover:underline">
                  Privacy Policy
                </span>
              </p>

              <p className="text-center text-sm text-text-secondary dark:text-gray-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setTab('signin')}
                  className="text-primary dark:text-dark-primary font-medium hover:underline"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>

        {/* ── Back to landing ────────────────────────────────────────────── */}
        <p className="text-center mt-6 text-sm text-text-secondary dark:text-gray-400">
          <Link to="/" className="hover:text-primary transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}

// ─── Password strength meter ──────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
    { label: 'Special character', pass: /[^a-zA-Z0-9]/.test(password) },
  ]
  const score = checks.filter((c) => c.pass).length

  const barColour =
    score <= 1 ? 'bg-error' :
    score === 2 ? 'bg-warning' :
    score === 3 ? 'bg-accent' :
    'bg-secondary'

  const label =
    score <= 1 ? 'Weak' :
    score === 2 ? 'Fair' :
    score === 3 ? 'Good' :
    'Strong'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary dark:text-gray-400">Password strength</span>
        <span className={clsx(
          'font-medium',
          score <= 1 ? 'text-error' :
          score === 2 ? 'text-warning' :
          score === 3 ? 'text-yellow-600' :
          'text-secondary'
        )}>
          {label}
        </span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={clsx(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              i <= score ? barColour : 'bg-gray-200 dark:bg-gray-700'
            )}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {checks.map((c) => (
          <span
            key={c.label}
            className={clsx(
              'text-[11px] flex items-center gap-1',
              c.pass ? 'text-secondary' : 'text-text-secondary dark:text-gray-500'
            )}
          >
            <span>{c.pass ? '✓' : '○'}</span>
            {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}
