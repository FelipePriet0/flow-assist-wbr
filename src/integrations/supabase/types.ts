export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      analyses: {
        Row: {
          application_id: string
          comments: string | null
          decided_at: string | null
          decided_by: string | null
          decided_by_name: string | null
          decision: string | null
          id: string
        }
        Insert: {
          application_id: string
          comments?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decided_by_name?: string | null
          decision?: string | null
          id?: string
        }
        Update: {
          application_id?: string
          comments?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decided_by_name?: string | null
          decision?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyses_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyses_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "v_app_cohort"
            referencedColumns: ["application_id"]
          },
        ]
      }
      application_address: {
        Row: {
          application_id: string
          city: string | null
          complement: string | null
          condo: string | null
          contract_named_to: string | null
          fixed_internet_company: string | null
          has_contract: boolean | null
          has_fixed_internet: boolean | null
          household_with: string | null
          housing_obs: string | null
          housing_type: string | null
          landlord_name: string | null
          landlord_phone: string | null
          neighborhood: string | null
          number: string | null
          others_relation: string | null
          proof_named_to: string | null
          proof_type: string | null
          sent_contract: boolean | null
          sent_proof: boolean | null
          state: string | null
          street: string | null
          zipcode: string | null
        }
        Insert: {
          application_id: string
          city?: string | null
          complement?: string | null
          condo?: string | null
          contract_named_to?: string | null
          fixed_internet_company?: string | null
          has_contract?: boolean | null
          has_fixed_internet?: boolean | null
          household_with?: string | null
          housing_obs?: string | null
          housing_type?: string | null
          landlord_name?: string | null
          landlord_phone?: string | null
          neighborhood?: string | null
          number?: string | null
          others_relation?: string | null
          proof_named_to?: string | null
          proof_type?: string | null
          sent_contract?: boolean | null
          sent_proof?: boolean | null
          state?: string | null
          street?: string | null
          zipcode?: string | null
        }
        Update: {
          application_id?: string
          city?: string | null
          complement?: string | null
          condo?: string | null
          contract_named_to?: string | null
          fixed_internet_company?: string | null
          has_contract?: boolean | null
          has_fixed_internet?: boolean | null
          household_with?: string | null
          housing_obs?: string | null
          housing_type?: string | null
          landlord_name?: string | null
          landlord_phone?: string | null
          neighborhood?: string | null
          number?: string | null
          others_relation?: string | null
          proof_named_to?: string | null
          proof_type?: string | null
          sent_contract?: boolean | null
          sent_proof?: boolean | null
          state?: string | null
          street?: string | null
          zipcode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_address_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_address_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "v_app_cohort"
            referencedColumns: ["application_id"]
          },
        ]
      }
      application_financial: {
        Row: {
          application_id: string
          cohort_month: string | null
          status_30d: boolean | null
          status_60d: boolean | null
          status_90d: boolean | null
          updated_at: string | null
        }
        Insert: {
          application_id: string
          cohort_month?: string | null
          status_30d?: boolean | null
          status_60d?: boolean | null
          status_90d?: boolean | null
          updated_at?: string | null
        }
        Update: {
          application_id?: string
          cohort_month?: string | null
          status_30d?: boolean | null
          status_60d?: boolean | null
          status_90d?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_financial_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_financial_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "v_app_cohort"
            referencedColumns: ["application_id"]
          },
        ]
      }
      application_labels: {
        Row: {
          application_id: string
          label_id: string
        }
        Insert: {
          application_id: string
          label_id: string
        }
        Update: {
          application_id?: string
          label_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_labels_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_labels_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "v_app_cohort"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "application_labels_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          analyst_id: string | null
          analyst_name: string | null
          comments: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string
          due_at: string | null
          id: string
          reanalysis_notes: string | null
          received_at: string | null
          status: string | null
        }
        Insert: {
          analyst_id?: string | null
          analyst_name?: string | null
          comments?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          due_at?: string | null
          id?: string
          reanalysis_notes?: string | null
          received_at?: string | null
          status?: string | null
        }
        Update: {
          analyst_id?: string | null
          analyst_name?: string | null
          comments?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          due_at?: string | null
          id?: string
          reanalysis_notes?: string | null
          received_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          application_id: string | null
          city: string | null
          company_id: string | null
          customer_name: string | null
          date: string
          id: string
          label_id: string | null
          notes: string | null
          phone: string | null
          slot: string
          technician_id: string | null
        }
        Insert: {
          application_id?: string | null
          city?: string | null
          company_id?: string | null
          customer_name?: string | null
          date: string
          id?: string
          label_id?: string | null
          notes?: string | null
          phone?: string | null
          slot: string
          technician_id?: string | null
        }
        Update: {
          application_id?: string | null
          city?: string | null
          company_id?: string | null
          customer_name?: string | null
          date?: string
          id?: string
          label_id?: string | null
          notes?: string | null
          phone?: string | null
          slot?: string
          technician_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "v_app_cohort"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "appointments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          application_id: string | null
          id: string
          kind: string | null
          storage_path: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          application_id?: string | null
          id?: string
          kind?: string | null
          storage_path?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          application_id?: string | null
          id?: string
          kind?: string | null
          storage_path?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "v_app_cohort"
            referencedColumns: ["application_id"]
          },
        ]
      }
      companies: {
        Row: {
          code: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          birth_date: string | null
          birthplace: string | null
          birthplace_uf: string | null
          cpf: string
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          phone: string | null
          whatsapp: string | null
        }
        Insert: {
          birth_date?: string | null
          birthplace?: string | null
          birthplace_uf?: string | null
          cpf: string
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          whatsapp?: string | null
        }
        Update: {
          birth_date?: string | null
          birthplace?: string | null
          birthplace_uf?: string | null
          cpf?: string
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      employment: {
        Row: {
          application_id: string
          company_name: string | null
          ctps: boolean | null
          employment_obs: string | null
          employment_type: string | null
          profession: string | null
          tenure_months: number | null
        }
        Insert: {
          application_id: string
          company_name?: string | null
          ctps?: boolean | null
          employment_obs?: string | null
          employment_type?: string | null
          profession?: string | null
          tenure_months?: number | null
        }
        Update: {
          application_id?: string
          company_name?: string | null
          ctps?: boolean | null
          employment_obs?: string | null
          employment_type?: string | null
          profession?: string | null
          tenure_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employment_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employment_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "v_app_cohort"
            referencedColumns: ["application_id"]
          },
        ]
      }
      events_audit: {
        Row: {
          action: string | null
          actor: string | null
          actor_name: string | null
          created_at: string | null
          entity: string | null
          entity_id: string | null
          id: string
          payload: Json | null
        }
        Insert: {
          action?: string | null
          actor?: string | null
          actor_name?: string | null
          created_at?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          payload?: Json | null
        }
        Update: {
          action?: string | null
          actor?: string | null
          actor_name?: string | null
          created_at?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          payload?: Json | null
        }
        Relationships: []
      }
      household: {
        Row: {
          application_id: string
          family_links: boolean | null
          family_links_obs: string | null
          marital_status: string | null
        }
        Insert: {
          application_id: string
          family_links?: boolean | null
          family_links_obs?: string | null
          marital_status?: string | null
        }
        Update: {
          application_id?: string
          family_links?: boolean | null
          family_links_obs?: string | null
          marital_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "household_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "v_app_cohort"
            referencedColumns: ["application_id"]
          },
        ]
      }
      labels: {
        Row: {
          code: string | null
          color_hex: string | null
          id: string
          name: string | null
        }
        Insert: {
          code?: string | null
          color_hex?: string | null
          id?: string
          name?: string | null
        }
        Update: {
          code?: string | null
          color_hex?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      payments_imports: {
        Row: {
          id: string
          imported_at: string | null
          row: Json | null
          source: string | null
        }
        Insert: {
          id?: string
          imported_at?: string | null
          row?: Json | null
          source?: string | null
        }
        Update: {
          id?: string
          imported_at?: string | null
          row?: Json | null
          source?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      references_personal: {
        Row: {
          application_id: string
          id: string
          lives_at: string | null
          phone: string | null
          ref_name: string | null
          relationship: string | null
        }
        Insert: {
          application_id: string
          id?: string
          lives_at?: string | null
          phone?: string | null
          ref_name?: string | null
          relationship?: string | null
        }
        Update: {
          application_id?: string
          id?: string
          lives_at?: string | null
          phone?: string | null
          ref_name?: string | null
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "references_personal_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "references_personal_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "v_app_cohort"
            referencedColumns: ["application_id"]
          },
        ]
      }
      spouse: {
        Row: {
          application_id: string
          birthplace: string | null
          birthplace_uf: string | null
          cpf: string | null
          full_name: string | null
          phone: string | null
          whatsapp: string | null
        }
        Insert: {
          application_id: string
          birthplace?: string | null
          birthplace_uf?: string | null
          cpf?: string | null
          full_name?: string | null
          phone?: string | null
          whatsapp?: string | null
        }
        Update: {
          application_id?: string
          birthplace?: string | null
          birthplace_uf?: string | null
          cpf?: string | null
          full_name?: string | null
          phone?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spouse_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spouse_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "v_app_cohort"
            referencedColumns: ["application_id"]
          },
        ]
      }
      technicians: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_app_cohort: {
        Row: {
          analyst_id: string | null
          analyst_name: string | null
          application_id: string | null
          cohort_month: string | null
        }
        Insert: {
          analyst_id?: string | null
          analyst_name?: string | null
          application_id?: string | null
          cohort_month?: never
        }
        Update: {
          analyst_id?: string | null
          analyst_name?: string | null
          application_id?: string | null
          cohort_month?: never
        }
        Relationships: []
      }
      v_delinquency_by_analyst: {
        Row: {
          analyst_id: string | null
          analyst_name: string | null
          cohort_month: string | null
          inad_30d: number | null
          inad_60d: number | null
          inad_90d: number | null
          pct_inad_30d: number | null
          pct_inad_60d: number | null
          pct_inad_90d: number | null
          total_fichas_coorte: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      applications_change_status: {
        Args: {
          p_app_id: string
          p_new_status: Database["public"]["Enums"]["app_status"]
          p_comment?: string
        }
        Returns: undefined
      }
      current_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string | null
          company_id: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
      }
      is_premium: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      same_company: {
        Args: { target: string }
        Returns: boolean
      }
      update_profile: {
        Args: { p_full_name: string; p_avatar_url: string }
        Returns: {
          avatar_url: string | null
          company_id: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
      }
    }
    Enums: {
      app_status: "pendente" | "aprovado" | "negado" | "reanalisar"
      user_role: "analista_premium" | "reanalista" | "comercial"
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
      app_status: ["pendente", "aprovado", "negado", "reanalisar"],
      user_role: ["analista_premium", "reanalista", "comercial"],
    },
  },
} as const
