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
      business_verification_requests: {
        Row: {
          created_at: string
          id: string
          provider: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          provider?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          provider?: string
          status?: string
          updated_at?: string
          user_id?: string
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
      credential_verifications: {
        Row: {
          created_at: string
          credential_type: string
          display_public: boolean
          expires_at: string | null
          id: string
          provider: string
          provider_name: string
          section_id: string
          status: string
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_issuer: string | null
          verified_title: string
        }
        Insert: {
          created_at?: string
          credential_type: string
          display_public?: boolean
          expires_at?: string | null
          id?: string
          provider?: string
          provider_name?: string
          section_id: string
          status?: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_issuer?: string | null
          verified_title: string
        }
        Update: {
          created_at?: string
          credential_type?: string
          display_public?: boolean
          expires_at?: string | null
          id?: string
          provider?: string
          provider_name?: string
          section_id?: string
          status?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_issuer?: string | null
          verified_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "credential_verifications_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: true
            referencedRelation: "profile_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      document_share_links: {
        Row: {
          created_at: string
          document_id: string
          expires_at: string
          id: string
          max_views: number | null
          owner_id: string
          password_hash: string | null
          revoked_at: string | null
          token_hash: string
          updated_at: string
          view_count: number
        }
        Insert: {
          created_at?: string
          document_id: string
          expires_at: string
          id?: string
          max_views?: number | null
          owner_id: string
          password_hash?: string | null
          revoked_at?: string | null
          token_hash: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          created_at?: string
          document_id?: string
          expires_at?: string
          id?: string
          max_views?: number | null
          owner_id?: string
          password_hash?: string | null
          revoked_at?: string | null
          token_hash?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_share_links_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          doc_type: string
          expiry_date: string | null
          file_size: number | null
          id: string
          is_public: boolean
          issue_date: string | null
          issuer: string | null
          mime_type: string | null
          note: string | null
          original_filename: string | null
          storage_path: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          expiry_date?: string | null
          file_size?: number | null
          id?: string
          is_public?: boolean
          issue_date?: string | null
          issuer?: string | null
          mime_type?: string | null
          note?: string | null
          original_filename?: string | null
          storage_path: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          expiry_date?: string | null
          file_size?: number | null
          id?: string
          is_public?: boolean
          issue_date?: string | null
          issuer?: string | null
          mime_type?: string | null
          note?: string | null
          original_filename?: string | null
          storage_path?: string
          title?: string
          updated_at?: string
          user_id?: string
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
      legal_acceptances: {
        Row: {
          accepted_at: string
          id: string
          source: string
          terms_version: string
          user_id: string
          vault_policy_version: string
        }
        Insert: {
          accepted_at?: string
          id?: string
          source: string
          terms_version: string
          user_id: string
          vault_policy_version: string
        }
        Update: {
          accepted_at?: string
          id?: string
          source?: string
          terms_version?: string
          user_id?: string
          vault_policy_version?: string
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
          code_challenge: string | null
          code_challenge_method: string | null
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
          code_challenge?: string | null
          code_challenge_method?: string | null
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
          code_challenge?: string | null
          code_challenge_method?: string | null
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
      profile_sections: {
        Row: {
          created_at: string
          data: Json
          id: string
          is_public: boolean
          kind: string
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          is_public?: boolean
          kind: string
          position?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          is_public?: boolean
          kind?: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accepts_verification_requests: boolean
          account_type: string | null
          avatar_url: string | null
          bio: string | null
          business_verification_expires_at: string | null
          business_verification_provider: string | null
          business_verified: boolean
          business_verified_at: string | null
          category: string | null
          comp_tier: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          domain_verified: boolean
          follower_count: number | null
          id: string
          id_verified: boolean
          is_elite: boolean | null
          is_featured: boolean | null
          is_pro: boolean | null
          is_verified: boolean | null
          link_layout: string
          membership_button_label: string | null
          onboarding_completed: boolean | null
          organization_country: string | null
          organization_industry: string | null
          organization_legal_name: string | null
          payout_status_public: boolean
          pro_identity_check_used: boolean
          referral_code: string | null
          referred_by: string | null
          search_visible: boolean
          show_legal_name: boolean
          signal_breakdown_public: boolean
          social_links: Json | null
          stripe_identity_session_id: string | null
          theme_color: string | null
          tip_button_label: string | null
          tips_enabled: boolean
          trust_score: number
          trust_score_opt_out: boolean
          trust_score_public: boolean
          updated_at: string
          username: string
          verification_kind: string | null
          verification_status: string
          verified_at: string | null
          verified_business_country: string | null
          verified_business_name: string | null
          verified_business_tax_id_last4: string | null
          verified_country: string | null
          verified_dob: string | null
          verified_domain: string | null
          verified_first_name: string | null
          verified_full_name: string | null
          verified_last_name: string | null
          verified_socials_public: boolean
          website: string | null
        }
        Insert: {
          accepts_verification_requests?: boolean
          account_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          business_verification_expires_at?: string | null
          business_verification_provider?: string | null
          business_verified?: boolean
          business_verified_at?: string | null
          category?: string | null
          comp_tier?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          domain_verified?: boolean
          follower_count?: number | null
          id: string
          id_verified?: boolean
          is_elite?: boolean | null
          is_featured?: boolean | null
          is_pro?: boolean | null
          is_verified?: boolean | null
          link_layout?: string
          membership_button_label?: string | null
          onboarding_completed?: boolean | null
          organization_country?: string | null
          organization_industry?: string | null
          organization_legal_name?: string | null
          payout_status_public?: boolean
          pro_identity_check_used?: boolean
          referral_code?: string | null
          referred_by?: string | null
          search_visible?: boolean
          show_legal_name?: boolean
          signal_breakdown_public?: boolean
          social_links?: Json | null
          stripe_identity_session_id?: string | null
          theme_color?: string | null
          tip_button_label?: string | null
          tips_enabled?: boolean
          trust_score?: number
          trust_score_opt_out?: boolean
          trust_score_public?: boolean
          updated_at?: string
          username: string
          verification_kind?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_business_country?: string | null
          verified_business_name?: string | null
          verified_business_tax_id_last4?: string | null
          verified_country?: string | null
          verified_dob?: string | null
          verified_domain?: string | null
          verified_first_name?: string | null
          verified_full_name?: string | null
          verified_last_name?: string | null
          verified_socials_public?: boolean
          website?: string | null
        }
        Update: {
          accepts_verification_requests?: boolean
          account_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          business_verification_expires_at?: string | null
          business_verification_provider?: string | null
          business_verified?: boolean
          business_verified_at?: string | null
          category?: string | null
          comp_tier?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          domain_verified?: boolean
          follower_count?: number | null
          id?: string
          id_verified?: boolean
          is_elite?: boolean | null
          is_featured?: boolean | null
          is_pro?: boolean | null
          is_verified?: boolean | null
          link_layout?: string
          membership_button_label?: string | null
          onboarding_completed?: boolean | null
          organization_country?: string | null
          organization_industry?: string | null
          organization_legal_name?: string | null
          payout_status_public?: boolean
          pro_identity_check_used?: boolean
          referral_code?: string | null
          referred_by?: string | null
          search_visible?: boolean
          show_legal_name?: boolean
          signal_breakdown_public?: boolean
          social_links?: Json | null
          stripe_identity_session_id?: string | null
          theme_color?: string | null
          tip_button_label?: string | null
          tips_enabled?: boolean
          trust_score?: number
          trust_score_opt_out?: boolean
          trust_score_public?: boolean
          updated_at?: string
          username?: string
          verification_kind?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_business_country?: string | null
          verified_business_name?: string | null
          verified_business_tax_id_last4?: string | null
          verified_country?: string | null
          verified_dob?: string | null
          verified_domain?: string | null
          verified_first_name?: string | null
          verified_full_name?: string | null
          verified_last_name?: string | null
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
      verifiedly_billing: {
        Row: {
          annual_card_credit_available: boolean
          annual_card_credit_granted_at: string | null
          created_at: string
          documents_cancel_at_period_end: boolean
          documents_current_period_end: string | null
          documents_interval: string | null
          documents_status: string
          identity_attempt_count: number
          identity_last_session_id: string | null
          identity_status: string
          pro_cancel_at_period_end: boolean
          pro_current_period_end: string | null
          pro_interval: string | null
          pro_started_at: string | null
          pro_status: string
          pro_subscription_id: string | null
          stripe_customer_id: string | null
          updated_at: string
          user_id: string
          verification_checkout_session_id: string | null
          verification_payment_status: string
        }
        Insert: {
          annual_card_credit_available?: boolean
          annual_card_credit_granted_at?: string | null
          created_at?: string
          documents_cancel_at_period_end?: boolean
          documents_current_period_end?: string | null
          documents_interval?: string | null
          documents_status?: string
          identity_attempt_count?: number
          identity_last_session_id?: string | null
          identity_status?: string
          pro_cancel_at_period_end?: boolean
          pro_current_period_end?: string | null
          pro_interval?: string | null
          pro_started_at?: string | null
          pro_status?: string
          pro_subscription_id?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id: string
          verification_checkout_session_id?: string | null
          verification_payment_status?: string
        }
        Update: {
          annual_card_credit_available?: boolean
          annual_card_credit_granted_at?: string | null
          created_at?: string
          documents_cancel_at_period_end?: boolean
          documents_current_period_end?: string | null
          documents_interval?: string | null
          documents_status?: string
          identity_attempt_count?: number
          identity_last_session_id?: string | null
          identity_status?: string
          pro_cancel_at_period_end?: boolean
          pro_current_period_end?: string | null
          pro_interval?: string | null
          pro_started_at?: string | null
          pro_status?: string
          pro_subscription_id?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string
          verification_checkout_session_id?: string | null
          verification_payment_status?: string
        }
        Relationships: []
      }
      verifiedly_support_tickets: {
        Row: {
          admin_response: string | null
          category: string
          created_at: string
          id: string
          message: string
          priority: string
          responded_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          category?: string
          created_at?: string
          id?: string
          message: string
          priority?: string
          responded_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          category?: string
          created_at?: string
          id?: string
          message?: string
          priority?: string
          responded_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      verifiedly_tap_card_orders: {
        Row: {
          admin_notes: string | null
          amount_cents: number
          card_id: string
          created_at: string
          currency: string
          delivered_at: string | null
          fulfillment_order_id: string | null
          fulfillment_provider: string | null
          id: string
          material: string
          order_source: string
          preview_approved_at: string | null
          printed_handle: string | null
          printed_name: string | null
          printed_title: string | null
          production_started_at: string | null
          shipped_at: string | null
          shipping_address: Json | null
          shipping_name: string | null
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          submitted_at: string | null
          template_version: string
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount_cents?: number
          card_id: string
          created_at?: string
          currency?: string
          delivered_at?: string | null
          fulfillment_order_id?: string | null
          fulfillment_provider?: string | null
          id?: string
          material: string
          order_source: string
          preview_approved_at?: string | null
          printed_handle?: string | null
          printed_name?: string | null
          printed_title?: string | null
          production_started_at?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_name?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          submitted_at?: string | null
          template_version?: string
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount_cents?: number
          card_id?: string
          created_at?: string
          currency?: string
          delivered_at?: string | null
          fulfillment_order_id?: string | null
          fulfillment_provider?: string | null
          id?: string
          material?: string
          order_source?: string
          preview_approved_at?: string | null
          printed_handle?: string | null
          printed_name?: string | null
          printed_title?: string | null
          production_started_at?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_name?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          submitted_at?: string | null
          template_version?: string
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verifiedly_tap_card_orders_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "verifiedly_tap_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      verifiedly_tap_cards: {
        Row: {
          activated_at: string | null
          card_serial: string
          created_at: string
          disabled_at: string | null
          id: string
          last_tapped_at: string | null
          manufacturer: string | null
          manufacturer_order_id: string | null
          material: string
          public_token: string
          status: string
          tap_count: number
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          card_serial?: string
          created_at?: string
          disabled_at?: string | null
          id?: string
          last_tapped_at?: string | null
          manufacturer?: string | null
          manufacturer_order_id?: string | null
          material?: string
          public_token?: string
          status?: string
          tap_count?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          card_serial?: string
          created_at?: string
          disabled_at?: string | null
          id?: string
          last_tapped_at?: string | null
          manufacturer?: string | null
          manufacturer_order_id?: string | null
          material?: string
          public_token?: string
          status?: string
          tap_count?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string
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
      admin_update_verifiedly_tap_card_order: {
        Args: {
          p_admin_notes?: string
          p_fulfillment_order_id?: string
          p_fulfillment_provider?: string
          p_order_id: string
          p_status: string
          p_tracking_number?: string
          p_tracking_url?: string
        }
        Returns: string
      }
      consume_oauth_code: {
        Args: { _client_id: string; _code: string; _redirect_uri: string }
        Returns: {
          code_challenge: string
          code_challenge_method: string
          scopes: string[]
          user_id: string
        }[]
      }
      creator_has_payments: { Args: { _creator_id: string }; Returns: boolean }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
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
      is_age_over: {
        Args: { _user_id: string; _years: number }
        Returns: boolean
      }
      manage_verifiedly_tap_card: {
        Args: { p_action: string; p_card_id: string }
        Returns: string
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
      record_verifiedly_tap_card_order: {
        Args: {
          p_amount_cents: number
          p_checkout_session_id: string
          p_currency: string
          p_material: string
          p_order_source: string
          p_payment_intent_id: string
          p_preview_approved_at: string
          p_printed_handle: string
          p_printed_name: string
          p_printed_title: string
          p_shipping_address: Json
          p_shipping_name: string
          p_template_version: string
          p_user_id: string
        }
        Returns: Json
      }
      request_business_verification: { Args: never; Returns: string }
      request_credential_verification: {
        Args: { _credential_type: string; _section_id: string }
        Returns: string
      }
      resolve_verifiedly_tap_card: {
        Args: { p_source?: string; p_token: string }
        Returns: {
          card_status: string
          profile_display_name: string
          profile_username: string
        }[]
      }
      verifiedly_is_admin: { Args: never; Returns: boolean }
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
