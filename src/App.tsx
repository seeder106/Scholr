import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { RequireAuth, RedirectIfAuth } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────
// Each page is code-split so the initial bundle stays small
const Landing       = lazy(() => import('@/pages/Landing'))
const Login         = lazy(() => import('@/pages/Login'))
const Communities   = lazy(() => import('@/pages/Communities'))
const CommunityPage = lazy(() => import('@/pages/CommunityPage'))
const PostPage      = lazy(() => import('@/pages/PostPage'))
const Profile       = lazy(() => import('@/pages/Profile'))

// ─── Full-page loading fallback ───────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-dark-bg">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-text-secondary dark:text-gray-400 text-sm">Loading…</p>
      </div>
    </div>
  )
}

// ─── Dark mode hook ───────────────────────────────────────────────────────────
// Reads from localStorage, respects OS preference as default
function useDarkMode(): [boolean, () => void] {
  const [dark, setDark] = useState<boolean>(() => {
    const stored = localStorage.getItem('scholr-theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      localStorage.setItem('scholr-theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('scholr-theme', 'light')
    }
  }, [dark])

  const toggle = () => setDark((d) => !d)
  return [dark, toggle]
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [dark, toggleDark] = useDarkMode()

  return (
    <div className="min-h-screen bg-background dark:bg-dark-bg transition-colors duration-200">
      {/* Navbar is shown on all pages — it handles its own auth-aware rendering */}
      <Navbar dark={dark} onToggleDark={toggleDark} />

      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* ── Public landing page ──────────────────────────────────────── */}
          <Route
            path="/"
            element={
              <RedirectIfAuth>
                <Landing />
              </RedirectIfAuth>
            }
          />

          {/* ── Auth page (login + signup tabs) ──────────────────────────── */}
          <Route
            path="/login"
            element={
              <RedirectIfAuth>
                <Login />
              </RedirectIfAuth>
            }
          />

          {/* ── Protected routes ─────────────────────────────────────────── */}
          <Route
            path="/communities"
            element={
              <RequireAuth>
                <Communities />
              </RequireAuth>
            }
          />

          <Route
            path="/c/:communityId"
            element={
              <RequireAuth>
                <CommunityPage />
              </RequireAuth>
            }
          />

          <Route
            path="/p/:postId"
            element={
              <RequireAuth>
                <PostPage />
              </RequireAuth>
            }
          />

          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />

          {/* ── Catch-all → redirect home ─────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Suspense>
    </div>
  )
}
