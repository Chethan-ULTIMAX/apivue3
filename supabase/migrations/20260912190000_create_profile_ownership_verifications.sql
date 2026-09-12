create table if not exists public.profile_ownership_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('leetcode','codewars')),
  handle text not null,
  code_hash text not null,
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists profile_ownership_verifications_user_idx
  on public.profile_ownership_verifications(user_id, platform, handle);
create index if not exists profile_ownership_verifications_expiry_idx
  on public.profile_ownership_verifications(expires_at);

alter table public.profile_ownership_verifications enable row level security;

drop policy if exists "Users can manage their own ownership verifications"
  on public.profile_ownership_verifications;
create policy "Users can manage their own ownership verifications"
  on public.profile_ownership_verifications
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
