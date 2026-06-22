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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          address: string
          booking_date: string
          city: string
          created_at: string
          decline_reason: string | null
          declined_by_pandit_id: string | null
          ends_at: string | null
          id: string
          invoice_fy: number | null
          invoice_no: number | null
          language: string | null
          notes: string | null
          pandit_id: string | null
          peak_label: string | null
          peak_surcharge: number
          pincode: string | null
          pooja_id: string
          preferred_pandit_id: string | null
          priest_responded_at: string | null
          priest_response: Database["public"]["Enums"]["priest_response"]
          samagri_kit: boolean
          samagri_price: number
          service_price: number
          starts_at: string | null
          status: Database["public"]["Enums"]["booking_status"]
          time_slot: string
          total_amount: number
          travel_band: string | null
          travel_fee: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          booking_date: string
          city: string
          created_at?: string
          decline_reason?: string | null
          declined_by_pandit_id?: string | null
          ends_at?: string | null
          id?: string
          invoice_fy?: number | null
          invoice_no?: number | null
          language?: string | null
          notes?: string | null
          pandit_id?: string | null
          peak_label?: string | null
          peak_surcharge?: number
          pincode?: string | null
          pooja_id: string
          preferred_pandit_id?: string | null
          priest_responded_at?: string | null
          priest_response?: Database["public"]["Enums"]["priest_response"]
          samagri_kit?: boolean
          samagri_price?: number
          service_price: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          time_slot: string
          total_amount: number
          travel_band?: string | null
          travel_fee?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          booking_date?: string
          city?: string
          created_at?: string
          decline_reason?: string | null
          declined_by_pandit_id?: string | null
          ends_at?: string | null
          id?: string
          invoice_fy?: number | null
          invoice_no?: number | null
          language?: string | null
          notes?: string | null
          pandit_id?: string | null
          peak_label?: string | null
          peak_surcharge?: number
          pincode?: string | null
          pooja_id?: string
          preferred_pandit_id?: string | null
          priest_responded_at?: string | null
          priest_response?: Database["public"]["Enums"]["priest_response"]
          samagri_kit?: boolean
          samagri_price?: number
          service_price?: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          time_slot?: string
          total_amount?: number
          travel_band?: string | null
          travel_fee?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_declined_by_pandit_id_fkey"
            columns: ["declined_by_pandit_id"]
            isOneToOne: false
            referencedRelation: "pandits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_pandit_id_fkey"
            columns: ["pandit_id"]
            isOneToOne: false
            referencedRelation: "pandits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_pooja_id_fkey"
            columns: ["pooja_id"]
            isOneToOne: false
            referencedRelation: "poojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_preferred_pandit_id_fkey"
            columns: ["preferred_pandit_id"]
            isOneToOne: false
            referencedRelation: "pandits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          items: Json
          notified_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          items?: Json
          notified_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          items?: Json
          notified_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address: string | null
          email: string | null
          gstin: string | null
          id: number
          name: string | null
          phone: string | null
          state: string | null
          updated_at: string
          upi: string | null
        }
        Insert: {
          address?: string | null
          email?: string | null
          gstin?: string | null
          id?: number
          name?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          upi?: string | null
        }
        Update: {
          address?: string | null
          email?: string | null
          gstin?: string | null
          id?: number
          name?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          upi?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string | null
          handled: boolean
          id: string
          message: string
          name: string
          phone: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          handled?: boolean
          id?: string
          message: string
          name: string
          phone?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          handled?: boolean
          id?: string
          message?: string
          name?: string
          phone?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      credit_notes: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_fy: number | null
          invoice_no: number | null
          order_id: string | null
          payment_id: string | null
          reason: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_fy?: number | null
          invoice_no?: number | null
          order_id?: string | null
          payment_id?: string | null
          reason?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_fy?: number | null
          invoice_no?: number | null
          order_id?: string | null
          payment_id?: string | null
          reason?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_counters: {
        Row: {
          doc_type: string
          fy: number
          last_no: number
        }
        Insert: {
          doc_type: string
          fy: number
          last_no?: number
        }
        Update: {
          doc_type?: string
          fy?: number
          last_no?: number
        }
        Relationships: []
      }
      muhurat_windows: {
        Row: {
          approved: boolean
          category: Database["public"]["Enums"]["pooja_category"] | null
          created_at: string
          date: string
          end_time: string
          id: string
          label: string | null
          note: string | null
          pooja_slug: string | null
          quality_score: number | null
          source: string
          start_time: string
          updated_at: string
        }
        Insert: {
          approved?: boolean
          category?: Database["public"]["Enums"]["pooja_category"] | null
          created_at?: string
          date: string
          end_time: string
          id?: string
          label?: string | null
          note?: string | null
          pooja_slug?: string | null
          quality_score?: number | null
          source?: string
          start_time: string
          updated_at?: string
        }
        Update: {
          approved?: boolean
          category?: Database["public"]["Enums"]["pooja_category"] | null
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          label?: string | null
          note?: string | null
          pooja_slug?: string | null
          quality_score?: number | null
          source?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          gst_rate: number
          hsn_code: string | null
          id: string
          line_total: number
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          gst_rate?: number
          hsn_code?: string | null
          id?: string
          line_total: number
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Update: {
          gst_rate?: number
          hsn_code?: string | null
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          carrier: string | null
          city: string | null
          created_at: string
          customer_gstin: string | null
          delivery_name: string | null
          delivery_phone: string | null
          estimated_delivery: string | null
          ewb_date: string | null
          ewb_expiry_alerted_at: string | null
          ewb_no: string | null
          ewb_valid_until: string | null
          ewb_vehicle: string | null
          id: string
          invoice_fy: number | null
          invoice_no: number | null
          irn: string | null
          irn_cancelled_at: string | null
          irn_date: string | null
          pincode: string | null
          shipping: number
          signed_qr: string | null
          state: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total_amount: number
          tracking_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          carrier?: string | null
          city?: string | null
          created_at?: string
          customer_gstin?: string | null
          delivery_name?: string | null
          delivery_phone?: string | null
          estimated_delivery?: string | null
          ewb_date?: string | null
          ewb_expiry_alerted_at?: string | null
          ewb_no?: string | null
          ewb_valid_until?: string | null
          ewb_vehicle?: string | null
          id?: string
          invoice_fy?: number | null
          invoice_no?: number | null
          irn?: string | null
          irn_cancelled_at?: string | null
          irn_date?: string | null
          pincode?: string | null
          shipping?: number
          signed_qr?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          carrier?: string | null
          city?: string | null
          created_at?: string
          customer_gstin?: string | null
          delivery_name?: string | null
          delivery_phone?: string | null
          estimated_delivery?: string | null
          ewb_date?: string | null
          ewb_expiry_alerted_at?: string | null
          ewb_no?: string | null
          ewb_valid_until?: string | null
          ewb_vehicle?: string | null
          id?: string
          invoice_fy?: number | null
          invoice_no?: number | null
          irn?: string | null
          irn_cancelled_at?: string | null
          irn_date?: string | null
          pincode?: string | null
          shipping?: number
          signed_qr?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pandits: {
        Row: {
          active: boolean
          bio: string | null
          blackout_dates: string[]
          created_at: string
          experience_years: number | null
          full_name: string
          home_pincode: string | null
          id: string
          languages: string[]
          login_email: string | null
          max_travel_mins: number
          photo_url: string | null
          qualifications: string[]
          achievements: string[]
          rating: number
          regions: string[]
          review_count: number
          service_pincodes: string[]
          slug: string | null
          specializations: string[]
          updated_at: string
          user_id: string | null
          verified: boolean
          work_end: string
          work_start: string
        }
        Insert: {
          active?: boolean
          bio?: string | null
          blackout_dates?: string[]
          created_at?: string
          experience_years?: number | null
          full_name: string
          home_pincode?: string | null
          id?: string
          languages?: string[]
          login_email?: string | null
          max_travel_mins?: number
          photo_url?: string | null
          qualifications?: string[]
          achievements?: string[]
          rating?: number
          regions?: string[]
          review_count?: number
          service_pincodes?: string[]
          slug?: string | null
          specializations?: string[]
          updated_at?: string
          user_id?: string | null
          verified?: boolean
          work_end?: string
          work_start?: string
        }
        Update: {
          active?: boolean
          bio?: string | null
          blackout_dates?: string[]
          created_at?: string
          experience_years?: number | null
          full_name?: string
          home_pincode?: string | null
          id?: string
          languages?: string[]
          login_email?: string | null
          max_travel_mins?: number
          photo_url?: string | null
          qualifications?: string[]
          achievements?: string[]
          rating?: number
          regions?: string[]
          review_count?: number
          service_pincodes?: string[]
          slug?: string | null
          specializations?: string[]
          updated_at?: string
          user_id?: string | null
          verified?: boolean
          work_end?: string
          work_start?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          currency: string
          id: string
          order_id: string | null
          payment_for: Database["public"]["Enums"]["payment_for"]
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          refunded_amount: number
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          order_id?: string | null
          payment_for: Database["public"]["Enums"]["payment_for"]
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          refunded_amount?: number
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          order_id?: string | null
          payment_for?: Database["public"]["Enums"]["payment_for"]
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          refunded_amount?: number
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      peak_days: {
        Row: {
          active: boolean
          created_at: string
          date: string
          label: string
          surcharge_pct: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          date: string
          label: string
          surcharge_pct?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          date?: string
          label?: string
          surcharge_pct?: number
        }
        Relationships: []
      }
      payroll_run_items: {
        Row: {
          base_salary: number
          bookings_count: number
          bookings_value: number
          commission: number
          consultant_fee: number
          created_at: string
          dakshina_retained: number
          deductions: number
          gratuity: number
          gross: number
          id: string
          incentive: number
          model: Database["public"]["Enums"]["comp_model"]
          net_pay: number
          notes: string | null
          paid: boolean
          paid_at: string | null
          pandit_id: string
          payment_ref: string | null
          pf_employee: number
          pf_employer: number
          run_id: string
          travel_allowance: number
        }
        Insert: {
          base_salary?: number
          bookings_count?: number
          bookings_value?: number
          commission?: number
          consultant_fee?: number
          created_at?: string
          dakshina_retained?: number
          deductions?: number
          gratuity?: number
          gross?: number
          id?: string
          incentive?: number
          model?: Database["public"]["Enums"]["comp_model"]
          net_pay?: number
          notes?: string | null
          paid?: boolean
          paid_at?: string | null
          pandit_id: string
          payment_ref?: string | null
          pf_employee?: number
          pf_employer?: number
          run_id: string
          travel_allowance?: number
        }
        Update: {
          base_salary?: number
          bookings_count?: number
          bookings_value?: number
          commission?: number
          consultant_fee?: number
          created_at?: string
          dakshina_retained?: number
          deductions?: number
          gratuity?: number
          gross?: number
          id?: string
          incentive?: number
          model?: Database["public"]["Enums"]["comp_model"]
          net_pay?: number
          notes?: string | null
          paid?: boolean
          paid_at?: string | null
          pandit_id?: string
          payment_ref?: string | null
          pf_employee?: number
          pf_employer?: number
          run_id?: string
          travel_allowance?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_run_items_pandit_id_fkey"
            columns: ["pandit_id"]
            isOneToOne: false
            referencedRelation: "pandits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_run_items_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          period_month: number
          period_year: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          period_month: number
          period_year: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          period_month?: number
          period_year?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      poojas: {
        Row: {
          active: boolean
          category: Database["public"]["Enums"]["pooja_category"]
          created_at: string
          duration_hours: number
          emoji: string | null
          id: string
          includes: string[] | null
          long_description: string | null
          name: string
          popular: boolean
          requires_muhurat: boolean
          samagri_kit_price: number | null
          sanskrit_name: string | null
          short_description: string | null
          slug: string
          starting_price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: Database["public"]["Enums"]["pooja_category"]
          created_at?: string
          duration_hours?: number
          emoji?: string | null
          id?: string
          includes?: string[] | null
          long_description?: string | null
          name: string
          popular?: boolean
          requires_muhurat?: boolean
          samagri_kit_price?: number | null
          sanskrit_name?: string | null
          short_description?: string | null
          slug: string
          starting_price: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: Database["public"]["Enums"]["pooja_category"]
          created_at?: string
          duration_hours?: number
          emoji?: string | null
          id?: string
          includes?: string[] | null
          long_description?: string | null
          name?: string
          popular?: boolean
          requires_muhurat?: boolean
          samagri_kit_price?: number | null
          sanskrit_name?: string | null
          short_description?: string | null
          slug?: string
          starting_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      priest_compensation: {
        Row: {
          base_salary: number
          commission_basis: string
          commission_pct: number
          consultant_fee: number
          created_at: string
          effective_from: string | null
          gratuity_enabled: boolean
          gratuity_pct: number
          incentive_per_booking: number
          keeps_dakshina: boolean
          model: Database["public"]["Enums"]["comp_model"]
          notes: string | null
          pandit_id: string
          pf_employee_pct: number
          pf_employer_pct: number
          pf_enabled: boolean
          pf_wage_ceiling: number
          travel_allowance: number
          updated_at: string
        }
        Insert: {
          base_salary?: number
          commission_basis?: string
          commission_pct?: number
          consultant_fee?: number
          created_at?: string
          effective_from?: string | null
          gratuity_enabled?: boolean
          gratuity_pct?: number
          incentive_per_booking?: number
          keeps_dakshina?: boolean
          model?: Database["public"]["Enums"]["comp_model"]
          notes?: string | null
          pandit_id: string
          pf_employee_pct?: number
          pf_employer_pct?: number
          pf_enabled?: boolean
          pf_wage_ceiling?: number
          travel_allowance?: number
          updated_at?: string
        }
        Update: {
          base_salary?: number
          commission_basis?: string
          commission_pct?: number
          consultant_fee?: number
          created_at?: string
          effective_from?: string | null
          gratuity_enabled?: boolean
          gratuity_pct?: number
          incentive_per_booking?: number
          keeps_dakshina?: boolean
          model?: Database["public"]["Enums"]["comp_model"]
          notes?: string | null
          pandit_id?: string
          pf_employee_pct?: number
          pf_employer_pct?: number
          pf_enabled?: boolean
          pf_wage_ceiling?: number
          travel_allowance?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "priest_compensation_pandit_id_fkey"
            columns: ["pandit_id"]
            isOneToOne: true
            referencedRelation: "pandits"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          body: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          reviewer_name: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          reviewer_name?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          reviewer_name?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          description: string | null
          gst_rate: number
          hsn_code: string | null
          id: string
          image_url: string | null
          images: string[]
          mrp: number | null
          name: string
          price: number
          rating: number
          review_count: number
          slug: string
          stock: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          gst_rate?: number
          hsn_code?: string | null
          id?: string
          image_url?: string | null
          images?: string[]
          mrp?: number | null
          name: string
          price: number
          rating?: number
          review_count?: number
          slug: string
          stock?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          gst_rate?: number
          hsn_code?: string | null
          id?: string
          image_url?: string | null
          images?: string[]
          mrp?: number | null
          name?: string
          price?: number
          rating?: number
          review_count?: number
          slug?: string
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean
          marketing_consent: boolean
          phone: string | null
          signin_method: Database["public"]["Enums"]["signin_method"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean
          marketing_consent?: boolean
          phone?: string | null
          signin_method?: Database["public"]["Enums"]["signin_method"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean
          marketing_consent?: boolean
          phone?: string | null
          signin_method?: Database["public"]["Enums"]["signin_method"] | null
          updated_at?: string
        }
        Relationships: []
      }
      stock_subscriptions: {
        Row: {
          created_at: string
          email: string
          id: string
          notified_at: string | null
          product_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          notified_at?: string | null
          product_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          notified_at?: string | null
          product_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_subscriptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_booking_atomic: {
        Args: {
          p_address: string
          p_city: string
          p_duration_min: number
          p_language: string | null
          p_notes: string | null
          p_pandit_id: string
          p_peak_label?: string | null
          p_peak_surcharge?: number
          p_pincode: string | null
          p_pooja_id: string
          p_samagri_kit: boolean
          p_samagri_price: number
          p_service_price: number
          p_starts_at: string
          p_time_slot: string
          p_travel_band: string | null
          p_travel_fee: number
          p_user_id: string
        }
        Returns: string
      }
      decrement_stock_for_order: {
        Args: { p_order_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      booking_status:
        | "pending"
        | "confirmed"
        | "assigned"
        | "completed"
        | "cancelled"
      comp_model:
        | "fixed"
        | "dakshina"
        | "commission"
        | "salary_commission"
        | "consultant"
        | "incentive"
      order_status:
        | "pending"
        | "paid"
        | "packed"
        | "shipped"
        | "delivered"
        | "cancelled"
      payment_for: "booking" | "order"
      payment_status:
        | "created"
        | "authorized"
        | "captured"
        | "failed"
        | "refunded"
      pooja_category:
        | "Home"
        | "Festival"
        | "Life Event"
        | "Remedial"
        | "Ancestral"
      priest_response: "pending" | "accepted" | "declined"
      signin_method: "otp" | "google"
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
      booking_status: [
        "pending",
        "confirmed",
        "assigned",
        "completed",
        "cancelled",
      ],
      comp_model: [
        "fixed",
        "dakshina",
        "commission",
        "salary_commission",
        "consultant",
        "incentive",
      ],
      order_status: [
        "pending",
        "paid",
        "packed",
        "shipped",
        "delivered",
        "cancelled",
      ],
      payment_for: ["booking", "order"],
      payment_status: [
        "created",
        "authorized",
        "captured",
        "failed",
        "refunded",
      ],
      pooja_category: [
        "Home",
        "Festival",
        "Life Event",
        "Remedial",
        "Ancestral",
      ],
      priest_response: ["pending", "accepted", "declined"],
      signin_method: ["otp", "google"],
    },
  },
} as const
