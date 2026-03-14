import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { ProfileRow } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** Raw Supabase session — null when logged out */
  session: Session | null
  /** Raw Supabase user — null when logged out */
  user: User | null
  /** Enriched profile row from public.profiles */
  profile: ProfileRow | null
  /** True while the initial session check is in flight */
  loading: boolean
  /** True while a sign-in / sign-up / sign-out action is in flight */
  actionLoading: boolean

  // ── Actions ──────────────────────────────────────────────────────────────
  signUp: (email: string, password: string, username: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]           = useState<Session | null>(null)
  const [user, setUser]                 = useState<User | null>(null)
  const [profile, setProfile]           = useState<ProfileRow | null>(null)
  const [loading, setLoading]           = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // ── Fetch profile from public.profiles ─────────────────────────────────────
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[AuthContext] fetchProfile error:', error.message)
      setProfile(null)
    } else {
      setProfile(data)
    }
  }, [])

  /** Re-fetch profile — useful after profile edits */
  const refreshProfile = useCallback(async () => {
    if (user?.id) await fetchProfile(user.id)
  }, [user?.id, fetchProfile])

  // ── Bootstrap: read existing session on mount ──────────────────────────────
  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession()

      if (!mounted) return

      setSession(initialSession)
      setUser(initialSession?.user ?? null)

      if (initialSession?.user) {
        await fetchProfile(initialSession.user.id)
      }

      setLoading(false)
    }

    bootstrap()

    // ── Listen for auth state changes (login, logout, token refresh, OAuth) ──
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return

        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          // Small delay on SIGNED_IN to let the DB trigger create the profile
          if (event === 'SIGNED_IN') {
            await new Promise((r) => setTimeout(r, 500))
          }
          await fetchProfile(newSession.user.id)
        } else {
          setProfile(null)
        }

        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  // ── Sign up with email/password ────────────────────────────────────────────
  const signUp = useCallback(
    async (email: string, password: string, username: string) => {
      setActionLoading(true)
      try {
        // Check username availability first
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username.trim())
          .maybeSingle()

        if (existing) {
          throw new Error('That username is already taken. Please choose another.')
        }

        const { error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              username: username.trim(),
              full_name: '',
            },
          },
        })

        if (error) throw error
      } finally {
        setActionLoading(false)
      }
    },
    []
  )

  // ── Sign in with email/password ────────────────────────────────────────────
  const signIn = useCallback(async (email: string, password: string) => {
    setActionLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (error) throw error
    } finally {
      setActionLoading(false)
    }
  }, [])

  // ── Sign in with Google (OAuth redirect) ──────────────────────────────────
  const signInWithGoogle = useCallback(async () => {
    setActionLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/communities`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      if (error) throw error
      // Browser will redirect — no need to setActionLoading(false)
    } catch (err) {
      setActionLoading(false)
      throw err
    }
  }, [])

  // ── Sign out ───────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    setActionLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setProfile(null)
    } finally {
      setActionLoading(false)
    }
  }, [])

  // ── Context value ──────────────────────────────────────────────────────────
  const value: AuthContextValue = {
    session,
    user,
    profile,
    loading,
    actionLoading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useAuth — consume the auth context anywhere in the app.
 *
 * @example
 * const { user, profile, signIn, signOut } = useAuth()
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}

// ─── Guard component ──────────────────────────────────────────────────────────

/**
 * <RequireAuth> — wrap any route that needs authentication.
 * Redirects to /login if no session exists.
 */
import { Navigate, useLocation } from 'react-router-dom'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-dark-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary dark:text-gray-400 text-sm">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

/**
 * <RedirectIfAuth> — wrap public-only routes (/, /login).
 * Redirects to /communities if a session already exists.
 */
export function RedirectIfAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-dark-bg">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/communities" replace />
  }

  return <>{children}</>
}
