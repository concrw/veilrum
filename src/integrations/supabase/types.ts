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
      brainstorm_sessions: {
        Row: {
          ended_at: string | null
          id: string
          started_at: string | null
          status: string | null
          timer_duration: number | null
          total_jobs: number | null
          user_id: string | null
        }
        Insert: {
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          timer_duration?: number | null
          total_jobs?: number | null
          user_id?: string | null
        }
        Update: {
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          timer_duration?: number | null
          total_jobs?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      brand_strategies: {
        Row: {
          analysis_result_id: string | null
          brand_direction: Json
          brand_names: string[]
          content_strategy: Json
          created_at: string
          id: string
          selected_brand_name: string | null
          target_audience: Json
          user_id: string
        }
        Insert: {
          analysis_result_id?: string | null
          brand_direction?: Json
          brand_names?: string[]
          content_strategy?: Json
          created_at?: string
          id?: string
          selected_brand_name?: string | null
          target_audience?: Json
          user_id: string
        }
        Update: {
          analysis_result_id?: string | null
          brand_direction?: Json
          brand_names?: string[]
          content_strategy?: Json
          created_at?: string
          id?: string
          selected_brand_name?: string | null
          target_audience?: Json
          user_id?: string
        }
        Relationships: []
      }
      community_groups: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          id: string
          member_count: number
          name: string
          theme: string | null
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          member_count?: number
          name: string
          theme?: string | null
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          member_count?: number
          name?: string
          theme?: string | null
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["group_member_role"]
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["group_member_role"]
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["group_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      ikigai_assessments: {
        Row: {
          created_at: string
          final_ikigai: string | null
          good_at_elements: Json
          id: string
          ikigai_intersections: Json
          love_elements: Json
          paid_for_elements: Json
          user_id: string
          world_needs_elements: Json
        }
        Insert: {
          created_at?: string
          final_ikigai?: string | null
          good_at_elements?: Json
          id?: string
          ikigai_intersections?: Json
          love_elements?: Json
          paid_for_elements?: Json
          user_id: string
          world_needs_elements?: Json
        }
        Update: {
          created_at?: string
          final_ikigai?: string | null
          good_at_elements?: Json
          id?: string
          ikigai_intersections?: Json
          love_elements?: Json
          paid_for_elements?: Json
          user_id?: string
          world_needs_elements?: Json
        }
        Relationships: []
      }
      job_entries: {
        Row: {
          category: string | null
          created_at: string | null
          definition: string | null
          experience_note: string | null
          first_memory: string | null
          has_experience: boolean | null
          id: string
          job_name: string
          reason: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          definition?: string | null
          experience_note?: string | null
          first_memory?: string | null
          has_experience?: boolean | null
          id?: string
          job_name: string
          reason?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          definition?: string | null
          experience_note?: string | null
          first_memory?: string | null
          has_experience?: boolean | null
          id?: string
          job_name?: string
          reason?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_entries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "brainstorm_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_matches: {
        Row: {
          compatibility_score: number
          created_at: string
          id: string
          match_reasons: Json
          match_type: Database["public"]["Enums"]["match_type"]
          matched_user_id: string
          status: Database["public"]["Enums"]["match_status"]
          user_id: string
        }
        Insert: {
          compatibility_score?: number
          created_at?: string
          id?: string
          match_reasons?: Json
          match_type: Database["public"]["Enums"]["match_type"]
          matched_user_id: string
          status?: Database["public"]["Enums"]["match_status"]
          user_id: string
        }
        Update: {
          compatibility_score?: number
          created_at?: string
          id?: string
          match_reasons?: Json
          match_type?: Database["public"]["Enums"]["match_type"]
          matched_user_id?: string
          status?: Database["public"]["Enums"]["match_status"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      group_member_role: "member" | "admin"
      match_status: "pending" | "connected" | "dismissed"
      match_type: "similar" | "complementary"
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
      group_member_role: ["member", "admin"],
      match_status: ["pending", "connected", "dismissed"],
      match_type: ["similar", "complementary"],
    },
  },
} as const
