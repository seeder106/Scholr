// ─── Database shape (mirrors schema.sql exactly) ─────────────────────────────
// This is a hand-written type file. If you prefer auto-generation run:
//   npx supabase gen types typescript --project-id YOUR_PROJECT_REF > src/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          bio: string | null
          avatar_url: string | null
          avatar_config: {
            skin: string
            hair: string
            outfit: string
            accessory: string | null
          } | null
          reputation: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          avatar_config?: {
            skin: string
            hair: string
            outfit: string
            accessory: string | null
          } | null
          reputation?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          username?: string
          full_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          avatar_config?: {
            skin: string
            hair: string
            outfit: string
            accessory: string | null
          } | null
          reputation?: number
          updated_at?: string
        }
      }
      communities: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon_url: string | null
          owner_id: string
          is_private: boolean
          member_count: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon_url?: string | null
          owner_id: string
          is_private?: boolean
          member_count?: number
          created_at?: string
        }
        Update: {
          name?: string
          slug?: string
          description?: string | null
          icon_url?: string | null
          is_private?: boolean
        }
      }
      community_members: {
        Row: {
          community_id: string
          user_id: string
          role: 'owner' | 'moderator' | 'member'
          joined_at: string
        }
        Insert: {
          community_id: string
          user_id: string
          role?: 'owner' | 'moderator' | 'member'
          joined_at?: string
        }
        Update: {
          role?: 'owner' | 'moderator' | 'member'
        }
      }
      posts: {
        Row: {
          id: string
          community_id: string
          author_id: string
          title: string
          body: string | null
          upvotes: number
          reply_count: number
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          community_id: string
          author_id: string
          title: string
          body?: string | null
          upvotes?: number
          reply_count?: number
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          body?: string | null
          is_deleted?: boolean
          updated_at?: string
        }
      }
      replies: {
        Row: {
          id: string
          post_id: string
          author_id: string
          parent_id: string | null
          body: string
          upvotes: number
          is_deleted: boolean
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          parent_id?: string | null
          body: string
          upvotes?: number
          is_deleted?: boolean
          created_at?: string
        }
        Update: {
          body?: string
          is_deleted?: boolean
        }
      }
      votes: {
        Row: {
          reply_id: string
          user_id: string
          value: number
          created_at: string
        }
        Insert: {
          reply_id: string
          user_id: string
          value?: number
          created_at?: string
        }
        Update: {
          value?: number
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          target_type: 'post' | 'reply'
          target_id: string
          reason: string
          resolved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          target_type: 'post' | 'reply'
          target_id: string
          reason: string
          resolved?: boolean
          created_at?: string
        }
        Update: {
          resolved?: boolean
        }
      }
    }
    Views: {
      posts_with_authors: {
        Row: {
          id: string
          community_id: string
          author_id: string
          title: string
          body: string | null
          upvotes: number
          reply_count: number
          is_deleted: boolean
          created_at: string
          updated_at: string
          author_username: string
          author_avatar: string | null
          author_avatar_config: {
            skin: string
            hair: string
            outfit: string
            accessory: string | null
          } | null
          author_reputation: number
        }
      }
      replies_with_authors: {
        Row: {
          id: string
          post_id: string
          author_id: string
          parent_id: string | null
          body: string
          upvotes: number
          is_deleted: boolean
          created_at: string
          author_username: string
          author_avatar: string | null
          author_avatar_config: {
            skin: string
            hair: string
            outfit: string
            accessory: string | null
          } | null
          author_reputation: number
        }
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
