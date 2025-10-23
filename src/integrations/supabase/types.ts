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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      class_registrations: {
        Row: {
          class_id: string
          country: string
          created_at: string | null
          email: string
          full_name: string
          id: string
          institution: string
          participant_type: string
          phone: string
          updated_at: string | null
        }
        Insert: {
          class_id: string
          country: string
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          institution: string
          participant_type: string
          phone: string
          updated_at?: string | null
        }
        Update: {
          class_id?: string
          country?: string
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          institution?: string
          participant_type?: string
          phone?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_registrations_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          allied_institution: string | null
          allied_professor: string
          campus: string
          capacity: number
          class_date: string
          class_type: Database["public"]["Enums"]["class_type"]
          created_at: string | null
          created_by: string
          description: string
          hours: number
          id: string
          knowledge_area: string[]
          profession: string
          status: Database["public"]["Enums"]["request_status"] | null
          title: string
          updated_at: string | null
          virtual_room_link: string | null
          virtual_room_required: boolean | null
        }
        Insert: {
          allied_institution?: string | null
          allied_professor: string
          campus: string
          capacity: number
          class_date: string
          class_type: Database["public"]["Enums"]["class_type"]
          created_at?: string | null
          created_by: string
          description: string
          hours: number
          id?: string
          knowledge_area?: string[]
          profession: string
          status?: Database["public"]["Enums"]["request_status"] | null
          title: string
          updated_at?: string | null
          virtual_room_link?: string | null
          virtual_room_required?: boolean | null
        }
        Update: {
          allied_institution?: string | null
          allied_professor?: string
          campus?: string
          capacity?: number
          class_date?: string
          class_type?: Database["public"]["Enums"]["class_type"]
          created_at?: string | null
          created_by?: string
          description?: string
          hours?: number
          id?: string
          knowledge_area?: string[]
          profession?: string
          status?: Database["public"]["Enums"]["request_status"] | null
          title?: string
          updated_at?: string | null
          virtual_room_link?: string | null
          virtual_room_required?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coil_proposals: {
        Row: {
          academic_program: string
          academic_semester: string
          course_name: string
          created_at: string | null
          created_by: string
          email: string
          external_capacity: number
          full_name: string
          id: string
          languages: string[]
          project_topics: string
          status: Database["public"]["Enums"]["request_status"] | null
          sustainable_development_goals: string[]
          updated_at: string | null
        }
        Insert: {
          academic_program: string
          academic_semester: string
          course_name: string
          created_at?: string | null
          created_by: string
          email: string
          external_capacity: number
          full_name: string
          id?: string
          languages?: string[]
          project_topics: string
          status?: Database["public"]["Enums"]["request_status"] | null
          sustainable_development_goals?: string[]
          updated_at?: string | null
        }
        Update: {
          academic_program?: string
          academic_semester?: string
          course_name?: string
          created_at?: string | null
          created_by?: string
          email?: string
          external_capacity?: number
          full_name?: string
          id?: string
          languages?: string[]
          project_topics?: string
          status?: Database["public"]["Enums"]["request_status"] | null
          sustainable_development_goals?: string[]
          updated_at?: string | null
        }
        Relationships: []
      }
      course_offerings: {
        Row: {
          allied_institution: string | null
          allied_professor: string | null
          campus: string
          capacity: number
          created_at: string | null
          created_by: string
          description: string
          hours: number
          id: string
          knowledge_area: string[]
          offering_type: string
          profession: string
          status: Database["public"]["Enums"]["request_status"] | null
          title: string
          udes_professor_email: string | null
          udes_professor_name: string | null
          udes_professor_phone: string | null
          udes_professor_program: string | null
          updated_at: string | null
        }
        Insert: {
          allied_institution?: string | null
          allied_professor?: string | null
          campus: string
          capacity: number
          created_at?: string | null
          created_by: string
          description: string
          hours: number
          id?: string
          knowledge_area?: string[]
          offering_type: string
          profession: string
          status?: Database["public"]["Enums"]["request_status"] | null
          title: string
          udes_professor_email?: string | null
          udes_professor_name?: string | null
          udes_professor_phone?: string | null
          udes_professor_program?: string | null
          updated_at?: string | null
        }
        Update: {
          allied_institution?: string | null
          allied_professor?: string | null
          campus?: string
          capacity?: number
          created_at?: string | null
          created_by?: string
          description?: string
          hours?: number
          id?: string
          knowledge_area?: string[]
          offering_type?: string
          profession?: string
          status?: Database["public"]["Enums"]["request_status"] | null
          title?: string
          udes_professor_email?: string | null
          udes_professor_name?: string | null
          udes_professor_phone?: string | null
          udes_professor_program?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mooc_course_teachers: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          teacher_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          teacher_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mooc_course_teachers_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "mooc_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      mooc_courses: {
        Row: {
          course_image_url: string | null
          created_at: string | null
          created_by: string
          description: string
          id: string
          intro_video_url: string | null
          objective: string
          profession: string
          status: Database["public"]["Enums"]["request_status"] | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          course_image_url?: string | null
          created_at?: string | null
          created_by: string
          description: string
          id?: string
          intro_video_url?: string | null
          objective: string
          profession: string
          status?: Database["public"]["Enums"]["request_status"] | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          course_image_url?: string | null
          created_at?: string | null
          created_by?: string
          description?: string
          id?: string
          intro_video_url?: string | null
          objective?: string
          profession?: string
          status?: Database["public"]["Enums"]["request_status"] | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      mooc_enrollments: {
        Row: {
          completed: boolean | null
          course_id: string
          enrolled_at: string | null
          id: string
          progress: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          course_id: string
          enrolled_at?: string | null
          id?: string
          progress?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          course_id?: string
          enrolled_at?: string | null
          id?: string
          progress?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mooc_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "mooc_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      mooc_lesson_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          lesson_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mooc_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "mooc_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      mooc_lessons: {
        Row: {
          content: string | null
          course_id: string
          created_at: string | null
          description: string | null
          duration_hours: number
          id: string
          order_index: number
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          content?: string | null
          course_id: string
          created_at?: string | null
          description?: string | null
          duration_hours: number
          id?: string
          order_index: number
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          content?: string | null
          course_id?: string
          created_at?: string | null
          description?: string | null
          duration_hours?: number
          id?: string
          order_index?: number
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mooc_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "mooc_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string | null
          department: string | null
          document_number: string | null
          document_type: string | null
          email: string
          full_name: string
          id: string
          is_international_student: boolean | null
          is_other_university: boolean | null
          is_private_student: boolean | null
          phone: string | null
          profile_completed: boolean | null
          university_name: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          department?: string | null
          document_number?: string | null
          document_type?: string | null
          email: string
          full_name: string
          id: string
          is_international_student?: boolean | null
          is_other_university?: boolean | null
          is_private_student?: boolean | null
          phone?: string | null
          profile_completed?: boolean | null
          university_name?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          department?: string | null
          document_number?: string | null
          document_type?: string | null
          email?: string
          full_name?: string
          id?: string
          is_international_student?: boolean | null
          is_other_university?: boolean | null
          is_private_student?: boolean | null
          phone?: string | null
          profile_completed?: boolean | null
          university_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      teachers: {
        Row: {
          campus: string
          created_at: string | null
          cvlac_link: string | null
          email: string
          id: string
          interests: string[] | null
          orcid_link: string | null
          phone: string
          profile_description: string
          status: Database["public"]["Enums"]["request_status"] | null
          teacher_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          campus: string
          created_at?: string | null
          cvlac_link?: string | null
          email: string
          id?: string
          interests?: string[] | null
          orcid_link?: string | null
          phone: string
          profile_description: string
          status?: Database["public"]["Enums"]["request_status"] | null
          teacher_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          campus?: string
          created_at?: string | null
          cvlac_link?: string | null
          email?: string
          id?: string
          interests?: string[] | null
          orcid_link?: string | null
          phone?: string
          profile_description?: string
          status?: Database["public"]["Enums"]["request_status"] | null
          teacher_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_course_duration: {
        Args: { course_id_param: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "professor" | "student"
      class_type: "mirror" | "masterclass"
      request_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "professor", "student"],
      class_type: ["mirror", "masterclass"],
      request_status: ["pending", "approved", "rejected"],
    },
  },
} as const
