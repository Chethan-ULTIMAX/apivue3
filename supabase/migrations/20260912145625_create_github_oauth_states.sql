create table if not exists public.github_oauth_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  state_hash text not null unique,
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  created_at timestamptz not null default now()
);

create index if not exists github_oauth_states_user_id_idx on public.github_oauth_states(user_id);
create index if not exists github_oauth_states_expires_at_idx on public.github_oauth_states(expires_at);

alter table public.github_oauth_states enable row level security;

create policy "Users can create their own GitHub OAuth states"
  on public.github_oauth_states for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can read their own GitHub OAuth states"
  on public.github_oauth_states for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete their own GitHub OAuth states"
  on public.github_oauth_states for delete to authenticated
  using (auth.uid() = user_id);
