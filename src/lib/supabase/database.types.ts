// Generated from the mslab-dev Supabase project schema. Do not edit by hand.
// Regenerate after each migration (Supabase MCP generate_typescript_types or
// `npx supabase gen types typescript --project-id <ref>`).
// Then re-apply the nullable RPC args: admin_auth_guard / create_upload_ticket / track_quotation
// ip_hash and record_submission_notification error_message accept null (the generator cannot express it).

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
          department_id: string | null
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          job_title: string | null
          kind: string
          phone: string | null
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          job_title?: string | null
          kind?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          job_title?: string | null
          kind?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      business_activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["business_activity_type"]
          created_at: string
          created_by: string
          customer_id: string | null
          description: string | null
          id: string
          occurred_at: string
          responsible_id: string | null
          sale_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["business_activity_type"]
          created_at?: string
          created_by?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          occurred_at?: string
          responsible_id?: string | null
          sale_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["business_activity_type"]
          created_at?: string
          created_by?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          occurred_at?: string
          responsible_id?: string | null
          sale_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_activities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "business_customer_balances"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "business_activities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "business_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_activities_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_activities_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "business_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      business_activity_comments: {
        Row: {
          activity_id: string
          author_id: string
          body: string
          created_at: string
          id: string
        }
        Insert: {
          activity_id: string
          author_id?: string
          body: string
          created_at?: string
          id?: string
        }
        Update: {
          activity_id?: string
          author_id?: string
          body?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_activity_comments_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "business_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_activity_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_attachments: {
        Row: {
          created_at: string
          created_by: string
          entity_id: string
          entity_type: string
          file_name: string
          id: string
          mime_type: string
          size_bytes: number
          storage_path: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          entity_id: string
          entity_type: string
          file_name: string
          id?: string
          mime_type: string
          size_bytes: number
          storage_path: string
        }
        Update: {
          created_at?: string
          created_by?: string
          entity_id?: string
          entity_type?: string
          file_name?: string
          id?: string
          mime_type?: string
          size_bytes?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_attachments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["business_category_kind"]
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["business_category_kind"]
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["business_category_kind"]
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      business_customer_notes: {
        Row: {
          body: string
          created_at: string
          created_by: string
          customer_id: string
          id: string
          kind: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string
          customer_id: string
          id?: string
          kind?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string
          customer_id?: string
          id?: string
          kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_customer_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_customer_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "business_customer_balances"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "business_customer_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "business_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      business_customers: {
        Row: {
          address: string | null
          city: string | null
          contact_name: string | null
          created_at: string
          created_by: string | null
          customer_type: Database["public"]["Enums"]["business_customer_type"]
          email: string | null
          id: string
          is_archived: boolean
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          customer_type?: Database["public"]["Enums"]["business_customer_type"]
          email?: string | null
          id?: string
          is_archived?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          customer_type?: Database["public"]["Enums"]["business_customer_type"]
          email?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_daily_reports: {
        Row: {
          closed_at: string
          closed_by: string | null
          decisions: string | null
          id: string
          observations: string | null
          priorities: string | null
          problems: string | null
          report_date: string
          status: Database["public"]["Enums"]["business_report_status"]
          summary: Json
          timeline: Json
          updated_at: string
          version: number
        }
        Insert: {
          closed_at?: string
          closed_by?: string | null
          decisions?: string | null
          id?: string
          observations?: string | null
          priorities?: string | null
          problems?: string | null
          report_date: string
          status?: Database["public"]["Enums"]["business_report_status"]
          summary: Json
          timeline?: Json
          updated_at?: string
          version?: number
        }
        Update: {
          closed_at?: string
          closed_by?: string | null
          decisions?: string | null
          id?: string
          observations?: string | null
          priorities?: string | null
          problems?: string | null
          report_date?: string
          status?: Database["public"]["Enums"]["business_report_status"]
          summary?: Json
          timeline?: Json
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_daily_reports_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_expense_items: {
        Row: {
          created_at: string
          expense_id: string
          id: string
          line_total: number
          product_id: string
          quantity: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          expense_id: string
          id?: string
          line_total: number
          product_id: string
          quantity: number
          unit_cost: number
        }
        Update: {
          created_at?: string
          expense_id?: string
          id?: string
          line_total?: number
          product_id?: string
          quantity?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_expense_items_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "business_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_expense_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "business_products"
            referencedColumns: ["id"]
          },
        ]
      }
      business_expenses: {
        Row: {
          amount: number
          category_id: string | null
          client_key: string
          created_at: string
          created_by: string | null
          description: string | null
          expense_date: string
          id: string
          is_void: boolean
          label: string
          payment_method: Database["public"]["Enums"]["business_payment_method"]
          reference: string | null
          supplier_id: string | null
          treatment: Database["public"]["Enums"]["business_expense_treatment"]
          updated_at: string
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          client_key: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date: string
          id?: string
          is_void?: boolean
          label: string
          payment_method: Database["public"]["Enums"]["business_payment_method"]
          reference?: string | null
          supplier_id?: string | null
          treatment?: Database["public"]["Enums"]["business_expense_treatment"]
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          client_key?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          is_void?: boolean
          label?: string
          payment_method?: Database["public"]["Enums"]["business_payment_method"]
          reference?: string | null
          supplier_id?: string | null
          treatment?: Database["public"]["Enums"]["business_expense_treatment"]
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "business_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_expenses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "business_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_expenses_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_payments: {
        Row: {
          amount: number
          client_key: string
          created_at: string
          created_by: string | null
          customer_id: string | null
          id: string
          is_void: boolean
          method: Database["public"]["Enums"]["business_payment_method"]
          notes: string | null
          paid_at: string
          reference: string | null
          sale_id: string
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          amount: number
          client_key: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          is_void?: boolean
          method: Database["public"]["Enums"]["business_payment_method"]
          notes?: string | null
          paid_at?: string
          reference?: string | null
          sale_id: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          amount?: number
          client_key?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          is_void?: boolean
          method?: Database["public"]["Enums"]["business_payment_method"]
          notes?: string | null
          paid_at?: string
          reference?: string | null
          sale_id?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "business_customer_balances"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "business_payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "business_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "business_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_payments_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_products: {
        Row: {
          allow_negative: boolean
          archived_at: string | null
          catalog_product_id: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_path: string | null
          is_archived: boolean
          item_type: Database["public"]["Enums"]["business_item_type"]
          min_stock: number | null
          name: string
          purchase_cost: number | null
          quantity_on_hand: number
          selling_price: number | null
          sku: string | null
          track_stock: boolean
          unit: string
          updated_at: string
        }
        Insert: {
          allow_negative?: boolean
          archived_at?: string | null
          catalog_product_id?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_path?: string | null
          is_archived?: boolean
          item_type?: Database["public"]["Enums"]["business_item_type"]
          min_stock?: number | null
          name: string
          purchase_cost?: number | null
          quantity_on_hand?: number
          selling_price?: number | null
          sku?: string | null
          track_stock?: boolean
          unit?: string
          updated_at?: string
        }
        Update: {
          allow_negative?: boolean
          archived_at?: string | null
          catalog_product_id?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_path?: string | null
          is_archived?: boolean
          item_type?: Database["public"]["Enums"]["business_item_type"]
          min_stock?: number | null
          name?: string
          purchase_cost?: number | null
          quantity_on_hand?: number
          selling_price?: number | null
          sku?: string | null
          track_stock?: boolean
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_products_catalog_product_id_fkey"
            columns: ["catalog_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "business_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_report_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          report_id: string
        }
        Insert: {
          author_id?: string
          body: string
          created_at?: string
          id?: string
          report_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_report_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_report_comments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "business_daily_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      business_report_corrections: {
        Row: {
          corrected_at: string
          corrected_by: string | null
          id: string
          next: Json
          previous: Json
          reason: string
          report_id: string
          version: number
        }
        Insert: {
          corrected_at?: string
          corrected_by?: string | null
          id?: string
          next: Json
          previous: Json
          reason: string
          report_id: string
          version: number
        }
        Update: {
          corrected_at?: string
          corrected_by?: string | null
          id?: string
          next?: Json
          previous?: Json
          reason?: string
          report_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_report_corrections_corrected_by_fkey"
            columns: ["corrected_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_report_corrections_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "business_daily_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      business_sale_events: {
        Row: {
          amount: number | null
          created_at: string
          created_by: string | null
          event_type: string
          from_status:
            | Database["public"]["Enums"]["business_order_status"]
            | null
          id: number
          note: string | null
          sale_id: string
          to_status: Database["public"]["Enums"]["business_order_status"] | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          created_by?: string | null
          event_type: string
          from_status?:
            | Database["public"]["Enums"]["business_order_status"]
            | null
          id?: never
          note?: string | null
          sale_id: string
          to_status?:
            | Database["public"]["Enums"]["business_order_status"]
            | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          created_by?: string | null
          event_type?: string
          from_status?:
            | Database["public"]["Enums"]["business_order_status"]
            | null
          id?: never
          note?: string | null
          sale_id?: string
          to_status?:
            | Database["public"]["Enums"]["business_order_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "business_sale_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_sale_events_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "business_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      business_sale_items: {
        Row: {
          created_at: string
          deducts_stock: boolean
          description: string
          discount_amount: number
          id: string
          line_kind: Database["public"]["Enums"]["business_line_kind"]
          line_total: number
          position: number
          product_id: string | null
          quantity: number
          sale_id: string
          unit: string | null
          unit_cost: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          deducts_stock?: boolean
          description: string
          discount_amount?: number
          id?: string
          line_kind: Database["public"]["Enums"]["business_line_kind"]
          line_total: number
          position: number
          product_id?: string | null
          quantity: number
          sale_id: string
          unit?: string | null
          unit_cost?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string
          deducts_stock?: boolean
          description?: string
          discount_amount?: number
          id?: string
          line_kind?: Database["public"]["Enums"]["business_line_kind"]
          line_total?: number
          position?: number
          product_id?: string | null
          quantity?: number
          sale_id?: string
          unit?: string | null
          unit_cost?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "business_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "business_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      business_sales: {
        Row: {
          amount_paid: number
          balance: number | null
          cancel_reason: string | null
          cancelled_at: string | null
          client_key: string
          created_at: string
          created_by: string | null
          customer_id: string | null
          discount_amount: number
          due_date: string | null
          id: string
          notes: string | null
          number: string
          order_status: Database["public"]["Enums"]["business_order_status"]
          payment_status: Database["public"]["Enums"]["business_payment_status"]
          quotation_request_id: string | null
          sold_at: string
          status_changed_at: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          balance?: number | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          client_key: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          discount_amount?: number
          due_date?: string | null
          id?: string
          notes?: string | null
          number: string
          order_status?: Database["public"]["Enums"]["business_order_status"]
          payment_status?: Database["public"]["Enums"]["business_payment_status"]
          quotation_request_id?: string | null
          sold_at?: string
          status_changed_at?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          balance?: number | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          client_key?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          discount_amount?: number
          due_date?: string | null
          id?: string
          notes?: string | null
          number?: string
          order_status?: Database["public"]["Enums"]["business_order_status"]
          payment_status?: Database["public"]["Enums"]["business_payment_status"]
          quotation_request_id?: string | null
          sold_at?: string
          status_changed_at?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_sales_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "business_customer_balances"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "business_sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "business_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_sales_quotation_request_id_fkey"
            columns: ["quotation_request_id"]
            isOneToOne: false
            referencedRelation: "quotation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      business_suppliers: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          is_archived: boolean
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_archived?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_suppliers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_task_comments: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          kind: string
          task_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          kind?: string
          task_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          kind?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_task_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "business_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      business_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          customer_id: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["business_task_priority"]
          report_id: string | null
          sale_id: string | null
          status: Database["public"]["Enums"]["business_task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["business_task_priority"]
          report_id?: string | null
          sale_id?: string | null
          status?: Database["public"]["Enums"]["business_task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["business_task_priority"]
          report_id?: string | null
          sale_id?: string | null
          status?: Database["public"]["Enums"]["business_task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_tasks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "business_customer_balances"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "business_tasks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "business_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_tasks_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "business_daily_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_tasks_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "business_sales"
            referencedColumns: ["id"]
          },
        ]
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
          design: Json | null
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
          design?: Json | null
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
          design?: Json | null
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
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          manager_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_request_details: {
        Row: {
          budget: string | null
          created_at: string
          deadline: string | null
          description: string
          existing_website: string | null
          features: string[]
          project_types: string[]
          quotation_request_id: string
        }
        Insert: {
          budget?: string | null
          created_at?: string
          deadline?: string | null
          description: string
          existing_website?: string | null
          features?: string[]
          project_types: string[]
          quotation_request_id: string
        }
        Update: {
          budget?: string | null
          created_at?: string
          deadline?: string | null
          description?: string
          existing_website?: string | null
          features?: string[]
          project_types?: string[]
          quotation_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_request_details_quotation_request_id_fkey"
            columns: ["quotation_request_id"]
            isOneToOne: true
            referencedRelation: "quotation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      document_counters: {
        Row: {
          doc_type: string
          last_value: number
          period: number
        }
        Insert: {
          doc_type: string
          last_value: number
          period: number
        }
        Update: {
          doc_type?: string
          last_value?: number
          period?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_counters_doc_type_fkey"
            columns: ["doc_type"]
            isOneToOne: false
            referencedRelation: "document_sequences"
            referencedColumns: ["doc_type"]
          },
        ]
      }
      document_sequences: {
        Row: {
          doc_type: string
          padding: number
          prefix: string
          sort_order: number
          updated_at: string
          yearly_reset: boolean
        }
        Insert: {
          doc_type: string
          padding?: number
          prefix: string
          sort_order?: number
          updated_at?: string
          yearly_reset?: boolean
        }
        Update: {
          doc_type?: string
          padding?: number
          prefix?: string
          sort_order?: number
          updated_at?: string
          yearly_reset?: boolean
        }
        Relationships: []
      }
      erp_settings: {
        Row: {
          bank_account: string | null
          bank_name: string | null
          default_currency: string
          discount_approval_pct: number | null
          document_footer: string | null
          id: number
          payment_terms_days: number | null
          quote_validity_days: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          bank_account?: string | null
          bank_name?: string | null
          default_currency?: string
          discount_approval_pct?: number | null
          document_footer?: string | null
          id?: number
          payment_terms_days?: number | null
          quote_validity_days?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          bank_account?: string | null
          bank_name?: string | null
          default_currency?: string
          discount_approval_pct?: number | null
          document_footer?: string | null
          id?: number
          payment_terms_days?: number | null
          quote_validity_days?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          consent: boolean
          created_at: string
          customer_id: string | null
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
          customer_id?: string | null
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
          customer_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "inquiries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "business_customer_balances"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "inquiries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "business_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          allowed_negative: boolean
          client_key: string | null
          created_at: string
          created_by: string | null
          expense_id: string | null
          id: string
          movement_type: Database["public"]["Enums"]["business_movement_type"]
          occurred_at: string
          product_id: string
          quantity: number
          quantity_after: number
          quantity_before: number
          reason: string | null
          sale_id: string | null
          sale_item_id: string | null
          unit_cost: number | null
        }
        Insert: {
          allowed_negative?: boolean
          client_key?: string | null
          created_at?: string
          created_by?: string | null
          expense_id?: string | null
          id?: string
          movement_type: Database["public"]["Enums"]["business_movement_type"]
          occurred_at?: string
          product_id: string
          quantity: number
          quantity_after: number
          quantity_before: number
          reason?: string | null
          sale_id?: string | null
          sale_item_id?: string | null
          unit_cost?: number | null
        }
        Update: {
          allowed_negative?: boolean
          client_key?: string | null
          created_at?: string
          created_by?: string | null
          expense_id?: string | null
          id?: string
          movement_type?: Database["public"]["Enums"]["business_movement_type"]
          occurred_at?: string
          product_id?: string
          quantity?: number
          quantity_after?: number
          quantity_before?: number
          reason?: string | null
          sale_id?: string | null
          sale_item_id?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "business_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "business_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "business_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_sale_item_id_fkey"
            columns: ["sale_item_id"]
            isOneToOne: false
            referencedRelation: "business_sale_items"
            referencedColumns: ["id"]
          },
        ]
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
      notifications: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          read_at: string | null
          recipient_id: string
          reference: string | null
          type: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          read_at?: string | null
          recipient_id: string
          reference?: string | null
          type: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          reference?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          key: string
          module: string
          sort_order: number
        }
        Insert: {
          key: string
          module: string
          sort_order?: number
        }
        Update: {
          key?: string
          module?: string
          sort_order?: number
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
          min_order_quantity: number | null
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
          min_order_quantity?: number | null
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
          min_order_quantity?: number | null
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
          role: string
          size_bytes: number | null
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          mime_type?: string | null
          original_name: string
          quotation_request_id: string
          role?: string
          size_bytes?: number | null
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          mime_type?: string | null
          original_name?: string
          quotation_request_id?: string
          role?: string
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
          customer_id: string | null
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
          customer_id?: string | null
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
          customer_id?: string | null
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
          {
            foreignKeyName: "quotation_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "business_customer_balances"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "quotation_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "business_customers"
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
      role_permissions: {
        Row: {
          permission_key: string
          role_id: string
          scope: Database["public"]["Enums"]["permission_scope"]
        }
        Insert: {
          permission_key: string
          role_id: string
          scope?: Database["public"]["Enums"]["permission_scope"]
        }
        Update: {
          permission_key?: string
          role_id?: string
          scope?: Database["public"]["Enums"]["permission_scope"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          key: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          key: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          key?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
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
          id: number
          legal_facts: Json
          legal_name: string | null
          legal_notice_ar: string | null
          legal_notice_en: string | null
          legal_notice_fr: string | null
          maps_url: string | null
          mission_ar: string | null
          mission_en: string | null
          mission_fr: string | null
          opening_hours_ar: string | null
          opening_hours_en: string | null
          opening_hours_fr: string | null
          phone: string | null
          privacy_policy_ar: string | null
          privacy_policy_en: string | null
          privacy_policy_fr: string | null
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
          id?: number
          legal_facts?: Json
          legal_name?: string | null
          legal_notice_ar?: string | null
          legal_notice_en?: string | null
          legal_notice_fr?: string | null
          maps_url?: string | null
          mission_ar?: string | null
          mission_en?: string | null
          mission_fr?: string | null
          opening_hours_ar?: string | null
          opening_hours_en?: string | null
          opening_hours_fr?: string | null
          phone?: string | null
          privacy_policy_ar?: string | null
          privacy_policy_en?: string | null
          privacy_policy_fr?: string | null
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
          id?: number
          legal_facts?: Json
          legal_name?: string | null
          legal_notice_ar?: string | null
          legal_notice_en?: string | null
          legal_notice_fr?: string | null
          maps_url?: string | null
          mission_ar?: string | null
          mission_en?: string | null
          mission_fr?: string | null
          opening_hours_ar?: string | null
          opening_hours_en?: string | null
          opening_hours_fr?: string | null
          phone?: string | null
          privacy_policy_ar?: string | null
          privacy_policy_en?: string | null
          privacy_policy_fr?: string | null
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
      staff_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          role_id: string
          staff_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          role_id: string
          staff_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          role_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_roles_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_options: {
        Row: {
          hex: string | null
          id: string
          is_active: boolean
          kind: string
          name_ar: string | null
          name_en: string | null
          name_fr: string
          product_key: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          hex?: string | null
          id?: string
          is_active?: boolean
          kind: string
          name_ar?: string | null
          name_en?: string | null
          name_fr: string
          product_key: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          hex?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          name_ar?: string | null
          name_en?: string | null
          name_fr?: string
          product_key?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_options_product_key_fkey"
            columns: ["product_key"]
            isOneToOne: false
            referencedRelation: "studio_products"
            referencedColumns: ["key"]
          },
        ]
      }
      studio_products: {
        Row: {
          key: string
          min_dpi: number | null
          updated_at: string
        }
        Insert: {
          key: string
          min_dpi?: number | null
          updated_at?: string
        }
        Update: {
          key?: string
          min_dpi?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      studio_views: {
        Row: {
          area_h: number
          area_w: number
          area_x: number
          area_y: number
          displacement_path: string | null
          id: string
          image_height: number
          image_path: string
          image_width: number
          is_active: boolean
          mask_path: string | null
          print_height_mm: number | null
          print_width_mm: number | null
          product_key: string
          sort_order: number
          updated_at: string
          view: string
        }
        Insert: {
          area_h: number
          area_w: number
          area_x: number
          area_y: number
          displacement_path?: string | null
          id?: string
          image_height: number
          image_path: string
          image_width: number
          is_active?: boolean
          mask_path?: string | null
          print_height_mm?: number | null
          print_width_mm?: number | null
          product_key: string
          sort_order?: number
          updated_at?: string
          view: string
        }
        Update: {
          area_h?: number
          area_w?: number
          area_x?: number
          area_y?: number
          displacement_path?: string | null
          id?: string
          image_height?: number
          image_path?: string
          image_width?: number
          is_active?: boolean
          mask_path?: string | null
          print_height_mm?: number | null
          print_width_mm?: number | null
          product_key?: string
          sort_order?: number
          updated_at?: string
          view?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_views_product_key_fkey"
            columns: ["product_key"]
            isOneToOne: false
            referencedRelation: "studio_products"
            referencedColumns: ["key"]
          },
        ]
      }
      tax_rates: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          label: string
          rate: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          label: string
          rate: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          label?: string
          rate?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      business_customer_balances: {
        Row: {
          balance: number | null
          customer_id: string | null
          last_sale_at: string | null
          sales_count: number | null
          total_paid: number | null
          total_sales: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_auth_guard: {
        Args: {
          ip_hash: string | null
          record_failure: boolean
          submission_key: string
        }
        Returns: undefined
      }
      attach_staff_by_email: {
        Args: { p_email: string; p_full_name: string; p_kind?: string }
        Returns: string
      }
      audit_timeline: {
        Args: { p_row_id: string; p_table: string }
        Returns: {
          action: string
          actor_id: string
          actor_name: string
          changes: Json
          occurred_at: string
        }[]
      }
      business_analytics: {
        Args: { p_from: string; p_granularity?: string; p_to: string }
        Returns: Json
      }
      business_cancel_sale: {
        Args: { p_reason: string; p_sale_id: string }
        Returns: undefined
      }
      business_close_day: {
        Args: {
          p_date: string
          p_decisions?: string
          p_observations?: string
          p_priorities?: string
          p_problems?: string
        }
        Returns: string
      }
      business_correct_report: {
        Args: {
          p_decisions?: string
          p_observations?: string
          p_priorities?: string
          p_problems?: string
          p_reason: string
          p_refresh_figures?: boolean
          p_report_id: string
        }
        Returns: undefined
      }
      business_link_customer: {
        Args: {
          p_customer_id: string
          p_inquiry_id?: string
          p_request_id?: string
        }
        Returns: undefined
      }
      business_period_summary: {
        Args: { p_from: string; p_to: string }
        Returns: Json
      }
      business_record_expense: { Args: { p_payload: Json }; Returns: string }
      business_record_payment: {
        Args: {
          p_amount: number
          p_client_key: string
          p_method: string
          p_notes?: string
          p_paid_at?: string
          p_reference?: string
          p_sale_id: string
        }
        Returns: string
      }
      business_record_sale: { Args: { p_payload: Json }; Returns: string }
      business_record_stock_movement: {
        Args: {
          p_allow_negative?: boolean
          p_client_key?: string
          p_occurred_at?: string
          p_product_id: string
          p_quantity: number
          p_reason?: string
          p_type: string
          p_unit_cost?: number
        }
        Returns: string
      }
      business_set_sale_status: {
        Args: { p_note?: string; p_sale_id: string; p_status: string }
        Returns: undefined
      }
      business_sync_notifications: { Args: never; Returns: number }
      business_void_expense: {
        Args: { p_expense_id: string; p_reason: string }
        Returns: undefined
      }
      business_void_payment: {
        Args: { p_payment_id: string; p_reason: string }
        Returns: undefined
      }
      create_upload_ticket: {
        Args: { ip_hash: string | null; submission_key: string }
        Returns: string
      }
      mark_notifications_read: { Args: { p_ids?: string[] }; Returns: number }
      my_permissions: { Args: never; Returns: string[] }
      recent_activity: {
        Args: { p_actor?: string; p_before?: string; p_limit?: number }
        Returns: {
          action: string
          actor_id: string
          actor_name: string
          changes: Json
          id: number
          occurred_at: string
          row_id: string
          table_name: string
        }[]
      }
      record_submission_notification: {
        Args: {
          error_message: string | null
          kind: string
          reference: string
          submission_key: string
        }
        Returns: undefined
      }
      submit_brief_request: {
        Args: { payload: Json; submission_key: string }
        Returns: string
      }
      submit_contact_inquiry: {
        Args: { payload: Json; submission_key: string }
        Returns: string
      }
      submit_custom_request: {
        Args: { payload: Json; submission_key: string }
        Returns: string
      }
      submit_digital_request: {
        Args: { payload: Json; submission_key: string }
        Returns: string
      }
      submit_quotation_request: {
        Args: { payload: Json; submission_key: string }
        Returns: string
      }
      track_quotation: {
        Args: {
          ip_hash: string | null
          p_email: string
          p_reference: string
          submission_key: string
        }
        Returns: Json
      }
    }
    Enums: {
      admin_role: "owner" | "editor"
      business_activity_type:
        | "production_completed"
        | "customer_meeting"
        | "new_order"
        | "delivery"
        | "supplier_visit"
        | "purchase"
        | "maintenance"
        | "administrative"
        | "incident"
        | "other"
      business_category_kind: "product" | "expense"
      business_customer_type: "individual" | "company"
      business_expense_treatment: "operating" | "stock_purchase" | "investment"
      business_item_type: "product" | "material" | "service"
      business_line_kind: "product" | "service" | "custom"
      business_movement_type:
        | "initial"
        | "entry"
        | "purchase"
        | "purchase_void"
        | "exit"
        | "sale"
        | "sale_return"
        | "damage"
        | "loss"
        | "adjustment"
      business_order_status:
        | "new"
        | "confirmed"
        | "in_production"
        | "ready"
        | "delivered"
        | "cancelled"
      business_payment_method: "cash" | "transfer" | "cheque" | "card" | "other"
      business_payment_status: "unpaid" | "partial" | "paid"
      business_report_status: "closed" | "corrected"
      business_task_priority: "low" | "normal" | "high" | "urgent"
      business_task_status: "todo" | "in_progress" | "completed" | "blocked"
      contact_method: "email" | "phone" | "whatsapp"
      content_status: "draft" | "published" | "archived"
      inquiry_status: "new" | "read" | "replied" | "closed" | "spam"
      permission_scope: "all" | "assigned"
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
      request_kind: "catalog" | "custom" | "digital"
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
      business_activity_type: [
        "production_completed",
        "customer_meeting",
        "new_order",
        "delivery",
        "supplier_visit",
        "purchase",
        "maintenance",
        "administrative",
        "incident",
        "other",
      ],
      business_category_kind: ["product", "expense"],
      business_customer_type: ["individual", "company"],
      business_expense_treatment: ["operating", "stock_purchase", "investment"],
      business_item_type: ["product", "material", "service"],
      business_line_kind: ["product", "service", "custom"],
      business_movement_type: [
        "initial",
        "entry",
        "purchase",
        "purchase_void",
        "exit",
        "sale",
        "sale_return",
        "damage",
        "loss",
        "adjustment",
      ],
      business_order_status: [
        "new",
        "confirmed",
        "in_production",
        "ready",
        "delivered",
        "cancelled",
      ],
      business_payment_method: ["cash", "transfer", "cheque", "card", "other"],
      business_payment_status: ["unpaid", "partial", "paid"],
      business_report_status: ["closed", "corrected"],
      business_task_priority: ["low", "normal", "high", "urgent"],
      business_task_status: ["todo", "in_progress", "completed", "blocked"],
      contact_method: ["email", "phone", "whatsapp"],
      content_status: ["draft", "published", "archived"],
      inquiry_status: ["new", "read", "replied", "closed", "spam"],
      permission_scope: ["all", "assigned"],
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
      request_kind: ["catalog", "custom", "digital"],
    },
  },
} as const
