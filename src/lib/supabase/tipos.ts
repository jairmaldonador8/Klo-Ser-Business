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
      avisos: {
        Row: {
          creado_en: string
          enviado_en: string | null
          enviar_en: string
          id: string
          owner_id: string
          tarea_id: string | null
          texto: string
          url: string | null
        }
        Insert: {
          creado_en?: string
          enviado_en?: string | null
          enviar_en: string
          id?: string
          owner_id?: string
          tarea_id?: string | null
          texto: string
          url?: string | null
        }
        Update: {
          creado_en?: string
          enviado_en?: string | null
          enviar_en?: string
          id?: string
          owner_id?: string
          tarea_id?: string | null
          texto?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avisos_tarea_id_fkey"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id"]
          },
        ]
      }
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
      klo_memoria: {
        Row: {
          creado_en: string
          id: string
          owner_id: string
          texto: string
        }
        Insert: {
          creado_en?: string
          id?: string
          owner_id?: string
          texto: string
        }
        Update: {
          creado_en?: string
          id?: string
          owner_id?: string
          texto?: string
        }
        Relationships: []
      }
      klo_mensajes: {
        Row: {
          acciones: Json
          creado_en: string
          deshecho_en: string | null
          id: string
          owner_id: string
          pendiente: Json | null
          rol: string
          sesion: string
          texto: string
          tokens_cache_escritos: number
          tokens_cache_leidos: number
          tokens_entrada: number
          tokens_salida: number
        }
        Insert: {
          acciones?: Json
          creado_en?: string
          deshecho_en?: string | null
          id?: string
          owner_id?: string
          pendiente?: Json | null
          rol: string
          sesion: string
          texto: string
          tokens_cache_escritos?: number
          tokens_cache_leidos?: number
          tokens_entrada?: number
          tokens_salida?: number
        }
        Update: {
          acciones?: Json
          creado_en?: string
          deshecho_en?: string | null
          id?: string
          owner_id?: string
          pendiente?: Json | null
          rol?: string
          sesion?: string
          texto?: string
          tokens_cache_escritos?: number
          tokens_cache_leidos?: number
          tokens_entrada?: number
          tokens_salida?: number
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
          posible_tarea: boolean
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
          posible_tarea?: boolean
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
          posible_tarea?: boolean
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
          klo_brief: string | null
          nombre: string
          resumen_enviado: string | null
          resumen_hora: string | null
          user_id: string
          vista: Json
          zona_horaria: string
        }
        Insert: {
          actividades?: string[]
          actualizado_en?: string
          creado_en?: string
          espacio_predeterminado_id?: string | null
          klo_brief?: string | null
          nombre?: string
          resumen_enviado?: string | null
          resumen_hora?: string | null
          user_id: string
          vista?: Json
          zona_horaria?: string
        }
        Update: {
          actividades?: string[]
          actualizado_en?: string
          creado_en?: string
          espacio_predeterminado_id?: string | null
          klo_brief?: string | null
          nombre?: string
          resumen_enviado?: string | null
          resumen_hora?: string | null
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
      push_suscripciones: {
        Row: {
          agente: string | null
          auth: string
          creado_en: string
          endpoint: string
          id: string
          owner_id: string
          p256dh: string
        }
        Insert: {
          agente?: string | null
          auth: string
          creado_en?: string
          endpoint: string
          id?: string
          owner_id?: string
          p256dh: string
        }
        Update: {
          agente?: string | null
          auth?: string
          creado_en?: string
          endpoint?: string
          id?: string
          owner_id?: string
          p256dh?: string
        }
        Relationships: []
      }
      series: {
        Row: {
          borrado_en: string | null
          conteo: number | null
          creado_en: string
          creado_por: string
          espacio_id: string
          generado_hasta: string
          hasta: string | null
          id: string
          inicio: string
          regla: Json
        }
        Insert: {
          borrado_en?: string | null
          conteo?: number | null
          creado_en?: string
          creado_por?: string
          espacio_id: string
          generado_hasta: string
          hasta?: string | null
          id?: string
          inicio: string
          regla: Json
        }
        Update: {
          borrado_en?: string | null
          conteo?: number | null
          creado_en?: string
          creado_por?: string
          espacio_id?: string
          generado_hasta?: string
          hasta?: string | null
          id?: string
          inicio?: string
          regla?: Json
        }
        Relationships: [
          {
            foreignKeyName: "series_espacio_id_fkey"
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
          avisado_en: string | null
          aviso_min: number | null
          borrado_en: string | null
          clase: string
          color: string | null
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
          serie_id: string | null
          titulo: string
        }
        Insert: {
          actualizado_en?: string
          avisado_en?: string | null
          aviso_min?: number | null
          borrado_en?: string | null
          clase?: string
          color?: string | null
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
          serie_id?: string | null
          titulo: string
        }
        Update: {
          actualizado_en?: string
          avisado_en?: string | null
          aviso_min?: number | null
          borrado_en?: string | null
          clase?: string
          color?: string | null
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
          serie_id?: string | null
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
          {
            foreignKeyName: "tareas_serie_id_fkey"
            columns: ["serie_id"]
            isOneToOne: false
            referencedRelation: "series"
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
