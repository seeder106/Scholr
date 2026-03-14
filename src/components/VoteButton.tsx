import { useState, useCallback } from 'react'
import { ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// ─── Props ────────────────────────────────────────────────────────────────────
interface VoteButtonProps {
  replyId: string
  /** Current total upvotes on the reply */
  initialCount: number
  /** Whether the current user has already voted */
  initialVoted: boolean
  /** Optional callback after a successful vote change */
  onChange?: (newCount: number, voted: boolean) => void
  /** Display orientation */
  orientation?: 'horizontal' | 'vertical'
  size?: 'sm' | 'md'
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function VoteButton({
  replyId,
  initialCount,
  initialVoted,
  onChange,
  orientation = 'horizontal',
  size = 'sm',
}: VoteButtonProps) {
  const { user } = useAuth()

  // ── Optimistic state ────────────────────────────────────────────────────────
  const [voted, setVoted]   = useState(initialVoted)
  const [count, setCount]   = useState(initialCount)
  const [loading, setLoading] = useState(false)

  // ── Toggle vote ─────────────────────────────────────────────────────────────
  const handleVote = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation() // prevent PostCard click-through

      if (!user) {
        toast.error('Sign in to upvote answers')
        return
      }
      if (loading) return

      // Optimistic update
      const nextVoted = !voted
      const nextCount = nextVoted ? count + 1 : Math.max(count - 1, 0)
      setVoted(nextVoted)
      setCount(nextCount)
      setLoading(true)

      try {
        if (nextVoted) {
          // Insert vote
          const { error } = await supabase
            .from('votes')
            .insert({ reply_id: replyId, user_id: user.id, value: 1 })

          if (error) {
            // Duplicate vote — already voted somehow, just sync state
            if (error.code === '23505') {
              setVoted(true)
              setCount(count)
              onChange?.(count, true)
              return
            }
            throw error
          }
        } else {
          // Delete vote
          const { error } = await supabase
            .from('votes')
            .delete()
            .eq('reply_id', replyId)
            .eq('user_id', user.id)

          if (error) throw error
        }

        onChange?.(nextCount, nextVoted)
      } catch (err) {
        // Roll back optimistic update on error
        setVoted(voted)
        setCount(count)
        console.error('[VoteButton] vote error:', err)
        toast.error('Failed to register vote')
      } finally {
        setLoading(false)
      }
    },
    [user, loading, voted, count, replyId, onChange]
  )

  // ── Styles ──────────────────────────────────────────────────────────────────
  const iconSize  = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  const countSize = size === 'sm' ? 'text-xs' : 'text-sm'

  const btnClass = clsx(
    'vote-btn select-none transition-all duration-150',
    voted && 'vote-btn-active',
    loading && 'opacity-60 cursor-wait',
    !user && 'cursor-default',
    orientation === 'vertical' && 'flex-col gap-0.5 py-1.5 px-2',
  )

  return (
    <button
      onClick={handleVote}
      disabled={loading}
      aria-pressed={voted}
      aria-label={voted ? 'Remove upvote' : 'Upvote this answer'}
      title={!user ? 'Sign in to upvote' : voted ? 'Remove upvote' : 'Upvote'}
      className={btnClass}
    >
      <ChevronUp
        className={clsx(
          iconSize,
          'transition-transform duration-150',
          voted && 'scale-110'
        )}
      />
      <span className={clsx(countSize, 'font-semibold tabular-nums')}>
        {count}
      </span>
    </button>
  )
}
