/*
 * Supabase database types for APIVue.
 *
 * Keep this file in sync with supabase/migrations. It is intentionally
 * checked into source control so CI, local builds, and deployed clients
 * all share the same database contract without an `any` escape hatch.
 */

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Row<T> = T;

type Insert<T> = Partial<T>;
type Update<T> = Partial<T>;

export interface Database {
  public: {
    Tables: {
      tracked_profiles: {
        Row: Row<{
          id: string;
          user_id: string;
          platform: string;
          handle: string;
          display_name: string | null;
          avatar_url: string | null;
          profile_url: string | null;
          data: Json;
          pinned: boolean;
          sync_error: string | null;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        }>;
        Insert: Insert<{
          id: string;
          user_id: string;
          platform: string;
          handle: string;
          display_name: string | null;
          avatar_url: string | null;
          profile_url: string | null;
          data: Json;
          pinned: boolean;
          sync_error: string | null;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        }>;
        Update: Update<{
          id: string;
          user_id: string;
          platform: string;
          handle: string;
          display_name: string | null;
          avatar_url: string | null;
          profile_url: string | null;
          data: Json;
          pinned: boolean;
          sync_error: string | null;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [];
      };
      profile_snapshots: {
        Row: Row<{
          id: string;
          profile_id: string;
          user_id: string;
          captured_at: string;
          metrics: Json;
        }>;
        Insert: Insert<{
          id: string;
          profile_id: string;
          user_id: string;
          captured_at: string;
          metrics: Json;
        }>;
        Update: Update<{
          id: string;
          profile_id: string;
          user_id: string;
          captured_at: string;
          metrics: Json;
        }>;
        Relationships: [];
      };
      profiles: {
        Row: Row<{
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        }>;
        Insert: Insert<{
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        }>;
        Update: Update<{
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [];
      };
      connected_accounts: {
        Row: Row<{
          id: string;
          user_id: string;
          provider: 'github' | 'codeforces' | 'leetcode' | 'codewars' | 'stackoverflow';
          provider_user_id: string | null;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          profile_url: string | null;
          metadata: Json;
          connected_at: string;
          last_synced_at: string | null;
          updated_at: string;
        }>;
        Insert: Insert<{
          id: string;
          user_id: string;
          provider: 'github' | 'codeforces' | 'leetcode' | 'codewars' | 'stackoverflow';
          provider_user_id: string | null;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          profile_url: string | null;
          metadata: Json;
          connected_at: string;
          last_synced_at: string | null;
          updated_at: string;
        }>;
        Update: Update<{
          id: string;
          user_id: string;
          provider: 'github' | 'codeforces' | 'leetcode' | 'codewars' | 'stackoverflow';
          provider_user_id: string | null;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          profile_url: string | null;
          metadata: Json;
          connected_at: string;
          last_synced_at: string | null;
          updated_at: string;
        }>;
        Relationships: [];
      };
      activity_events: {
        Row: Row<{
          id: string;
          user_id: string;
          profile_id: string | null;
          event_type: string;
          occurred_at: string;
          value: number | null;
          unit: string | null;
          metadata: Json;
          created_at: string;
        }>;
        Insert: Insert<{
          id: string;
          user_id: string;
          profile_id: string | null;
          event_type: string;
          occurred_at: string;
          value: number | null;
          unit: string | null;
          metadata: Json;
          created_at: string;
        }>;
        Update: Update<{
          id: string;
          user_id: string;
          profile_id: string | null;
          event_type: string;
          occurred_at: string;
          value: number | null;
          unit: string | null;
          metadata: Json;
          created_at: string;
        }>;
        Relationships: [];
      };
      goals: {
        Row: Row<{
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string | null;
          target_value: number | null;
          current_value: number;
          unit: string | null;
          start_date: string | null;
          target_date: string | null;
          status: 'active' | 'completed' | 'paused' | 'cancelled';
          metadata: Json;
          created_at: string;
          updated_at: string;
        }>;
        Insert: Insert<{
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string | null;
          target_value: number | null;
          current_value: number;
          unit: string | null;
          start_date: string | null;
          target_date: string | null;
          status: 'active' | 'completed' | 'paused' | 'cancelled';
          metadata: Json;
          created_at: string;
          updated_at: string;
        }>;
        Update: Update<{
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string | null;
          target_value: number | null;
          current_value: number;
          unit: string | null;
          start_date: string | null;
          target_date: string | null;
          status: 'active' | 'completed' | 'paused' | 'cancelled';
          metadata: Json;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
