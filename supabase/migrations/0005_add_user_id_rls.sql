-- Add user_id column to searches and companies tables and enable RLS

-- 1. Add user_id to searches
alter table public.searches
  add column if not exists user_id uuid not null default auth.uid();

-- 2. Add user_id to companies
alter table public.companies
  add column if not exists user_id uuid not null default auth.uid();

-- 3. Enable RLS on searches
alter table public.searches enable row level security;

-- 4. Enable RLS on companies
alter table public.companies enable row level security;

-- 5. Policies for searches
create policy "Users can insert their own searches"
  on public.searches for insert
  with check (auth.uid() = user_id);

create policy "Users can select their own searches"
  on public.searches for select
  using (auth.uid() = user_id);

create policy "Users can update their own searches"
  on public.searches for update
  using (auth.uid() = user_id);

create policy "Users can delete their own searches"
  on public.searches for delete
  using (auth.uid() = user_id);

-- 6. Policies for companies
create policy "Users can insert their own companies"
  on public.companies for insert
  with check (auth.uid() = user_id);

create policy "Users can select their own companies"
  on public.companies for select
  using (auth.uid() = user_id);

create policy "Users can update their own companies"
  on public.companies for update
  using (auth.uid() = user_id);

create policy "Users can delete their own companies"
  on public.companies for delete
  using (auth.uid() = user_id);

