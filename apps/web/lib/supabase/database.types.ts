export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      editorial_candidates: {
        Row: {
          artist_name: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          deezer_url: string | null
          id: string
          metadata: Json
          provider: string
          provider_id: string
          reason: string | null
          score: number
          seed_label: string | null
          source: string
          source_label: string
          starter_track_id: string | null
          status: string
          tier: string
          title: string
          type: Database["public"]["Enums"]["entity_type"]
          updated_at: string
        }
        Insert: {
          artist_name?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          deezer_url?: string | null
          id?: string
          metadata?: Json
          provider?: string
          provider_id: string
          reason?: string | null
          score?: number
          seed_label?: string | null
          source: string
          source_label: string
          starter_track_id?: string | null
          status?: string
          tier: string
          title: string
          type?: Database["public"]["Enums"]["entity_type"]
          updated_at?: string
        }
        Update: {
          artist_name?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          deezer_url?: string | null
          id?: string
          metadata?: Json
          provider?: string
          provider_id?: string
          reason?: string | null
          score?: number
          seed_label?: string | null
          source?: string
          source_label?: string
          starter_track_id?: string | null
          status?: string
          tier?: string
          title?: string
          type?: Database["public"]["Enums"]["entity_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "editorial_candidates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editorial_candidates_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editorial_candidates_starter_track_id_fkey"
            columns: ["starter_track_id"]
            isOneToOne: false
            referencedRelation: "starter_tracks"
            referencedColumns: ["id"]
          },
        ]
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
      entities: {
        Row: {
          artist_name: string | null
          cover_url: string | null
          created_at: string
          deezer_url: string | null
          id: string
          provider: string
          provider_id: string
          short_id: string
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
          short_id?: never
          title: string
          type?: Database["public"]["Enums"]["entity_type"]
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
          short_id?: never
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
      entity_library_items: {
        Row: {
          created_at: string
          entity_id: string
          item_type: string
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          item_type: string
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          item_type?: string
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_library_items_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_library_items_user_id_fkey"
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
          official_label: string | null
          onboarded: boolean
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
          official_label?: string | null
          onboarded?: boolean
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
          official_label?: string | null
          onboarded?: boolean
          spotify_url?: string | null
          taste_onboarded?: boolean
          updated_at?: string
          username?: string | null
        }
        Relationships: []
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
          window_start: string
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
          short_id: string
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
          short_id?: never
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
          short_id?: never
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
      user_creator_perks: {
        Row: {
          created_at: string
          first_review_id: string | null
          perk_key: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_review_id?: string | null
          perk_key?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_review_id?: string | null
          perk_key?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_creator_perks_first_review_id_fkey"
            columns: ["first_review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_creator_perks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          type?: string
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
      archive_starter_track: {
        Args: { p_starter_track_id: string }
        Returns: {
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
        SetofOptions: {
          from: "*"
          to: "starter_tracks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
      create_notification: {
        Args: {
          p_actor_id: string
          p_comment_id?: string
          p_recipient_id: string
          p_review_id?: string
          p_type: Database["public"]["Enums"]["notification_type"]
        }
        Returns: {
          actor_id: string | null
          comment_id: string | null
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          review_id: string | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        SetofOptions: {
          from: "*"
          to: "notifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_review_with_entity: {
        Args: {
          p_artist_name?: string
          p_cover_url?: string
          p_deezer_url?: string
          p_is_pinned?: boolean
          p_provider: string
          p_provider_id: string
          p_rating?: number
          p_review_body?: string
          p_review_title?: string
          p_title: string
          p_type: Database["public"]["Enums"]["entity_type"]
        }
        Returns: {
          entity_id: string
          review_id: string
        }[]
      }
      get_viewer_entity_library_state: {
        Args: { p_entity_ids: string[] }
        Returns: {
          entity_id: string
          listen_later: boolean
          review_later: boolean
        }[]
      }
      get_recommended_review_ids: {
        Args: {
          p_cursor_created_at?: string
          p_cursor_id?: string
          p_cursor_score?: number
          p_limit?: number
        }
        Returns: {
          created_at: string
          reason: string
          review_id: string
          score: number
        }[]
      }
      get_recommendation_health_snapshot: {
        Args: { p_days?: number }
        Returns: Json
      }
      get_starter_tracks: {
        Args: { p_limit?: number }
        Returns: {
          artist_name: string
          collection_slug: string
          collection_title: string
          cover_url: string
          deezer_url: string
          editorial_note: string
          id: string
          matched_tag_count: number
          prompt: string
          provider: string
          provider_id: string
          score: number
          title: string
          type: Database["public"]["Enums"]["entity_type"]
        }[]
      }
      get_starter_tracks_for_surface: {
        Args: {
          p_context_key?: string
          p_exclude_provider_ids?: string[]
          p_limit?: number
          p_surface?: string
        }
        Returns: {
          artist_name: string
          collection_slug: string
          collection_title: string
          cover_url: string
          deezer_url: string
          editorial_note: string
          id: string
          matched_tag_count: number
          prompt: string
          provider: string
          provider_id: string
          score: number
          title: string
          type: Database["public"]["Enums"]["entity_type"]
        }[]
      }
      set_entity_library_item: {
        Args: {
          p_active: boolean
          p_entity_id: string
          p_item_type: string
          p_source?: string
        }
        Returns: {
          active: boolean
          created_at: string | null
          entity_id: string
          item_type: string
        }[]
      }
      get_viewer_review_collection_state: {
        Args: { p_review_ids: string[] }
        Returns: {
          bookmarked: boolean
          liked: boolean
          review_id: string
        }[]
      }
      infer_entity_preference_tags_from_user: {
        Args: { p_entity_id: string; p_signal_weight?: number }
        Returns: number
      }
      is_starter_curator: { Args: never; Returns: boolean }
      reconcile_review_comments_count: {
        Args: { p_review_id: string }
        Returns: {
          comments_count: number
          review_id: string
        }[]
      }
      sync_entity_tags_from_starter_track: {
        Args: {
          p_entity_id: string
          p_provider: string
          p_provider_id: string
          p_signal_weight?: number
          p_type: Database["public"]["Enums"]["entity_type"]
        }
        Returns: number
      }
      toggle_profile_follow: {
        Args: { p_target_profile_id: string }
        Returns: {
          follower_id: string
          following: boolean
          following_id: string
        }[]
      }
      toggle_review_bookmark: {
        Args: { p_review_id: string }
        Returns: {
          bookmarked: boolean
          review_id: string
          saved_at: string
        }[]
      }
      toggle_review_like: {
        Args: { p_review_id: string }
        Returns: {
          liked: boolean
          likes_count: number
        }[]
      }
      update_preference_tag: {
        Args: {
          p_description?: string
          p_is_featured?: boolean
          p_kind: Database["public"]["Enums"]["preference_kind"]
          p_label: string
          p_tag_id: string
        }
        Returns: {
          created_at: string
          description: string | null
          id: string
          is_featured: boolean
          kind: Database["public"]["Enums"]["preference_kind"]
          label: string
          slug: string
          sort_order: number
        }
        SetofOptions: {
          from: "*"
          to: "preference_tags"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_editorial_candidate_status: {
        Args: {
          p_candidate_id: string
          p_decision_note?: string
          p_starter_track_id?: string
          p_status: string
        }
        Returns: {
          artist_name: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          deezer_url: string | null
          id: string
          metadata: Json
          provider: string
          provider_id: string
          reason: string | null
          score: number
          seed_label: string | null
          source: string
          source_label: string
          starter_track_id: string | null
          status: string
          tier: string
          title: string
          type: Database["public"]["Enums"]["entity_type"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "editorial_candidates"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      upsert_editorial_candidate: {
        Args: {
          p_artist_name?: string
          p_cover_url?: string
          p_deezer_url?: string
          p_metadata?: Json
          p_provider: string
          p_provider_id: string
          p_reason?: string
          p_score?: number
          p_seed_label?: string
          p_source?: string
          p_source_label?: string
          p_tier?: string
          p_title: string
          p_type: Database["public"]["Enums"]["entity_type"]
        }
        Returns: {
          artist_name: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          deezer_url: string | null
          id: string
          metadata: Json
          provider: string
          provider_id: string
          reason: string | null
          score: number
          seed_label: string | null
          source: string
          source_label: string
          starter_track_id: string | null
          status: string
          tier: string
          title: string
          type: Database["public"]["Enums"]["entity_type"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "editorial_candidates"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      upsert_preference_tag: {
        Args: {
          p_description?: string
          p_is_featured?: boolean
          p_kind: Database["public"]["Enums"]["preference_kind"]
          p_label: string
          p_slug?: string
        }
        Returns: {
          created_at: string
          description: string | null
          id: string
          is_featured: boolean
          kind: Database["public"]["Enums"]["preference_kind"]
          label: string
          slug: string
          sort_order: number
        }
        SetofOptions: {
          from: "*"
          to: "preference_tags"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      upsert_starter_track: {
        Args: {
          p_artist_name?: string
          p_collection_slug?: string
          p_cover_url?: string
          p_deezer_url?: string
          p_editorial_note?: string
          p_is_active?: boolean
          p_is_featured?: boolean
          p_prompt?: string
          p_provider: string
          p_provider_id: string
          p_tag_ids?: string[]
          p_title: string
          p_type: Database["public"]["Enums"]["entity_type"]
        }
        Returns: {
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
        SetofOptions: {
          from: "*"
          to: "starter_tracks"
          isOneToOne: true
          isSetofReturn: false
        }
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
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      iceberg_namespaces: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_namespaces_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      iceberg_tables: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          location: string
          name: string
          namespace_id: string
          remote_table_id: string | null
          shard_id: string | null
          shard_key: string | null
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          location: string
          name: string
          namespace_id: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          namespace_id?: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_tables_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iceberg_tables_namespace_id_fkey"
            columns: ["namespace_id"]
            isOneToOne: false
            referencedRelation: "iceberg_namespaces"
            referencedColumns: ["id"]
          },
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
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
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
