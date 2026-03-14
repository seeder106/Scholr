import { useNavigate } from 'react-router-dom'
import { Users, Lock, ArrowRight } from 'lucide-react'
import type { CommunityWithMembership } from '@/types'
import clsx from 'clsx'

interface CommunityCardProps {
  community: CommunityWithMembership
  onJoin?: (communityId: string) => Promise<void>
  onLeave?: (communityId: string) => Promise<void>
  joining?: boolean
}

// ─── Community icon ───────────────────────────────────────────────────────────
function CommunityIcon({
  iconUrl,
  name,
  size = 'md',
}: {
  iconUrl: string | null | undefined
  name: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClass = {
    sm: 'w-9 h-9 text-base',
    md: 'w-12 h-12 text-xl',
    lg: 'w-16 h-16 text-3xl',
  }[size]

  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt={name}
        className={clsx('rounded-xl object-cover shrink-0', sizeClass)}
      />
    )
  }

  // Deterministic colour from name
  const colours = [
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-violet-100 text-violet-700',
    'bg-orange-100 text-orange-700',
    'bg-pink-100 text-pink-700',
    'bg-cyan-100 text-cyan-700',
  ]
  const idx = name.charCodeAt(0) % colours.length

  return (
    <div
      className={clsx(
        'rounded-xl shrink-0 flex items-center justify-center font-bold select-none',
        sizeClass,
        colours[idx]
      )}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CommunityCard({
  community,
  onJoin,
  onLeave,
  joining = false,
}: CommunityCardProps) {
  const navigate = useNavigate()
  const isMember = community.is_member ?? false
  const isOwner  = community.member_role === 'owner'

  const handleEnter = () => navigate(`/c/${community.id}`)

  const handleJoinLeave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isMember && onLeave) {
      await onLeave(community.id)
    } else if (!isMember && onJoin) {
      await onJoin(community.id)
    }
  }

  return (
    <article
      onClick={isMember ? handleEnter : undefined}
      className={clsx(
        'card-hover p-4 flex flex-col gap-3 animate-fade-in',
        isMember && 'cursor-pointer'
      )}
      role={isMember ? 'button' : undefined}
      tabIndex={isMember ? 0 : undefined}
      onKeyDown={(e) => {
        if (isMember && (e.key === 'Enter' || e.key === ' ')) handleEnter()
      }}
      aria-label={`${community.name} community`}
    >
      {/* ── Header row ─────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <CommunityIcon iconUrl={community.icon_url} name={community.name} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-semibold text-text-primary dark:text-dark-text text-base leading-tight truncate">
              {community.name}
            </h3>
            {community.is_private && (
              <Lock className="w-3.5 h-3.5 text-text-secondary shrink-0" aria-label="Private community" />
            )}
            {isOwner && (
              <span className="badge-primary text-[10px]">Owner</span>
            )}
          </div>

          <p className="text-xs text-text-secondary dark:text-gray-400 mt-0.5 flex items-center gap-1">
            <Users className="w-3 h-3" />
            {community.member_count.toLocaleString()}
            {community.member_count === 1 ? ' member' : ' members'}
          </p>
        </div>
      </div>

      {/* ── Description ────────────────────────────────────────────────────── */}
      {community.description && (
        <p className="text-sm text-text-secondary dark:text-gray-400 line-clamp-2 leading-relaxed">
          {community.description}
        </p>
      )}

      {/* ── Footer actions ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 pt-1 mt-auto">
        {isMember ? (
          <>
            <button
              onClick={handleEnter}
              className="btn btn-primary btn-sm flex-1"
            >
              Enter
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            {!isOwner && (
              <button
                onClick={handleJoinLeave}
                disabled={joining}
                className="btn btn-secondary btn-sm"
              >
                {joining ? <span className="spinner w-3.5 h-3.5" /> : 'Leave'}
              </button>
            )}
          </>
        ) : (
          <button
            onClick={handleJoinLeave}
            disabled={joining}
            className="btn btn-primary btn-sm flex-1"
          >
            {joining
              ? <><span className="spinner w-3.5 h-3.5" /> Joining…</>
              : 'Join community'
            }
          </button>
        )}
      </div>
    </article>
  )
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
export function CommunityCardSkeleton() {
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="skeleton w-12 h-12 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-2/3 rounded" />
          <div className="skeleton h-3 w-1/3 rounded" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-4/5 rounded" />
      </div>
      <div className="skeleton h-8 w-full rounded mt-1" />
    </div>
  )
}
