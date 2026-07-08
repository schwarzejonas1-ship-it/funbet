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
      bets: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          no_pool: number
          outcome: boolean | null
          question: string
          resolved_at: string | null
          room_id: string
          status: string
          yes_pool: number
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          no_pool?: number
          outcome?: boolean | null
          question: string
          resolved_at?: string | null
          room_id: string
          status?: string
          yes_pool?: number
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          no_pool?: number
          outcome?: boolean | null
          question?: string
          resolved_at?: string | null
          room_id?: string
          status?: string
          yes_pool?: number
        }
        Relationships: [
          {
            foreignKeyName: "bets_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          bet_id: string | null
          created_at: string
          id: string
          message: string
          read: boolean
          room_id: string
          type: string
          user_id: string
        }
        Insert: {
          bet_id?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean
          room_id: string
          type: string
          user_id: string
        }
        Update: {
          bet_id?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          room_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_bet_id_fkey"
            columns: ["bet_id"]
            isOneToOne: false
            referencedRelation: "bets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_members: {
        Row: {
          balance: number
          display_name: string
          id: string
          joined_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          balance: number
          display_name: string
          id?: string
          joined_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          balance?: number
          display_name?: string
          id?: string
          joined_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          code: string
          created_at: string
          created_by: string
          id: string
          name: string
          starting_balance: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          starting_balance: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          starting_balance?: number
        }
        Relationships: []
      }
      stakes: {
        Row: {
          amount: number
          bet_id: string
          created_at: string
          id: string
          payout: number | null
          side: boolean
          user_id: string
        }
        Insert: {
          amount: number
          bet_id: string
          created_at?: string
          id?: string
          payout?: number | null
          side: boolean
          user_id: string
        }
        Update: {
          amount?: number
          bet_id?: string
          created_at?: string
          id?: string
          payout?: number | null
          side?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stakes_bet_id_fkey"
            columns: ["bet_id"]
            isOneToOne: false
            referencedRelation: "bets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_bet: {
        Args: { p_question: string; p_room_id: string }
        Returns: Json
      }
      create_room: {
        Args: {
          p_display_name: string
          p_name: string
          p_starting_balance: number
        }
        Returns: Json
      }
      generate_room_code: { Args: never; Returns: string }
      get_room_preview: { Args: { p_code: string }; Returns: Json }
      is_bet_room_member: { Args: { p_bet_id: string }; Returns: boolean }
      is_room_member: { Args: { p_room_id: string }; Returns: boolean }
      join_room: {
        Args: { p_code: string; p_display_name: string }
        Returns: Json
      }
      place_stake: {
        Args: { p_amount: number; p_bet_id: string; p_side: boolean }
        Returns: Json
      }
      resolve_bet: {
        Args: { p_bet_id: string; p_outcome: boolean }
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
    Enums: {},
  },
} as const
