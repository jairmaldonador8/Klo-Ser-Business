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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
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
  public: {
    Tables: {
      espacios: {
        Row: {
          actualizado_en: string
          atajo: string
          color: string
          creado_en: string
          creado_por: string
          id: string
          inicial: string
          logo: string | null
          logo_ancho: string | null
          nombre: string
          orden: number
        }
        Insert: {
          actualizado_en?: string
          atajo: string
          color: string
          creado_en?: string
          creado_por?: string
          id?: string
          inicial: string
          logo?: string | null
          logo_ancho?: string | null
          nombre: string
          orden?: number
        }
        Update: {
          actualizado_en?: string
          atajo?: string
          color?: string
          creado_en?: string
          creado_por?: string
          id?: string
          inicial?: string
          logo?: string | null
          logo_ancho?: string | null
          nombre?: string
          orden?: number
        }
        Relationships: []
      }
      micro_wins: {
        Row: {
          borrado_en: string | null
          creado_en: string
          id: string
          nombre: string
          orden: number
          user_id: string
        }
        Insert: {
          borrado_en?: string | null
          creado_en?: string
          id?: string
          nombre: string
          orden?: number
          user_id?: string
        }
        Update: {
          borrado_en?: string | null
          creado_en?: string
          id?: string
          nombre?: string
          orden?: number
          user_id?: string
        }
        Relationships: []
      }
      micro_wins_hechos: {
        Row: {
          creado_en: string
          fecha: string
          micro_win_id: string
          user_id: string
        }
        Insert: {
          creado_en?: string
          fecha: string
          micro_win_id: string
          user_id?: string
        }
        Update: {
          creado_en?: string
          fecha?: string
          micro_win_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "micro_wins_hechos_micro_win_id_fkey"
            columns: ["micro_win_id"]
            isOneToOne: false
            referencedRelation: "micro_wins"
            referencedColumns: ["id"]
          },
        ]
      }
      miembros: {
        Row: {
          creado_en: string
          espacio_id: string
          rol: string
          user_id: string
        }
        Insert: {
          creado_en?: string
          espacio_id: string
          rol?: string
          user_id: string
        }
        Update: {
          creado_en?: string
          espacio_id?: string
          rol?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "miembros_espacio_id_fkey"
            columns: ["espacio_id"]
            isOneToOne: false
            referencedRelation: "espacios"
            referencedColumns: ["id"]
          },
        ]
      }
      notas: {
        Row: {
          actualizado_en: string
          borrado_en: string | null
          convertida_en_tarea_id: string | null
          creado_en: string
          creado_por: string
          espacio_id: string
          id: string
          texto: string
        }
        Insert: {
          actualizado_en?: string
          borrado_en?: string | null
          convertida_en_tarea_id?: string | null
          creado_en?: string
          creado_por?: string
          espacio_id: string
          id?: string
          texto: string
        }
        Update: {
          actualizado_en?: string
          borrado_en?: string | null
          convertida_en_tarea_id?: string | null
          creado_en?: string
          creado_por?: string
          espacio_id?: string
          id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "notas_convertida_en_tarea_id_fkey"
            columns: ["convertida_en_tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_espacio_id_fkey"
            columns: ["espacio_id"]
            isOneToOne: false
            referencedRelation: "espacios"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          actividades: string[]
          actualizado_en: string
          creado_en: string
          espacio_predeterminado_id: string | null
          nombre: string
          user_id: string
          vista: Json
          zona_horaria: string
        }
        Insert: {
          actividades?: string[]
          actualizado_en?: string
          creado_en?: string
          espacio_predeterminado_id?: string | null
          nombre?: string
          user_id: string
          vista?: Json
          zona_horaria?: string
        }
        Update: {
          actividades?: string[]
          actualizado_en?: string
          creado_en?: string
          espacio_predeterminado_id?: string | null
          nombre?: string
          user_id?: string
          vista?: Json
          zona_horaria?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_espacio_predeterminado_fk"
            columns: ["espacio_predeterminado_id"]
            isOneToOne: false
            referencedRelation: "espacios"
            referencedColumns: ["id"]
          },
        ]
      }
      proyectos: {
        Row: {
          actualizado_en: string
          cifra_actual: number
          cifra_meta: number | null
          creado_en: string
          creado_por: string
          espacio_id: string
          estado: string
          fecha_inicio: string
          fecha_meta: string | null
          id: string
          meta: string
          modo_avance: string
          nombre: string
          orden: number
        }
        Insert: {
          actualizado_en?: string
          cifra_actual?: number
          cifra_meta?: number | null
          creado_en?: string
          creado_por?: string
          espacio_id: string
          estado?: string
          fecha_inicio?: string
          fecha_meta?: string | null
          id?: string
          meta?: string
          modo_avance?: string
          nombre: string
          orden?: number
        }
        Update: {
          actualizado_en?: string
          cifra_actual?: number
          cifra_meta?: number | null
          creado_en?: string
          creado_por?: string
          espacio_id?: string
          estado?: string
          fecha_inicio?: string
          fecha_meta?: string | null
          id?: string
          meta?: string
          modo_avance?: string
          nombre?: string
          orden?: number
        }
        Relationships: [
          {
            foreignKeyName: "proyectos_espacio_id_fkey"
            columns: ["espacio_id"]
            isOneToOne: false
            referencedRelation: "espacios"
            referencedColumns: ["id"]
          },
        ]
      }
      tareas: {
        Row: {
          actualizado_en: string
          borrado_en: string | null
          clase: string
          completada_en: string | null
          creado_en: string
          creado_por: string
          espacio_id: string
          fecha: string | null
          fecha_fin: string | null
          hora: string | null
          hora_fin: string | null
          id: string
          origen: string
          proyecto_id: string | null
          responsable_id: string
          titulo: string
        }
        Insert: {
          actualizado_en?: string
          borrado_en?: string | null
          clase?: string
          completada_en?: string | null
          creado_en?: string
          creado_por?: string
          espacio_id: string
          fecha?: string | null
          fecha_fin?: string | null
          hora?: string | null
          hora_fin?: string | null
          id?: string
          origen?: string
          proyecto_id?: string | null
          responsable_id?: string
          titulo: string
        }
        Update: {
          actualizado_en?: string
          borrado_en?: string | null
          clase?: string
          completada_en?: string | null
          creado_en?: string
          creado_por?: string
          espacio_id?: string
          fecha?: string | null
          fecha_fin?: string | null
          hora?: string | null
          hora_fin?: string | null
          id?: string
          origen?: string
          proyecto_id?: string | null
          responsable_id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "tareas_espacio_id_fkey"
            columns: ["espacio_id"]
            isOneToOne: false
            referencedRelation: "espacios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      completar_bienvenida: {
        Args: { p_frentes: Json; p_nombre: string }
        Returns: undefined
      }
      crear_espacio: {
        Args: {
          p_atajo: string
          p_inicial: string
          p_nombre: string
          p_orden?: number
        }
        Returns: string
      }
      hook_lista_permitida: { Args: { event: Json }; Returns: Json }
      permitir_correo: { Args: { p_correo: string }; Returns: undefined }
      sumar_cifra: {
        Args: { p_delta: number; p_id: string }
        Returns: undefined
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
