export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          source?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          artist_name: string | null
          cover_url: string | null
          created_at: string
          deezer_url: string | null
          id: string
          provider: string
          provider_id: string
          title: string
          type: Database["public"]["Enums"]["entity_type"]
          updated_at: string
        }
        Insert: {
          artist_name?: string | null
          cover_url?: string | null
          created_at?: string
          deezer_url?: string | null
          id?: string
          provider?: string
          provider_id: string
          title: string
          type: Database["public"]["Enums"]["entity_type"]
          updated_at?: string
        }
        Update: {
          artist_name?: string | null
          cover_url?: string | null
          created_at?: string
          deezer_url?: string | null
          id?: string
          provider?: string
          provider_id?: string
          title?: string
          type?: Database["public"]["Enums"]["entity_type"]
          updated_at?: string
        }
        Relationships: []
      }
      entity_bookmarks: {
        Row: {
          created_at: string
          entity_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_bookmarks_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_preference_tags: {
        Row: {
          created_at: string
          entity_id: string
          source: string
          tag_id: string
          updated_at: string
          weight: number
        }
        Insert: {
          created_at?: string
          entity_id: string
          source?: string
          tag_id: string
          updated_at?: string
          weight?: number
        }
        Update: {
          created_at?: string
          entity_id?: string
          source?: string
          tag_id?: string
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "entity_preference_tags_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_preference_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "preference_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      editorial_collections: {
        Row: {
          created_at: string
          curation_note: string | null
          description: string | null
          id: string
          is_published: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          curation_note?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          curation_note?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      editorial_collection_items: {
        Row: {
          collection_id: string
          created_at: string
          note: string | null
          position: number
          starter_track_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          note?: string | null
          position?: number
          starter_track_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          note?: string | null
          position?: number
          starter_track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "editorial_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "editorial_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editorial_collection_items_starter_track_id_fkey"
            columns: ["starter_track_id"]
            isOneToOne: false
            referencedRelation: "starter_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      preference_tags: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_featured: boolean
          kind: Database["public"]["Enums"]["preference_kind"]
          label: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          kind: Database["public"]["Enums"]["preference_kind"]
          label: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          kind?: Database["public"]["Enums"]["preference_kind"]
          label?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          apple_music_url: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          deezer_url: string | null
          display_name: string | null
          id: string
          is_official: boolean
          onboarded: boolean
          official_label: string | null
          spotify_url: string | null
          taste_onboarded: boolean
          updated_at: string
          username: string | null
        }
        Insert: {
          apple_music_url?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          deezer_url?: string | null
          display_name?: string | null
          id: string
          is_official?: boolean
          onboarded?: boolean
          official_label?: string | null
          spotify_url?: string | null
          taste_onboarded?: boolean
          updated_at?: string
          username?: string | null
        }
        Update: {
          apple_music_url?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          deezer_url?: string | null
          display_name?: string | null
          id?: string
          is_official?: boolean
          onboarded?: boolean
          official_label?: string | null
          spotify_url?: string | null
          taste_onboarded?: boolean
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      profile_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_roles: {
        Row: {
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_windows: {
        Row: {
          identifier: string
          request_count: number
          scope: string
          updated_at: string
          window_start: string
        }
        Insert: {
          identifier: string
          request_count?: number
          scope: string
          updated_at?: string
          window_start?: string
        }
        Update: {
          identifier?: string
          request_count?: number
          scope?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          comment_id: string | null
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          review_id: string | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          actor_id?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          review_id?: string | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          actor_id?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          review_id?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "review_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_likes: {
        Row: {
          created_at: string
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_likes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_bookmarks: {
        Row: {
          created_at: string
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_bookmarks_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          parent_id: string | null
          review_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          parent_id?: string | null
          review_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          review_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "review_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_comments_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_id: string
          body: string | null
          comments_count: number
          created_at: string
          entity_id: string
          id: string
          is_pinned: boolean
          likes_count: number
          rating: number
          title: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          body?: string | null
          comments_count?: number
          created_at?: string
          entity_id: string
          id?: string
          is_pinned?: boolean
          likes_count?: number
          rating: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string | null
          comments_count?: number
          created_at?: string
          entity_id?: string
          id?: string
          is_pinned?: boolean
          likes_count?: number
          rating?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      starter_tracks: {
        Row: {
          artist_name: string | null
          cover_url: string | null
          created_at: string
          deezer_url: string | null
          editorial_note: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          prompt: string | null
          provider: string
          provider_id: string
          sort_order: number
          title: string
          type: Database["public"]["Enums"]["entity_type"]
          updated_at: string
        }
        Insert: {
          artist_name?: string | null
          cover_url?: string | null
          created_at?: string
          deezer_url?: string | null
          editorial_note?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          prompt?: string | null
          provider?: string
          provider_id: string
          sort_order?: number
          title: string
          type?: Database["public"]["Enums"]["entity_type"]
          updated_at?: string
        }
        Update: {
          artist_name?: string | null
          cover_url?: string | null
          created_at?: string
          deezer_url?: string | null
          editorial_note?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          prompt?: string | null
          provider?: string
          provider_id?: string
          sort_order?: number
          title?: string
          type?: Database["public"]["Enums"]["entity_type"]
          updated_at?: string
        }
        Relationships: []
      }
      starter_track_tags: {
        Row: {
          created_at: string
          starter_track_id: string
          tag_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          starter_track_id: string
          tag_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          starter_track_id?: string
          tag_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "starter_track_tags_starter_track_id_fkey"
            columns: ["starter_track_id"]
            isOneToOne: false
            referencedRelation: "starter_tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "starter_track_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "preference_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      user_music_seeds: {
        Row: {
          artist_name: string | null
          cover_url: string | null
          created_at: string
          entity_id: string | null
          id: string
          provider: string
          provider_id: string
          source: string
          title: string
          type: string
          user_id: string
          weight: number
        }
        Insert: {
          artist_name?: string | null
          cover_url?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          provider?: string
          provider_id: string
          source?: string
          title: string
          type: string
          user_id: string
          weight?: number
        }
        Update: {
          artist_name?: string | null
          cover_url?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          provider?: string
          provider_id?: string
          source?: string
          title?: string
          type?: string
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_music_seeds_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_music_seeds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preference_tags: {
        Row: {
          created_at: string
          source: string
          tag_id: string
          updated_at: string
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          source?: string
          tag_id: string
          updated_at?: string
          user_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          source?: string
          tag_id?: string
          updated_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_preference_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "preference_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_preference_tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_identifier: string
          p_limit: number
          p_scope: string
          p_window_seconds: number
        }
        Returns: {
          current_count: number
          ok: boolean
          remaining: number
          reset_at: string
        }[]
      }
      archive_starter_track: {
        Args: {
          p_starter_track_id: string
        }
        Returns: Database["public"]["Tables"]["starter_tracks"]["Row"]
      }
      get_recommended_review_ids: {
        Args: {
          p_cursor_created_at?: string | null
          p_cursor_id?: string | null
          p_cursor_score?: number | null
          p_limit?: number
        }
        Returns: {
          created_at: string
          reason: string
          review_id: string
          score: number
        }[]
      }
      get_starter_tracks: {
        Args: {
          p_limit?: number
        }
        Returns: {
          artist_name: string | null
          collection_slug: string | null
          collection_title: string | null
          cover_url: string | null
          deezer_url: string | null
          editorial_note: string | null
          id: string
          matched_tag_count: number
          prompt: string | null
          provider: string
          provider_id: string
          score: number
          title: string
          type: Database["public"]["Enums"]["entity_type"]
        }[]
      }
      is_starter_curator: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      infer_entity_preference_tags_from_user: {
        Args: {
          p_entity_id: string
          p_signal_weight?: number | null
        }
        Returns: number
      }
      sync_entity_tags_from_starter_track: {
        Args: {
          p_entity_id: string
          p_provider: string
          p_provider_id: string
          p_signal_weight?: number | null
          p_type: Database["public"]["Enums"]["entity_type"]
        }
        Returns: number
      }
      get_viewer_review_collection_state: {
        Args: {
          p_review_ids: string[]
        }
        Returns: {
          review_id: string
          liked: boolean
          bookmarked: boolean
        }[]
      }
      create_review_with_entity: {
        Args: {
          p_artist_name?: string | null
          p_cover_url?: string | null
          p_deezer_url?: string | null
          p_is_pinned?: boolean | null
          p_provider: string
          p_provider_id: string
          p_rating?: number | null
          p_review_body?: string | null
          p_review_title?: string | null
          p_title: string
          p_type: Database["public"]["Enums"]["entity_type"]
        }
        Returns: {
          entity_id: string
          review_id: string
        }[]
      }
      upsert_preference_tag: {
        Args: {
          p_description?: string | null
          p_is_featured?: boolean
          p_kind: Database["public"]["Enums"]["preference_kind"]
          p_label: string
          p_slug?: string | null
        }
        Returns: Database["public"]["Tables"]["preference_tags"]["Row"]
      }
      upsert_starter_track: {
        Args: {
          p_artist_name?: string | null
          p_collection_slug?: string
          p_cover_url?: string | null
          p_deezer_url?: string | null
          p_editorial_note?: string | null
          p_is_active?: boolean
          p_is_featured?: boolean
          p_prompt?: string | null
          p_provider: string
          p_provider_id: string
          p_tag_ids?: string[]
          p_title: string
          p_type: Database["public"]["Enums"]["entity_type"]
        }
        Returns: Database["public"]["Tables"]["starter_tracks"]["Row"]
      }
      create_notification: {
        Args: {
          p_actor_id: string
          p_comment_id?: string | null
          p_recipient_id: string
          p_review_id?: string | null
          p_type: Database["public"]["Enums"]["notification_type"]
        }
        Returns: Database["public"]["Tables"]["notifications"]["Row"]
      }
      reconcile_review_comments_count: {
        Args: {
          p_review_id: string
        }
        Returns: {
          review_id: string
          comments_count: number
        }[]
      }
      toggle_review_like: {
        Args: {
          p_review_id: string
        }
        Returns: {
          liked: boolean
          likes_count: number
        }[]
      }
      toggle_review_bookmark: {
        Args: {
          p_review_id: string
        }
        Returns: {
          review_id: string
          bookmarked: boolean
          saved_at: string | null
        }[]
      }
      toggle_profile_follow: {
        Args: {
          p_target_profile_id: string
        }
        Returns: {
          follower_id: string
          following_id: string
          following: boolean
        }[]
      }
    }
    Enums: {
      entity_type: "track" | "album"
      notification_type: "review_liked" | "review_commented"
      preference_kind: "genre" | "mood" | "scene" | "style" | "era" | "format"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      entity_type: ["track", "album"],
      notification_type: ["review_liked", "review_commented"],
      preference_kind: ["genre", "mood", "scene", "style", "era", "format"],
    },
  },
} as const
