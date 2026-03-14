import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables.\n' +
    'Copy .env.example → .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,   // needed for Google OAuth redirect
  },
})

// ─── Typed helpers ────────────────────────────────────────────────────────────

/** Shorthand: supabase.from() with full type inference */
export const db = supabase

/** Shorthand: supabase.storage */
export const storage = supabase.storage

/** Upload an avatar and return its public URL */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${userId}/avatar.${ext}`

  const { error } = await storage
    .from('avatars')
    .upload(path, file, { upsert: true })

  if (error) throw error

  const { data } = storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

/** Remove an avatar from storage */
export async function deleteAvatar(userId: string, ext: string) {
  const path = `${userId}/avatar.${ext}`
  await storage.from('avatars').remove([path])
}
