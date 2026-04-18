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
  public: {
    Tables: {
      bio_links: {
        Row: {
          clicks: number
          created_at: string
          creator_id: string
          icon: string | null
          id: string
          is_active: boolean
          sort_order: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          clicks?: number
          created_at?: string
          creator_id: string
          icon?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          clicks?: number
          created_at?: string
          creator_id?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "bio_links_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_campaigns: {
        Row: {
          brand_logo_url: string | null
          brand_name: string
          budget_max: number | null
          budget_min: number | null
          campaign_type: string
          category: string | null
          commission_rate: number | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          requirements: string | null
          title: string
          updated_at: string
        }
        Insert: {
          brand_logo_url?: string | null
          brand_name: string
          budget_max?: number | null
          budget_min?: number | null
          campaign_type?: string
          category?: string | null
          commission_rate?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          requirements?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          brand_logo_url?: string | null
          brand_name?: string
          budget_max?: number | null
          budget_min?: number | null
          campaign_type?: string
          category?: string | null
          commission_rate?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          requirements?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaign_applications: {
        Row: {
          campaign_id: string
          created_at: string
          creator_id: string
          id: string
          message: string | null
          status: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          creator_id: string
          id?: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          creator_id?: string
          id?: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_applications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "brand_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_applications_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_content: {
        Row: {
          content_type: string
          created_at: string
          creator_id: string
          description: string | null
          file_url: string | null
          id: string
          is_published: boolean
          live_stream_url: string | null
          subscription_tier_id: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          content_type?: string
          created_at?: string
          creator_id: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          live_stream_url?: string | null
          subscription_tier_id?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          content_type?: string
          created_at?: string
          creator_id?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          live_stream_url?: string | null
          subscription_tier_id?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_content_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_content_subscription_tier_id_fkey"
            columns: ["subscription_tier_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_private_data: {
        Row: {
          contact_email: string | null
          created_at: string
          id: string
          paypal_email: string | null
          stripe_connect_account_id: string | null
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          id: string
          paypal_email?: string | null
          stripe_connect_account_id?: string | null
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          id?: string
          paypal_email?: string | null
          stripe_connect_account_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      earnings: {
        Row: {
          amount: number
          created_at: string
          creator_id: string
          description: string | null
          id: string
          source: string
        }
        Insert: {
          amount?: number
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          source?: string
        }
        Update: {
          amount?: number
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "earnings_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      followers: {
        Row: {
          created_at: string
          creator_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: []
      }
      link_clicks: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          link_id: string
          referrer: string | null
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          link_id: string
          referrer?: string | null
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          link_id?: string
          referrer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_clicks_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "bio_links"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          referrer: string | null
          viewer_ip_hash: string | null
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          referrer?: string | null
          viewer_ip_hash?: string | null
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          referrer?: string | null
          viewer_ip_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_views_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          creator_id: string
          description: string | null
          file_url: string | null
          id: string
          image_url: string | null
          is_published: boolean | null
          name: string
          price: number
          product_type: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          name: string
          price?: number
          product_type?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          name?: string
          price?: number
          product_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: string | null
          avatar_url: string | null
          bio: string | null
          category: string | null
          contact_email: string | null
          created_at: string
          display_name: string | null
          follower_count: number | null
          id: string
          is_elite: boolean | null
          is_featured: boolean | null
          is_pro: boolean | null
          is_verified: boolean | null
          link_layout: string
          onboarding_completed: boolean | null
          paypal_email: string | null
          referral_code: string | null
          referred_by: string | null
          social_links: Json | null
          stripe_connect_account_id: string | null
          theme_color: string | null
          updated_at: string
          username: string
          website: string | null
        }
        Insert: {
          account_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          category?: string | null
          contact_email?: string | null
          created_at?: string
          display_name?: string | null
          follower_count?: number | null
          id: string
          is_elite?: boolean | null
          is_featured?: boolean | null
          is_pro?: boolean | null
          is_verified?: boolean | null
          link_layout?: string
          onboarding_completed?: boolean | null
          paypal_email?: string | null
          referral_code?: string | null
          referred_by?: string | null
          social_links?: Json | null
          stripe_connect_account_id?: string | null
          theme_color?: string | null
          updated_at?: string
          username: string
          website?: string | null
        }
        Update: {
          account_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          category?: string | null
          contact_email?: string | null
          created_at?: string
          display_name?: string | null
          follower_count?: number | null
          id?: string
          is_elite?: boolean | null
          is_featured?: boolean | null
          is_pro?: boolean | null
          is_verified?: boolean | null
          link_layout?: string
          onboarding_completed?: boolean | null
          paypal_email?: string | null
          referral_code?: string | null
          referred_by?: string | null
          social_links?: Json | null
          stripe_connect_account_id?: string | null
          theme_color?: string | null
          updated_at?: string
          username?: string
          website?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number
          buyer_email: string | null
          buyer_id: string | null
          created_at: string
          creator_id: string
          file_url: string | null
          id: string
          product_id: string | null
          product_image_url: string | null
          product_name: string | null
          status: string
          stripe_session_id: string | null
        }
        Insert: {
          amount?: number
          buyer_email?: string | null
          buyer_id?: string | null
          created_at?: string
          creator_id: string
          file_url?: string | null
          id?: string
          product_id?: string | null
          product_image_url?: string | null
          product_name?: string | null
          status?: string
          stripe_session_id?: string | null
        }
        Update: {
          amount?: number
          buyer_email?: string | null
          buyer_id?: string | null
          created_at?: string
          creator_id?: string
          file_url?: string | null
          id?: string
          product_id?: string | null
          product_image_url?: string | null
          product_name?: string | null
          status?: string
          stripe_session_id?: string | null
        }
        Relationships: []
      }
      social_analytics: {
        Row: {
          clicks: number | null
          created_at: string
          creator_id: string
          followers: number | null
          id: string
          last_synced_at: string | null
          platform: string
          updated_at: string
        }
        Insert: {
          clicks?: number | null
          created_at?: string
          creator_id: string
          followers?: number | null
          id?: string
          last_synced_at?: string | null
          platform: string
          updated_at?: string
        }
        Update: {
          clicks?: number | null
          created_at?: string
          creator_id?: string
          followers?: number | null
          id?: string
          last_synced_at?: string | null
          platform?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_analytics_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriber_events: {
        Row: {
          created_at: string
          creator_id: string
          event_type: string
          id: string
          subscriber_id: string | null
          subscription_id: string | null
        }
        Insert: {
          created_at?: string
          creator_id: string
          event_type?: string
          id?: string
          subscriber_id?: string | null
          subscription_id?: string | null
        }
        Update: {
          created_at?: string
          creator_id?: string
          event_type?: string
          id?: string
          subscriber_id?: string | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriber_events_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriber_events_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriber_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_perks: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          perk_description: string | null
          perk_name: string
          sort_order: number
          subscription_id: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          perk_description?: string | null
          perk_name: string
          sort_order?: number
          subscription_id: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          perk_description?: string | null
          perk_name?: string
          sort_order?: number
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_perks_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_perks_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          features: string[] | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      creator_has_payments: { Args: { _creator_id: string }; Returns: boolean }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_my_private_data: {
        Args: never
        Returns: {
          contact_email: string
          paypal_email: string
          stripe_connect_account_id: string
        }[]
      }
      get_my_referral_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
