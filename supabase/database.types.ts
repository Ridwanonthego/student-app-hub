
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      app_hub_preferences: {
        Row: {
          user_id: string
          app_order: string[]
          recently_used: string[]
          wallpaper: string
          pinned_apps: string[]
          updated_at: string | null
        }
        Insert: {
          user_id: string
          app_order?: string[] | null
          recently_used?: string[] | null
          wallpaper?: string | null
          pinned_apps?: string[] | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          app_order?: string[] | null
          recently_used?: string[] | null
          wallpaper?: string | null
          pinned_apps?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_hub_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      banglanutri_logged_meals: {
        Row: {
          created_at: string
          id: number
          logged_date: string
          meal_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          logged_date?: string
          meal_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          logged_date?: string
          meal_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "banglanutri_logged_meals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      banglanutri_profiles: {
        Row: {
          activity_level: "sedentary" | "light" | "moderate" | "active" | null
          age: number | null
          exclusions: string[] | null
          goal: "lose" | "maintain" | "gain" | null
          height_cm: number | null
          id: string
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          activity_level?: "sedentary" | "light" | "moderate" | "active" | null
          age?: number | null
          exclusions?: string[] | null
          goal?: "lose" | "maintain" | "gain" | null
          height_cm?: number | null
          id: string
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          activity_level?: "sedentary" | "light" | "moderate" | "active" | null
          age?: number | null
          exclusions?: string[] | null
          goal?: "lose" | "maintain" | "gain" | null
          height_cm?: number | null
          id?: string
          updated_at?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "banglanutri_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_messages: {
        Row: {
          id: number
          sender_id: string
          receiver_id: string
          content: string | null
          message_type: string
          payload: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          sender_id: string
          receiver_id: string
          content?: string | null
          message_type?: string
          payload?: Json | null
          created_at?: string
        }
        Update: {
          id?: number
          sender_id?: string
          receiver_id?: string
          content?: string | null
          message_type?: string
          payload?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      cv_data: {
        Row: {
          education: Json | null
          experience: Json | null
          id: string
          image_url: string | null
          linkedin_url: string | null
          raw_info: string | null
          skills: string[] | null
          updated_at: string | null
        }
        Insert: {
          education?: Json | null
          experience?: Json | null
          id: string
          image_url?: string | null
          linkedin_url?: string | null
          raw_info?: string | null
          skills?: string[] | null
          updated_at?: string | null
        }
        Update: {
          education?: Json | null
          experience?: Json | null
          id?: string
          image_url?: string | null
          linkedin_url?: string | null
          raw_info?: string | null
          skills?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cv_data_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      gemini_bangla_chat_history: {
        Row: {
          user_id: string
          history: Json | null
          updated_at: string | null
        }
        Insert: {
          user_id: string
          history?: Json | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          history?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gemini_bangla_chat_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string
          gemini_api_key: string
          hugging_face_key: string | null
          id: string
          updated_at: string | null
          username: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          gemini_api_key?: string | null
          hugging_face_key?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          gemini_api_key?: string | null
          hugging_face_key?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      todo_tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          category: string
          priority: "High" | "Medium" | "Low"
          status: "Pending" | "InProgress" | "Done" | "Cancelled"
          due_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          category?: string
          priority?: "High" | "Medium" | "Low"
          status?: "Pending" | "InProgress" | "Done" | "Cancelled"
          due_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          category?: string
          priority?: "High" | "Medium" | "Low"
          status?: "Pending" | "InProgress" | "Done" | "Cancelled"
          due_date?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "todo_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      watchfinder_favorites: {
        Row: {
          created_at: string | null
          id: number
          media_id: number
          media_type: "movie" | "tv"
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          media_id: number
          media_type: "movie" | "tv"
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          media_id?: number
          media_type?: "movie" | "tv"
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchfinder_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      watchfinder_profiles: {
        Row: {
          excluded_genres: string[] | null
          favorite_actors: string[] | null
          favorite_genres: string[] | null
          favorite_keywords: string[] | null
          id: string
          preferred_decades: string[] | null
          preferred_description: string | null
          updated_at: string | null
        }
        Insert: {
          excluded_genres?: string[] | null
          favorite_actors?: string[] | null
          favorite_genres?: string[] | null
          favorite_keywords?: string[] | null
          id: string
          preferred_decades?: string[] | null
          preferred_description?: string | null
          updated_at?: string | null
        }
        Update: {
          excluded_genres?: string[] | null
          favorite_actors?: string[] | null
          favorite_genres?: string[] | null
          favorite_keywords?: string[] | null
          id?: string
          preferred_decades?: string[] | null
          preferred_description?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "watchfinder_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      watchfinder_ratings: {
        Row: {
          created_at: string | null
          id: number
          media_id: number
          media_type: "movie" | "tv"
          rating: "like" | "dislike"
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          media_id: number
          media_type: "movie" | "tv"
          rating: "like" | "dislike"
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          media_id?: number
          media_type?: "movie" | "tv"
          rating?: "like" | "dislike"
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchfinder_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      webrtc_signals: {
        Row: {
          id: number
          sender_id: string
          receiver_id: string
          signal_type: string
          payload: Json
          created_at: string
        }
        Insert: {
          id?: number
          sender_id: string
          receiver_id: string
          signal_type: string
          payload: Json
          created_at?: string
        }
        Update: {
          id?: number
          sender_id?: string
          receiver_id?: string
          signal_type?: string
          payload?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "webrtc_signals_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webrtc_signals_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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
