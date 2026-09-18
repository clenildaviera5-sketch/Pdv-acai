create table if not exists public.pdv_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.pdv_data enable row level security;

drop policy if exists "Users can read own PDV data" on public.pdv_data;
drop policy if exists "Users can insert own PDV data" on public.pdv_data;
drop policy if exists "Users can update own PDV data" on public.pdv_data;

create policy "Users can read own PDV data"
on public.pdv_data for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own PDV data"
on public.pdv_data for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own PDV data"
on public.pdv_data for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
