import { useState, useRef } from 'react'
import { Send, ChevronDown, ChevronUp, PenLine } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { resolveAvatar } from '@/types'
import type { PostWithAuthor } from '@/types'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// ─── Props ────────────────────────────────────────────────────────────────────
interface PostComposerProps {
  communityId: string
  onPostCreated: (post: PostWithAuthor) => void
}

// ─── Character limits ─────────────────────────────────────────────────────────
const TITLE_MAX = 200
const BODY_MAX  = 5000

// ─── Component ────────────────────────────────────────────────────────────────
export default function PostComposer({ communityId, onPostCreated }: PostComposerProps) {
  const { user, profile } = useAuth()

  const [expanded, setExpanded]   = useState(false)
  const [title, setTitle]         = useState('')
  const [body, setBody]           = useState('')
  const [submitting, setSubmitting] = useState(false)

  const titleRef = useRef<HTMLInputElement>(null)

  // ── Expand on click ─────────────────────────────────────────────────────────
  const handleExpand = () => {
    setExpanded(true)
    setTimeout(() => titleRef.current?.focus(), 50)
  }

  // ── Collapse + reset ────────────────────────────────────────────────────────
  const handleCollapse = () => {
    if (title || body) {
      if (!window.confirm('Discard this post?')) return
    }
    setExpanded(false)
    setTitle('')
    setBody('')
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) return

    const trimmedTitle = title.trim()
    const trimmedBody  = body.trim()

    if (!trimmedTitle) {
      toast.error('A title is required')
      titleRef.current?.focus()
      return
    }
    if (trimmedTitle.length > TITLE_MAX) {
      toast.error(`Title must be ${TITLE_MAX} characters or fewer`)
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          community_id: communityId,
          author_id: user.id,
          title: trimmedTitle,
          body: trimmedBody || null,
        })
        .select(`
          *,
          author_username:profiles!author_id(username),
          author_avatar:profiles!author_id(avatar_url),
          author_reputation:profiles!author_id(reputation)
        `)
        .single()

      if (error) throw error

      // Flatten the joined profile fields from Supabase's nested shape
      const raw = data as Record<string, unknown>
      const authorUsername   = (raw.author_username as { username: string } | null)?.username ?? profile.username
      const authorAvatar     = (raw.author_avatar as { avatar_url: string | null } | null)?.avatar_url ?? profile.avatar_url
      const authorReputation = (raw.author_reputation as { reputation: number } | null)?.reputation ?? profile.reputation

      const newPost: PostWithAuthor = {
        id:               raw.id as string,
        community_id:     raw.community_id as string,
        author_id:        raw.author_id as string,
        title:            raw.title as string,
        body:             raw.body as string | null,
        upvotes:          raw.upvotes as number,
        reply_count:      raw.reply_count as number,
        is_deleted:       raw.is_deleted as boolean,
        created_at:       raw.created_at as string,
        updated_at:       raw.updated_at as string,
        author_username:  authorUsername,
        author_avatar:    authorAvatar ?? null,
        author_reputation: authorReputation,
      }

      onPostCreated(newPost)
      toast.success('Post published!')
      setTitle('')
      setBody('')
      setExpanded(false)
    } catch (err) {
      console.error('[PostComposer] submit error:', err)
      toast.error('Failed to publish post. Are you a member of this community?')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Avatar ──────────────────────────────────────────────────────────────────
  const resolved = resolveAvatar(profile?.avatar_url)
  const avatarEl = resolved.type === 'image'
    ? <img src={resolved.value} alt={profile?.username ?? ''} className="avatar avatar-sm shrink-0" />
    : resolved.type === 'preset'
    ? <span className="avatar-emoji avatar-sm text-sm shrink-0">{resolved.value}</span>
    : <span className="avatar-emoji avatar-sm text-xs font-semibold text-primary shrink-0">
        {(profile?.username ?? 'U').slice(0, 2).toUpperCase()}
      </span>

  // ── Collapsed trigger ───────────────────────────────────────────────────────
  if (!expanded) {
    return (
      <div
        onClick={handleExpand}
        className="card flex items-center gap-3 p-3 cursor-text group hover:shadow-card-hover transition-shadow"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleExpand() }}
        aria-label="Create a new post"
      >
        {avatarEl}
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-full bg-background dark:bg-dark-bg border border-border dark:border-gray-600 group-hover:border-primary transition-colors">
          <PenLine className="w-3.5 h-3.5 text-text-secondary" />
          <span className="text-sm text-text-secondary dark:text-gray-400">
            Ask a question or share something…
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
      </div>
    )
  }

  // ── Expanded composer ───────────────────────────────────────────────────────
  return (
    <form
      onSubmit={handleSubmit}
      className="card p-4 flex flex-col gap-3 animate-fade-in"
      noValidate
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {avatarEl}
          <span className="text-sm font-medium text-text-primary dark:text-dark-text">
            {profile?.username ?? 'You'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCollapse}
          className="btn-ghost btn btn-sm w-7 h-7 p-0 rounded-full"
          aria-label="Collapse post composer"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      <div className="divider my-0" />

      {/* Title */}
      <div>
        <label htmlFor="post-title" className="label">
          Title <span className="text-error">*</span>
        </label>
        <input
          id="post-title"
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={TITLE_MAX}
          placeholder="What's your question or topic?"
          className={clsx(
            'input',
            title.length > TITLE_MAX && 'input-error'
          )}
          disabled={submitting}
          required
        />
        <div className="flex justify-end mt-0.5">
          <span
            className={clsx(
              'text-xs tabular-nums',
              title.length > TITLE_MAX * 0.9
                ? title.length > TITLE_MAX ? 'text-error' : 'text-warning'
                : 'text-text-secondary dark:text-gray-500'
            )}
          >
            {title.length}/{TITLE_MAX}
          </span>
        </div>
      </div>

      {/* Body */}
      <div>
        <label htmlFor="post-body" className="label">
          Details{' '}
          <span className="text-text-secondary font-normal">(optional)</span>
        </label>
        <textarea
          id="post-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={BODY_MAX}
          rows={4}
          placeholder="Add context, background, or the full question…"
          className={clsx(
            'textarea',
            body.length > BODY_MAX && 'input-error'
          )}
          disabled={submitting}
        />
        <div className="flex justify-end mt-0.5">
          <span
            className={clsx(
              'text-xs tabular-nums',
              body.length > BODY_MAX * 0.9
                ? body.length > BODY_MAX ? 'text-error' : 'text-warning'
                : 'text-text-secondary dark:text-gray-500'
            )}
          >
            {body.length}/{BODY_MAX}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <p className="text-xs text-text-secondary dark:text-gray-500">
          Be respectful and stay on topic.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCollapse}
            disabled={submitting}
            className="btn btn-secondary btn-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !title.trim() || title.length > TITLE_MAX}
            className="btn btn-primary btn-sm"
          >
            {submitting
              ? <><span className="spinner w-3.5 h-3.5" /> Publishing…</>
              : <><Send className="w-3.5 h-3.5" /> Post</>
            }
          </button>
        </div>
      </div>
    </form>
  )
}
