import { useState, useCallback } from 'react'
import { Lock, ChevronRight, Sparkles } from 'lucide-react'
import {
  SKIN_TONES,
  HAIR_COLORS,
  OUTFITS,
  ACCESSORIES,
  getRepTier,
  getNextTier,
  nextUnlock,
  isUnlocked,
  repToNextUnlock,
  type AvatarConfig,
  type AvatarItem,
} from '@/data/avatarItems'
import AvatarRenderer, { AvatarXl } from './AvatarRenderer'
import clsx from 'clsx'

// ─── Props ────────────────────────────────────────────────────────────────────
interface AvatarBuilderProps {
  config:    AvatarConfig
  rep:       number
  onChange:  (newConfig: AvatarConfig) => void
}

// ─── Tab definitions ──────────────────────────────────────────────────────────
type TabId = 'skin' | 'hair' | 'outfit' | 'accessory'

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: 'skin',      label: 'Skin',        emoji: '🎨' },
  { id: 'hair',      label: 'Hair',        emoji: '💇' },
  { id: 'outfit',    label: 'Outfit',      emoji: '👕' },
  { id: 'accessory', label: 'Accessories', emoji: '✨' },
]

// ─── Rep progress bar ─────────────────────────────────────────────────────────
function RepProgress({ rep }: { rep: number }) {
  const tier     = getRepTier(rep)
  const nextTier = getNextTier(rep)
  const toNext   = repToNextUnlock(rep)

  const progress = nextTier
    ? Math.min(100, ((rep - tier.min) / (nextTier.min - tier.min)) * 100)
    : 100

  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-border dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{tier.emoji}</span>
          <span className="text-sm font-semibold text-text-primary dark:text-dark-text">
            {tier.label}
          </span>
        </div>
        <span className="text-xs font-mono font-medium text-text-secondary dark:text-gray-400">
          {rep.toLocaleString()} rep
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary dark:bg-dark-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {nextTier ? (
        <p className="text-xs text-text-secondary dark:text-gray-400">
          {toNext !== null && toNext > 0
            ? <><span className="font-medium text-primary dark:text-dark-primary">{toNext} more rep</span> to unlock new items</>
            : 'Keep earning rep to unlock more!'
          }
        </p>
      ) : (
        <p className="text-xs text-secondary font-medium">
          🏆 All items unlocked — you're an Expert!
        </p>
      )}
    </div>
  )
}

// ─── Skin swatch ──────────────────────────────────────────────────────────────
function SkinSwatch({
  tone,
  active,
  locked,
  onSelect,
}: {
  tone: typeof SKIN_TONES[0]
  active: boolean
  locked: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={locked ? undefined : onSelect}
      disabled={locked}
      title={locked ? `Unlocks at ${tone.minRep} rep` : tone.label}
      aria-label={tone.label}
      aria-pressed={active}
      className={clsx(
        'relative w-10 h-10 rounded-full border-2 transition-all duration-150',
        'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
        active  && 'border-primary dark:border-dark-primary scale-110 shadow-md',
        !active && !locked && 'border-transparent hover:border-gray-400 hover:scale-105',
        locked  && 'border-transparent opacity-40 cursor-not-allowed grayscale'
      )}
      style={{ background: tone.color }}
    >
      {locked && (
        <span className="absolute -bottom-0.5 -right-0.5 bg-white dark:bg-dark-card rounded-full p-0.5 shadow">
          <Lock className="w-2.5 h-2.5 text-text-secondary" />
        </span>
      )}
      {active && !locked && (
        <span className="absolute inset-0 rounded-full flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
        </span>
      )}
    </button>
  )
}

// ─── Hair colour swatch ───────────────────────────────────────────────────────
function HairSwatch({
  hair,
  active,
  locked,
  onSelect,
}: {
  hair: typeof HAIR_COLORS[0]
  active: boolean
  locked: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={locked ? undefined : onSelect}
      disabled={locked}
      title={locked ? `Unlocks at ${hair.minRep} rep` : hair.label}
      aria-label={hair.label}
      aria-pressed={active}
      className={clsx(
        'relative w-8 h-8 rounded-full border-2 transition-all duration-150',
        active  && 'border-primary dark:border-dark-primary scale-110 shadow-md',
        !active && !locked && 'border-transparent hover:border-gray-400 hover:scale-105',
        locked  && 'border-transparent opacity-35 cursor-not-allowed grayscale'
      )}
      style={{ background: hair.color }}
    >
      {locked && (
        <span className="absolute -bottom-0.5 -right-0.5 bg-white dark:bg-dark-card rounded-full p-0.5 shadow">
          <Lock className="w-2 h-2 text-text-secondary" />
        </span>
      )}
    </button>
  )
}

// ─── Item card (outfits + accessories) ────────────────────────────────────────
function ItemCard({
  item,
  emoji,
  active,
  locked,
  toggleable,
  onSelect,
}: {
  item: AvatarItem
  emoji: string
  active: boolean
  locked: boolean
  toggleable?: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={locked ? undefined : onSelect}
      disabled={locked}
      title={locked ? `Unlocks at ${item.minRep} rep` : item.label}
      aria-label={item.label}
      aria-pressed={active}
      className={clsx(
        'relative flex flex-col items-center gap-1 p-2 rounded-lg border transition-all duration-150',
        'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
        active  && 'border-primary dark:border-dark-primary bg-blue-50 dark:bg-blue-900/20',
        !active && !locked && [
          'border-border dark:border-gray-700 bg-gray-50 dark:bg-gray-800',
          'hover:border-primary/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10',
        ],
        locked  && 'border-border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-40 cursor-not-allowed grayscale'
      )}
    >
      <span className="text-2xl leading-none" role="img" aria-hidden="true">
        {emoji}
      </span>
      <span className={clsx(
        'text-[10px] font-medium leading-tight text-center truncate w-full',
        active
          ? 'text-primary dark:text-dark-primary'
          : 'text-text-secondary dark:text-gray-400'
      )}>
        {item.label}
      </span>

      {/* Rep badge on locked items */}
      {locked && (
        <span className="absolute -top-1.5 -right-1.5 bg-warning text-white text-[9px] font-bold px-1 py-0.5 rounded-full leading-none">
          {item.minRep}+
        </span>
      )}

      {/* Active check */}
      {active && (
        <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-primary dark:bg-dark-primary rounded-full flex items-center justify-center shadow">
          <svg className="w-2 h-2 text-white" viewBox="0 0 8 8" fill="none">
            <path d="M1 4l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      )}

      {/* Toggle hint for accessories */}
      {active && toggleable && (
        <span className="text-[9px] text-primary dark:text-dark-primary font-medium">tap to remove</span>
      )}
    </button>
  )
}

// ─── Unlock hint ──────────────────────────────────────────────────────────────
function UnlockHint({ item, rep }: { item: AvatarItem | null; rep: number }) {
  if (!item) return null
  const needed = item.minRep - rep
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 mt-2">
      <Sparkles className="w-3.5 h-3.5 text-warning shrink-0" />
      <p className="text-xs text-yellow-800 dark:text-yellow-300">
        Earn <span className="font-semibold">{needed} more rep</span> to unlock {item.label}
      </p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AvatarBuilder({ config, rep, onChange }: AvatarBuilderProps) {
  const [activeTab, setActiveTab] = useState<TabId>('skin')

  const update = useCallback((patch: Partial<AvatarConfig>) => {
    onChange({ ...config, ...patch })
  }, [config, onChange])

  // ── Tab content renderers ────────────────────────────────────────────────────
  const renderSkinTab = () => {
    const nextLocked = nextUnlock(SKIN_TONES, rep)
    return (
      <div className="flex flex-col gap-3">
        <p className="text-xs text-text-secondary dark:text-gray-400">
          Choose your skin tone
        </p>
        <div className="flex flex-wrap gap-3">
          {SKIN_TONES.map((tone) => (
            <SkinSwatch
              key={tone.id}
              tone={tone}
              active={config.skin === tone.id}
              locked={!isUnlocked(tone, rep)}
              onSelect={() => update({ skin: tone.id })}
            />
          ))}
        </div>
        <UnlockHint item={nextLocked} rep={rep} />
      </div>
    )
  }

  const renderHairTab = () => {
    const nextLocked = nextUnlock(HAIR_COLORS, rep)
    return (
      <div className="flex flex-col gap-3">
        <p className="text-xs text-text-secondary dark:text-gray-400">
          Choose your hair colour
        </p>
        <div className="flex flex-wrap gap-2.5">
          {HAIR_COLORS.map((hair) => (
            <HairSwatch
              key={hair.id}
              hair={hair}
              active={config.hair === hair.id}
              locked={!isUnlocked(hair, rep)}
              onSelect={() => update({ hair: hair.id })}
            />
          ))}
        </div>
        <UnlockHint item={nextLocked} rep={rep} />
      </div>
    )
  }

  const renderOutfitTab = () => {
    const nextLocked = nextUnlock(OUTFITS, rep)
    return (
      <div className="flex flex-col gap-3">
        <p className="text-xs text-text-secondary dark:text-gray-400">
          Choose your outfit
        </p>
        <div className="grid grid-cols-4 gap-2">
          {OUTFITS.map((outfit) => (
            <ItemCard
              key={outfit.id}
              item={outfit}
              emoji={outfit.emoji}
              active={config.outfit === outfit.id}
              locked={!isUnlocked(outfit, rep)}
              onSelect={() => update({ outfit: outfit.id })}
            />
          ))}
        </div>
        <UnlockHint item={nextLocked} rep={rep} />
      </div>
    )
  }

  const renderAccessoryTab = () => {
    const nextLocked = nextUnlock(ACCESSORIES, rep)
    const categories: { id: string; label: string }[] = [
      { id: 'face',   label: 'Face'   },
      { id: 'head',   label: 'Head'   },
      { id: 'neck',   label: 'Neck'   },
      { id: 'effect', label: 'Effects'},
    ]

    return (
      <div className="flex flex-col gap-4">
        <p className="text-xs text-text-secondary dark:text-gray-400">
          Pick an accessory — tap again to remove
        </p>
        {categories.map((cat) => {
          const items = ACCESSORIES.filter((a) => a.category === cat.id)
          return (
            <div key={cat.id}>
              <p className="text-xs font-medium text-text-secondary dark:text-gray-400 mb-2 uppercase tracking-wide">
                {cat.label}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {items.map((acc) => (
                  <ItemCard
                    key={acc.id}
                    item={acc}
                    emoji={acc.emoji}
                    active={config.accessory === acc.id}
                    locked={!isUnlocked(acc, rep)}
                    toggleable
                    onSelect={() =>
                      update({ accessory: config.accessory === acc.id ? null : acc.id })
                    }
                  />
                ))}
              </div>
            </div>
          )
        })}
        <UnlockHint item={nextLocked} rep={rep} />
      </div>
    )
  }

  const tabContent: Record<TabId, () => React.ReactNode> = {
    skin:      renderSkinTab,
    hair:      renderHairTab,
    outfit:    renderOutfitTab,
    accessory: renderAccessoryTab,
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Live preview + rep bar ─────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        {/* Avatar preview */}
        <div className="shrink-0 flex flex-col items-center gap-1.5">
          <div className="w-24 h-24 rounded-2xl border-2 border-border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden shadow-sm">
            <AvatarRenderer config={config} rep={rep} size={88} alt="Your avatar preview" />
          </div>
          <span className="text-[11px] text-text-secondary dark:text-gray-400">Preview</span>
        </div>

        {/* Rep progress */}
        <div className="flex-1">
          <RepProgress rep={rep} />
        </div>
      </div>

      {/* ── Category tabs ─────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800">
        {TABS.map((tab) => {
          // Count locked items in this tab to show a hint
          const allItems: AvatarItem[] =
            tab.id === 'skin'      ? SKIN_TONES :
            tab.id === 'hair'      ? HAIR_COLORS :
            tab.id === 'outfit'    ? OUTFITS :
            ACCESSORIES
          const lockedCount = allItems.filter((i) => !isUnlocked(i, rep)).length

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'relative flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-md',
                'text-xs font-medium transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-white dark:bg-dark-card text-primary dark:text-dark-primary shadow-sm'
                  : 'text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-dark-text'
              )}
            >
              <span className="text-base leading-none">{tab.emoji}</span>
              <span className="hidden sm:block">{tab.label}</span>

              {/* Locked items count badge */}
              {lockedCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-warning text-white text-[9px] font-bold flex items-center justify-center leading-none">
                  {lockedCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Tab content ───────────────────────────────────────────────────── */}
      <div className="min-h-[160px] animate-fade-in">
        {tabContent[activeTab]()}
      </div>

    </div>
  )
}
