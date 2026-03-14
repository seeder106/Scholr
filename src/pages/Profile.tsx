import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Edit2, Save, X, Star, MessageSquare,
  ChevronUp, Calendar, BookOpen, Palette,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import AvatarBuilder from '@/components/AvatarBuilder'
import AvatarRenderer from '@/components/AvatarRenderer'
import { PostCardSkeleton } from '@/components/PostCard'
import { getRepTier, getNextTier, DEFAULT_AVATAR_CONFIG, type AvatarConfig } from '@/data/avatarItems'
import type { PostWithAuthor } from '@/types'
import { formatDistanceToNow, format } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// ─── Editable field ───────────────────────────────────────────────────────────
function EditableField({
  id, label, value, onChange, maxLength, placeholder, hint, error, multiline,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void
  maxLength?: number; placeholder?: string; hint?: string; error?: string; multiline?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="label">{label}</label>
      {multiline ? (
        <textarea
          id={id} value={value} onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength} placeholder={placeholder} rows={3}
          className={clsx('textarea', error && 'input-error')}
        />
      ) : (
        <input
          id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength} placeholder={placeholder}
          className={clsx('input', error && 'input-error')}
        />
      )}
      <div className="flex items-start justify-between gap-2">
        {error
          ? <p className="field-error">{error}</p>
          : hint ? <p className="text-xs text-text-secondary dark:text-gray-500">{hint}</p>
          : <span />
        }
        {maxLength && (
          <span className={clsx(
            'text-xs tabular-nums shrink-0',
            value.length > maxLength * 0.9 ? 'text-warning' : 'text-text-secondary dark:text-gray-500'
          )}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Mini post card ───────────────────────────────────────────────────────────
function MiniPostCard({ post }: { post: PostWithAuthor }) {
  return (
    <Link
      to={`/p/${post.id}`}
      className="card-hover p-4 flex flex-col gap-2 no-underline animate-fade-in block"
    >
      <h3 className="font-medium text-text-primary dark:text-dark-text text-sm leading-snug line-clamp-2">
        {post.title}
      </h3>
      {post.body && (
        <p className="text-xs text-text-secondary dark:text-gray-400 line-clamp-2 leading-relaxed">
          {post.body}
        </p>
      )}
      <div className="flex items-center gap-3 text-xs text-text-secondary dark:text-gray-400 pt-1 border-t border-border dark:border-gray-700">
        <span className="flex items-center gap-1">
          <ChevronUp className="w-3 h-3" />{post.upvotes}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />{post.reply_count}
        </span>
        <span className="ml-auto">
          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
        </span>
      </div>
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()

  // ── Edit form state ─────────────────────────────────────────────────────────
  const [editing,    setEditing]    = useState(false)
  const [username,   setUsername]   = useState('')
  const [fullName,   setFullName]   = useState('')
  const [bio,        setBio]        = useState('')
  const [saving,     setSaving]     = useState(false)
  const [formErrors, setFormErrors] = useState<{ username?: string; bio?: string }>({})

  // ── Avatar builder state ────────────────────────────────────────────────────
  const [showBuilder,  setShowBuilder]  = useState(false)
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG)
  const [savingAvatar, setSavingAvatar] = useState(false)
  const [builderDirty, setBuilderDirty] = useState(false)

  // ── Post history ────────────────────────────────────────────────────────────
  const [posts,        setPosts]        = useState<PostWithAuthor[]>([])
  const [postsLoading, setPostsLoading] = useState(true)

  // ── Sync from profile ────────────────────────────────────────────────────────
  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? '')
      setFullName(profile.full_name ?? '')
      setBio(profile.bio ?? '')
      const saved = profile.avatar_config as AvatarConfig | null
      setAvatarConfig(saved ?? DEFAULT_AVATAR_CONFIG)
    }
  }, [profile])

  // ── Fetch post history ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const load = async () => {
      setPostsLoading(true)
      try {
        const { data, error } = await supabase
          .from('posts_with_authors')
          .select('*')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)
        if (error) throw error
        setPosts(data ?? [])
      } catch {
        toast.error('Failed to load post history')
      } finally {
        setPostsLoading(false)
      }
    }
    load()
  }, [user?.id])

  // ── Avatar builder handlers ──────────────────────────────────────────────────
  const handleAvatarChange = useCallback((newConfig: AvatarConfig) => {
    setAvatarConfig(newConfig)
    setBuilderDirty(true)
  }, [])

  const saveAvatarConfig = async () => {
    if (!user) return
    setSavingAvatar(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_config: avatarConfig, updated_at: new Date().toISOString() })
        .eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      toast.success('Avatar saved!')
      setBuilderDirty(false)
      setShowBuilder(false)
    } catch {
      toast.error('Failed to save avatar')
    } finally {
      setSavingAvatar(false)
    }
  }

  const discardAvatarChanges = () => {
    const saved = profile?.avatar_config as AvatarConfig | null
    setAvatarConfig(saved ?? DEFAULT_AVATAR_CONFIG)
    setBuilderDirty(false)
    setShowBuilder(false)
  }

  // ── Profile edit handlers ────────────────────────────────────────────────────
  const startEdit = () => {
    setUsername(profile?.username ?? '')
    setFullName(profile?.full_name ?? '')
    setBio(profile?.bio ?? '')
    setFormErrors({})
    setEditing(true)
  }

  const cancelEdit = () => {
    setUsername(profile?.username ?? '')
    setFullName(profile?.full_name ?? '')
    setBio(profile?.bio ?? '')
    setFormErrors({})
    setEditing(false)
  }

  const saveProfile = async () => {
    if (!user) return
    const errs: typeof formErrors = {}
    const trimUser = username.trim()
    const trimBio  = bio.trim()
    if (!trimUser) errs.username = 'Username is required'
    else if (trimUser.length < 3) errs.username = 'At least 3 characters required'
    else if (trimUser.length > 30) errs.username = '30 characters maximum'
    else if (!/^[a-zA-Z0-9_-]+$/.test(trimUser))
      errs.username = 'Only letters, numbers, _ and - allowed'
    if (trimBio.length > 300) errs.bio = 'Bio must be 300 characters or fewer'
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    setFormErrors({})
    setSaving(true)
    try {
      if (trimUser !== profile?.username) {
        const { data: taken } = await supabase
          .from('profiles').select('id').eq('username', trimUser).maybeSingle()
        if (taken) {
          setFormErrors({ username: 'Username is already taken' })
          setSaving(false)
          return
        }
      }
      const { error } = await supabase.from('profiles').update({
        username:   trimUser,
        full_name:  fullName.trim() || null,
        bio:        trimBio || null,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      toast.success('Profile updated!')
      setEditing(false)
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (!profile) return null

  const rep         = profile.reputation
  const tier        = getRepTier(rep)
  const nextTier    = getNextTier(rep)
  const joinDate    = format(new Date(profile.created_at), 'MMMM yyyy')
  const displayName = profile.full_name || profile.username

  return (
    <div className="page-container max-w-3xl">

      {/* ══════════════════════════════════════════════════════════════════
          PROFILE HEADER CARD
      ══════════════════════════════════════════════════════════════════ */}
      <div className="card overflow-hidden mb-6 animate-fade-in">
        {/* Gradient banner */}
        <div className="h-24 sm:h-32 bg-gradient-to-br from-primary via-blue-700 to-secondary relative">
          <div
            className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          />
        </div>

        <div className="px-5 sm:px-6 pb-6">
          {/* Avatar + edit button row */}
          <div className="flex items-end justify-between -mt-12 sm:-mt-14 mb-4">

            {/* Avatar — click to open builder */}
            <button
              onClick={() => setShowBuilder((v) => !v)}
              className="relative group focus-visible:outline-none"
              aria-label="Customise your avatar"
              title="Customise avatar"
            >
              <div className="rounded-full border-4 border-white dark:border-dark-card shadow-md overflow-hidden w-24 h-24">
                <AvatarRenderer config={avatarConfig} rep={rep} size={96} alt={profile.username} />
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                <Palette className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-text-secondary dark:text-gray-400 font-medium">
                Tap to customise
              </span>
            </button>

            {/* Edit profile / Save / Cancel */}
            {!editing ? (
              <button onClick={startEdit} className="btn btn-secondary btn-sm gap-1.5">
                <Edit2 className="w-3.5 h-3.5" />
                Edit profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={cancelEdit} disabled={saving} className="btn btn-secondary btn-sm gap-1">
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
                <button onClick={saveProfile} disabled={saving} className="btn btn-primary btn-sm gap-1">
                  {saving
                    ? <><span className="spinner w-3.5 h-3.5" /> Saving…</>
                    : <><Save className="w-3.5 h-3.5" /> Save</>
                  }
                </button>
              </div>
            )}
          </div>

          {/* ── Avatar Builder (collapsible) ──────────────────────────── */}
          {showBuilder && (
            <div className="card p-4 mb-5 mt-6 animate-fade-in border-2 border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-primary" />
                    Customise your avatar
                  </h3>
                  <p className="text-xs text-text-secondary dark:text-gray-400 mt-0.5">
                    Earn reputation to unlock more items
                  </p>
                </div>
                <button
                  onClick={discardAvatarChanges}
                  className="btn-ghost btn btn-sm w-7 h-7 p-0 rounded-full"
                  aria-label="Close avatar builder"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <AvatarBuilder config={avatarConfig} rep={rep} onChange={handleAvatarChange} />

              {/* Save / discard */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border dark:border-gray-700">
                <button
                  onClick={discardAvatarChanges}
                  disabled={savingAvatar}
                  className="btn btn-secondary btn-sm"
                >
                  Discard
                </button>
                <button
                  onClick={saveAvatarConfig}
                  disabled={savingAvatar || !builderDirty}
                  className="btn btn-primary btn-sm gap-1.5 ml-auto"
                >
                  {savingAvatar
                    ? <><span className="spinner w-3.5 h-3.5" /> Saving…</>
                    : <><Save className="w-3.5 h-3.5" /> Save avatar</>
                  }
                </button>
              </div>
            </div>
          )}

          {/* ── Profile info ────────────────────────────────────────── */}
          {!editing ? (
            <div className={clsx('flex flex-col gap-2', showBuilder ? 'mt-2' : 'mt-6')}>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-text-primary dark:text-dark-text">
                  {displayName}
                </h1>
                {profile.full_name && (
                  <span className="text-text-secondary dark:text-gray-400 text-sm">
                    @{profile.username}
                  </span>
                )}
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ color: tier.color, background: tier.color + '22' }}
                >
                  {tier.emoji} {tier.label}
                </span>
              </div>

              {profile.bio && (
                <p className="text-sm text-text-secondary dark:text-gray-400 leading-relaxed">
                  {profile.bio}
                </p>
              )}

              <div className="flex items-center gap-4 flex-wrap text-xs text-text-secondary dark:text-gray-400 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined {joinDate}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                </span>
                {nextTier && (
                  <span className="flex items-center gap-1">
                    <span>🎯</span>
                    {nextTier.min - rep} rep to {nextTier.label}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 mt-6">
              <EditableField
                id="edit-username" label="Username"
                value={username} onChange={setUsername}
                maxLength={30} placeholder="your_username"
                hint="Letters, numbers, underscores and hyphens only"
                error={formErrors.username}
              />
              <EditableField
                id="edit-fullname" label="Display name"
                value={fullName} onChange={setFullName}
                maxLength={60} placeholder="Your full name (optional)"
              />
              <EditableField
                id="edit-bio" label="Bio"
                value={bio} onChange={setBio}
                maxLength={300} placeholder="Tell the community a bit about yourself…"
                multiline error={formErrors.bio}
              />
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          STATS ROW
      ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-4 flex flex-col items-center gap-1 text-center">
          <span className="text-2xl">{tier.emoji}</span>
          <span className="text-2xl font-extrabold tabular-nums" style={{ color: tier.color }}>
            {rep.toLocaleString()}
          </span>
          <span className="text-xs text-text-secondary dark:text-gray-400">Reputation</span>
          <span className="text-[11px] font-semibold" style={{ color: tier.color }}>
            {tier.label}
          </span>
        </div>

        <div className="card p-4 flex flex-col items-center gap-1 text-center">
          <Star className="w-6 h-6 text-accent" />
          <span className="text-2xl font-extrabold text-text-primary dark:text-dark-text tabular-nums">
            {postsLoading ? '–' : posts.length}
          </span>
          <span className="text-xs text-text-secondary dark:text-gray-400">
            {posts.length === 1 ? 'Post' : 'Posts'}
          </span>
        </div>

        <div className="card p-4 flex flex-col items-center gap-1 text-center">
          <ChevronUp className="w-6 h-6 text-primary dark:text-dark-primary" />
          <span className="text-2xl font-extrabold text-text-primary dark:text-dark-text tabular-nums">
            {postsLoading
              ? '–'
              : posts.reduce((sum, p) => sum + p.upvotes, 0).toLocaleString()
            }
          </span>
          <span className="text-xs text-text-secondary dark:text-gray-400">Upvotes on posts</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          POST HISTORY
      ══════════════════════════════════════════════════════════════════ */}
      <section>
        <h2 className="section-title mb-4">Your posts</h2>
        {postsLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <BookOpen className="w-10 h-10 opacity-30" />
            <p className="font-semibold text-text-primary dark:text-dark-text">No posts yet</p>
            <p className="text-sm">Join a community and share your first question or insight.</p>
            <Link to="/communities" className="btn btn-primary btn-sm mt-2">
              Browse communities
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((post) => <MiniPostCard key={post.id} post={post} />)}
          </div>
        )}
      </section>
    </div>
  )
}
