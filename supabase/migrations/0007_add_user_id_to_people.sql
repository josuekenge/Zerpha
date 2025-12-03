-- Add user_id column to people table for RLS
alter table public.people
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Create index on user_id for faster filtering
create index if not exists people_user_id_idx on public.people(user_id);

-- Enable RLS on people table
alter table public.people enable row level security;

-- Policy: Users can only see their own people records
drop policy if exists "Users can view their own people" on public.people;
create policy "Users can view their own people"
  on public.people for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own people records
drop policy if exists "Users can insert their own people" on public.people;
create policy "Users can insert their own people"
  on public.people for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own people records
drop policy if exists "Users can update their own people" on public.people;
create policy "Users can update their own people"
  on public.people for update
  using (auth.uid() = user_id);

-- Policy: Users can delete their own people records
drop policy if exists "Users can delete their own people" on public.people;
create policy "Users can delete their own people"
  on public.people for delete
  using (auth.uid() = user_id);

-- Policy: Service role can do everything (for backend operations)
drop policy if exists "Service role has full access to people" on public.people;
create policy "Service role has full access to people"
  on public.people for all
  using (auth.jwt() ->> 'role' = 'service_role');




