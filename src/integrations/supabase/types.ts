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
      booking_legs: {
        Row: {
          airline_code: string | null
          airline_name: string | null
          arrival_time: string | null
          boarding_pass_data: string | null
          booking_id: string | null
          departure_time: string | null
          destination_iata: string | null
          flight_number: string | null
          flight_status: string | null
          gate: string | null
          id: string
          is_resilient_carrier: boolean | null
          last_status_check: string | null
          leg_number: number | null
          origin_iata: string | null
          pnr: string | null
          seat_number: string | null
          terminal: string | null
          ticket_number: string | null
        }
        Insert: {
          airline_code?: string | null
          airline_name?: string | null
          arrival_time?: string | null
          boarding_pass_data?: string | null
          booking_id?: string | null
          departure_time?: string | null
          destination_iata?: string | null
          flight_number?: string | null
          flight_status?: string | null
          gate?: string | null
          id?: string
          is_resilient_carrier?: boolean | null
          last_status_check?: string | null
          leg_number?: number | null
          origin_iata?: string | null
          pnr?: string | null
          seat_number?: string | null
          terminal?: string | null
          ticket_number?: string | null
        }
        Update: {
          airline_code?: string | null
          airline_name?: string | null
          arrival_time?: string | null
          boarding_pass_data?: string | null
          booking_id?: string | null
          departure_time?: string | null
          destination_iata?: string | null
          flight_number?: string | null
          flight_status?: string | null
          gate?: string | null
          id?: string
          is_resilient_carrier?: boolean | null
          last_status_check?: string | null
          leg_number?: number | null
          origin_iata?: string | null
          pnr?: string | null
          seat_number?: string | null
          terminal?: string | null
          ticket_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_legs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_status: string | null
          booking_type: string | null
          connection_guarantee_fee_usd: number | null
          created_at: string | null
          curation_fee_usd: number | null
          duffel_order_id: string | null
          id: string
          insurance_fee_usd: number | null
          is_self_transfer: boolean | null
          markup_applied_usd: number | null
          stripe_payment_intent_id: string | null
          support_flag: string | null
          ticket_count: number | null
          total_price_usd: number | null
          user_id: string
        }
        Insert: {
          booking_status?: string | null
          booking_type?: string | null
          connection_guarantee_fee_usd?: number | null
          created_at?: string | null
          curation_fee_usd?: number | null
          duffel_order_id?: string | null
          id?: string
          insurance_fee_usd?: number | null
          is_self_transfer?: boolean | null
          markup_applied_usd?: number | null
          stripe_payment_intent_id?: string | null
          support_flag?: string | null
          ticket_count?: number | null
          total_price_usd?: number | null
          user_id: string
        }
        Update: {
          booking_status?: string | null
          booking_type?: string | null
          connection_guarantee_fee_usd?: number | null
          created_at?: string | null
          curation_fee_usd?: number | null
          duffel_order_id?: string | null
          id?: string
          insurance_fee_usd?: number | null
          is_self_transfer?: boolean | null
          markup_applied_usd?: number | null
          stripe_payment_intent_id?: string | null
          support_flag?: string | null
          ticket_count?: number | null
          total_price_usd?: number | null
          user_id?: string
        }
        Relationships: []
      }
      business_accounts: {
        Row: {
          billing_email: string | null
          company_name: string | null
          created_at: string | null
          dedicated_agent: string | null
          id: string
          max_employees: number | null
          plan: string | null
          stripe_customer_id: string | null
          travel_policy: Json | null
        }
        Insert: {
          billing_email?: string | null
          company_name?: string | null
          created_at?: string | null
          dedicated_agent?: string | null
          id?: string
          max_employees?: number | null
          plan?: string | null
          stripe_customer_id?: string | null
          travel_policy?: Json | null
        }
        Update: {
          billing_email?: string | null
          company_name?: string | null
          created_at?: string | null
          dedicated_agent?: string | null
          id?: string
          max_employees?: number | null
          plan?: string | null
          stripe_customer_id?: string | null
          travel_policy?: Json | null
        }
        Relationships: []
      }
      business_employees: {
        Row: {
          active: boolean | null
          business_id: string | null
          id: string
          role: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          business_id?: string | null
          id?: string
          role?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          business_id?: string | null
          id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_employees_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      destination_safety: {
        Row: {
          alert_level: string | null
          city_name: string | null
          country_name: string | null
          iata_code: string
          last_events: string[] | null
          last_updated: string | null
          resilient_routing_recommended: boolean | null
          safety_score: number | null
        }
        Insert: {
          alert_level?: string | null
          city_name?: string | null
          country_name?: string | null
          iata_code: string
          last_events?: string[] | null
          last_updated?: string | null
          resilient_routing_recommended?: boolean | null
          safety_score?: number | null
        }
        Update: {
          alert_level?: string | null
          city_name?: string | null
          country_name?: string | null
          iata_code?: string
          last_events?: string[] | null
          last_updated?: string | null
          resilient_routing_recommended?: boolean | null
          safety_score?: number | null
        }
        Relationships: []
      }
      esim_purchases: {
        Row: {
          activation_code: string | null
          booking_id: string | null
          data_gb: number | null
          destination_country: string | null
          id: string
          price_usd: number | null
          status: string | null
          user_id: string
          validity_days: number | null
        }
        Insert: {
          activation_code?: string | null
          booking_id?: string | null
          data_gb?: number | null
          destination_country?: string | null
          id?: string
          price_usd?: number | null
          status?: string | null
          user_id: string
          validity_days?: number | null
        }
        Update: {
          activation_code?: string | null
          booking_id?: string | null
          data_gb?: number | null
          destination_country?: string | null
          id?: string
          price_usd?: number | null
          status?: string | null
          user_id?: string
          validity_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "esim_purchases_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_pool: {
        Row: {
          booking_id: string | null
          claim_amount_usd: number | null
          claim_status: string | null
          created_at: string | null
          id: string
          premium_paid_usd: number | null
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          claim_amount_usd?: number | null
          claim_status?: string | null
          created_at?: string | null
          id?: string
          premium_paid_usd?: number | null
          user_id: string
        }
        Update: {
          booking_id?: string | null
          claim_amount_usd?: number | null
          claim_status?: string | null
          created_at?: string | null
          id?: string
          premium_paid_usd?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_pool_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      passenger_documents: {
        Row: {
          created_at: string | null
          document_number: string | null
          document_type: string | null
          expiry_date: string | null
          id: string
          is_verified: boolean | null
          mrz_data: Json | null
          nationality: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_number?: string | null
          document_type?: string | null
          expiry_date?: string | null
          id?: string
          is_verified?: boolean | null
          mrz_data?: Json | null
          nationality?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_number?: string | null
          document_type?: string | null
          expiry_date?: string | null
          id?: string
          is_verified?: boolean | null
          mrz_data?: Json | null
          nationality?: string | null
          user_id?: string
        }
        Relationships: []
      }
      price_freezes: {
        Row: {
          destination_iata: string | null
          freeze_expires_at: string | null
          freeze_fee_usd: number | null
          frozen_price_usd: number | null
          id: string
          origin_iata: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          destination_iata?: string | null
          freeze_expires_at?: string | null
          freeze_fee_usd?: number | null
          frozen_price_usd?: number | null
          id?: string
          origin_iata?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          destination_iata?: string | null
          freeze_expires_at?: string | null
          freeze_fee_usd?: number | null
          frozen_price_usd?: number | null
          id?: string
          origin_iata?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      price_watches: {
        Row: {
          alert_sent: boolean | null
          created_at: string | null
          current_price_usd: number | null
          destination_iata: string | null
          id: string
          origin_iata: string | null
          prediction: string | null
          prediction_confidence: number | null
          target_price_usd: number | null
          user_id: string
        }
        Insert: {
          alert_sent?: boolean | null
          created_at?: string | null
          current_price_usd?: number | null
          destination_iata?: string | null
          id?: string
          origin_iata?: string | null
          prediction?: string | null
          prediction_confidence?: number | null
          target_price_usd?: number | null
          user_id: string
        }
        Update: {
          alert_sent?: boolean | null
          created_at?: string | null
          current_price_usd?: number | null
          destination_iata?: string | null
          id?: string
          origin_iata?: string | null
          prediction?: string | null
          prediction_confidence?: number | null
          target_price_usd?: number | null
          user_id?: string
        }
        Relationships: []
      }
      resilient_airlines: {
        Row: {
          airline_code: string | null
          airline_name: string | null
          id: string
          notes: string | null
          regions: string[] | null
          reliability_score: number | null
        }
        Insert: {
          airline_code?: string | null
          airline_name?: string | null
          id?: string
          notes?: string | null
          regions?: string[] | null
          reliability_score?: number | null
        }
        Update: {
          airline_code?: string | null
          airline_name?: string | null
          id?: string
          notes?: string | null
          regions?: string[] | null
          reliability_score?: number | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_agent: string | null
          booking_id: string | null
          chat_transcript: Json | null
          created_at: string | null
          id: string
          priority: string | null
          status: string | null
          trigger_type: string | null
          user_id: string
        }
        Insert: {
          assigned_agent?: string | null
          booking_id?: string | null
          chat_transcript?: Json | null
          created_at?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          trigger_type?: string | null
          user_id: string
        }
        Update: {
          assigned_agent?: string | null
          booking_id?: string | null
          chat_transcript?: Json | null
          created_at?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          trigger_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_logs: {
        Row: {
          actual_destination_iata: string | null
          airline_code: string | null
          booking_id: string | null
          created_at: string | null
          destination_iata: string | null
          id: string
          is_skiplag: boolean | null
          origin_iata: string | null
          pnr: string | null
          status: string | null
          ticket_number: string | null
          travel_date: string | null
          user_id: string
        }
        Insert: {
          actual_destination_iata?: string | null
          airline_code?: string | null
          booking_id?: string | null
          created_at?: string | null
          destination_iata?: string | null
          id?: string
          is_skiplag?: boolean | null
          origin_iata?: string | null
          pnr?: string | null
          status?: string | null
          ticket_number?: string | null
          travel_date?: string | null
          user_id: string
        }
        Update: {
          actual_destination_iata?: string | null
          airline_code?: string | null
          booking_id?: string | null
          created_at?: string | null
          destination_iata?: string | null
          id?: string
          is_skiplag?: boolean | null
          origin_iata?: string | null
          pnr?: string | null
          status?: string | null
          ticket_number?: string | null
          travel_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mandates: {
        Row: {
          id: string
          mandate_accepted_at: string | null
          mandate_active: boolean | null
          mandate_ip: string | null
          max_auto_charge_usd: number | null
          stripe_customer_id: string | null
          stripe_payment_method_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          mandate_accepted_at?: string | null
          mandate_active?: boolean | null
          mandate_ip?: string | null
          max_auto_charge_usd?: number | null
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          mandate_accepted_at?: string | null
          mandate_active?: boolean | null
          mandate_ip?: string | null
          max_auto_charge_usd?: number | null
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          auto_checkin_enabled: boolean | null
          auto_rebook_enabled: boolean | null
          avoided_airlines: string[] | null
          esim_auto_offer: boolean | null
          max_stops: number | null
          pref_direct_only: boolean | null
          preferred_airlines: string[] | null
          safety_sensitivity: string | null
          seat_preference: string | null
          show_points_optimization: boolean | null
          user_id: string
        }
        Insert: {
          auto_checkin_enabled?: boolean | null
          auto_rebook_enabled?: boolean | null
          avoided_airlines?: string[] | null
          esim_auto_offer?: boolean | null
          max_stops?: number | null
          pref_direct_only?: boolean | null
          preferred_airlines?: string[] | null
          safety_sensitivity?: string | null
          seat_preference?: string | null
          show_points_optimization?: boolean | null
          user_id: string
        }
        Update: {
          auto_checkin_enabled?: boolean | null
          auto_rebook_enabled?: boolean | null
          avoided_airlines?: string[] | null
          esim_auto_offer?: boolean | null
          max_stops?: number | null
          pref_direct_only?: boolean | null
          preferred_airlines?: string[] | null
          safety_sensitivity?: string | null
          seat_preference?: string | null
          show_points_optimization?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          nationality: string | null
          phone: string | null
          preferred_currency: string | null
          tier: string | null
          trust_level: number | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          nationality?: string | null
          phone?: string | null
          preferred_currency?: string | null
          tier?: string | null
          trust_level?: number | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          nationality?: string | null
          phone?: string | null
          preferred_currency?: string | null
          tier?: string | null
          trust_level?: number | null
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
      user_wallet: {
        Row: {
          card_issuer: string | null
          card_name: string | null
          id: string
          points_multiplier: Json | null
          transfer_partners: string[] | null
          user_id: string
        }
        Insert: {
          card_issuer?: string | null
          card_name?: string | null
          id?: string
          points_multiplier?: Json | null
          transfer_partners?: string[] | null
          user_id: string
        }
        Update: {
          card_issuer?: string | null
          card_name?: string | null
          id?: string
          points_multiplier?: Json | null
          transfer_partners?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
