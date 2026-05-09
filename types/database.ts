export interface Database {
  public: {
    Tables: {
      ideas: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          is_public: boolean
          edited_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          is_public?: boolean
          edited_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          is_public?: boolean
          edited_at?: string | null
          created_at?: string
        }
      }
      idea_likes: {
        Row: {
          id: string
          idea_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          idea_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          idea_id?: string
          user_id?: string
          created_at?: string
        }
      }
      idea_comments: {
        Row: {
          id: string
          idea_id: string
          user_id: string
          parent_id: string | null
          content: string
          edited_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          idea_id: string
          user_id: string
          parent_id?: string | null
          content: string
          edited_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          idea_id?: string
          user_id?: string
          parent_id?: string | null
          content?: string
          edited_at?: string | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string
          display_name?: string
          location?: string
          bio?: string
          stage?: string
          skills?: string[]
          status_tags?: string[]
          twitter?: string
          linkedin?: string
          github?: string
          message_preference?: 'anyone' | 'cofounders_only' | 'nobody'
          theme_preference?: 'light' | 'dark'
          onboarding_complete?: boolean
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          display_name?: string
          location?: string
          bio?: string
          stage?: string
          skills?: string[]
          status_tags?: string[]
          twitter?: string
          linkedin?: string
          github?: string
          message_preference?: 'anyone' | 'cofounders_only' | 'nobody'
          theme_preference?: 'light' | 'dark'
          onboarding_complete?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string
          location?: string
          bio?: string
          stage?: string
          skills?: string[]
          status_tags?: string[]
          twitter?: string
          linkedin?: string
          github?: string
          message_preference?: 'anyone' | 'cofounders_only' | 'nobody'
          theme_preference?: 'light' | 'dark'
          onboarding_complete?: boolean
          created_at?: string
        }
      }
    }
  }
}

export interface IdeaWithDetails {
  id: string
  user_id: string
  title: string
  content: string
  is_public: boolean
  edited_at: string | null
  created_at: string
  profiles: {
    username: string
    display_name?: string
  }
  idea_likes: Array<{
    id: string
    user_id: string
    created_at: string
  }>
  idea_comments: Array<{
    id: string
    user_id: string
    parent_id: string | null
    content: string
    edited_at: string | null
    created_at: string
  }>
  _count: {
    idea_likes: number
    idea_comments: number
  }
}

export interface CommentWithProfile {
  id: string
  idea_id: string
  user_id: string
  parent_id: string | null
  content: string
  edited_at: string | null
  created_at: string
  profiles: {
    username: string
    display_name?: string
  }
  replies?: CommentWithProfile[]
}

export type SortOption = 'latest' | 'most_liked'
