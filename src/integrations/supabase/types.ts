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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      conteudos: {
        Row: {
          bunny_id: string | null
          capa_url: string | null
          created_at: string
          id: string
          idioma: string
          imdb_id: string | null
          info_hash: string
          path_pasta: string | null
          qualidade: string | null
          status_processamento: string | null
          tipo: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          bunny_id?: string | null
          capa_url?: string | null
          created_at?: string
          id?: string
          idioma?: string
          imdb_id?: string | null
          info_hash: string
          path_pasta?: string | null
          qualidade?: string | null
          status_processamento?: string | null
          tipo?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          bunny_id?: string | null
          capa_url?: string | null
          created_at?: string
          id?: string
          idioma?: string
          imdb_id?: string | null
          info_hash?: string
          path_pasta?: string | null
          qualidade?: string | null
          status_processamento?: string | null
          tipo?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      episodios: {
        Row: {
          bunny_id: string | null
          created_at: string
          episodio: number
          id: string
          idioma: string | null
          info_hash: string | null
          path_pasta: string | null
          qualidade: string | null
          serie_id: string
          sinopse_episodio: string | null
          status_processamento: string | null
          temporada: number
          titulo_episodio: string | null
          updated_at: string
          url_video: string | null
        }
        Insert: {
          bunny_id?: string | null
          created_at?: string
          episodio: number
          id?: string
          idioma?: string | null
          info_hash?: string | null
          path_pasta?: string | null
          qualidade?: string | null
          serie_id: string
          sinopse_episodio?: string | null
          status_processamento?: string | null
          temporada: number
          titulo_episodio?: string | null
          updated_at?: string
          url_video?: string | null
        }
        Update: {
          bunny_id?: string | null
          created_at?: string
          episodio?: number
          id?: string
          idioma?: string | null
          info_hash?: string | null
          path_pasta?: string | null
          qualidade?: string | null
          serie_id?: string
          sinopse_episodio?: string | null
          status_processamento?: string | null
          temporada?: number
          titulo_episodio?: string | null
          updated_at?: string
          url_video?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "episodios_serie_id_fkey"
            columns: ["serie_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          movie_id: string
          movie_poster: string | null
          movie_title: string
          profile_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          movie_id: string
          movie_poster?: string | null
          movie_title: string
          profile_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          movie_id?: string
          movie_poster?: string | null
          movie_title?: string
          profile_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fila_sincronizacao: {
        Row: {
          conteudo_id: string | null
          created_at: string | null
          direct_url: string | null
          episodio_id: string | null
          erro_msg: string | null
          fonte: string | null
          id: string
          magnet_link: string
          metadata: Json | null
          prioridade: number | null
          status: string | null
          tentativas: number | null
          updated_at: string | null
        }
        Insert: {
          conteudo_id?: string | null
          created_at?: string | null
          direct_url?: string | null
          episodio_id?: string | null
          erro_msg?: string | null
          fonte?: string | null
          id?: string
          magnet_link: string
          metadata?: Json | null
          prioridade?: number | null
          status?: string | null
          tentativas?: number | null
          updated_at?: string | null
        }
        Update: {
          conteudo_id?: string | null
          created_at?: string | null
          direct_url?: string | null
          episodio_id?: string | null
          erro_msg?: string | null
          fonte?: string | null
          id?: string
          magnet_link?: string
          metadata?: Json | null
          prioridade?: number | null
          status?: string | null
          tentativas?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fila_sincronizacao_conteudo_id_fkey"
            columns: ["conteudo_id"]
            isOneToOne: false
            referencedRelation: "conteudos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fila_sincronizacao_conteudo_id_fkey"
            columns: ["conteudo_id"]
            isOneToOne: false
            referencedRelation: "view_status_conteudo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fila_sincronizacao_episodio_id_fkey"
            columns: ["episodio_id"]
            isOneToOne: false
            referencedRelation: "episodios"
            referencedColumns: ["id"]
          },
        ]
      }
      media_links: {
        Row: {
          created_at: string
          episode: number
          expires_at: string | null
          fail_count: number
          id: string
          kind: string | null
          last_checked_at: string
          media_type: string
          season: number
          source: string
          source_url: string | null
          status: string
          tmdb_id: number
          url: string | null
          versao: string
        }
        Insert: {
          created_at?: string
          episode?: number
          expires_at?: string | null
          fail_count?: number
          id?: string
          kind?: string | null
          last_checked_at?: string
          media_type?: string
          season?: number
          source?: string
          source_url?: string | null
          status?: string
          tmdb_id: number
          url?: string | null
          versao?: string
        }
        Update: {
          created_at?: string
          episode?: number
          expires_at?: string | null
          fail_count?: number
          id?: string
          kind?: string | null
          last_checked_at?: string
          media_type?: string
          season?: number
          source?: string
          source_url?: string | null
          status?: string
          tmdb_id?: number
          url?: string | null
          versao?: string
        }
        Relationships: []
      }
      movies_cache: {
        Row: {
          created_at: string
          id: string
          imdb_id: string | null
          imdb_rating: number | null
          movyra_score: number | null
          overview: string | null
          poster_path: string | null
          release_date: string | null
          title: string
          tmdb_id: number
          tmdb_rating: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          imdb_id?: string | null
          imdb_rating?: number | null
          movyra_score?: number | null
          overview?: string | null
          poster_path?: string | null
          release_date?: string | null
          title: string
          tmdb_id: number
          tmdb_rating?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          imdb_id?: string | null
          imdb_rating?: number | null
          movyra_score?: number | null
          overview?: string | null
          poster_path?: string | null
          release_date?: string | null
          title?: string
          tmdb_id?: number
          tmdb_rating?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          has_pin: boolean
          id: string
          is_kids: boolean
          max_age_rating: number
          pin_hash: string | null
          preferences: Json | null
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          has_pin?: boolean
          id?: string
          is_kids?: boolean
          max_age_rating?: number
          pin_hash?: string | null
          preferences?: Json | null
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          has_pin?: boolean
          id?: string
          is_kids?: boolean
          max_age_rating?: number
          pin_hash?: string | null
          preferences?: Json | null
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string
          id: string
          movie_id: string
          profile_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          movie_id: string
          profile_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          movie_id?: string
          profile_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      series: {
        Row: {
          bunny_collection_id: string | null
          capa_url: string | null
          created_at: string
          id: string
          idioma: string
          imdb_id: string | null
          path_pasta: string | null
          sinopse: string | null
          tipo: string
          titulo: string
          tmdb_id: number | null
          total_temporadas: number | null
          updated_at: string
        }
        Insert: {
          bunny_collection_id?: string | null
          capa_url?: string | null
          created_at?: string
          id?: string
          idioma?: string
          imdb_id?: string | null
          path_pasta?: string | null
          sinopse?: string | null
          tipo?: string
          titulo: string
          tmdb_id?: number | null
          total_temporadas?: number | null
          updated_at?: string
        }
        Update: {
          bunny_collection_id?: string | null
          capa_url?: string | null
          created_at?: string
          id?: string
          idioma?: string
          imdb_id?: string | null
          path_pasta?: string | null
          sinopse?: string | null
          tipo?: string
          titulo?: string
          tmdb_id?: number | null
          total_temporadas?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_addons: {
        Row: {
          addon_description: string | null
          addon_id: string
          addon_logo: string | null
          addon_name: string
          addon_url: string
          config_url: string | null
          created_at: string
          has_config: boolean | null
          id: string
          user_id: string
        }
        Insert: {
          addon_description?: string | null
          addon_id: string
          addon_logo?: string | null
          addon_name: string
          addon_url: string
          config_url?: string | null
          created_at?: string
          has_config?: boolean | null
          id?: string
          user_id: string
        }
        Update: {
          addon_description?: string | null
          addon_id?: string
          addon_logo?: string | null
          addon_name?: string
          addon_url?: string
          config_url?: string | null
          created_at?: string
          has_config?: boolean | null
          id?: string
          user_id?: string
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
      watch_history: {
        Row: {
          created_at: string
          duration_seconds: number | null
          episode_number: number | null
          episode_title: string | null
          id: string
          media_type: string
          movie_id: string
          movie_poster: string | null
          movie_title: string
          profile_id: string
          progress_seconds: number
          season_number: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          episode_number?: number | null
          episode_title?: string | null
          id?: string
          media_type?: string
          movie_id: string
          movie_poster?: string | null
          movie_title: string
          profile_id: string
          progress_seconds?: number
          season_number?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          episode_number?: number | null
          episode_title?: string | null
          id?: string
          media_type?: string
          movie_id?: string
          movie_poster?: string | null
          movie_title?: string
          profile_id?: string
          progress_seconds?: number
          season_number?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      view_status_conteudo: {
        Row: {
          bunny_id: string | null
          capa_url: string | null
          created_at: string | null
          id: string | null
          idioma: string | null
          imdb_id: string | null
          info_hash: string | null
          path_pasta: string | null
          qualidade: string | null
          status_processamento: string | null
          tipo: string | null
          titulo: string | null
          updated_at: string | null
        }
        Insert: {
          bunny_id?: string | null
          capa_url?: string | null
          created_at?: string | null
          id?: string | null
          idioma?: string | null
          imdb_id?: string | null
          info_hash?: string | null
          path_pasta?: string | null
          qualidade?: string | null
          status_processamento?: string | null
          tipo?: string | null
          titulo?: string | null
          updated_at?: string | null
        }
        Update: {
          bunny_id?: string | null
          capa_url?: string | null
          created_at?: string | null
          id?: string | null
          idioma?: string | null
          imdb_id?: string | null
          info_hash?: string | null
          path_pasta?: string | null
          qualidade?: string | null
          status_processamento?: string | null
          tipo?: string | null
          titulo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_download_stats: { Args: never; Returns: Json }
      get_movie_rating_stats: { Args: { p_movie_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_current_user_admin: { Args: never; Returns: boolean }
      pegar_proximo_item: {
        Args: { vps_id: string }
        Returns: {
          conteudo_id: string
          direct_url: string
          episodio_id: string
          fila_id: string
          magnet: string
          metadata: Json
          titulo: string
        }[]
      }
      set_profile_pin: {
        Args: { p_pin: string; p_profile_id: string }
        Returns: boolean
      }
      verify_profile_pin: {
        Args: { p_pin: string; p_profile_id: string }
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
