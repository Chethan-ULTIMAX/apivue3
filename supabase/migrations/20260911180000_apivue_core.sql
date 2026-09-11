-- ============================================================
-- APIVue Core Database Migration
-- Run AFTER the existing tracked_profiles/profile_snapshots
-- migration.
-- ============================================================


-- ============================================================
-- 1. PROFILES
-- One application profile for every Supabase Auth user
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    display_name TEXT,

    avatar_url TEXT,

    bio TEXT,

    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


GRANT SELECT, INSERT, UPDATE, DELETE
ON public.profiles
TO authenticated;

GRANT ALL
ON public.profiles
TO service_role;


ALTER TABLE public.profiles
ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "Users can view own profile"
ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);


DROP POLICY IF EXISTS "Users can insert own profile"
ON public.profiles;

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);


DROP POLICY IF EXISTS "Users can update own profile"
ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- ============================================================
-- 2. CONNECTED ACCOUNTS
--
-- Stores metadata about accounts connected to APIVue.
--
-- IMPORTANT:
-- OAuth access tokens / secrets are intentionally NOT stored
-- in this table.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.connected_accounts (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    provider TEXT NOT NULL,

    provider_user_id TEXT,

    username TEXT,

    display_name TEXT,

    avatar_url TEXT,

    profile_url TEXT,

    metadata JSONB NOT NULL
        DEFAULT '{}'::jsonb,

    connected_at TIMESTAMPTZ NOT NULL
        DEFAULT now(),

    last_synced_at TIMESTAMPTZ,

    updated_at TIMESTAMPTZ NOT NULL
        DEFAULT now(),

    CONSTRAINT connected_accounts_provider_check
        CHECK (
            provider IN (
                'github',
                'codeforces'
            )
        ),

    CONSTRAINT connected_accounts_unique_provider
        UNIQUE (user_id, provider)
);


GRANT SELECT, INSERT, UPDATE, DELETE
ON public.connected_accounts
TO authenticated;

GRANT ALL
ON public.connected_accounts
TO service_role;


ALTER TABLE public.connected_accounts
ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "Users can view own connected accounts"
ON public.connected_accounts;

CREATE POLICY "Users can view own connected accounts"
ON public.connected_accounts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);


DROP POLICY IF EXISTS "Users can insert own connected accounts"
ON public.connected_accounts;

CREATE POLICY "Users can insert own connected accounts"
ON public.connected_accounts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);


DROP POLICY IF EXISTS "Users can update own connected accounts"
ON public.connected_accounts;

CREATE POLICY "Users can update own connected accounts"
ON public.connected_accounts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


DROP POLICY IF EXISTS "Users can delete own connected accounts"
ON public.connected_accounts;

CREATE POLICY "Users can delete own connected accounts"
ON public.connected_accounts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


CREATE INDEX IF NOT EXISTS idx_connected_accounts_user
ON public.connected_accounts(user_id);


CREATE INDEX IF NOT EXISTS idx_connected_accounts_provider
ON public.connected_accounts(provider);


-- ============================================================
-- 3. ACTIVITY EVENTS
--
-- General-purpose activity/history system.
--
-- Examples:
--   coding
--   studying
--   learning
--   project_work
--   exercise
--   reading
--   custom activities
--
-- APIVue can expand this later without changing the basic
-- architecture.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.activity_events (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    profile_id UUID
        REFERENCES public.tracked_profiles(id)
        ON DELETE SET NULL,

    event_type TEXT NOT NULL,

    occurred_at TIMESTAMPTZ NOT NULL
        DEFAULT now(),

    value NUMERIC,

    unit TEXT,

    metadata JSONB NOT NULL
        DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT now()
);


GRANT SELECT, INSERT, UPDATE, DELETE
ON public.activity_events
TO authenticated;

GRANT ALL
ON public.activity_events
TO service_role;


ALTER TABLE public.activity_events
ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "Users can view own activity"
ON public.activity_events;

CREATE POLICY "Users can view own activity"
ON public.activity_events
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);


DROP POLICY IF EXISTS "Users can insert own activity"
ON public.activity_events;

CREATE POLICY "Users can insert own activity"
ON public.activity_events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);


DROP POLICY IF EXISTS "Users can update own activity"
ON public.activity_events;

CREATE POLICY "Users can update own activity"
ON public.activity_events
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


DROP POLICY IF EXISTS "Users can delete own activity"
ON public.activity_events;

CREATE POLICY "Users can delete own activity"
ON public.activity_events
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


CREATE INDEX IF NOT EXISTS idx_activity_events_user
ON public.activity_events(user_id);


CREATE INDEX IF NOT EXISTS idx_activity_events_profile
ON public.activity_events(profile_id);


CREATE INDEX IF NOT EXISTS idx_activity_events_occurred
ON public.activity_events(occurred_at DESC);


CREATE INDEX IF NOT EXISTS idx_activity_events_type
ON public.activity_events(event_type);


-- ============================================================
-- 4. GOALS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    title TEXT NOT NULL,

    description TEXT,

    category TEXT,

    target_value NUMERIC,

    current_value NUMERIC NOT NULL
        DEFAULT 0,

    unit TEXT,

    start_date DATE,

    target_date DATE,

    status TEXT NOT NULL
        DEFAULT 'active',

    metadata JSONB NOT NULL
        DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL
        DEFAULT now(),

    CONSTRAINT goals_status_check
        CHECK (
            status IN (
                'active',
                'completed',
                'paused',
                'cancelled'
            )
        )
);


GRANT SELECT, INSERT, UPDATE, DELETE
ON public.goals
TO authenticated;

GRANT ALL
ON public.goals
TO service_role;


ALTER TABLE public.goals
ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "Users can view own goals"
ON public.goals;

CREATE POLICY "Users can view own goals"
ON public.goals
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);


DROP POLICY IF EXISTS "Users can insert own goals"
ON public.goals;

CREATE POLICY "Users can insert own goals"
ON public.goals
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);


DROP POLICY IF EXISTS "Users can update own goals"
ON public.goals;

CREATE POLICY "Users can update own goals"
ON public.goals
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


DROP POLICY IF EXISTS "Users can delete own goals"
ON public.goals;

CREATE POLICY "Users can delete own goals"
ON public.goals
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


CREATE INDEX IF NOT EXISTS idx_goals_user
ON public.goals(user_id);


CREATE INDEX IF NOT EXISTS idx_goals_status
ON public.goals(status);


-- ============================================================
-- 5. UPDATED_AT TRIGGERS
--
-- The existing migration already creates public.set_updated_at()
-- so we reuse that function instead of creating another one.
-- ============================================================


DROP TRIGGER IF EXISTS profiles_updated_at
ON public.profiles;

CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


DROP TRIGGER IF EXISTS connected_accounts_updated_at
ON public.connected_accounts;

CREATE TRIGGER connected_accounts_updated_at
BEFORE UPDATE ON public.connected_accounts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


DROP TRIGGER IF EXISTS goals_updated_at
ON public.goals;

CREATE TRIGGER goals_updated_at
BEFORE UPDATE ON public.goals
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- 6. AUTOMATIC PROFILE CREATION
--
-- Whenever a new Supabase Auth user signs up, automatically
-- create their APIVue profile.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN

    INSERT INTO public.profiles (
        id,
        display_name,
        avatar_url
    )
    VALUES (
        NEW.id,

        COALESCE(
            NEW.raw_user_meta_data ->> 'full_name',
            NEW.raw_user_meta_data ->> 'name'
        ),

        NEW.raw_user_meta_data ->> 'avatar_url'
    )

    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;

END;
$$;


DROP TRIGGER IF EXISTS on_auth_user_created
ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 7. BACKFILL EXISTING USERS
--
-- Your current Supabase account already exists.
-- The trigger above only affects future signups, so this creates
-- a profile for existing Auth users too.
-- ============================================================

INSERT INTO public.profiles (
    id,
    display_name,
    avatar_url
)

SELECT
    id,

    COALESCE(
        raw_user_meta_data ->> 'full_name',
        raw_user_meta_data ->> 'name'
    ),

    raw_user_meta_data ->> 'avatar_url'

FROM auth.users

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 8. MAKE SURE EXISTING TABLES HAVE THE EXPECTED INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_tracked_profiles_user
ON public.tracked_profiles(user_id, platform);


CREATE INDEX IF NOT EXISTS idx_profile_snapshots_profile
ON public.profile_snapshots(profile_id, captured_at DESC);


-- ============================================================
-- 9. FINAL SCHEMA CHECK
--
-- This doesn't modify anything.
-- It simply leaves the database with the complete structure.
-- ============================================================

-- APIVue database structure:
--
-- auth.users
--     │
--     └── profiles
--           │
--           ├── connected_accounts
--           │
--           ├── tracked_profiles
--           │       │
--           │       └── profile_snapshots
--           │
--           ├── activity_events
--           │
--           └── goals
--
-- ============================================================
-- END APIVue CORE MIGRATION
-- ============================================================