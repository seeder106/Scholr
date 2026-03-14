import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessageSquare,
  ChevronUp,
  Trash2,
  Flag,
  MoreHorizontal,
  Clock,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { REPORT_REASONS, type PostWithAuthor } from '@/types'
import AvatarRenderer from '@/components/AvatarRenderer'
import type { AvatarConfig } from '@/data/avatarItems'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// ─── Props ────────────────────────────────────────────────────────────────────
interface PostCardProps {
  post: PostWithAuthor
  communityOwnerId?: string
  onDeleted?: (postId: string) => void
  showCommunity?: boolean
  communityName?: string
}

// ─── Report modal ─────────────────────────────────────────────────────────────
function ReportModal({
  postId,
  onClose,
}: {
  postId: string
  onClose: () => void
}) {
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
                name="reason"
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
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            Cancel
          </button>
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

// ─── Component ────────────────────────────────────────────────────────────────
export default function PostCard({
  post,
  communityOwnerId,
  onDeleted,
  showCommunity = false,
  communityName,
}: PostCardProps) {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [menuOpen,   setMenuOpen]   = useState(false)
  const [reporting,  setReporting]  = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  const isAuthor         = user?.id === post.author_id
  const isCommunityOwner = user?.id === communityOwnerId
  const canModerate      = isAuthor || isCommunityOwner

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })

  const handleOpen = () => navigate(`/p/${post.id}`)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm('Delete this post? This cannot be undone.')) return
    setDeleting(true)
    setMenuOpen(false)
    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_deleted: true })
        .eq('id', post.id)
      if (error) throw error
      toast.success('Post deleted')
      onDeleted?.(post.id)
    } catch {
      toast.error('Failed to delete post')
    } finally {
      setDeleting(false)
    }
  }

  // Pull avatar_config from the view row (added in migration + view update)
  const avatarConfig = (post as PostWithAuthor & {
    author_avatar_config?: AvatarConfig | null
  }).author_avatar_config ?? null

  return (
    <>
      <article
        className="card-hover p-4 flex flex-col gap-3 cursor-pointer animate-fade-in"
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpen() }}
        aria-label={`Post: ${post.title}`}
      >
        {/* ── Header row ───────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Custom SVG avatar */}
            <AvatarRenderer
              config={avatarConfig}
              rep={post.author_reputation}
              size={28}
              alt={post.author_username}
            />

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-medium text-text-primary dark:text-dark-text truncate">
                  {post.author_username}
                </span>
                {(post.author_reputation ?? 0) > 0 && (
                  <span className="badge-rep text-[10px]">
                    ⭐ {post.author_reputation}
                  </span>
                )}
                {showCommunity && communityName && (
                  <span className="badge-primary text-[10px]">
                    {communityName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-text-secondary dark:text-gray-400">
                <Clock className="w-3 h-3" />
                <span>{timeAgo}</span>
              </div>
            </div>
          </div>

          {/* ── Actions menu ─────────────────────────────────────────────── */}
          {user && (
            <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="btn-ghost btn btn-sm w-7 h-7 p-0 rounded-full"
                aria-label="Post options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-8 w-40 card shadow-card-hover py-1 z-20 animate-fade-in">
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
                      Report
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Title ────────────────────────────────────────────────────────── */}
        <h2 className="font-semibold text-text-primary dark:text-dark-text text-base leading-snug line-clamp-2">
          {post.title}
        </h2>

        {/* ── Body preview ─────────────────────────────────────────────────── */}
        {post.body && (
          <p className="text-sm text-text-secondary dark:text-gray-400 line-clamp-3 leading-relaxed">
            {post.body}
          </p>
        )}

        {/* ── Footer stats ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 pt-1 border-t border-border dark:border-gray-700">
          <div
            className={clsx(
              'flex items-center gap-1 text-xs font-medium',
              post.upvotes > 0
                ? 'text-primary dark:text-dark-primary'
                : 'text-text-secondary dark:text-gray-400'
            )}
          >
            <ChevronUp className="w-4 h-4" />
            <span>{post.upvotes}</span>
            <span className="font-normal">{post.upvotes === 1 ? 'upvote' : 'upvotes'}</span>
          </div>

          <div className="flex items-center gap-1 text-xs text-text-secondary dark:text-gray-400">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{post.reply_count}</span>
            <span>{post.reply_count === 1 ? 'reply' : 'replies'}</span>
          </div>

          <span className="ml-auto text-xs text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-dark-primary transition-colors font-medium">
            Read more →
          </span>
        </div>
      </article>

      {reporting && (
        <ReportModal
          postId={post.id}
          onClose={() => setReporting(false)}
        />
      )}
    </>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function PostCardSkeleton() {
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="skeleton w-7 h-7 rounded-full shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="skeleton h-3 w-1/3 rounded" />
          <div className="skeleton h-2.5 w-1/4 rounded" />
        </div>
      </div>
      <div className="skeleton h-4 w-4/5 rounded" />
      <div className="space-y-1.5">
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-3/4 rounded" />
      </div>
      <div className="flex gap-4 pt-1 border-t border-border dark:border-gray-700">
        <div className="skeleton h-3 w-16 rounded" />
        <div className="skeleton h-3 w-16 rounded" />
      </div>
    </div>
  )
}
