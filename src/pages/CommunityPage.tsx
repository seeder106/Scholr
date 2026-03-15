import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Search, X, Users, ArrowLeft, Lock, Shield, LogOut, Trash2, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import PostCard, { PostCardSkeleton } from '@/components/PostCard'
import PostComposer from '@/components/PostComposer'
import type { CommunityRow, CommunityMemberRow, PostWithAuthor } from '@/types'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

type SortBy = 'newest' | 'top'
const PAGE_SIZE = 15

function DeleteCommunityModal({ communityName, onConfirm, onCancel, deleting }: {
  communityName: string; onConfirm: () => void; onCancel: () => void; deleting: boolean
}) {
  const [confirmText, setConfirmText] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onCancel}>
      <div className="card w-full max-w-md p-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-error" />
        </div>
        <h2 className="text-lg font-bold text-text-primary dark:text-dark-text text-center mb-1">Delete community</h2>
        <p className="text-sm text-text-secondary dark:text-gray-400 text-center mb-4">
          This will permanently delete <strong>{communityName}</strong> and all its posts. This cannot be undone.
        </p>
        <p className="text-sm text-text-primary dark:text-dark-text mb-2">Type <strong>{communityName}</strong> to confirm:</p>
        <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="input mb-4" placeholder={communityName} autoFocus />
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn btn-secondary flex-1" disabled={deleting}>Cancel</button>
          <button onClick={onConfirm} disabled={confirmText !== communityName || deleting} className="btn btn-danger flex-1">
            {deleting ? <span className="spinner w-4 h-4" /> : 'Delete community'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CommunityInfoCard({ community, isMember, isOwner, onJoin, onLeave, onDeleteRequest, joining }: {
  community: CommunityRow; isMember: boolean; isOwner: boolean
  onJoin: () => void; onLeave: () => void; onDeleteRequest: () => void; joining: boolean
}) {
  return (
    <aside className="hidden lg:flex flex-col gap-4 w-72 shrink-0">
      <div className="card p-5 flex flex-col gap-4">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary dark:text-dark-primary select-none">
            {community.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-text-primary dark:text-dark-text text-base flex items-center gap-1.5 justify-center">
              {community.name}
              {community.is_private && <Lock className="w-3.5 h-3.5 text-text-secondary" />}
            </h2>
            <p className="text-xs text-text-secondary dark:text-gray-400 mt-0.5 flex items-center gap-1 justify-center">
              <Users className="w-3 h-3" />{community.member_count.toLocaleString()} {community.member_count === 1 ? 'member' : 'members'}
            </p>
          </div>
        </div>
        {community.description && <p className="text-sm text-text-secondary dark:text-gray-400 leading-relaxed text-center">{community.description}</p>}
        <div className="divider my-0" />
        <p className="text-xs text-text-secondary dark:text-gray-400 text-center">
          Created {formatDistanceToNow(new Date(community.created_at), { addSuffix: true })}
        </p>
        {isMember ? (
          <div className="flex flex-col gap-2">
            {isOwner && <div className="badge-primary text-xs justify-center py-1.5"><Shield className="w-3 h-3" /> You own this community</div>}
            {!isOwner && <button onClick={onLeave} disabled={joining} className="btn btn-secondary btn-sm w-full gap-1.5"><LogOut className="w-3.5 h-3.5" />{joining ? 'Leaving…' : 'Leave community'}</button>}
            {isOwner && <button onClick={onDeleteRequest} className="btn btn-sm w-full gap-1.5 text-error hover:bg-red-50 dark:hover:bg-red-900/20 bg-transparent border border-error/30"><Trash2 className="w-3.5 h-3.5" />Delete community</button>}
          </div>
        ) : (
          <button onClick={onJoin} disabled={joining} className="btn btn-primary w-full">
            {joining ? <><span className="spinner w-4 h-4" /> Joining…</> : 'Join community'}
          </button>
        )}
      </div>
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text mb-2">Community rules</h3>
        <ol className="list-decimal list-inside space-y-1">
          {['Be respectful to everyone', 'Stay on topic for this subject', 'No spam or self-promotion', 'Search before posting duplicates'].map((rule, i) => (
            <li key={i} className="text-xs text-text-secondary dark:text-gray-400">{rule}</li>
          ))}
        </ol>
      </div>
    </aside>
  )
}

export default function CommunityPage() {
  const { communityId } = useParams<{ communityId: string }>()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [community,       setCommunity]       = useState<CommunityRow | null>(null)
  const [membership,      setMembership]      = useState<CommunityMemberRow | null>(null)
  const [posts,           setPosts]           = useState<PostWithAuthor[]>([])
  const [loading,         setLoading]         = useState(true)
  const [joining,         setJoining]         = useState(false)
  const [search,          setSearch]          = useState('')
  const [searchResults,   setSearchResults]   = useState<PostWithAuthor[] | null>(null)
  const [searching,       setSearching]       = useState(false)
  const [sortBy,          setSortBy]          = useState<SortBy>('newest')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting,        setDeleting]        = useState(false)
  const [page,            setPage]            = useState(0)
  const [hasMore,         setHasMore]         = useState(true)
  const [loadingMore,     setLoadingMore]     = useState(false)
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isMember = !!membership
  const isOwner  = membership?.role === 'owner'

  useEffect(() => {
    if (!communityId || authLoading) return
    let cancelled = false
    const init = async () => {
      setLoading(true)
      try {
        const [{ data: comm, error: commErr }, { data: postsData, error: postsErr }] = await Promise.all([
          supabase.from('communities').select('*').eq('id', communityId).single(),
          supabase.from('posts_with_authors').select('*').eq('community_id', communityId).order('created_at', { ascending: false }).range(0, PAGE_SIZE - 1),
        ])
        if (commErr) throw commErr
        if (postsErr) throw postsErr
        if (cancelled) return
        setCommunity(comm as CommunityRow)
        setPosts((postsData ?? []) as PostWithAuthor[])
        setHasMore((postsData?.length ?? 0) === PAGE_SIZE)
        setPage(0)
        if (user) {
          const { data: mem } = await supabase.from('community_members').select('*').eq('community_id', communityId).eq('user_id', user.id).maybeSingle()
          if (!cancelled) setMembership(mem as CommunityMemberRow | null)
        }
      } catch (err) {
        console.error('[CommunityPage] init error:', err)
        toast.error('Failed to load community')
        navigate('/communities')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [communityId, user?.id, authLoading, navigate])

  useEffect(() => {
    setPosts((prev) => {
      const sorted = [...prev]
      if (sortBy === 'newest') sorted.sort((a, b) => b.created_at.localeCompare(a.created_at))
      else sorted.sort((a, b) => b.upvotes - a.upvotes)
      return sorted
    })
  }, [sortBy])

  const loadMore = async () => {
    if (!communityId || loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    try {
      const { data } = await supabase.from('posts_with_authors').select('*').eq('community_id', communityId)
        .order(sortBy === 'newest' ? 'created_at' : 'upvotes', { ascending: false })
        .range(nextPage * PAGE_SIZE, (nextPage + 1) * PAGE_SIZE - 1)
      const newPosts = (data ?? []) as PostWithAuthor[]
      setPosts((prev) => [...prev, ...newPosts])
      setHasMore(newPosts.length === PAGE_SIZE)
      setPage(nextPage)
    } catch { toast.error('Failed to load more posts') }
    finally { setLoadingMore(false) }
  }

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    if (!search.trim()) { setSearchResults(null); return }
    searchDebounce.current = setTimeout(async () => {
      setSearching(true)
      try {
        const { data } = await supabase.from('posts_with_authors').select('*')
          .eq('community_id', communityId ?? '')
          .or(`title.ilike.%${search.trim()}%,body.ilike.%${search.trim()}%`)
          .order('created_at', { ascending: false }).limit(20)
        setSearchResults((data ?? []) as PostWithAuthor[])
      } catch {
        setSearchResults(posts.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()) || (p.body ?? '').toLowerCase().includes(search.toLowerCase())))
      } finally { setSearching(false) }
    }, 350)
    return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current) }
  }, [search, communityId, posts])

  const handleJoin = async () => {
    if (!user || !community) return
    setJoining(true)
    try {
      const { data, error } = await supabase.from('community_members').insert({ community_id: community.id, user_id: user.id, role: 'member' }).select('*').single()
      if (error) throw error
      setMembership(data as CommunityMemberRow)
      setCommunity((c) => c ? { ...c, member_count: c.member_count + 1 } : c)
      toast.success(`Joined ${community.name}!`)
    } catch { toast.error('Failed to join community') }
    finally { setJoining(false) }
  }

  const handleLeave = async () => {
    if (!user || !community) return
    if (!window.confirm('Leave this community?')) return
    setJoining(true)
    try {
      await supabase.from('community_members').delete().eq('community_id', community.id).eq('user_id', user.id)
      setMembership(null)
      setCommunity((c) => c ? { ...c, member_count: Math.max(c.member_count - 1, 0) } : c)
      toast('Left community')
    } catch { toast.error('Failed to leave community') }
    finally { setJoining(false) }
  }

  const handleDeleteCommunity = async () => {
    if (!community) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('communities').delete().eq('id', community.id)
      if (error) throw error
      toast.success('Community deleted')
      navigate('/communities')
    } catch { toast.error('Failed to delete community'); setDeleting(false) }
  }

  const handlePostCreated = useCallback((post: PostWithAuthor) => { setPosts((prev) => [post, ...prev]) }, [])
  const handlePostDeleted = useCallback((postId: string) => { setPosts((prev) => prev.filter((p) => p.id !== postId)) }, [])

  const displayPosts = searchResults ?? posts

  if (loading) {
    return (
      <div className="page-container-wide">
        <div className="skeleton h-6 w-40 rounded mb-6" />
        <div className="flex gap-6">
          <div className="flex-1 flex flex-col gap-4">{Array.from({ length: 4 }).map((_, i) => <PostCardSkeleton key={i} />)}</div>
          <div className="hidden lg:block w-72 shrink-0">
            <div className="card p-5 space-y-3">
              <div className="skeleton h-16 w-16 rounded-2xl mx-auto" />
              <div className="skeleton h-4 w-1/2 rounded mx-auto" />
              <div className="skeleton h-8 w-full rounded mt-2" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!community) return null

  return (
    <>
      <div className="page-container-wide">
        <div className="flex items-center gap-2 mb-5 text-sm text-text-secondary dark:text-gray-400">
          <Link to="/communities" className="flex items-center gap-1 hover:text-primary transition-colors no-underline"><ArrowLeft className="w-4 h-4" />Communities</Link>
          <span>/</span>
          <span className="text-text-primary dark:text-dark-text font-medium truncate max-w-xs">{community.name}</span>
        </div>

        {/* Mobile community header */}
        <div className="lg:hidden card p-4 flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-xl font-bold text-primary dark:text-dark-primary shrink-0 select-none">
            {community.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-text-primary dark:text-dark-text truncate flex items-center gap-1">
              {community.name}{community.is_private && <Lock className="w-3.5 h-3.5 text-text-secondary shrink-0" />}
            </h1>
            <p className="text-xs text-text-secondary dark:text-gray-400">{community.member_count.toLocaleString()} members</p>
          </div>
          {!isMember ? (
            <button onClick={handleJoin} disabled={joining} className="btn btn-primary btn-sm shrink-0">
              {joining ? <span className="spinner w-3.5 h-3.5" /> : 'Join'}
            </button>
          ) : isOwner ? (
            <span className="badge-primary shrink-0"><Shield className="w-3 h-3" /> Owner</span>
          ) : (
            <button onClick={handleLeave} disabled={joining} className="btn btn-secondary btn-sm shrink-0">Leave</button>
          )}
        </div>

        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {isMember && <PostComposer communityId={community.id} onPostCreated={handlePostCreated} />}

            <div className="flex gap-2 items-center">
              <div className="search-wrapper flex-1">
                <Search className="search-icon w-4 h-4" />
                <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search posts in this community…" className="search-input" aria-label="Search posts" />
                {searching && <span className="absolute right-3"><span className="spinner w-3.5 h-3.5 text-text-secondary" /></span>}
                {search && !searching && (
                  <button onClick={() => { setSearch(''); setSearchResults(null) }} className="absolute right-3 text-text-secondary hover:text-text-primary" aria-label="Clear search">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="relative shrink-0">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className="input pr-8 py-2 text-sm appearance-none cursor-pointer" aria-label="Sort posts">
                  <option value="newest">Newest</option>
                  <option value="top">Top</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary pointer-events-none" />
              </div>
            </div>

            {search && !searching && <p className="text-xs text-text-secondary dark:text-gray-400">{displayPosts.length} result{displayPosts.length !== 1 ? 's' : ''} for "{search}"</p>}

            {displayPosts.length === 0 ? (
              <div className="empty-state">
                {search ? (
                  <><Search className="w-10 h-10 opacity-30" /><p className="font-semibold text-text-primary dark:text-dark-text">No posts match "{search}"</p></>
                ) : (
                  <><span className="text-4xl">📝</span><p className="font-semibold text-text-primary dark:text-dark-text">No posts yet</p>{isMember ? <p className="text-sm">Be the first to post something!</p> : <p className="text-sm">Join the community to post.</p>}</>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {displayPosts.map((post) => (
                  <PostCard key={post.id} post={post} communityOwnerId={community.owner_id} onDeleted={handlePostDeleted} />
                ))}
                {!search && hasMore && (
                  <button onClick={loadMore} disabled={loadingMore} className={clsx('btn btn-secondary w-full mt-2', loadingMore && 'opacity-70')}>
                    {loadingMore ? <><span className="spinner w-4 h-4" /> Loading…</> : 'Load more posts'}
                  </button>
                )}
              </div>
            )}
          </div>

          <CommunityInfoCard community={community} isMember={isMember} isOwner={isOwner}
            onJoin={handleJoin} onLeave={handleLeave} onDeleteRequest={() => setShowDeleteModal(true)} joining={joining} />
        </div>
      </div>

      {showDeleteModal && (
        <DeleteCommunityModal communityName={community.name} onConfirm={handleDeleteCommunity}
          onCancel={() => setShowDeleteModal(false)} deleting={deleting} />
      )}
    </>
  )
}
