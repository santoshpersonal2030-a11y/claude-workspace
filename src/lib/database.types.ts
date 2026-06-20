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
          id: string
          invoice_no: number | null
          language: string | null
          notes: string | null
          pandit_id: string | null
          pincode: string | null
          pooja_id: string
          preferred_pandit_id: string | null
          samagri_kit: boolean
          samagri_price: number
          service_price: number
          status: Database["public"]["Enums"]["booking_status"]
          time_slot: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          booking_date: string
          city: string
          created_at?: string
          id?: string
          invoice_no?: number | null
          language?: string | null
          notes?: string | null
          pandit_id?: string | null
          pincode?: string | null
          pooja_id: string
          preferred_pandit_id?: string | null
          samagri_kit?: boolean
          samagri_price?: number
          service_price: number
          status?: Database["public"]["Enums"]["booking_status"]
          time_slot: string
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          booking_date?: string
          city?: string
          created_at?: string
          id?: string
          invoice_no?: number | null
          language?: string | null
          notes?: string | null
          pandit_id?: string | null
          pincode?: string | null
          pooja_id?: string
          preferred_pandit_id?: string | null
          samagri_kit?: boolean
          samagri_price?: number
          service_price?: number
          status?: Database["public"]["Enums"]["booking_status"]
          time_slot?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
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
      order_items: {
        Row: {
          id: string
          line_total: number
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          id?: string
          line_total: number
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Update: {
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
          delivery_name: string | null
          delivery_phone: string | null
          estimated_delivery: string | null
          id: string
          invoice_no: number | null
          pincode: string | null
          shipping: number
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
          delivery_name?: string | null
          delivery_phone?: string | null
          estimated_delivery?: string | null
          id?: string
          invoice_no?: number | null
          pincode?: string | null
          shipping?: number
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
          delivery_name?: string | null
          delivery_phone?: string | null
          estimated_delivery?: string | null
          id?: string
          invoice_no?: number | null
          pincode?: string | null
          shipping?: number
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
          created_at: string
          experience_years: number | null
          full_name: string
          id: string
          languages: string[]
          photo_url: string | null
          rating: number
          regions: string[]
          review_count: number
          slug: string | null
          updated_at: string
          verified: boolean
        }
        Insert: {
          active?: boolean
          bio?: string | null
          created_at?: string
          experience_years?: number | null
          full_name: string
          id?: string
          languages?: string[]
          photo_url?: string | null
          rating?: number
          regions?: string[]
          review_count?: number
          slug?: string | null
          updated_at?: string
          verified?: boolean
        }
        Update: {
          active?: boolean
          bio?: string | null
          created_at?: string
          experience_years?: number | null
          full_name?: string
          id?: string
          languages?: string[]
          photo_url?: string | null
          rating?: number
          regions?: string[]
          review_count?: number
          slug?: string | null
          updated_at?: string
          verified?: boolean
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
          samagri_kit_price?: number | null
          sanskrit_name?: string | null
          short_description?: string | null
          slug?: string
          starting_price?: number
          updated_at?: string
        }
        Relationships: []
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
      signin_method: ["otp", "google"],
    },
  },
} as const
