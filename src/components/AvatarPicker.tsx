import { useRef, useState } from 'react'
import { Upload, Check, X, RefreshCw } from 'lucide-react'
import { uploadAvatar } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { PRESET_AVATARS, resolveAvatar } from '@/types'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// ─── Props ────────────────────────────────────────────────────────────────────
interface AvatarPickerProps {
  /** Current avatar_url value (could be image URL, preset key, or null) */
  currentAvatarUrl: string | null | undefined
  /** Called with the new avatar_url value after selection or upload */
  onAvatarChange: (newUrl: string) => void
  /** Size variant for the preview */
  size?: 'md' | 'lg' | 'xl'
}

// ─── File validation ──────────────────────────────────────────────────────────
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE_MB    = 2
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Only JPG, PNG, WebP, or GIF images are allowed.'
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `File must be under ${MAX_SIZE_MB}MB.`
  }
  return null
}

// ─── Preview display ──────────────────────────────────────────────────────────
function AvatarPreview({
  avatarUrl,
  username,
  size,
  localPreview,
}: {
  avatarUrl: string | null | undefined
  username: string
  size: 'md' | 'lg' | 'xl'
  localPreview?: string | null
}) {
  const sizeClass = {
    md: 'w-14 h-14 text-2xl',
    lg: 'w-20 h-20 text-3xl',
    xl: 'w-28 h-28 text-4xl',
  }[size]

  // Local blob preview takes priority while uploading
  const src = localPreview ?? (resolveAvatar(avatarUrl).type === 'image' ? resolveAvatar(avatarUrl).value : null)
  const resolved = resolveAvatar(avatarUrl)

  if (localPreview || resolved.type === 'image') {
    return (
      <img
        src={localPreview ?? resolved.value}
        alt={username}
        className={clsx('avatar rounded-full object-cover border-4 border-white dark:border-dark-card shadow-md', sizeClass)}
      />
    )
  }

  if (resolved.type === 'preset') {
    return (
      <div className={clsx('avatar-emoji rounded-full border-4 border-white dark:border-dark-card shadow-md bg-primary/10 dark:bg-primary/20', sizeClass)}>
        {resolved.value}
      </div>
    )
  }

  // Default: initials
  return (
    <div className={clsx(
      'avatar-emoji rounded-full border-4 border-white dark:border-dark-card shadow-md bg-primary/10 dark:bg-primary/20 font-bold text-primary',
      sizeClass
    )}>
      {username.slice(0, 2).toUpperCase()}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AvatarPicker({
  currentAvatarUrl,
  onAvatarChange,
  size = 'lg',
}: AvatarPickerProps) {
  const { user, profile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uploading, setUploading]       = useState(false)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [selected, setSelected]         = useState<string | null>(null) // tracks preset selection before save

  const username = profile?.username ?? 'U'

  // ── File upload flow ────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    const validationError = validateFile(file)
    if (validationError) {
      toast.error(validationError)
      return
    }

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file)
    setLocalPreview(objectUrl)
    setSelected(null)
    setUploading(true)

    try {
      const publicUrl = await uploadAvatar(user.id, file)
      onAvatarChange(publicUrl)
      toast.success('Profile photo updated!')
    } catch (err) {
      console.error('[AvatarPicker] upload error:', err)
      toast.error('Upload failed. Please try again.')
      setLocalPreview(null) // revert preview
    } finally {
      setUploading(false)
      URL.revokeObjectURL(objectUrl)
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Preset selection ────────────────────────────────────────────────────────
  const handlePresetSelect = (key: string) => {
    setSelected(key)
    setLocalPreview(null)
  }

  const handlePresetConfirm = () => {
    if (!selected) return
    onAvatarChange(selected)
    setSelected(null)
    toast.success('Avatar updated!')
  }

  const handlePresetCancel = () => setSelected(null)

  // ── Reset to default ────────────────────────────────────────────────────────
  const handleReset = () => {
    onAvatarChange('')   // empty string → component and DB treat as null/default
    setLocalPreview(null)
    setSelected(null)
    toast('Reverted to default avatar')
  }

  // Effective avatar to display: confirmed preset > current > null
  const displayUrl = localPreview
    ? null   // if localPreview is set, AvatarPreview uses it via prop
    : selected ?? currentAvatarUrl

  return (
    <div className="flex flex-col gap-5">

      {/* ── Preview + upload trigger ────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <AvatarPreview
            avatarUrl={displayUrl}
            username={username}
            size={size}
            localPreview={localPreview}
          />

          {/* Upload overlay button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={clsx(
              'absolute bottom-0 right-0 w-8 h-8 rounded-full',
              'bg-primary text-white flex items-center justify-center shadow-md',
              'hover:bg-btn-hover transition-colors',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              'border-2 border-white dark:border-dark-card'
            )}
            aria-label="Upload profile photo"
            title="Upload photo"
          >
            {uploading
              ? <span className="spinner w-3.5 h-3.5" />
              : <Upload className="w-3.5 h-3.5" />
            }
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />

        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn btn-secondary btn-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            {uploading ? 'Uploading…' : 'Upload photo'}
          </button>
          <p className="text-xs text-text-secondary dark:text-gray-400">
            JPG, PNG, WebP or GIF · max {MAX_SIZE_MB}MB
          </p>
        </div>
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border dark:bg-gray-700" />
        <span className="text-xs text-text-secondary dark:text-gray-400 uppercase tracking-wide font-medium">
          or choose a preset
        </span>
        <div className="flex-1 h-px bg-border dark:bg-gray-700" />
      </div>

      {/* ── Preset grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {PRESET_AVATARS.map((preset) => {
          const isActive = (selected ?? currentAvatarUrl) === preset.key
          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => handlePresetSelect(preset.key)}
              className={clsx(
                'relative flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all duration-150',
                'hover:border-primary hover:bg-blue-50 dark:hover:bg-blue-900/20',
                isActive
                  ? 'border-primary bg-blue-50 dark:bg-blue-900/20'
                  : 'border-transparent bg-gray-50 dark:bg-gray-800'
              )}
              aria-label={`Select ${preset.label} avatar`}
              aria-pressed={isActive}
              title={preset.label}
            >
              <span className="text-2xl leading-none" role="img" aria-label={preset.label}>
                {preset.emoji}
              </span>
              <span className="text-[10px] text-text-secondary dark:text-gray-400 truncate w-full text-center">
                {preset.label}
              </span>
              {isActive && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Preset confirm / cancel bar ─────────────────────────────────── */}
      {selected && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-primary/20 animate-fade-in">
          <span className="text-sm text-text-primary dark:text-dark-text flex-1">
            Use{' '}
            <strong>{PRESET_AVATARS.find((p) => p.key === selected)?.emoji}</strong>{' '}
            <strong>{PRESET_AVATARS.find((p) => p.key === selected)?.label}</strong> as your avatar?
          </span>
          <button
            type="button"
            onClick={handlePresetCancel}
            className="btn btn-secondary btn-sm w-8 h-8 p-0"
            aria-label="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handlePresetConfirm}
            className="btn btn-primary btn-sm"
          >
            <Check className="w-3.5 h-3.5" />
            Confirm
          </button>
        </div>
      )}

      {/* ── Reset to default ────────────────────────────────────────────── */}
      {currentAvatarUrl && !selected && (
        <button
          type="button"
          onClick={handleReset}
          className="btn btn-ghost btn-sm self-center gap-1.5 text-xs text-text-secondary"
        >
          <RefreshCw className="w-3 h-3" />
          Reset to default
        </button>
      )}
    </div>
  )
}
