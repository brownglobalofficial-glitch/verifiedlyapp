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
          stripe_charges_enabled: boolean
          stripe_connect_account_id: string | null
          stripe_details_submitted: boolean
          stripe_disabled_reason: string | null
          stripe_payouts_enabled: boolean
          stripe_requirements_currently_due: Json
          stripe_requirements_past_due: Json
          stripe_status_synced_at: string | null
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          id: string
          paypal_email?: string | null
          stripe_charges_enabled?: boolean
          stripe_connect_account_id?: string | null
          stripe_details_submitted?: boolean
          stripe_disabled_reason?: string | null
          stripe_payouts_enabled?: boolean
          stripe_requirements_currently_due?: Json
          stripe_requirements_past_due?: Json
          stripe_status_synced_at?: string | null
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          id?: string
          paypal_email?: string | null
          stripe_charges_enabled?: boolean
          stripe_connect_account_id?: string | null
          stripe_details_submitted?: boolean
          stripe_disabled_reason?: string | null
          stripe_payouts_enabled?: boolean
          stripe_requirements_currently_due?: Json
          stripe_requirements_past_due?: Json
          stripe_status_synced_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      creator_status: {
        Row: {
          caption: string | null
          created_at: string
          creator_id: string
          expires_at: string
          id: string
          image_url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          creator_id: string
          expires_at?: string
          id?: string
          image_url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          creator_id?: string
          expires_at?: string
          id?: string
          image_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_status_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      oauth_clients: {
        Row: {
          active: boolean
          client_id: string
          client_secret_hash: string
          created_at: string
          homepage_url: string | null
          id: string
          is_first_party: boolean
          logo_url: string | null
          name: string
          redirect_uris: string[]
          rotated_at: string | null
          scopes: string[]
          updated_at: string
        }
        Insert: {
          active?: boolean
          client_id: string
          client_secret_hash: string
          created_at?: string
          homepage_url?: string | null
          id?: string
          is_first_party?: boolean
          logo_url?: string | null
          name: string
          redirect_uris?: string[]
          rotated_at?: string | null
          scopes?: string[]
          updated_at?: string
        }
        Update: {
          active?: boolean
          client_id?: string
          client_secret_hash?: string
          created_at?: string
          homepage_url?: string | null
          id?: string
          is_first_party?: boolean
          logo_url?: string | null
          name?: string
          redirect_uris?: string[]
          rotated_at?: string | null
          scopes?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      oauth_codes: {
        Row: {
          client_id: string
          code: string
          created_at: string
          expires_at: string
          redirect_uri: string
          scopes: string[]
          used: boolean
          user_id: string
        }
        Insert: {
          client_id: string
          code: string
          created_at?: string
          expires_at: string
          redirect_uri: string
          scopes?: string[]
          used?: boolean
          user_id: string
        }
        Update: {
          client_id?: string
          code?: string
          created_at?: string
          expires_at?: string
          redirect_uri?: string
          scopes?: string[]
          used?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_codes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      oauth_tokens: {
        Row: {
          access_token: string
          client_id: string
          created_at: string
          expires_at: string
          revoked: boolean
          scopes: string[]
          user_id: string
        }
        Insert: {
          access_token: string
          client_id: string
          created_at?: string
          expires_at: string
          revoked?: boolean
          scopes?: string[]
          user_id: string
        }
        Update: {
          access_token?: string
          client_id?: string
          created_at?: string
          expires_at?: string
          revoked?: boolean
          scopes?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["client_id"]
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
      payout_ledger: {
        Row: {
          buyer_email: string | null
          buyer_user_id: string | null
          created_at: string
          currency: string
          destination_stripe_account_id: string | null
          gross_amount: number
          id: string
          metadata: Json
          net_amount: number
          platform_fee: number
          platform_fee_percent: number
          reference_id: string | null
          seller_user_id: string | null
          stripe_event_id: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          stripe_subscription_id: string | null
          transaction_type: string
        }
        Insert: {
          buyer_email?: string | null
          buyer_user_id?: string | null
          created_at?: string
          currency?: string
          destination_stripe_account_id?: string | null
          gross_amount?: number
          id?: string
          metadata?: Json
          net_amount?: number
          platform_fee?: number
          platform_fee_percent?: number
          reference_id?: string | null
          seller_user_id?: string | null
          stripe_event_id?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          transaction_type: string
        }
        Update: {
          buyer_email?: string | null
          buyer_user_id?: string | null
          created_at?: string
          currency?: string
          destination_stripe_account_id?: string | null
          gross_amount?: number
          id?: string
          metadata?: Json
          net_amount?: number
          platform_fee?: number
          platform_fee_percent?: number
          reference_id?: string | null
          seller_user_id?: string | null
          stripe_event_id?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          transaction_type?: string
        }
        Relationships: []
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
          stripe_price_id: string | null
          stripe_product_id: string | null
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
          stripe_price_id?: string | null
          stripe_product_id?: string | null
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
          stripe_price_id?: string | null
          stripe_product_id?: string | null
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
          comp_tier: string | null
          created_at: string
          display_name: string | null
          domain_verified: boolean
          follower_count: number | null
          id: string
          is_elite: boolean | null
          is_featured: boolean | null
          is_pro: boolean | null
          is_verified: boolean | null
          link_layout: string
          membership_button_label: string | null
          onboarding_completed: boolean | null
          payout_status_public: boolean
          referral_code: string | null
          referred_by: string | null
          signal_breakdown_public: boolean
          social_links: Json | null
          theme_color: string | null
          tip_button_label: string | null
          tips_enabled: boolean
          trust_score: number
          trust_score_opt_out: boolean
          trust_score_public: boolean
          updated_at: string
          username: string
          verified_domain: string | null
          verified_socials_public: boolean
          website: string | null
        }
        Insert: {
          account_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          category?: string | null
          comp_tier?: string | null
          created_at?: string
          display_name?: string | null
          domain_verified?: boolean
          follower_count?: number | null
          id: string
          is_elite?: boolean | null
          is_featured?: boolean | null
          is_pro?: boolean | null
          is_verified?: boolean | null
          link_layout?: string
          membership_button_label?: string | null
          onboarding_completed?: boolean | null
          payout_status_public?: boolean
          referral_code?: string | null
          referred_by?: string | null
          signal_breakdown_public?: boolean
          social_links?: Json | null
          theme_color?: string | null
          tip_button_label?: string | null
          tips_enabled?: boolean
          trust_score?: number
          trust_score_opt_out?: boolean
          trust_score_public?: boolean
          updated_at?: string
          username: string
          verified_domain?: string | null
          verified_socials_public?: boolean
          website?: string | null
        }
        Update: {
          account_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          category?: string | null
          comp_tier?: string | null
          created_at?: string
          display_name?: string | null
          domain_verified?: boolean
          follower_count?: number | null
          id?: string
          is_elite?: boolean | null
          is_featured?: boolean | null
          is_pro?: boolean | null
          is_verified?: boolean | null
          link_layout?: string
          membership_button_label?: string | null
          onboarding_completed?: boolean | null
          payout_status_public?: boolean
          referral_code?: string | null
          referred_by?: string | null
          signal_breakdown_public?: boolean
          social_links?: Json | null
          theme_color?: string | null
          tip_button_label?: string | null
          tips_enabled?: boolean
          trust_score?: number
          trust_score_opt_out?: boolean
          trust_score_public?: boolean
          updated_at?: string
          username?: string
          verified_domain?: string | null
          verified_socials_public?: boolean
          website?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          notes: string | null
          tier: string
          updated_at: string
          uses: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          notes?: string | null
          tier: string
          updated_at?: string
          uses?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          notes?: string | null
          tier?: string
          updated_at?: string
          uses?: number
        }
        Relationships: []
      }
      promo_redemptions: {
        Row: {
          code: string
          id: string
          promo_code_id: string | null
          redeemed_at: string
          tier: string
          user_id: string
        }
        Insert: {
          code: string
          id?: string
          promo_code_id?: string | null
          redeemed_at?: string
          tier: string
          user_id: string
        }
        Update: {
          code?: string
          id?: string
          promo_code_id?: string | null
          redeemed_at?: string
          tier?: string
          user_id?: string
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
      stripe_agreements: {
        Row: {
          accepted_at: string
          agreement_version: string
          context: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          agreement_version?: string
          context?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          agreement_version?: string
          context?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
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
          perk_type: string
          sort_order: number
          subscription_id: string
          unlock_code: string | null
          unlock_url: string | null
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          perk_description?: string | null
          perk_name: string
          perk_type?: string
          sort_order?: number
          subscription_id: string
          unlock_code?: string | null
          unlock_url?: string | null
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          perk_description?: string | null
          perk_name?: string
          perk_type?: string
          sort_order?: number
          subscription_id?: string
          unlock_code?: string | null
          unlock_url?: string | null
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
          stripe_price_month_id: string | null
          stripe_price_year_id: string | null
          stripe_product_id: string | null
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
          stripe_price_month_id?: string | null
          stripe_price_year_id?: string | null
          stripe_product_id?: string | null
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
          stripe_price_month_id?: string | null
          stripe_price_year_id?: string | null
          stripe_product_id?: string | null
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
      trust_score_errors: {
        Row: {
          created_at: string
          error_message: string
          id: string
          resolved: boolean
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message: string
          id?: string
          resolved?: boolean
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string
          id?: string
          resolved?: boolean
          user_id?: string | null
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
      verification_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      verification_disputes: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          priority: boolean
          reason: string
          resolved_at: string | null
          resolved_by: string | null
          signal_type: string
          social_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          priority?: boolean
          reason: string
          resolved_at?: string | null
          resolved_by?: string | null
          signal_type: string
          social_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          priority?: boolean
          reason?: string
          resolved_at?: string | null
          resolved_by?: string | null
          signal_type?: string
          social_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_disputes_social_id_fkey"
            columns: ["social_id"]
            isOneToOne: false
            referencedRelation: "verified_socials"
            referencedColumns: ["id"]
          },
        ]
      }
      verified_socials: {
        Row: {
          created_at: string
          handle: string
          id: string
          last_checked_at: string | null
          last_error: string | null
          method: string
          platform: string
          user_id: string
          verification_code: string | null
          verification_status: string
          verified_at: string
        }
        Insert: {
          created_at?: string
          handle: string
          id?: string
          last_checked_at?: string | null
          last_error?: string | null
          method?: string
          platform: string
          user_id: string
          verification_code?: string | null
          verification_status?: string
          verified_at?: string
        }
        Update: {
          created_at?: string
          handle?: string
          id?: string
          last_checked_at?: string | null
          last_error?: string | null
          method?: string
          platform?: string
          user_id?: string
          verification_code?: string | null
          verification_status?: string
          verified_at?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          event_type: string
          id: string
          livemode: boolean | null
          payload_preview: Json | null
          received_at: string
          stripe_event_id: string | null
        }
        Insert: {
          event_type: string
          id?: string
          livemode?: boolean | null
          payload_preview?: Json | null
          received_at?: string
          stripe_event_id?: string | null
        }
        Update: {
          event_type?: string
          id?: string
          livemode?: boolean | null
          payload_preview?: Json | null
          received_at?: string
          stripe_event_id?: string | null
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
      get_creator_payout_status: {
        Args: { _creator_id: string }
        Returns: {
          charges_enabled: boolean
          details_submitted: boolean
          has_account: boolean
          has_past_due: boolean
          payouts_enabled: boolean
        }[]
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
      recompute_all_trust_scores: { Args: never; Returns: number }
      recompute_trust_score: { Args: { _user_id: string }; Returns: number }
      record_stripe_agreement: {
        Args: { _context: string; _ip: string; _user_agent: string }
        Returns: string
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
