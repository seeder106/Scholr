import type { Database } from './database'

// ─── Avatar config — re-exported from avatarItems for convenience ─────────────
// Components can import AvatarConfig from either @/types or @/data/avatarItems
export type { AvatarConfig } from '@/data/avatarItems'
export { DEFAULT_AVATAR_CONFIG, sanitiseConfig } from '@/data/avatarItems'

// ─── Raw DB row aliases ────────────────────────────────────────────────────────
export type ProfileRow        = Database['public']['Tables']['profiles']['Row']
export type CommunityRow      = Database['public']['Tables']['communities']['Row']
export type CommunityMemberRow = Database['public']['Tables']['community_members']['Row']
export type PostRow           = Database['public']['Tables']['posts']['Row']
export type ReplyRow          = Database['public']['Tables']['replies']['Row']
export type VoteRow           = Database['public']['Tables']['votes']['Row']
export type ReportRow         = Database['public']['Tables']['reports']['Row']

// ─── View row aliases (include joined author fields) ──────────────────────────
export type PostWithAuthor   = Database['public']['Views']['posts_with_authors']['Row']
export type ReplyWithAuthor  = Database['public']['Views']['replies_with_authors']['Row']

// ─── Extended / enriched types used in the UI ────────────────────────────────

/** Community with an optional flag showing if the current user is a member */
export interface CommunityWithMembership extends CommunityRow {
  is_member?: boolean
  member_role?: CommunityMemberRow['role'] | null
}

/** Reply enriched with nested children and user's vote state */
export interface ReplyWithChildren extends ReplyWithAuthor {
  children: ReplyWithChildren[]
  user_has_voted: boolean
  author_avatar_config?: {
    skin: string
    hair: string
    outfit: string
    accessory: string | null
  } | null
}

/** Post enriched with author info + user vote state */
export interface PostWithMeta extends PostWithAuthor {
  user_has_voted?: boolean
}

// ─── Preset avatars ───────────────────────────────────────────────────────────
export interface PresetAvatar {
  key: string     // used as avatar_url value when no upload
  label: string
  emoji: string   // rendered as the avatar image
}

export const PRESET_AVATARS: PresetAvatar[] = [
  { key: 'preset:owl',      label: 'Owl',      emoji: '🦉' },
  { key: 'preset:rocket',   label: 'Rocket',   emoji: '🚀' },
  { key: 'preset:book',     label: 'Book',     emoji: '📚' },
  { key: 'preset:atom',     label: 'Atom',     emoji: '⚛️' },
  { key: 'preset:bulb',     label: 'Bulb',     emoji: '💡' },
  { key: 'preset:star',     label: 'Star',     emoji: '⭐' },
  { key: 'preset:globe',    label: 'Globe',    emoji: '🌍' },
  { key: 'preset:pen',      label: 'Pen',      emoji: '✏️' },
]

/**
 * Resolve an avatar_url to what should be rendered.
 *
 * Priority order:
 *  1. 'custom'  — user has an avatar_config → use AvatarRenderer (caller handles)
 *  2. 'image'   — user uploaded a photo → render as <img>
 *  3. 'preset'  — user chose an emoji preset → render emoji
 *  4. 'default' — nothing set → render initials fallback
 *
 * NOTE: callers that receive type='custom' should render <AvatarRenderer>
 * instead of this function's value. Pass avatar_config from the profile row.
 */
export function resolveAvatar(
  avatarUrl: string | null | undefined,
  hasAvatarConfig?: boolean
): {
  type: 'custom' | 'image' | 'preset' | 'default'
  value: string
} {
  // Custom SVG avatar takes highest priority when config exists
  if (hasAvatarConfig) {
    return { type: 'custom', value: '' }
  }
  if (!avatarUrl) {
    return { type: 'default', value: '' }
  }
  if (avatarUrl.startsWith('preset:')) {
    const found = PRESET_AVATARS.find((p) => p.key === avatarUrl)
    return { type: 'preset', value: found?.emoji ?? '🎓' }
  }
  return { type: 'image', value: avatarUrl }
}

// ─── Auth types ───────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string
  email: string | undefined
  profile: ProfileRow | null
}

// ─── Form / UI state helpers ─────────────────────────────────────────────────
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface ApiError {
  message: string
  code?: string
}

// ─── Search ───────────────────────────────────────────────────────────────────
export interface SearchResult {
  id: string
  title: string
  body: string | null
  created_at: string
  author_username: string
  reply_count: number
  upvotes: number
}

// ─── Report reasons ───────────────────────────────────────────────────────────
export const REPORT_REASONS = [
  'Spam or advertising',
  'Harassment or bullying',
  'Misinformation',
  'Off-topic',
  'Inappropriate content',
  'Other',
] as const

export type ReportReason = typeof REPORT_REASONS[number]
