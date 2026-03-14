import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Plus, X, Users, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import CommunityCard, { CommunityCardSkeleton } from '@/components/CommunityCard'
import AvatarRenderer from '@/components/AvatarRenderer'
import { getRepTier, getNextTier, DEFAULT_AVATAR_CONFIG, type AvatarConfig } from '@/data/avatarItems'
import type { CommunityWithMembership } from '@/types'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// ─── Slug generator ───────────────────────────────────────────────────────────
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

// ─── Create community modal ───────────────────────────────────────────────────
interface CreateModalProps {
  onClose: () => void
  onCreated: (community: CommunityWithMembership) => void
}

function CreateCommunityModal({ onClose, onCreated }: CreateModalProps) {
  const { user } = useAuth()
  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate]     = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [errors, setErrors]           = useState<{ name?: string; description?: string }>({})
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const slug = toSlug(name)

  const validate = () => {
    const errs: typeof errors = {}
    if (!name.trim()) errs.name = 'Name is required'
    else if (name.trim().length < 3) errs.name = 'Name must be at least 3 characters'
    else if (name.trim().length > 60) errs.name = 'Name must be 60 characters or fewer'
    if (description.length > 300) errs.description = 'Description must be 300 characters or fewer'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setSubmitting(true)

    try {
      // Check slug uniqueness
      const { data: existing } = await supabase
        .from('communities')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

      if (existing) {
        setErrors({ name: 'A community with a similar name already exists.' })
        setSubmitting(false)
        return
      }

      // Insert community
      const { data: community, error: insertError } = await supabase
        .from('communities')
        .insert({
          name: name.trim(),
          slug,
          description: description.trim() || null,
          owner_id: user.id,
          is_private: isPrivate,
        })
        .select('*')
        .single()

      if (insertError) throw insertError

      // Auto-join as owner
      await supabase.from('community_members').insert({
        community_id: community.id,
        user_id: user.id,
        role: 'owner',
      })

      toast.success(`Community "${community.name}" created!`)
      onCreated({ ...community, is_member: true, member_role: 'owner' })
      onClose()
    } catch (err) {
      console.error('[CreateCommunity]', err)
      toast.error('Failed to create community. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md p-6 animate-fade-in shadow-card-hover"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Create a community"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-text-primary dark:text-dark-text">
            Create a community
          </h2>
          <button
            onClick={onClose}
            className="btn-ghost btn btn-sm w-8 h-8 p-0 rounded-full"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {/* Name */}
          <div>
            <label htmlFor="c-name" className="label">
              Community name <span className="text-error">*</span>
            </label>
            <input
              id="c-name"
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Organic Chemistry 201"
              maxLength={60}
              disabled={submitting}
              className={clsx('input', errors.name && 'input-error')}
            />
            {errors.name
              ? <p className="field-error">{errors.name}</p>
              : name && (
                <p className="text-xs text-text-secondary dark:text-gray-500 mt-1">
                  Slug: <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">{slug}</code>
                </p>
              )
            }
          </div>

          {/* Description */}
          <div>
            <label htmlFor="c-desc" className="label">
              Description{' '}
              <span className="text-text-secondary font-normal">(optional)</span>
            </label>
            <textarea
              id="c-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this community about?"
              rows={3}
              maxLength={300}
              disabled={submitting}
              className={clsx('textarea', errors.description && 'input-error')}
            />
            <div className="flex justify-between mt-0.5">
              {errors.description
                ? <p className="field-error">{errors.description}</p>
                : <span />
              }
              <span className={clsx(
                'text-xs tabular-nums',
                description.length > 270 ? 'text-warning' : 'text-text-secondary dark:text-gray-500'
              )}>
                {description.length}/300
              </span>
            </div>
          </div>

          {/* Private toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="sr-only"
              />
              <div className={clsx(
                'w-10 h-5 rounded-full transition-colors duration-200',
                isPrivate ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
              )} />
              <div className={clsx(
                'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
                isPrivate && 'translate-x-5'
              )} />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary dark:text-dark-text">Private community</p>
              <p className="text-xs text-text-secondary dark:text-gray-400">Only members can see posts</p>
            </div>
          </label>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="btn btn-primary flex-1"
            >
              {submitting
                ? <><span className="spinner w-4 h-4" /> Creating…</>
                : 'Create community'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Communities() {
  const { user, profile } = useAuth()

  const [communities,    setCommunities]    = useState<CommunityWithMembership[]>([])
  const [loading,        setLoading]        = useState(true)
  const [search,         setSearch]         = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [joiningId,      setJoiningId]      = useState<string | null>(null)
  const [activeTab,      setActiveTab]      = useState<'all' | 'joined'>('all')

  // ── Fetch all communities + membership status ───────────────────────────────
  const fetchCommunities = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('member_count', { ascending: false })

      if (error) throw error

      if (!user || !data) {
        setCommunities((data ?? []).map((c) => ({ ...c, is_member: false, member_role: null })))
        return
      }

      // Fetch this user's memberships in one query
      const { data: memberships } = await supabase
        .from('community_members')
        .select('community_id, role')
        .eq('user_id', user.id)

      const memberMap = new Map(memberships?.map((m) => [m.community_id, m.role]) ?? [])

      setCommunities(
        data.map((c) => ({
          ...c,
          is_member: memberMap.has(c.id),
          member_role: (memberMap.get(c.id) ?? null) as CommunityWithMembership['member_role'],
        }))
      )
    } catch (err) {
      console.error('[Communities] fetch error:', err)
      toast.error('Failed to load communities')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchCommunities() }, [fetchCommunities])

  // ── Join ────────────────────────────────────────────────────────────────────
  const handleJoin = async (communityId: string) => {
    if (!user) return
    setJoiningId(communityId)
    try {
      const { error } = await supabase.from('community_members').insert({
        community_id: communityId,
        user_id: user.id,
        role: 'member',
      })
      if (error) throw error

      setCommunities((prev) =>
        prev.map((c) =>
          c.id === communityId
            ? { ...c, is_member: true, member_role: 'member', member_count: c.member_count + 1 }
            : c
        )
      )
      toast.success('Joined!')
    } catch {
      toast.error('Failed to join community')
    } finally {
      setJoiningId(null)
    }
  }

  // ── Leave ───────────────────────────────────────────────────────────────────
  const handleLeave = async (communityId: string) => {
    if (!user) return
    if (!window.confirm('Leave this community?')) return
    setJoiningId(communityId)
    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', user.id)
      if (error) throw error

      setCommunities((prev) =>
        prev.map((c) =>
          c.id === communityId
            ? { ...c, is_member: false, member_role: null, member_count: Math.max(c.member_count - 1, 0) }
            : c
        )
      )
      toast('Left community')
    } catch {
      toast.error('Failed to leave community')
    } finally {
      setJoiningId(null)
    }
  }

  // ── On community created ────────────────────────────────────────────────────
  const handleCreated = (community: CommunityWithMembership) => {
    setCommunities((prev) => [community, ...prev])
    setActiveTab('joined')
  }

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = communities.filter((c) => {
    const matchesSearch =
      !search.trim() ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description ?? '').toLowerCase().includes(search.toLowerCase())

    const matchesTab = activeTab === 'all' || c.is_member

    return matchesSearch && matchesTab
  })

  const joinedCount = communities.filter((c) => c.is_member).length

  // ── User stats for the header bar ────────────────────────────────────────────
  const rep         = profile?.reputation ?? 0
  const tier        = getRepTier(rep)
  const nextTier    = getNextTier(rep)
  const avatarConfig = (profile?.avatar_config as AvatarConfig | null) ?? DEFAULT_AVATAR_CONFIG

  return (
    <main className="page-container-wide">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        {/* Title */}
        <div className="shrink-0">
          <h1 className="text-2xl font-extrabold text-text-primary dark:text-dark-text">
            Communities
          </h1>
          <p className="text-text-secondary dark:text-gray-400 text-sm mt-0.5">
            Join communities for your courses and subjects
          </p>
        </div>

        {/* ── Stats bar + New community button ─────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">

          {/* Stats card */}
          <Link
            to="/profile"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border dark:border-gray-700 bg-card dark:bg-dark-card hover:shadow-card-hover hover:border-primary/30 transition-all duration-200 no-underline group shrink-0"
            title="View your profile"
          >
            {/* Avatar */}
            <div className="rounded-full overflow-hidden shrink-0">
              <AvatarRenderer
                config={avatarConfig}
                rep={rep}
                size={36}
                alt={profile?.username ?? 'You'}
              />
            </div>

            {/* Divider */}
            <div className="w-px h-7 bg-border dark:bg-gray-700 shrink-0" />

            {/* Reputation */}
            <div className="flex flex-col items-center min-w-[48px]">
              <span
                className="text-base font-extrabold tabular-nums leading-tight"
                style={{ color: tier.color }}
              >
                {rep.toLocaleString()}
              </span>
              <span className="text-[10px] text-text-secondary dark:text-gray-400 leading-tight">
                rep
              </span>
            </div>

            {/* Divider */}
            <div className="w-px h-7 bg-border dark:bg-gray-700 shrink-0" />

            {/* Tier */}
            <div className="flex flex-col items-center min-w-[56px]">
              <span className="text-base leading-tight">{tier.emoji}</span>
              <span
                className="text-[10px] font-semibold leading-tight"
                style={{ color: tier.color }}
              >
                {tier.label}
              </span>
            </div>

            {/* Divider */}
            <div className="w-px h-7 bg-border dark:bg-gray-700 shrink-0" />

            {/* Communities joined */}
            <div className="flex flex-col items-center min-w-[40px]">
              <span className="text-base font-extrabold tabular-nums leading-tight text-text-primary dark:text-dark-text">
                {joinedCount}
              </span>
              <span className="text-[10px] text-text-secondary dark:text-gray-400 leading-tight">
                {joinedCount === 1 ? 'joined' : 'joined'}
              </span>
            </div>

            {/* Next unlock hint — only show if something is upcoming */}
            {nextTier && rep < nextTier.min && (
              <>
                <div className="w-px h-7 bg-border dark:bg-gray-700 shrink-0" />
                <div className="flex flex-col items-center min-w-[56px]">
                  <span className="text-[11px] font-semibold text-primary dark:text-dark-primary leading-tight tabular-nums">
                    {(nextTier.min - rep).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-text-secondary dark:text-gray-400 leading-tight">
                    to {nextTier.emoji}
                  </span>
                </div>
              </>
            )}
          </Link>

          {/* New community button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary shrink-0"
          >
            <Plus className="w-4 h-4" />
            New community
          </button>
        </div>
      </div>

      {/* ── Search + tabs bar ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="search-wrapper flex-1">
          <Search className="search-icon w-4 h-4" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search communities…"
            className="search-input"
            aria-label="Search communities"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tab buttons */}
        <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 shrink-0">
          {(['all', 'joined'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={clsx(
                'px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
                activeTab === t
                  ? 'bg-white dark:bg-dark-card text-primary dark:text-dark-primary shadow-sm'
                  : 'text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-dark-text'
              )}
            >
              {t === 'all' ? 'All' : `Joined${joinedCount ? ` (${joinedCount})` : ''}`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CommunityCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          search={search}
          tab={activeTab}
          onClearSearch={() => setSearch('')}
          onCreateCommunity={() => setShowCreateModal(true)}
        />
      ) : (
        <>
          <p className="text-xs text-text-secondary dark:text-gray-400 mb-3">
            {filtered.length} {filtered.length === 1 ? 'community' : 'communities'}
            {search && ` matching "${search}"`}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((community) => (
              <CommunityCard
                key={community.id}
                community={community}
                onJoin={handleJoin}
                onLeave={handleLeave}
                joining={joiningId === community.id}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Create community modal ────────────────────────────────────────────── */}
      {showCreateModal && (
        <CreateCommunityModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}
    </main>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({
  search,
  tab,
  onClearSearch,
  onCreateCommunity,
}: {
  search: string
  tab: 'all' | 'joined'
  onClearSearch: () => void
  onCreateCommunity: () => void
}) {
  if (search) {
    return (
      <div className="empty-state">
        <Search className="w-10 h-10 opacity-30" />
        <p className="font-semibold text-text-primary dark:text-dark-text">
          No communities match "{search}"
        </p>
        <p className="text-sm">Try a different name, or start a new one.</p>
        <div className="flex gap-2 mt-2">
          <button onClick={onClearSearch} className="btn btn-secondary btn-sm">
            Clear search
          </button>
          <button onClick={onCreateCommunity} className="btn btn-primary btn-sm">
            <Plus className="w-3.5 h-3.5" /> Create it
          </button>
        </div>
      </div>
    )
  }

  if (tab === 'joined') {
    return (
      <div className="empty-state">
        <Users className="w-10 h-10 opacity-30" />
        <p className="font-semibold text-text-primary dark:text-dark-text">
          You haven't joined any communities yet
        </p>
        <p className="text-sm">Browse the "All" tab and join some to get started.</p>
        <button onClick={() => {}} className="btn btn-primary btn-sm mt-2">
          <BookOpen className="w-3.5 h-3.5" /> Browse all communities
        </button>
      </div>
    )
  }

  return (
    <div className="empty-state">
      <BookOpen className="w-10 h-10 opacity-30" />
      <p className="font-semibold text-text-primary dark:text-dark-text">
        No communities yet
      </p>
      <p className="text-sm">Be the first to create one!</p>
      <button onClick={onCreateCommunity} className="btn btn-primary btn-sm mt-2">
        <Plus className="w-3.5 h-3.5" /> Create community
      </button>
    </div>
  )
}
