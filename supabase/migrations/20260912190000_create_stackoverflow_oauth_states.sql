create table if not exists public.stackoverflow_oauth_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  state_hash text not null unique,
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  created_at timestamptz not null default now()
);

create index if not exists stackoverflow_oauth_states_user_id_idx
  on public.stackoverflow_oauth_states(user_id);

create index if not exists stackoverflow_oauth_states_expires_at_idx
  on public.stackoverflow_oauth_states(expires_at);

alter table public.stackoverflow_oauth_states enable row level security;

drop policy if exists "Users can manage their own Stack Overflow OAuth states"
  on public.stackoverflow_oauth_states;

create policy "Users can manage their own Stack Overflow OAuth states"
  on public.stackoverflow_oauth_states
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
