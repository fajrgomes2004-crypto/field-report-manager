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
      contratos: {
        Row: {
          cliente: string
          cnpj: string | null
          codigo: string
          contato: string | null
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          id: string
          observacoes: string | null
          responsavel: string | null
          status: Database["public"]["Enums"]["contrato_status"]
          updated_at: string
        }
        Insert: {
          cliente: string
          cnpj?: string | null
          codigo: string
          contato?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          observacoes?: string | null
          responsavel?: string | null
          status?: Database["public"]["Enums"]["contrato_status"]
          updated_at?: string
        }
        Update: {
          cliente?: string
          cnpj?: string | null
          codigo?: string
          contato?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          observacoes?: string | null
          responsavel?: string | null
          status?: Database["public"]["Enums"]["contrato_status"]
          updated_at?: string
        }
        Relationships: []
      }
      empresa: {
        Row: {
          cep: string | null
          cidade: string | null
          cnpj: string | null
          conselho: string | null
          email: string | null
          endereco: string | null
          id: string
          logo_path: string | null
          nome_fantasia: string | null
          razao_social: string
          registro_conselho: string | null
          responsavel_tecnico: string | null
          site: string | null
          telefone: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          conselho?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          logo_path?: string | null
          nome_fantasia?: string | null
          razao_social?: string
          registro_conselho?: string | null
          responsavel_tecnico?: string | null
          site?: string | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          conselho?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          logo_path?: string | null
          nome_fantasia?: string | null
          razao_social?: string
          registro_conselho?: string | null
          responsavel_tecnico?: string | null
          site?: string | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      itens_servico: {
        Row: {
          ativo: boolean
          categoria: string | null
          codigo: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          unidade: string
          updated_at: string
          valor_unitario: number
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          codigo: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          unidade?: string
          updated_at?: string
          valor_unitario?: number
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          codigo?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          unidade?: string
          updated_at?: string
          valor_unitario?: number
        }
        Relationships: []
      }
      locais: {
        Row: {
          ativo: boolean
          cidade: string | null
          codigo: string | null
          contrato_id: string
          created_at: string
          endereco: string | null
          id: string
          nome: string
          responsavel: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cidade?: string | null
          codigo?: string | null
          contrato_id: string
          created_at?: string
          endereco?: string | null
          id?: string
          nome: string
          responsavel?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cidade?: string | null
          codigo?: string | null
          contrato_id?: string
          created_at?: string
          endereco?: string | null
          id?: string
          nome?: string
          responsavel?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locais_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      manutencao_fotos: {
        Row: {
          created_at: string
          id: string
          legenda: string | null
          manutencao_id: string
          ordem: number
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          legenda?: string | null
          manutencao_id: string
          ordem?: number
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          legenda?: string | null
          manutencao_id?: string
          ordem?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "manutencao_fotos_manutencao_id_fkey"
            columns: ["manutencao_id"]
            isOneToOne: false
            referencedRelation: "manutencoes"
            referencedColumns: ["id"]
          },
        ]
      }
      manutencao_itens: {
        Row: {
          categoria_snapshot: string | null
          codigo_snapshot: string
          created_at: string
          id: string
          item_id: string | null
          manutencao_id: string
          nome_snapshot: string
          quantidade: number
          unidade_snapshot: string
          valor_total: number
          valor_unitario_snapshot: number
        }
        Insert: {
          categoria_snapshot?: string | null
          codigo_snapshot?: string
          created_at?: string
          id?: string
          item_id?: string | null
          manutencao_id: string
          nome_snapshot: string
          quantidade?: number
          unidade_snapshot?: string
          valor_total?: number
          valor_unitario_snapshot?: number
        }
        Update: {
          categoria_snapshot?: string | null
          codigo_snapshot?: string
          created_at?: string
          id?: string
          item_id?: string | null
          manutencao_id?: string
          nome_snapshot?: string
          quantidade?: number
          unidade_snapshot?: string
          valor_total?: number
          valor_unitario_snapshot?: number
        }
        Relationships: [
          {
            foreignKeyName: "manutencao_itens_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "itens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manutencao_itens_manutencao_id_fkey"
            columns: ["manutencao_id"]
            isOneToOne: false
            referencedRelation: "manutencoes"
            referencedColumns: ["id"]
          },
        ]
      }
      manutencoes: {
        Row: {
          contrato_id: string
          created_at: string
          data_hora: string
          descricao: string | null
          id: string
          local_id: string
          observacoes: string | null
          status: Database["public"]["Enums"]["manutencao_status"]
          tecnico_id: string
          updated_at: string
          valor_total: number
        }
        Insert: {
          contrato_id: string
          created_at?: string
          data_hora?: string
          descricao?: string | null
          id?: string
          local_id: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["manutencao_status"]
          tecnico_id: string
          updated_at?: string
          valor_total?: number
        }
        Update: {
          contrato_id?: string
          created_at?: string
          data_hora?: string
          descricao?: string | null
          id?: string
          local_id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["manutencao_status"]
          tecnico_id?: string
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "manutencoes_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manutencoes_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          created_at?: string
          email?: string
          id: string
          nome?: string
          telefone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "administrador" | "tecnico"
      contrato_status: "ativo" | "inativo" | "encerrado"
      manutencao_status: "rascunho" | "concluida" | "cancelada"
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
      app_role: ["administrador", "tecnico"],
      contrato_status: ["ativo", "inativo", "encerrado"],
      manutencao_status: ["rascunho", "concluida", "cancelada"],
    },
  },
} as const
