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
      activity_entries: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          ticket_id: string | null
          workspace_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          ticket_id?: string | null
          workspace_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          ticket_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_entries_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_entries_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_entries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          id: string
          ticket_id: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          id?: string
          ticket_id: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          id?: string
          ticket_id?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      epics: {
        Row: {
          color: string
          created_at: string
          end_date: string | null
          id: string
          name: string
          sort_order: number
          start_date: string | null
          target_quarter: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          sort_order?: number
          start_date?: string | null
          target_quarter?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          color?: string
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          sort_order?: number
          start_date?: string | null
          target_quarter?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "epics_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          description: string
          id: string
          read: boolean
          recipient_member_id: string | null
          ticket_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          read?: boolean
          recipient_member_id?: string | null
          ticket_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          read?: boolean
          recipient_member_id?: string | null
          ticket_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_member_id_fkey"
            columns: ["recipient_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_snapshots: {
        Row: {
          captured_at: string
          id: string
          metrics: Json
          profile_id: string
          user_id: string
        }
        Insert: {
          captured_at?: string
          id?: string
          metrics?: Json
          profile_id: string
          user_id: string
        }
        Update: {
          captured_at?: string
          id?: string
          metrics?: Json
          profile_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_snapshots_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "tracked_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sprint_capacity: {
        Row: {
          available_days: number
          created_at: string
          id: string
          sprint_id: string
          team_member_id: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          available_days?: number
          created_at?: string
          id?: string
          sprint_id: string
          team_member_id: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          available_days?: number
          created_at?: string
          id?: string
          sprint_id?: string
          team_member_id?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprint_capacity_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sprint_capacity_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sprint_capacity_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sprint_retros: {
        Row: {
          action_items: string
          created_at: string
          didnt_go_well: string
          id: string
          sprint_id: string
          updated_at: string
          went_well: string
          workspace_id: string
        }
        Insert: {
          action_items?: string
          created_at?: string
          didnt_go_well?: string
          id?: string
          sprint_id: string
          updated_at?: string
          went_well?: string
          workspace_id: string
        }
        Update: {
          action_items?: string
          created_at?: string
          didnt_go_well?: string
          id?: string
          sprint_id?: string
          updated_at?: string
          went_well?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprint_retros_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sprint_retros_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sprints: {
        Row: {
          created_at: string
          end_date: string
          goal: string | null
          id: string
          is_active: boolean
          name: string
          start_date: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          goal?: string | null
          id?: string
          is_active?: boolean
          name: string
          start_date: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          goal?: string | null
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprints_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      subtasks: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          sort_order: number
          ticket_id: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          sort_order?: number
          ticket_id: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          sort_order?: number
          ticket_id?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subtasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          available_days: number
          avatar: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          job_title: string | null
          name: string
          updated_at: string
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          available_days?: number
          avatar: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          job_title?: string | null
          name: string
          updated_at?: string
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          available_days?: number
          avatar?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          job_title?: string | null
          name?: string
          updated_at?: string
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_attachments: {
        Row: {
          content_type: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          ticket_id: string
          uploaded_by: string | null
          workspace_id: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number
          id?: string
          ticket_id: string
          uploaded_by?: string | null
          workspace_id: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          ticket_id?: string
          uploaded_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_attachments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_labels: {
        Row: {
          created_at: string
          id: string
          label: Database["public"]["Enums"]["ticket_label"]
          ticket_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: Database["public"]["Enums"]["ticket_label"]
          ticket_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: Database["public"]["Enums"]["ticket_label"]
          ticket_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_labels_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_labels_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_relations: {
        Row: {
          created_at: string
          id: string
          related_ticket_id: string
          ticket_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          related_ticket_id: string
          ticket_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          related_ticket_id?: string
          ticket_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_relations_related_ticket_id_fkey"
            columns: ["related_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_relations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_relations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          acceptance_criteria: string | null
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          description: string
          epic_id: string | null
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          sprint_id: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          story_points: number
          ticket_key: string
          title: string
          type: Database["public"]["Enums"]["ticket_type"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          acceptance_criteria?: string | null
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string
          epic_id?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          sprint_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          story_points?: number
          ticket_key: string
          title: string
          type?: Database["public"]["Enums"]["ticket_type"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          acceptance_criteria?: string | null
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string
          epic_id?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          sprint_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          story_points?: number
          ticket_key?: string
          title?: string
          type?: Database["public"]["Enums"]["ticket_type"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_epic_id_fkey"
            columns: ["epic_id"]
            isOneToOne: false
            referencedRelation: "epics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tracked_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          data: Json
          display_name: string | null
          handle: string
          id: string
          last_synced_at: string | null
          pinned: boolean
          platform: string
          profile_url: string | null
          sync_error: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          data?: Json
          display_name?: string | null
          handle: string
          id?: string
          last_synced_at?: string | null
          pinned?: boolean
          platform: string
          profile_url?: string | null
          sync_error?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          data?: Json
          display_name?: string | null
          handle?: string
          id?: string
          last_synced_at?: string | null
          pinned?: boolean
          platform?: string
          profile_url?: string | null
          sync_error?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      uat_test_cases: {
        Row: {
          created_at: string
          description: string
          executed_at: string | null
          expected_result: string
          id: string
          linked_ticket_id: string | null
          notes: string
          plan_id: string
          sort_order: number
          status: Database["public"]["Enums"]["uat_test_case_status"]
          tester_id: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          executed_at?: string | null
          expected_result?: string
          id?: string
          linked_ticket_id?: string | null
          notes?: string
          plan_id: string
          sort_order?: number
          status?: Database["public"]["Enums"]["uat_test_case_status"]
          tester_id?: string | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string
          executed_at?: string | null
          expected_result?: string
          id?: string
          linked_ticket_id?: string | null
          notes?: string
          plan_id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["uat_test_case_status"]
          tester_id?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uat_test_cases_linked_ticket_id_fkey"
            columns: ["linked_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uat_test_cases_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "uat_test_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uat_test_cases_tester_id_fkey"
            columns: ["tester_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uat_test_cases_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      uat_test_plans: {
        Row: {
          created_at: string
          description: string
          epic_id: string | null
          id: string
          name: string
          signed_off_at: string | null
          signed_off_by: string | null
          sprint_id: string | null
          status: Database["public"]["Enums"]["uat_test_plan_status"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          epic_id?: string | null
          id?: string
          name: string
          signed_off_at?: string | null
          signed_off_by?: string | null
          sprint_id?: string | null
          status?: Database["public"]["Enums"]["uat_test_plan_status"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string
          epic_id?: string | null
          id?: string
          name?: string
          signed_off_at?: string | null
          signed_off_by?: string | null
          sprint_id?: string | null
          status?: Database["public"]["Enums"]["uat_test_plan_status"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uat_test_plans_epic_id_fkey"
            columns: ["epic_id"]
            isOneToOne: false
            referencedRelation: "epics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uat_test_plans_signed_off_by_fkey"
            columns: ["signed_off_by"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uat_test_plans_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uat_test_plans_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          team_member_id: string | null
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          team_member_id?: string | null
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          team_member_id?: string | null
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_settings: {
        Row: {
          created_at: string
          id: string
          sprint_duration_weeks: number
          story_point_scale: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sprint_duration_weeks?: number
          story_point_scale?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sprint_duration_weeks?: number
          story_point_scale?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_bootstrap_workspace: {
        Args: { _workspace_id: string }
        Returns: boolean
      }
      claim_default_workspace: {
        Args: { _display_name?: string }
        Returns: string
      }
      claim_invited_memberships: { Args: never; Returns: string[] }
      claim_workspace_admin: {
        Args: { _display_name?: string }
        Returns: string
      }
      current_email: { Args: never; Returns: string }
      current_member_id: { Args: { _workspace_id: string }; Returns: string }
      default_workspace_needs_admin: { Args: never; Returns: boolean }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _workspace_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _workspace_id: string
        }
        Returns: boolean
      }
      has_workspace_access: {
        Args: { _workspace_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "product_owner" | "developer" | "qa_tester" | "viewer"
      notification_type: "assigned" | "sprint_ending" | "sprint_completed"
      ticket_label:
        | "bug"
        | "feature"
        | "tech-debt"
        | "urgent"
        | "design"
        | "infra"
      ticket_priority: "P0" | "P1" | "P2"
      ticket_status: "backlog" | "todo" | "in_progress" | "in_review" | "done"
      ticket_type: "bug" | "feature" | "task"
      uat_test_case_status: "pending" | "passed" | "failed" | "blocked"
      uat_test_plan_status: "draft" | "in_progress" | "completed" | "signed_off"
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
      app_role: ["admin", "product_owner", "developer", "qa_tester", "viewer"],
      notification_type: ["assigned", "sprint_ending", "sprint_completed"],
      ticket_label: [
        "bug",
        "feature",
        "tech-debt",
        "urgent",
        "design",
        "infra",
      ],
      ticket_priority: ["P0", "P1", "P2"],
      ticket_status: ["backlog", "todo", "in_progress", "in_review", "done"],
      ticket_type: ["bug", "feature", "task"],
      uat_test_case_status: ["pending", "passed", "failed", "blocked"],
      uat_test_plan_status: ["draft", "in_progress", "completed", "signed_off"],
    },
  },
} as const
