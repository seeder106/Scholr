import {
  SKIN_TONES,
  HAIR_COLORS,
  OUTFITS,
  ACCESSORIES,
  DEFAULT_AVATAR_CONFIG,
  sanitiseConfig,
  type AvatarConfig,
} from '@/data/avatarItems'

// ─── Props ────────────────────────────────────────────────────────────────────
interface AvatarRendererProps {
  /** The saved avatar config from profiles.avatar_config */
  config:    AvatarConfig | null | undefined
  /** Reputation — used to sanitise config so locked items never show */
  rep?:      number
  /** Display size in px — renders as a square */
  size?:     number
  /** Extra class names on the wrapper */
  className?: string
  /** Alt text for accessibility */
  alt?:      string
}

// ─── Colour helpers ───────────────────────────────────────────────────────────
function darken(hex: string, amount: number): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount)
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount)
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount)
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

function lighten(hex: string, amount: number): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount)
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount)
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount)
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

// ─── SVG layer builders ───────────────────────────────────────────────────────
// Each function returns an array of SVG element strings.
// viewBox is 0 0 160 160 — all coordinates relative to that.

function buildBody(outfitColor: string, collarColor: string): string[] {
  return [
    // Main torso ellipse
    `<ellipse cx="80" cy="148" rx="42" ry="26" fill="${outfitColor}"/>`,
    // Shoulder curve
    `<ellipse cx="80" cy="130" rx="38" ry="14" fill="${outfitColor}"/>`,
    // Collar line
    `<path d="M62 118 Q80 126 98 118" stroke="${collarColor}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
  ]
}

function buildNeck(skinColor: string): string[] {
  return [
    `<rect x="71" y="100" width="18" height="20" rx="5" fill="${skinColor}"/>`,
  ]
}

function buildHead(skinColor: string): string[] {
  const shadow = darken(skinColor, 18)
  return [
    // Head base
    `<circle cx="80" cy="80" r="36" fill="${skinColor}"/>`,
    // Subtle cheek shading
    `<circle cx="60" cy="88" r="8" fill="${shadow}" opacity="0.18"/>`,
    `<circle cx="100" cy="88" r="8" fill="${shadow}" opacity="0.18"/>`,
  ]
}

function buildHair(hairColor: string): string[] {
  const shade = darken(hairColor, 20)
  return [
    // Top of head
    `<ellipse cx="80" cy="52" rx="36" ry="18" fill="${hairColor}"/>`,
    // Left side
    `<ellipse cx="47" cy="72" rx="12" ry="24" fill="${hairColor}"/>`,
    // Right side
    `<ellipse cx="113" cy="72" rx="12" ry="24" fill="${hairColor}"/>`,
    // Hair depth line
    `<path d="M44 68 Q80 44 116 68" stroke="${shade}" stroke-width="2" fill="none" opacity="0.4"/>`,
  ]
}

function buildFace(skinColor: string): string[] {
  const eyeWhite  = '#FFFFFF'
  const pupil     = '#2A2A2A'
  const noseColor = darken(skinColor, 28)
  const lipColor  = darken(skinColor, 42)

  return [
    // Left eye white
    `<ellipse cx="65" cy="80" rx="6" ry="6.5" fill="${eyeWhite}"/>`,
    // Right eye white
    `<ellipse cx="95" cy="80" rx="6" ry="6.5" fill="${eyeWhite}"/>`,
    // Left pupil
    `<circle cx="65.5" cy="81" r="3.2" fill="${pupil}"/>`,
    // Right pupil
    `<circle cx="95.5" cy="81" r="3.2" fill="${pupil}"/>`,
    // Eye shine left
    `<circle cx="67" cy="79" r="1.2" fill="${eyeWhite}"/>`,
    // Eye shine right
    `<circle cx="97" cy="79" r="1.2" fill="${eyeWhite}"/>`,
    // Left eyebrow
    `<path d="M58 71 Q65 67 72 70" stroke="${darken(skinColor, 60)}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    // Right eyebrow
    `<path d="M88 70 Q95 67 102 71" stroke="${darken(skinColor, 60)}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    // Nose
    `<path d="M78 90 Q80 94 82 90" stroke="${noseColor}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
    // Mouth smile
    `<path d="M69 98 Q80 107 91 98" stroke="${lipColor}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
  ]
}

function buildAccessory(accessoryId: string | null): string[] {
  if (!accessoryId) return []

  switch (accessoryId) {
    // ── Face accessories ──────────────────────────────────────────────────────
    case 'a0': // Glasses
      return [
        `<rect x="55" y="74" width="20" height="13" rx="5" fill="none" stroke="#444" stroke-width="2"/>`,
        `<rect x="85" y="74" width="20" height="13" rx="5" fill="none" stroke="#444" stroke-width="2"/>`,
        `<line x1="75" y1="80" x2="85" y2="80" stroke="#444" stroke-width="2"/>`,
        `<line x1="45" y1="80" x2="55" y2="80" stroke="#444" stroke-width="1.5"/>`,
        `<line x1="105" y1="80" x2="115" y2="80" stroke="#444" stroke-width="1.5"/>`,
      ]
    case 'a1': // Sunglasses
      return [
        `<rect x="55" y="74" width="20" height="13" rx="5" fill="#1a1a1a" fill-opacity="0.85" stroke="#666" stroke-width="1.5"/>`,
        `<rect x="85" y="74" width="20" height="13" rx="5" fill="#1a1a1a" fill-opacity="0.85" stroke="#666" stroke-width="1.5"/>`,
        `<line x1="75" y1="80" x2="85" y2="80" stroke="#666" stroke-width="1.5"/>`,
        `<line x1="45" y1="80" x2="55" y2="80" stroke="#666" stroke-width="1.5"/>`,
        `<line x1="105" y1="80" x2="115" y2="80" stroke="#666" stroke-width="1.5"/>`,
        // Lens shine
        `<line x1="58" y1="77" x2="62" y2="79" stroke="white" stroke-width="1" opacity="0.4" stroke-linecap="round"/>`,
        `<line x1="88" y1="77" x2="92" y2="79" stroke="white" stroke-width="1" opacity="0.4" stroke-linecap="round"/>`,
      ]
    case 'a2': // Monocle
      return [
        `<circle cx="95" cy="80" r="10" fill="none" stroke="#B8860B" stroke-width="2.5"/>`,
        `<circle cx="95" cy="80" r="9" fill="white" fill-opacity="0.1"/>`,
        `<line x1="103" y1="88" x2="108" y2="96" stroke="#B8860B" stroke-width="2"/>`,
      ]

    // ── Head accessories ──────────────────────────────────────────────────────
    case 'a3': // Headphones
      return [
        `<path d="M46 78 Q46 42 80 42 Q114 42 114 78" stroke="#2a2a2a" stroke-width="5" fill="none" stroke-linecap="round"/>`,
        `<rect x="40" y="74" width="14" height="20" rx="6" fill="#3a3a3a"/>`,
        `<rect x="106" y="74" width="14" height="20" rx="6" fill="#3a3a3a"/>`,
        `<rect x="42" y="77" width="10" height="14" rx="4" fill="#555"/>`,
        `<rect x="108" y="77" width="10" height="14" rx="4" fill="#555"/>`,
      ]
    case 'a4': // Graduation cap
      return [
        // Cap base
        `<ellipse cx="80" cy="46" rx="32" ry="8" fill="#1a1a2e"/>`,
        // Cap top (mortarboard)
        `<rect x="54" y="38" width="52" height="8" rx="2" fill="#1a1a2e"/>`,
        // Tassel string
        `<line x1="106" y1="42" x2="112" y2="54" stroke="#FFD700" stroke-width="2"/>`,
        `<circle cx="112" cy="57" r="3" fill="#FFD700"/>`,
      ]
    case 'a5': // Crown
      return [
        `<polygon points="50,58 58,38 68,52 80,34 92,52 102,38 110,58" fill="#FFD700" stroke="#FFA500" stroke-width="1.5"/>`,
        // Jewels
        `<circle cx="68" cy="52" r="4" fill="#FF4500"/>`,
        `<circle cx="80" cy="46" r="4" fill="#4169E1"/>`,
        `<circle cx="92" cy="52" r="4" fill="#FF4500"/>`,
        // Base line
        `<rect x="50" y="56" width="60" height="6" rx="2" fill="#FFA500"/>`,
      ]
    case 'a6': // Wizard hat
      return [
        // Brim
        `<ellipse cx="80" cy="54" rx="34" ry="8" fill="#4B0082"/>`,
        // Cone
        `<polygon points="80,10 52,54 108,54" fill="#4B0082"/>`,
        // Star on hat
        `<polygon points="80,22 83,30 91,30 85,35 87,43 80,38 73,43 75,35 69,30 77,30" fill="#FFD700"/>`,
        // Brim highlight
        `<ellipse cx="80" cy="54" rx="34" ry="8" fill="none" stroke="#9370DB" stroke-width="2"/>`,
      ]

    // ── Neck accessories ──────────────────────────────────────────────────────
    case 'a7': // Gold chain
      return [
        `<path d="M58 116 Q80 124 102 116" stroke="#FFD700" stroke-width="3" fill="none" stroke-linecap="round"/>`,
        `<circle cx="80" cy="126" r="5" fill="#FFD700"/>`,
        `<circle cx="80" cy="126" r="3" fill="#FFA500"/>`,
      ]
    case 'a8': // Diamond chain
      return [
        `<path d="M56 116 Q80 126 104 116" stroke="#B9F2FF" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
        // Diamond pendant
        `<polygon points="80,122 73,130 80,140 87,130" fill="#B9F2FF" stroke="#5BC8E8" stroke-width="1"/>`,
        `<polygon points="73,130 87,130 80,122" fill="#7FE0F5"/>`,
        // Shine
        `<line x1="76" y1="126" x2="78" y2="130" stroke="white" stroke-width="1" opacity="0.6"/>`,
      ]

    // ── Effect accessories ─────────────────────────────────────────────────────
    case 'a9': // Lightning aura
      return [
        // Left bolt
        `<polygon points="28,50 22,70 30,68 24,88 38,62 30,64" fill="#FFD700" opacity="0.9"/>`,
        // Right bolt
        `<polygon points="132,50 138,70 130,68 136,88 122,62 130,64" fill="#FFD700" opacity="0.9"/>`,
        // Glow ring
        `<circle cx="80" cy="80" r="46" fill="none" stroke="#FFD700" stroke-width="1.5" opacity="0.35" stroke-dasharray="4 3"/>`,
      ]

    default:
      return []
  }
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AvatarRenderer({
  config,
  rep = 9999,
  size = 36,
  className = '',
  alt,
}: AvatarRendererProps) {
  // Resolve config — sanitise against rep, fall back to defaults
  const safe = config
    ? sanitiseConfig(config, rep)
    : DEFAULT_AVATAR_CONFIG

  const skin   = SKIN_TONES.find((s) => s.id === safe.skin)   ?? SKIN_TONES[0]
  const hair   = HAIR_COLORS.find((h) => h.id === safe.hair)  ?? HAIR_COLORS[0]
  const outfit = OUTFITS.find((o) => o.id === safe.outfit)     ?? OUTFITS[0]

  const skinColor    = skin.color
  const hairColor    = hair.color
  const outfitColor  = outfit.bodyColor
  const collarColor  = outfit.collarColor ?? darken(outfit.bodyColor, 20)

  // Build SVG layers bottom → top
  const layers: string[] = [
    ...buildBody(outfitColor, collarColor),
    ...buildNeck(skinColor),
    ...buildHead(skinColor),
    ...buildHair(hairColor),
    ...buildFace(skinColor),
    ...buildAccessory(safe.accessory),
  ]

  const svgContent = layers.join('\n')

  return (
    <span
      role="img"
      aria-label={alt ?? 'User avatar'}
      style={{ width: size, height: size, display: 'inline-flex', flexShrink: 0 }}
      className={`rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 ${className}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 160 160"
        xmlns="http://www.w3.org/2000/svg"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </span>
  )
}

// ─── Preset size variants ─────────────────────────────────────────────────────
// Convenience wrappers so callers don't have to remember sizes

export function AvatarSm(props: Omit<AvatarRendererProps, 'size'>) {
  return <AvatarRenderer {...props} size={28} />
}

export function AvatarMd(props: Omit<AvatarRendererProps, 'size'>) {
  return <AvatarRenderer {...props} size={36} />
}

export function AvatarLg(props: Omit<AvatarRendererProps, 'size'>) {
  return <AvatarRenderer {...props} size={56} />
}

export function AvatarXl(props: Omit<AvatarRendererProps, 'size'>) {
  return <AvatarRenderer {...props} size={96} />
}
