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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_type: string | null
          created_at: string
          criteria: Json
          description: string
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          points: number | null
          rarity: string | null
        }
        Insert: {
          achievement_type?: string | null
          created_at?: string
          criteria: Json
          description: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          points?: number | null
          rarity?: string | null
        }
        Update: {
          achievement_type?: string | null
          created_at?: string
          criteria?: Json
          description?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          points?: number | null
          rarity?: string | null
        }
        Relationships: []
      }
      challenge_completions: {
        Row: {
          challenge_id: string
          completed_at: string
          completion_value: number
          id: string
          points_earned: number | null
          ranking_position: number | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string
          completion_value: number
          id?: string
          points_earned?: number | null
          ranking_position?: number | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string
          completion_value?: number
          id?: string
          points_earned?: number | null
          ranking_position?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_completions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          id: string
          joined_at: string
          status: string | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          id?: string
          joined_at?: string
          status?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          id?: string
          joined_at?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          challenge_type: string | null
          created_at: string
          creator_id: string
          current_participants: number | null
          description: string | null
          difficulty_level: string | null
          end_date: string
          id: string
          is_public: boolean | null
          max_participants: number | null
          name: string
          reward_points: number | null
          route_id: string
          start_date: string
          target_value: number | null
          updated_at: string
        }
        Insert: {
          challenge_type?: string | null
          created_at?: string
          creator_id: string
          current_participants?: number | null
          description?: string | null
          difficulty_level?: string | null
          end_date: string
          id?: string
          is_public?: boolean | null
          max_participants?: number | null
          name: string
          reward_points?: number | null
          route_id: string
          start_date: string
          target_value?: number | null
          updated_at?: string
        }
        Update: {
          challenge_type?: string | null
          created_at?: string
          creator_id?: string
          current_participants?: number | null
          description?: string | null
          difficulty_level?: string | null
          end_date?: string
          id?: string
          is_public?: boolean | null
          max_participants?: number | null
          name?: string
          reward_points?: number | null
          route_id?: string
          start_date?: string
          target_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          id: string
          image_url: string | null
          is_public: boolean | null
          member_count: number | null
          name: string
          route_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          member_count?: number | null
          name: string
          route_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          member_count?: number | null
          name?: string
          route_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      community_chat: {
        Row: {
          community_id: string
          created_at: string
          id: string
          message: string
          message_type: string | null
          reply_to_id: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          message: string
          message_type?: string | null
          reply_to_id?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string
          id?: string
          message?: string
          message_type?: string | null
          reply_to_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_chat_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_chat_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "community_chat"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string
          id: string
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          completion_time: number | null
          event_id: string
          final_position: number | null
          id: string
          registration_time: string
          status: string | null
          user_id: string
        }
        Insert: {
          completion_time?: number | null
          event_id: string
          final_position?: number | null
          id?: string
          registration_time?: string
          status?: string | null
          user_id: string
        }
        Update: {
          completion_time?: number | null
          event_id?: string
          final_position?: number | null
          id?: string
          registration_time?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          community_id: string | null
          created_at: string
          creator_id: string
          current_participants: number | null
          description: string | null
          event_date: string
          event_type: string | null
          id: string
          is_public: boolean | null
          max_participants: number | null
          name: string
          registration_deadline: string | null
          route_id: string | null
          updated_at: string
        }
        Insert: {
          community_id?: string | null
          created_at?: string
          creator_id: string
          current_participants?: number | null
          description?: string | null
          event_date: string
          event_type?: string | null
          id?: string
          is_public?: boolean | null
          max_participants?: number | null
          name: string
          registration_deadline?: string | null
          route_id?: string | null
          updated_at?: string
        }
        Update: {
          community_id?: string | null
          created_at?: string
          creator_id?: string
          current_participants?: number | null
          description?: string | null
          event_date?: string
          event_type?: string | null
          id?: string
          is_public?: boolean | null
          max_participants?: number | null
          name?: string
          registration_deadline?: string | null
          route_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          total_distance: number | null
          total_routes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          total_distance?: number | null
          total_routes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          total_distance?: number | null
          total_routes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      route_completions: {
        Row: {
          average_speed: number | null
          completion_date: string
          completion_time: number
          created_at: string
          gps_data: Json | null
          id: string
          max_speed: number | null
          route_id: string
          user_id: string
        }
        Insert: {
          average_speed?: number | null
          completion_date?: string
          completion_time: number
          created_at?: string
          gps_data?: Json | null
          id?: string
          max_speed?: number | null
          route_id: string
          user_id: string
        }
        Update: {
          average_speed?: number | null
          completion_date?: string
          completion_time?: number
          created_at?: string
          gps_data?: Json | null
          id?: string
          max_speed?: number | null
          route_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_completions_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          created_at: string
          description: string | null
          difficulty_level: string | null
          distance: number | null
          end_lat: number
          end_lng: number
          estimated_time: number | null
          id: string
          is_favorite: boolean | null
          is_public: boolean | null
          likes_count: number | null
          name: string
          shared_count: number | null
          start_lat: number
          start_lng: number
          tags: string[] | null
          times_completed: number | null
          updated_at: string
          user_id: string
          waypoints: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          distance?: number | null
          end_lat: number
          end_lng: number
          estimated_time?: number | null
          id?: string
          is_favorite?: boolean | null
          is_public?: boolean | null
          likes_count?: number | null
          name: string
          shared_count?: number | null
          start_lat: number
          start_lng: number
          tags?: string[] | null
          times_completed?: number | null
          updated_at?: string
          user_id: string
          waypoints?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          distance?: number | null
          end_lat?: number
          end_lng?: number
          estimated_time?: number | null
          id?: string
          is_favorite?: boolean | null
          is_public?: boolean | null
          likes_count?: number | null
          name?: string
          shared_count?: number | null
          start_lat?: number
          start_lng?: number
          tags?: string[] | null
          times_completed?: number | null
          updated_at?: string
          user_id?: string
          waypoints?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          progress: Json | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          progress?: Json | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          progress?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_route_interactions: {
        Row: {
          best_time: number | null
          completed: boolean | null
          created_at: string
          favorited: boolean | null
          id: string
          liked: boolean | null
          route_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          best_time?: number | null
          completed?: boolean | null
          created_at?: string
          favorited?: boolean | null
          id?: string
          liked?: boolean | null
          route_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          best_time?: number | null
          completed?: boolean | null
          created_at?: string
          favorited?: boolean | null
          id?: string
          liked?: boolean | null
          route_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_route_interactions_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_analytics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
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
