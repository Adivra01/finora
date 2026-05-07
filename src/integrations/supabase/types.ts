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
      data_backups: {
        Row: {
          backup_date: string
          created_at: string
          id: string
          sql_content: string
          tables_included: string[]
          user_id: string
        }
        Insert: {
          backup_date?: string
          created_at?: string
          id?: string
          sql_content: string
          tables_included?: string[]
          user_id: string
        }
        Update: {
          backup_date?: string
          created_at?: string
          id?: string
          sql_content?: string
          tables_included?: string[]
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
          ecom_aout: number
          ecom_avr: number
          ecom_dec: number
          ecom_fev: number
          ecom_jan: number
          ecom_juil: number
          ecom_juin: number
          ecom_mai: number
          ecom_mar: number
          ecom_nov: number
          ecom_oct: number
          ecom_sept: number
          id: string
          locked_t1: boolean
          locked_t2: boolean
          locked_t3: boolean
          locked_t4: boolean
          paiement_t1: number
          paiement_t2: number
          paiement_t3: number
          paiement_t4: number
          service_aout: number
          service_avr: number
          service_dec: number
          service_fev: number
          service_jan: number
          service_juil: number
          service_juin: number
          service_mai: number
          service_mar: number
          service_nov: number
          service_oct: number
          service_sept: number
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
          ecom_aout?: number
          ecom_avr?: number
          ecom_dec?: number
          ecom_fev?: number
          ecom_jan?: number
          ecom_juil?: number
          ecom_juin?: number
          ecom_mai?: number
          ecom_mar?: number
          ecom_nov?: number
          ecom_oct?: number
          ecom_sept?: number
          id?: string
          locked_t1?: boolean
          locked_t2?: boolean
          locked_t3?: boolean
          locked_t4?: boolean
          paiement_t1?: number
          paiement_t2?: number
          paiement_t3?: number
          paiement_t4?: number
          service_aout?: number
          service_avr?: number
          service_dec?: number
          service_fev?: number
          service_jan?: number
          service_juil?: number
          service_juin?: number
          service_mai?: number
          service_mar?: number
          service_nov?: number
          service_oct?: number
          service_sept?: number
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
          ecom_aout?: number
          ecom_avr?: number
          ecom_dec?: number
          ecom_fev?: number
          ecom_jan?: number
          ecom_juil?: number
          ecom_juin?: number
          ecom_mai?: number
          ecom_mar?: number
          ecom_nov?: number
          ecom_oct?: number
          ecom_sept?: number
          id?: string
          locked_t1?: boolean
          locked_t2?: boolean
          locked_t3?: boolean
          locked_t4?: boolean
          paiement_t1?: number
          paiement_t2?: number
          paiement_t3?: number
          paiement_t4?: number
          service_aout?: number
          service_avr?: number
          service_dec?: number
          service_fev?: number
          service_jan?: number
          service_juil?: number
          service_juin?: number
          service_mai?: number
          service_mar?: number
          service_nov?: number
          service_oct?: number
          service_sept?: number
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
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          invoice_id: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_address: string | null
          client_email: string | null
          client_name: string
          created_at: string
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          total: number
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_address?: string | null
          client_email?: string | null
          client_name: string
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_address?: string | null
          client_email?: string | null
          client_name?: string
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          type?: string
          updated_at?: string
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
