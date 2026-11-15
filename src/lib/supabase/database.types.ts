// Generated from the mslab-dev Supabase project schema. Do not edit by hand.
// Regenerate after each migration (Supabase MCP generate_typescript_types or
// `npx supabase gen types typescript --project-id <ref>`).

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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description_ar: string | null
          description_en: string | null
          description_fr: string | null
          id: string
          image_path: string | null
          is_published: boolean
          name_ar: string | null
          name_en: string | null
          name_fr: string
          parent_id: string | null
          slug_ar: string | null
          slug_en: string | null
          slug_fr: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          description_fr?: string | null
          id?: string
          image_path?: string | null
          is_published?: boolean
          name_ar?: string | null
          name_en?: string | null
          name_fr: string
          parent_id?: string | null
          slug_ar?: string | null
          slug_en?: string | null
          slug_fr: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          description_fr?: string | null
          id?: string
          image_path?: string | null
          is_published?: boolean
          name_ar?: string | null
          name_en?: string | null
          name_fr?: string
          parent_id?: string | null
          slug_ar?: string | null
          slug_en?: string | null
          slug_fr?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_request_details: {
        Row: {
          created_at: string
          deadline: string | null
          depth: number | null
          description: string
          dimension_unit: string
          finishings: string[]
          height: number | null
          material: string | null
          project_type: string
          quantity: number
          quotation_request_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          depth?: number | null
          description: string
          dimension_unit?: string
          finishings?: string[]
          height?: number | null
          material?: string | null
          project_type: string
          quantity: number
          quotation_request_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          deadline?: string | null
          depth?: number | null
          description?: string
          dimension_unit?: string
          finishings?: string[]
          height?: number | null
          material?: string | null
          project_type?: string
          quantity?: number
          quotation_request_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_request_details_quotation_request_id_fkey"
            columns: ["quotation_request_id"]
            isOneToOne: true
            referencedRelation: "quotation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          consent: boolean
          created_at: string
          email: string
          full_name: string
          id: string
          ip_hash: string | null
          locale: string
          message: string
          notification_error: string | null
          notified_at: string | null
          phone: string | null
          read_at: string | null
          reference: string
          source_path: string | null
          status: Database["public"]["Enums"]["inquiry_status"]
          subject: string
          submission_id: string
          updated_at: string
        }
        Insert: {
          consent: boolean
          created_at?: string
          email: string
          full_name: string
          id?: string
          ip_hash?: string | null
          locale?: string
          message: string
          notification_error?: string | null
          notified_at?: string | null
          phone?: string | null
          read_at?: string | null
          reference?: string
          source_path?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          subject: string
          submission_id: string
          updated_at?: string
        }
        Update: {
          consent?: boolean
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          ip_hash?: string | null
          locale?: string
          message?: string
          notification_error?: string | null
          notified_at?: string | null
          phone?: string | null
          read_at?: string | null
          reference?: string
          source_path?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          subject?: string
          submission_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      mockup_products: {
        Row: {
          is_active: boolean
          key: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          is_active?: boolean
          key: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          is_active?: boolean
          key?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          caption_ar: string | null
          caption_en: string | null
          caption_fr: string | null
          created_at: string
          id: string
          image_path: string | null
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          title_ar: string | null
          title_en: string | null
          title_fr: string
          updated_at: string
        }
        Insert: {
          caption_ar?: string | null
          caption_en?: string | null
          caption_fr?: string | null
          created_at?: string
          id?: string
          image_path?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          title_ar?: string | null
          title_en?: string | null
          title_fr: string
          updated_at?: string
        }
        Update: {
          caption_ar?: string | null
          caption_en?: string | null
          caption_fr?: string | null
          created_at?: string
          id?: string
          image_path?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          title_ar?: string | null
          title_en?: string | null
          title_fr?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt_ar: string | null
          alt_en: string | null
          alt_fr: string | null
          created_at: string
          height: number | null
          id: string
          is_primary: boolean
          product_id: string
          sort_order: number
          storage_path: string
          width: number | null
        }
        Insert: {
          alt_ar?: string | null
          alt_en?: string | null
          alt_fr?: string | null
          created_at?: string
          height?: number | null
          id?: string
          is_primary?: boolean
          product_id: string
          sort_order?: number
          storage_path: string
          width?: number | null
        }
        Update: {
          alt_ar?: string | null
          alt_en?: string | null
          alt_fr?: string | null
          created_at?: string
          height?: number | null
          id?: string
          is_primary?: boolean
          product_id?: string
          sort_order?: number
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_options: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["production_option_kind"]
          name_ar: string | null
          name_en: string | null
          name_fr: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["production_option_kind"]
          name_ar?: string | null
          name_en?: string | null
          name_fr: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["production_option_kind"]
          name_ar?: string | null
          name_en?: string | null
          name_fr?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          created_by: string | null
          description_ar: string | null
          description_en: string | null
          description_fr: string | null
          id: string
          is_featured: boolean
          name_ar: string | null
          name_en: string | null
          name_fr: string
          published_at: string | null
          search_text: string | null
          short_description_ar: string | null
          short_description_en: string | null
          short_description_fr: string | null
          sku: string | null
          slug_ar: string | null
          slug_en: string | null
          slug_fr: string
          sort_order: number
          specifications: Json
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          description_fr?: string | null
          id?: string
          is_featured?: boolean
          name_ar?: string | null
          name_en?: string | null
          name_fr: string
          published_at?: string | null
          search_text?: string | null
          short_description_ar?: string | null
          short_description_en?: string | null
          short_description_fr?: string | null
          sku?: string | null
          slug_ar?: string | null
          slug_en?: string | null
          slug_fr: string
          sort_order?: number
          specifications?: Json
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          description_fr?: string | null
          id?: string
          is_featured?: boolean
          name_ar?: string | null
          name_en?: string | null
          name_fr?: string
          published_at?: string | null
          search_text?: string | null
          short_description_ar?: string | null
          short_description_en?: string | null
          short_description_fr?: string | null
          sku?: string | null
          slug_ar?: string | null
          slug_en?: string | null
          slug_fr?: string
          sort_order?: number
          specifications?: Json
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_files: {
        Row: {
          created_at: string
          id: string
          mime_type: string | null
          original_name: string
          quotation_request_id: string
          size_bytes: number | null
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          mime_type?: string | null
          original_name: string
          quotation_request_id: string
          size_bytes?: number | null
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          mime_type?: string | null
          original_name?: string
          quotation_request_id?: string
          size_bytes?: number | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_files_quotation_request_id_fkey"
            columns: ["quotation_request_id"]
            isOneToOne: false
            referencedRelation: "quotation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          created_at: string
          id: string
          product_id: string | null
          product_name_snapshot: string
          product_sku_snapshot: string | null
          quantity: number
          quotation_request_id: string
          sort_order: number
          specifications: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
          product_name_snapshot: string
          product_sku_snapshot?: string | null
          quantity: number
          quotation_request_id: string
          sort_order?: number
          specifications?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
          product_name_snapshot?: string
          product_sku_snapshot?: string | null
          quantity?: number
          quotation_request_id?: string
          sort_order?: number
          specifications?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_quotation_request_id_fkey"
            columns: ["quotation_request_id"]
            isOneToOne: false
            referencedRelation: "quotation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_requests: {
        Row: {
          assigned_to: string | null
          company_name: string | null
          consent: boolean
          created_at: string
          email: string
          full_name: string
          id: string
          internal_notes: string | null
          ip_hash: string | null
          kind: Database["public"]["Enums"]["request_kind"]
          locale: string
          message: string | null
          notification_error: string | null
          notified_at: string | null
          phone: string
          preferred_contact: Database["public"]["Enums"]["contact_method"]
          reference: string
          source_path: string | null
          status: Database["public"]["Enums"]["quotation_status"]
          status_changed_at: string
          submission_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company_name?: string | null
          consent: boolean
          created_at?: string
          email: string
          full_name: string
          id?: string
          internal_notes?: string | null
          ip_hash?: string | null
          kind?: Database["public"]["Enums"]["request_kind"]
          locale?: string
          message?: string | null
          notification_error?: string | null
          notified_at?: string | null
          phone: string
          preferred_contact?: Database["public"]["Enums"]["contact_method"]
          reference?: string
          source_path?: string | null
          status?: Database["public"]["Enums"]["quotation_status"]
          status_changed_at?: string
          submission_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company_name?: string | null
          consent?: boolean
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          internal_notes?: string | null
          ip_hash?: string | null
          kind?: Database["public"]["Enums"]["request_kind"]
          locale?: string
          message?: string | null
          notification_error?: string | null
          notified_at?: string | null
          phone?: string
          preferred_contact?: Database["public"]["Enums"]["contact_method"]
          reference?: string
          source_path?: string | null
          status?: Database["public"]["Enums"]["quotation_status"]
          status_changed_at?: string
          submission_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_status_events: {
        Row: {
          created_at: string
          id: number
          quotation_request_id: string
          status: Database["public"]["Enums"]["quotation_status"]
        }
        Insert: {
          created_at?: string
          id?: never
          quotation_request_id: string
          status: Database["public"]["Enums"]["quotation_status"]
        }
        Update: {
          created_at?: string
          id?: never
          quotation_request_id?: string
          status?: Database["public"]["Enums"]["quotation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "quotation_status_events_quotation_request_id_fkey"
            columns: ["quotation_request_id"]
            isOneToOne: false
            referencedRelation: "quotation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description_ar: string | null
          description_en: string | null
          description_fr: string | null
          id: string
          image_path: string | null
          is_featured: boolean
          name_ar: string | null
          name_en: string | null
          name_fr: string
          slug_ar: string | null
          slug_en: string | null
          slug_fr: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          summary_ar: string | null
          summary_en: string | null
          summary_fr: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          description_fr?: string | null
          id?: string
          image_path?: string | null
          is_featured?: boolean
          name_ar?: string | null
          name_en?: string | null
          name_fr: string
          slug_ar?: string | null
          slug_en?: string | null
          slug_fr: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          summary_ar?: string | null
          summary_en?: string | null
          summary_fr?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          description_fr?: string | null
          id?: string
          image_path?: string | null
          is_featured?: boolean
          name_ar?: string | null
          name_en?: string | null
          name_fr?: string
          slug_ar?: string | null
          slug_en?: string | null
          slug_fr?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          summary_ar?: string | null
          summary_en?: string | null
          summary_fr?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          about_ar: string | null
          about_en: string | null
          about_fr: string | null
          address_ar: string | null
          address_en: string | null
          address_fr: string | null
          company_name: string | null
          email: string | null
          enabled_locales: string[]
          highlights_ar: string | null
          highlights_en: string | null
          highlights_fr: string | null
          legal_notice_ar: string | null
          legal_notice_en: string | null
          legal_notice_fr: string | null
          privacy_policy_ar: string | null
          privacy_policy_en: string | null
          privacy_policy_fr: string | null
          id: number
          legal_name: string | null
          maps_url: string | null
          mission_ar: string | null
          mission_en: string | null
          mission_fr: string | null
          opening_hours_ar: string | null
          opening_hours_en: string | null
          opening_hours_fr: string | null
          phone: string | null
          social_facebook: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_youtube: string | null
          updated_at: string
          updated_by: string | null
          values_ar: string | null
          values_en: string | null
          values_fr: string | null
          whatsapp_number: string | null
        }
        Insert: {
          about_ar?: string | null
          about_en?: string | null
          about_fr?: string | null
          address_ar?: string | null
          address_en?: string | null
          address_fr?: string | null
          company_name?: string | null
          email?: string | null
          enabled_locales?: string[]
          highlights_ar?: string | null
          highlights_en?: string | null
          highlights_fr?: string | null
          legal_notice_ar?: string | null
          legal_notice_en?: string | null
          legal_notice_fr?: string | null
          privacy_policy_ar?: string | null
          privacy_policy_en?: string | null
          privacy_policy_fr?: string | null
          id?: number
          legal_name?: string | null
          maps_url?: string | null
          mission_ar?: string | null
          mission_en?: string | null
          mission_fr?: string | null
          opening_hours_ar?: string | null
          opening_hours_en?: string | null
          opening_hours_fr?: string | null
          phone?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_youtube?: string | null
          updated_at?: string
          updated_by?: string | null
          values_ar?: string | null
          values_en?: string | null
          values_fr?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          about_ar?: string | null
          about_en?: string | null
          about_fr?: string | null
          address_ar?: string | null
          address_en?: string | null
          address_fr?: string | null
          company_name?: string | null
          email?: string | null
          enabled_locales?: string[]
          highlights_ar?: string | null
          highlights_en?: string | null
          highlights_fr?: string | null
          legal_notice_ar?: string | null
          legal_notice_en?: string | null
          legal_notice_fr?: string | null
          privacy_policy_ar?: string | null
          privacy_policy_en?: string | null
          privacy_policy_fr?: string | null
          id?: number
          legal_name?: string | null
          maps_url?: string | null
          mission_ar?: string | null
          mission_en?: string | null
          mission_fr?: string | null
          opening_hours_ar?: string | null
          opening_hours_en?: string | null
          opening_hours_fr?: string | null
          phone?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_youtube?: string | null
          updated_at?: string
          updated_by?: string | null
          values_ar?: string | null
          values_en?: string | null
          values_fr?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_upload_ticket: {
        Args: { ip_hash: string | null; submission_key: string }
        Returns: string
      }
      record_submission_notification: {
        Args: { error_message: string | null; kind: string; reference: string; submission_key: string }
        Returns: undefined
      }
      submit_contact_inquiry: {
        Args: { payload: Json; submission_key: string }
        Returns: string
      }
      submit_custom_request: {
        Args: { payload: Json; submission_key: string }
        Returns: string
      }
      submit_quotation_request: {
        Args: { payload: Json; submission_key: string }
        Returns: string
      }
      track_quotation: {
        Args: { ip_hash: string | null; p_email: string; p_reference: string; submission_key: string }
        Returns: Json
      }
    }
    Enums: {
      admin_role: "owner" | "editor"
      contact_method: "email" | "phone" | "whatsapp"
      content_status: "draft" | "published" | "archived"
      inquiry_status: "new" | "read" | "replied" | "closed" | "spam"
      production_option_kind: "material" | "finishing"
      quotation_status:
        | "new"
        | "in_review"
        | "contacted"
        | "quoted"
        | "accepted"
        | "in_production"
        | "ready"
        | "delivered"
        | "rejected"
        | "closed"
      request_kind: "catalog" | "custom"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      admin_role: ["owner", "editor"],
      contact_method: ["email", "phone", "whatsapp"],
      content_status: ["draft", "published", "archived"],
      inquiry_status: ["new", "read", "replied", "closed", "spam"],
      production_option_kind: ["material", "finishing"],
      quotation_status: [
        "new",
        "in_review",
        "contacted",
        "quoted",
        "accepted",
        "in_production",
        "ready",
        "delivered",
        "rejected",
        "closed",
      ],
      request_kind: ["catalog", "custom"],
    },
  },
} as const
