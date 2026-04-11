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
      categories: {
        Row: {
          created_at: string
          group: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          group?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      fiscal_data: {
        Row: {
          ca_aout: number
          ca_avr: number
          ca_dec: number
          ca_fev: number
          ca_jan: number
          ca_juil: number
          ca_juin: number
          ca_mai: number
          ca_mar: number
          ca_nov: number
          ca_oct: number
          ca_sept: number
          created_at: string
          id: string
          paiement_t1: number
          paiement_t2: number
          paiement_t3: number
          paiement_t4: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          ca_aout?: number
          ca_avr?: number
          ca_dec?: number
          ca_fev?: number
          ca_jan?: number
          ca_juil?: number
          ca_juin?: number
          ca_mai?: number
          ca_mar?: number
          ca_nov?: number
          ca_oct?: number
          ca_sept?: number
          created_at?: string
          id?: string
          paiement_t1?: number
          paiement_t2?: number
          paiement_t3?: number
          paiement_t4?: number
          updated_at?: string
          user_id: string
          year?: number
        }
        Update: {
          ca_aout?: number
          ca_avr?: number
          ca_dec?: number
          ca_fev?: number
          ca_jan?: number
          ca_juil?: number
          ca_juin?: number
          ca_mai?: number
          ca_mar?: number
          ca_nov?: number
          ca_oct?: number
          ca_sept?: number
          created_at?: string
          id?: string
          paiement_t1?: number
          paiement_t2?: number
          paiement_t3?: number
          paiement_t4?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      investments: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string
          id: string
          name: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          date: string
          description?: string
          id?: string
          name: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string
          id?: string
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payables: {
        Row: {
          client: string
          created_at: string
          description: string
          id: string
          paid_amount: number
          total_amount: number
          user_id: string
        }
        Insert: {
          client: string
          created_at?: string
          description?: string
          id?: string
          paid_amount?: number
          total_amount: number
          user_id: string
        }
        Update: {
          client?: string
          created_at?: string
          description?: string
          id?: string
          paid_amount?: number
          total_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          note: string
          payable_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          date: string
          id?: string
          note?: string
          payable_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          note?: string
          payable_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_payable_id_fkey"
            columns: ["payable_id"]
            isOneToOne: false
            referencedRelation: "payables"
            referencedColumns: ["id"]
          },
        ]
      }
      planned_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          id: string
          is_spent: boolean
          planned_date: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description?: string
          id?: string
          is_spent?: boolean
          planned_date: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          id?: string
          is_spent?: boolean
          planned_date?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
          planned_expense_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date: string
          description?: string
          id?: string
          planned_expense_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          planned_expense_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_planned_expense_id_fkey"
            columns: ["planned_expense_id"]
            isOneToOne: false
            referencedRelation: "planned_expenses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
