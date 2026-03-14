import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, MessageSquare, ChevronUp, Clock,
  Trash2, Flag, MoreHorizontal, ExternalLink,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import CommentList, { CommentListSkeleton } from '@/components/CommentList'
import {
  resolveAvatar,
  REPORT_REASONS,
  type PostWithAuthor,
  type ReplyWithChildren,
  type CommunityRow,
} from '@/types'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// ─── Post author avatar ───────────────────────────────────────────────────────
function PostAuthorAvatar({
  avatarUrl,
  username,
}: {
  avatarUrl: string | null | undefined
  username: string
}) {
  const resolved = resolveAvatar(avatarUrl)
  const base = 'w-10 h-10 shrink-0 rounded-full'
  if (resolved.type === 'image') {
    return <img src={resolved.value} alt={username} className={clsx(base, 'object-cover')} />
  }
  if (resolved.type === 'preset') {
    return (
      <span className={clsx('avatar-emoji flex items-center justify-center text-lg', base)}>
        {resolved.value}
      </span>
    )
  }
  return (
    <span className={clsx(
      'avatar-emoji flex items-center justify-center text-sm font-bold text-primary',
      base
    )}>
      {username.slice(0, 2).toUpperCase()}
    </span>
  )
}

// ─── Report modal ─────────────────────────────────────────────────────────────
function ReportPostModal({ postId, onClose }: { postId: string; onClose: () => void }) {
  const { user } = useAuth()
  const [reason, setReason] = useState<typeof REPORT_REASONS[number]>(REPORT_REASONS[0])
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!user) return
    setSubmitting(true)
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        target_type: 'post',
        target_id: postId,
        reason,
      })
      if (error) throw error
      toast.success('Report submitted — thank you')
      onClose()
    } catch {
      toast.error('Failed to submit report')
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
        className="card w-full max-w-sm p-5 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-text-primary dark:text-dark-text mb-3">
          Report post
        </h3>
        <div className="flex flex-col gap-2 mb-4">
          {REPORT_REASONS.map((r) => (
            <label
              key={r}
              className="flex items-center gap-2 cursor-pointer text-sm text-text-primary dark:text-dark-text"
            >
              <input
                type="radio"
                name="post-reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
                className="accent-primary"
              />
              {r}
            </label>
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
          <button
            onClick={submit}
            disabled={submitting}
            className="btn btn-danger btn-sm"
          >
            {submitting ? <span className="spinner w-3.5 h-3.5" /> : 'Submit report'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PostPage() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [post,      setPost]      = useState<PostWithAuthor | null>(null)
  const [community, setCommunity] = useState<CommunityRow | null>(null)
  const [replies,   setReplies]   = useState<ReplyWithChildren[]>([])
  const [loading,   setLoading]   = useState(true)
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [reporting, setReporting] = useState(false)
  const [deleting,  setDeleting]  = useState(false)
  const [notFound,  setNotFound]  = useState(false)

  const isAuthor         = user?.id === post?.author_id
  const isCommunityOwner = user?.id === community?.owner_id
  const canModerate      = isAuthor || isCommunityOwner

  useEffect(() => {
    if (!postId) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        // 1. Fetch post
        const { data: postData, error: postErr } = await supabase
          .from('posts_with_authors')
          .select('*')
          .eq('id', postId)
          .single()

        if (postErr || !postData) { setNotFound(true); setLoading(false); return }
        if (cancelled) return
        setPost(postData as PostWithAuthor)

        // 2. Fetch community
        const { data: commData } = await supabase
          .from('communities')
          .select('*')
          .eq('id', (postData as PostWithAuthor).community_id)
          .single()
        if (!cancelled && commData) setCommunity(commData as CommunityRow)

        // 3. Fetch replies
        const { data: repliesData, error: repliesErr } = await supabase
          .from('replies_with_authors')
          .select('*')
          .eq('post_id', postId)
          .order('created_at', { ascending: true })
        if (repliesErr) throw repliesErr
        if (cancelled) return

        // 4. Fetch user votes
        let votedSet = new Set<string>()
        if (user && repliesData && repliesData.length > 0) {
          const replyIds = (repliesData as { id: string }[]).map((r) => r.id)
          const { data: votes } = await supabase
            .from('votes')
            .select('reply_id')
            .eq('user_id', user.id)
            .in('reply_id', replyIds)
          votedSet = new Set((votes as { reply_id: string }[] | null)?.map((v) => v.reply_id) ?? [])
        }

        const enriched: ReplyWithChildren[] = ((repliesData ?? []) as ReplyWithChildren[]).map((r) => ({
          ...r,
          children: [],
          user_has_voted: votedSet.has(r.id),
        }))

        if (!cancelled) setReplies(enriched)
      } catch (err) {
        console.error('[PostPage] load error:', err)
        toast.error('Failed to load post')
        navigate(-1)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [postId, user?.id, navigate])

  const handleDelete = async () => {
    if (!post || !window.confirm('Delete this post? This cannot be undone.')) return
    setDeleting(true)
    setMenuOpen(false)
    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_deleted: true })
        .eq('id', post.id)
      if (error) throw error
      toast.success('Post deleted')
      navigate(`/c/${post.community_id}`, { replace: true })
    } catch {
      toast.error('Failed to delete post')
      setDeleting(false)
    }
  }

  const handleRepliesChange = useCallback((updated: ReplyWithChildren[]) => {
    setReplies(updated)
    setPost((p) => p ? { ...p, reply_count: updated.length } : p)
  }, [])

  if (notFound) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <span className="text-5xl">🔍</span>
        <h1 className="text-xl font-bold text-text-primary dark:text-dark-text">Post not found</h1>
        <p className="text-text-secondary dark:text-gray-400 text-sm">
          This post may have been deleted or doesn't exist.
        </p>
        <Link to="/communities" className="btn btn-primary btn-sm">
          Back to communities
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page-container max-w-3xl">
        <div className="skeleton h-4 w-48 rounded mb-6" />
        <div className="card p-6 mb-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="skeleton w-10 h-10 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="skeleton h-3.5 w-1/4 rounded" />
              <div className="skeleton h-3 w-1/5 rounded" />
            </div>
          </div>
          <div className="skeleton h-6 w-3/4 rounded" />
          <div className="space-y-2">
            <div className="skeleton h-3.5 w-full rounded" />
            <div className="skeleton h-3.5 w-5/6 rounded" />
            <div className="skeleton h-3.5 w-4/6 rounded" />
          </div>
          <div className="flex gap-4 pt-2">
            <div className="skeleton h-7 w-16 rounded" />
            <div className="skeleton h-7 w-16 rounded" />
          </div>
        </div>
        <CommentListSkeleton />
      </div>
    )
  }

  if (!post) return null

  const timeAgo  = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
  const fullDate = format(new Date(post.created_at), 'PPP p')

  return (
    <div className="page-container max-w-3xl">
      {/* ── Breadcrumb ───────────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-sm text-text-secondary dark:text-gray-400 mb-5 flex-wrap">
        <Link
          to="/communities"
          className="hover:text-primary transition-colors no-underline flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Communities
        </Link>
        {community && (
          <>
            <span>/</span>
            <Link
              to={`/c/${community.id}`}
              className="hover:text-primary transition-colors no-underline truncate max-w-[160px]"
            >
              {community.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-text-primary dark:text-dark-text truncate max-w-[200px]">
          {post.title}
        </span>
      </nav>

      {/* ── Post card ────────────────────────────────────────────────────────── */}
      <article className="card p-5 sm:p-6 mb-6 animate-fade-in">
        {/* Author row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <PostAuthorAvatar
              avatarUrl={post.author_avatar}
              username={post.author_username}
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-text-primary dark:text-dark-text text-sm">
                  {post.author_username}
                </span>
                {post.author_reputation > 0 && (
                  <span className="badge-rep text-[11px]">⭐ {post.author_reputation} rep</span>
                )}
                {isAuthor && (
                  <span className="badge-primary text-[11px]">Author</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-text-secondary dark:text-gray-400 mt-0.5">
                <Clock className="w-3 h-3" />
                <time dateTime={post.created_at} title={fullDate}>{timeAgo}</time>
                {community && (
                  <>
                    <span>·</span>
                    <Link
                      to={`/c/${community.id}`}
                      className="hover:text-primary transition-colors no-underline flex items-center gap-0.5"
                    >
                      {community.name}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Options menu */}
          {user && (
            <div className="relative shrink-0">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="btn-ghost btn btn-sm w-8 h-8 p-0 rounded-full"
                aria-label="Post options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-9 w-44 card shadow-card-hover py-1 z-20 animate-fade-in">
                  {canModerate && (
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      {deleting
                        ? <span className="spinner w-3.5 h-3.5" />
                        : <Trash2 className="w-3.5 h-3.5" />
                      }
                      Delete post
                    </button>
                  )}
                  {!isAuthor && (
                    <button
                      onClick={() => { setReporting(true); setMenuOpen(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      Report post
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-dark-text leading-snug mb-4">
          {post.title}
        </h1>

        {/* Body */}
        {post.body && (
          <div className="prose-sm text-text-primary dark:text-dark-text leading-relaxed whitespace-pre-wrap break-words mb-5 border-l-2 border-border dark:border-gray-700 pl-4">
            {post.body}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-5 pt-4 border-t border-border dark:border-gray-700">
          <div
            className={clsx(
              'flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full',
              post.upvotes > 0
                ? 'bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-dark-primary'
                : 'bg-gray-100 text-text-secondary dark:bg-gray-800 dark:text-gray-400'
            )}
          >
            <ChevronUp className="w-4 h-4" />
            <span className="tabular-nums">{post.upvotes}</span>
            <span className="font-normal text-xs">
              {post.upvotes === 1 ? 'upvote' : 'upvotes'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-text-secondary dark:text-gray-400">
            <MessageSquare className="w-4 h-4" />
            <span className="tabular-nums">{replies.length}</span>
            <span>{replies.length === 1 ? 'reply' : 'replies'}</span>
          </div>
          <time
            dateTime={post.created_at}
            className="ml-auto text-xs text-text-secondary dark:text-gray-500 hidden sm:block"
            title={fullDate}
          >
            {fullDate}
          </time>
        </div>
      </article>

      {/* ── Comment list ──────────────────────────────────────────────────────── */}
      <CommentList
        postId={post.id}
        replies={replies}
        communityOwnerId={community?.owner_id}
        onRepliesChange={handleRepliesChange}
      />

      {reporting && (
        <ReportPostModal postId={post.id} onClose={() => setReporting(false)} />
      )}

      {menuOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
