CREATE TABLE public.tracked_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  handle TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  profile_url TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  pinned BOOLEAN NOT NULL DEFAULT false,
  sync_error TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform, handle)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tracked_profiles TO authenticated;
GRANT ALL ON public.tracked_profiles TO service_role;
ALTER TABLE public.tracked_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own tracked profiles" ON public.tracked_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_tracked_profiles_user ON public.tracked_profiles (user_id, platform);

CREATE TABLE public.profile_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.tracked_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_snapshots TO authenticated;
GRANT ALL ON public.profile_snapshots TO service_role;
ALTER TABLE public.profile_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own profile snapshots" ON public.profile_snapshots FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_profile_snapshots_profile ON public.profile_snapshots (profile_id, captured_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tracked_profiles_updated_at
BEFORE UPDATE ON public.tracked_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();