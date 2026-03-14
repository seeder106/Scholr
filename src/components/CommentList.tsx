import { useState, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Trash2, Flag, CornerDownRight, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { REPORT_REASONS, type ReplyWithChildren } from '@/types'
import AvatarRenderer from '@/components/AvatarRenderer'
import VoteButton from './VoteButton'
import type { AvatarConfig } from '@/data/avatarItems'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// ─── Props ────────────────────────────────────────────────────────────────────
interface CommentListProps {
  postId: string
  replies: ReplyWithChildren[]
  communityOwnerId?: string
  onRepliesChange: (replies: ReplyWithChildren[]) => void
}

// ─── Report modal ─────────────────────────────────────────────────────────────
function ReportModal({ replyId, onClose }: { replyId: string; onClose: () => void }) {
  const { user } = useAuth()
  const [reason, setReason] = useState<typeof REPORT_REASONS[number]>(REPORT_REASONS[0])
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!user) return
    setSubmitting(true)
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        target_type: 'reply',
        target_id: replyId,
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
        <h3 className="font-semibold text-text-primary dark:text-dark-text mb-3">Report reply</h3>
        <div className="flex flex-col gap-2 mb-4">
          {REPORT_REASONS.map((r) => (
            <label
              key={r}
              className="flex items-center gap-2 cursor-pointer text-sm text-text-primary dark:text-dark-text"
            >
              <input
                type="radio"
                name="reply-reason"
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
          <button onClick={submit} disabled={submitting} className="btn btn-danger btn-sm">
            {submitting ? <span className="spinner w-3.5 h-3.5" /> : 'Submit report'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Inline reply composer ────────────────────────────────────────────────────
function ReplyComposer({
  postId,
  parentId,
  onSubmitted,
  onCancel,
}: {
  postId: string
  parentId: string | null
  onSubmitted: (reply: ReplyWithChildren) => void
  onCancel: () => void
}) {
  const { user, profile } = useAuth()
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile || !body.trim()) return
    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('replies')
        .insert({
          post_id: postId,
          author_id: user.id,
          parent_id: parentId,
          body: body.trim(),
        })
        .select('*')
        .single()

      if (error) throw error

      const newReply: ReplyWithChildren = {
        ...data,
        author_username: profile.username,
        author_avatar: profile.avatar_url ?? null,
        author_avatar_config: (profile.avatar_config as AvatarConfig | null) ?? null,
        author_reputation: profile.reputation,
        children: [],
        user_has_voted: false,
      }

      onSubmitted(newReply)
      setBody('')
      toast.success('Reply posted!')
    } catch {
      toast.error('Failed to post reply')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder={parentId ? 'Write a nested reply…' : 'Write your answer or comment…'}
        className="textarea text-sm"
        disabled={submitting}
        autoFocus
        maxLength={2000}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary dark:text-gray-500 tabular-nums">
          {body.length}/2000
        </span>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="btn btn-secondary btn-sm">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="btn btn-primary btn-sm"
          >
            {submitting ? <span className="spinner w-3.5 h-3.5" /> : 'Reply'}
          </button>
        </div>
      </div>
    </form>
  )
}

// ─── Single reply row (recursive) ────────────────────────────────────────────
function ReplyItem({
  reply,
  postId,
  communityOwnerId,
  depth,
  onDelete,
  onNewReply,
}: {
  reply: ReplyWithChildren
  postId: string
  communityOwnerId?: string
  depth: number
  onDelete: (replyId: string) => void
  onNewReply: (parentId: string, newReply: ReplyWithChildren) => void
}) {
  const { user } = useAuth()
  const [replying,   setReplying]   = useState(false)
  const [reporting,  setReporting]  = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [collapsed,  setCollapsed]  = useState(false)

  const isAuthor         = user?.id === reply.author_id
  const isCommunityOwner = user?.id === communityOwnerId
  const canDelete        = isAuthor || isCommunityOwner
  const hasChildren      = reply.children.length > 0
  const maxDepth         = 4

  const timeAgo = formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })

  // Pull avatar_config off the reply (added by view update)
  const avatarConfig = (reply as ReplyWithChildren & {
    author_avatar_config?: AvatarConfig | null
  }).author_avatar_config ?? null

  const handleDelete = async () => {
    if (!window.confirm('Delete this reply?')) return
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('replies')
        .update({ is_deleted: true })
        .eq('id', reply.id)
      if (error) throw error
      toast.success('Reply deleted')
      onDelete(reply.id)
    } catch {
      toast.error('Failed to delete reply')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={clsx('flex flex-col gap-1 animate-fade-in', depth > 0 && 'ml-4 sm:ml-7')}>
      <div className={clsx('flex gap-2.5', depth > 0 && 'relative')}>
        {depth > 0 && (
          <div className="absolute -left-4 sm:-left-7 top-0 bottom-0 w-px bg-border dark:bg-gray-700" />
        )}

        {/* Custom SVG avatar */}
        <div className="shrink-0 mt-0.5">
          <AvatarRenderer
            config={avatarConfig}
            rep={reply.author_reputation}
            size={28}
            alt={reply.author_username}
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* Author row */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-medium text-text-primary dark:text-dark-text">
              {reply.author_username}
            </span>
            {reply.author_reputation > 0 && (
              <span className="badge-rep text-[10px]">⭐ {reply.author_reputation}</span>
            )}
            <span className="text-xs text-text-secondary dark:text-gray-400">{timeAgo}</span>
          </div>

          {/* Body */}
          <p className="text-sm text-text-primary dark:text-dark-text leading-relaxed whitespace-pre-wrap break-words">
            {reply.body}
          </p>

          {/* Action row */}
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            <VoteButton
              replyId={reply.id}
              initialCount={reply.upvotes}
              initialVoted={reply.user_has_voted}
              size="sm"
            />

            {user && depth < maxDepth && (
              <button
                onClick={() => setReplying((r) => !r)}
                className="btn-ghost btn btn-sm gap-1 text-xs"
              >
                <CornerDownRight className="w-3 h-3" />
                {replying ? 'Cancel' : 'Reply'}
              </button>
            )}

            {hasChildren && (
              <button
                onClick={() => setCollapsed((c) => !c)}
                className="btn-ghost btn btn-sm gap-1 text-xs"
              >
                {collapsed
                  ? <><ChevronDown className="w-3 h-3" /> Show {reply.children.length}</>
                  : <><ChevronUp className="w-3 h-3" /> Hide</>
                }
              </button>
            )}

            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn-ghost btn btn-sm gap-1 text-xs text-error hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                {deleting
                  ? <span className="spinner w-3 h-3" />
                  : <Trash2 className="w-3 h-3" />
                }
                Delete
              </button>
            )}

            {user && !isAuthor && (
              <button
                onClick={() => setReporting(true)}
                className="btn-ghost btn btn-sm gap-1 text-xs"
              >
                <Flag className="w-3 h-3" />
                Report
              </button>
            )}
          </div>

          {replying && (
            <ReplyComposer
              postId={postId}
              parentId={reply.id}
              onSubmitted={(newReply) => {
                onNewReply(reply.id, newReply)
                setReplying(false)
              }}
              onCancel={() => setReplying(false)}
            />
          )}
        </div>
      </div>

      {/* Nested children */}
      {!collapsed && hasChildren && (
        <div className="flex flex-col gap-3 mt-2 border-l-2 border-border dark:border-gray-700 pl-4 sm:pl-6">
          {reply.children.map((child) => (
            <ReplyItem
              key={child.id}
              reply={child}
              postId={postId}
              communityOwnerId={communityOwnerId}
              depth={depth + 1}
              onDelete={onDelete}
              onNewReply={onNewReply}
            />
          ))}
        </div>
      )}

      {reporting && (
        <ReportModal replyId={reply.id} onClose={() => setReporting(false)} />
      )}
    </div>
  )
}

// ─── Tree builder ─────────────────────────────────────────────────────────────
function buildTree(flat: ReplyWithChildren[]): ReplyWithChildren[] {
  const map = new Map<string, ReplyWithChildren>()
  const roots: ReplyWithChildren[] = []

  flat.forEach((r) => map.set(r.id, { ...r, children: [] }))

  map.forEach((reply) => {
    if (reply.parent_id && map.has(reply.parent_id)) {
      map.get(reply.parent_id)!.children.push(reply)
    } else {
      roots.push(reply)
    }
  })

  return roots
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function CommentList({
  postId,
  replies,
  communityOwnerId,
  onRepliesChange,
}: CommentListProps) {
  const { user, profile } = useAuth()
  const [showTopComposer, setShowTopComposer] = useState(false)

  const tree = buildTree(replies)

  const handleDelete = useCallback(
    (replyId: string) => {
      onRepliesChange(replies.filter((r) => r.id !== replyId))
    },
    [replies, onRepliesChange]
  )

  const handleNewReply = useCallback(
    (parentId: string | null, newReply: ReplyWithChildren) => {
      onRepliesChange([...replies, { ...newReply, parent_id: parentId }])
    },
    [replies, onRepliesChange]
  )

  const handleTopSubmit = useCallback(
    (newReply: ReplyWithChildren) => {
      handleNewReply(null, newReply)
      setShowTopComposer(false)
    },
    [handleNewReply]
  )

  // Current user's avatar config for the composer strip
  const myAvatarConfig = (profile?.avatar_config as AvatarConfig | null) ?? null
  const myRep = profile?.reputation ?? 0

  return (
    <section aria-label="Replies and comments">
      {/* ── Header + add reply button ─────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">
          {replies.length === 0
            ? 'No replies yet'
            : `${replies.length} ${replies.length === 1 ? 'Reply' : 'Replies'}`}
        </h2>
        {user && !showTopComposer && (
          <button
            onClick={() => setShowTopComposer(true)}
            className="btn btn-primary btn-sm"
          >
            + Add reply
          </button>
        )}
      </div>

      {/* ── Top-level composer ────────────────────────────────────────────── */}
      {user && showTopComposer && (
        <div className="card p-4 mb-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <AvatarRenderer
              config={myAvatarConfig}
              rep={myRep}
              size={28}
              alt={profile?.username ?? 'You'}
            />
            <span className="text-sm font-medium text-text-primary dark:text-dark-text">
              {profile?.username}
            </span>
          </div>
          <ReplyComposer
            postId={postId}
            parentId={null}
            onSubmitted={handleTopSubmit}
            onCancel={() => setShowTopComposer(false)}
          />
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {tree.length === 0 && !showTopComposer && (
        <div className="empty-state">
          <span className="text-4xl">💬</span>
          <p className="font-medium">Be the first to reply!</p>
          {user
            ? <p className="text-sm">Click "Add reply" to share your answer or thoughts.</p>
            : <p className="text-sm">Sign in to join the discussion.</p>
          }
        </div>
      )}

      {/* ── Reply tree ────────────────────────────────────────────────────── */}
      {tree.length > 0 && (
        <div className="flex flex-col gap-4">
          {tree.map((reply) => (
            <div key={reply.id} className="card p-4">
              <ReplyItem
                reply={reply}
                postId={postId}
                communityOwnerId={communityOwnerId}
                depth={0}
                onDelete={handleDelete}
                onNewReply={handleNewReply}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function CommentListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-4 flex gap-2.5">
          <div className="skeleton w-7 h-7 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-1/4 rounded" />
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-3/4 rounded" />
            <div className="flex gap-2 mt-1">
              <div className="skeleton h-5 w-12 rounded" />
              <div className="skeleton h-5 w-12 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
