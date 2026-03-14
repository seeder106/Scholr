// ============================================================
// SCHOLR — Avatar Item Definitions
// Single source of truth for all avatar customisation options.
// All components read from here — edit here to add/remove items.
// ============================================================

// ─── Core config type ─────────────────────────────────────────────────────────
export interface AvatarConfig {
  skin:      string        // skin tone id e.g. "s1"
  hair:      string        // hair colour id e.g. "h2"
  outfit:    string        // outfit id e.g. "o0"
  accessory: string | null // accessory id or null
}

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  skin:      's1',
  hair:      'h1',
  outfit:    'o0',
  accessory: null,
}

// ─── Item base type ───────────────────────────────────────────────────────────
export interface AvatarItem {
  id:     string
  label:  string
  minRep: number   // reputation required to unlock
}

// ─── Skin tones ───────────────────────────────────────────────────────────────
export interface SkinTone extends AvatarItem {
  color: string   // hex fill for head/neck/hands
}

export const SKIN_TONES: SkinTone[] = [
  { id: 's1', label: 'Light',       color: '#FDDBB4', minRep: 0   },
  { id: 's2', label: 'Light warm',  color: '#F0C08A', minRep: 0   },
  { id: 's3', label: 'Medium',      color: '#E8AC76', minRep: 0   },
  { id: 's4', label: 'Medium deep', color: '#C68642', minRep: 10  },
  { id: 's5', label: 'Deep warm',   color: '#8D5524', minRep: 10  },
  { id: 's6', label: 'Deep',        color: '#4A2912', minRep: 50  },
]

// ─── Hair colours ─────────────────────────────────────────────────────────────
export interface HairColor extends AvatarItem {
  color: string
}

export const HAIR_COLORS: HairColor[] = [
  { id: 'h1', label: 'Black',       color: '#1A1A1A', minRep: 0    },
  { id: 'h2', label: 'Dark brown',  color: '#4B2E1A', minRep: 0    },
  { id: 'h3', label: 'Brown',       color: '#8B4513', minRep: 0    },
  { id: 'h4', label: 'Blonde',      color: '#D4A017', minRep: 10   },
  { id: 'h5', label: 'Auburn',      color: '#A0522D', minRep: 10   },
  { id: 'h6', label: 'Red',         color: '#CC3300', minRep: 10   },
  { id: 'h7', label: 'Silver',      color: '#A9A9A9', minRep: 50   },
  { id: 'h8', label: 'White',       color: '#E8E8E8', minRep: 50   },
  { id: 'h9', label: 'Purple',      color: '#7B2FBE', minRep: 100  },
  { id: 'h10',label: 'Blue',        color: '#1A4FC4', minRep: 100  },
  { id: 'h11',label: 'Teal',        color: '#008B8B', minRep: 250  },
  { id: 'h12',label: 'Pink',        color: '#E75480', minRep: 250  },
  { id: 'h13',label: 'Gold',        color: '#FFD700', minRep: 500  },
  { id: 'h14',label: 'Rainbow',     color: '#FF4500', minRep: 1000 },
]

// ─── Outfits ──────────────────────────────────────────────────────────────────
export interface Outfit extends AvatarItem {
  emoji:      string   // shown in picker grid
  bodyColor:  string   // main torso fill
  collarColor?: string // optional collar/detail colour
}

export const OUTFITS: Outfit[] = [
  {
    id: 'o0', label: 'Basic tee',       emoji: '👕', minRep: 0,
    bodyColor: '#6B9EFF',
  },
  {
    id: 'o1', label: 'Hoodie',          emoji: '🧥', minRep: 10,
    bodyColor: '#555965', collarColor: '#444',
  },
  {
    id: 'o2', label: 'Collared shirt',  emoji: '👔', minRep: 50,
    bodyColor: '#FFFFFF', collarColor: '#3A7BD5',
  },
  {
    id: 'o3', label: 'Lab coat',        emoji: '🥼', minRep: 100,
    bodyColor: '#F0F0F0', collarColor: '#CCCCCC',
  },
  {
    id: 'o4', label: 'Graduation gown', emoji: '🎓', minRep: 250,
    bodyColor: '#2C2C54', collarColor: '#FFD700',
  },
  {
    id: 'o5', label: 'Wizard robe',     emoji: '🧙', minRep: 500,
    bodyColor: '#4B0082', collarColor: '#9370DB',
  },
  {
    id: 'o6', label: 'Champion jersey', emoji: '🏆', minRep: 1000,
    bodyColor: '#B8860B', collarColor: '#FFD700',
  },
]

// ─── Accessories ──────────────────────────────────────────────────────────────
export type AccessoryCategory = 'face' | 'head' | 'neck' | 'effect'

export interface Accessory extends AvatarItem {
  emoji:    string
  category: AccessoryCategory
}

export const ACCESSORIES: Accessory[] = [
  // Face
  { id: 'a0',  label: 'Glasses',         emoji: '👓', category: 'face', minRep: 0    },
  { id: 'a1',  label: 'Sunglasses',      emoji: '🕶️', category: 'face', minRep: 10   },
  { id: 'a2',  label: 'Monocle',         emoji: '🧐', category: 'face', minRep: 50   },
  // Head
  { id: 'a3',  label: 'Headphones',      emoji: '🎧', category: 'head', minRep: 50   },
  { id: 'a4',  label: 'Graduation cap',  emoji: '🎓', category: 'head', minRep: 100  },
  { id: 'a5',  label: 'Crown',           emoji: '👑', category: 'head', minRep: 250  },
  { id: 'a6',  label: 'Wizard hat',      emoji: '🧙', category: 'head', minRep: 500  },
  // Neck
  { id: 'a7',  label: 'Gold chain',      emoji: '📿', category: 'neck', minRep: 100  },
  { id: 'a8',  label: 'Diamond chain',   emoji: '💎', category: 'neck', minRep: 500  },
  // Effect
  { id: 'a9',  label: 'Lightning aura',  emoji: '⚡', category: 'effect', minRep: 1000 },
]

// ─── Reputation tiers ─────────────────────────────────────────────────────────
export interface RepTier {
  min:   number
  label: string
  emoji: string
  color: string   // tailwind-compatible hex for UI
}

export const REP_TIERS: RepTier[] = [
  { min: 0,    label: 'Newcomer',    emoji: '👋', color: '#6B7280' },
  { min: 10,   label: 'Active',      emoji: '🌱', color: '#16A34A' },
  { min: 100,  label: 'Contributor', emoji: '⭐', color: '#CA8A04' },
  { min: 500,  label: 'Advanced',    emoji: '💎', color: '#2563EB' },
  { min: 1000, label: 'Expert',      emoji: '🏆', color: '#7C3AED' },
]

// ─── Helper functions ─────────────────────────────────────────────────────────

/** Get the current rep tier for a given reputation score */
export function getRepTier(rep: number): RepTier {
  let current = REP_TIERS[0]
  for (const tier of REP_TIERS) {
    if (rep >= tier.min) current = tier
  }
  return current
}

/** Get the next tier above the current one, or null if already at max */
export function getNextTier(rep: number): RepTier | null {
  const idx = REP_TIERS.findIndex((t) => t.min > rep)
  return idx === -1 ? null : REP_TIERS[idx]
}

/** Check if a specific item is unlocked for a given rep score */
export function isUnlocked(item: AvatarItem, rep: number): boolean {
  return rep >= item.minRep
}

/** Get all items unlocked at or below a given rep score */
export function unlockedItems<T extends AvatarItem>(items: T[], rep: number): T[] {
  return items.filter((i) => isUnlocked(i, rep))
}

/** Get the next item to unlock in a list (first locked item) */
export function nextUnlock<T extends AvatarItem>(items: T[], rep: number): T | null {
  return items.find((i) => !isUnlocked(i, rep)) ?? null
}

/** Validate and sanitise an avatar config against the current rep.
 *  Returns a safe config where all selected items are within rep budget. */
export function sanitiseConfig(config: Partial<AvatarConfig>, rep: number): AvatarConfig {
  const skin    = SKIN_TONES.find((s) => s.id === config.skin && isUnlocked(s, rep))
  const hair    = HAIR_COLORS.find((h) => h.id === config.hair && isUnlocked(h, rep))
  const outfit  = OUTFITS.find((o) => o.id === config.outfit && isUnlocked(o, rep))
  const acc     = config.accessory
    ? ACCESSORIES.find((a) => a.id === config.accessory && isUnlocked(a, rep)) ?? null
    : null

  return {
    skin:      skin?.id      ?? DEFAULT_AVATAR_CONFIG.skin,
    hair:      hair?.id      ?? DEFAULT_AVATAR_CONFIG.hair,
    outfit:    outfit?.id    ?? DEFAULT_AVATAR_CONFIG.outfit,
    accessory: acc?.id       ?? null,
  }
}

/** How many rep points until the next unlock across all item categories */
export function repToNextUnlock(rep: number): number | null {
  const allItems: AvatarItem[] = [
    ...SKIN_TONES,
    ...HAIR_COLORS,
    ...OUTFITS,
    ...ACCESSORIES,
  ]
  const locked = allItems.filter((i) => !isUnlocked(i, rep))
  if (locked.length === 0) return null
  return Math.min(...locked.map((i) => i.minRep)) - rep
}
