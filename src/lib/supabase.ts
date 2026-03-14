import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables.\n' +
    'Copy .env.example → .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  )
}

// We use the untyped client to stay compatible with all supabase-js v2.x versions.
// Query results are cast explicitly at the call site using our own types in @/types.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export const storage = supabase.storage

/** Upload an avatar and return its public URL */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${userId}/avatar.${ext}`
  const { error } = await storage.from('avatars').upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

/** Remove an avatar from storage */
export async function deleteAvatar(userId: string, ext: string) {
  const path = `${userId}/avatar.${ext}`
  await storage.from('avatars').remove([path])
}
