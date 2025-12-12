-- Add workspaces and workspace_members tables for team collaboration
-- Migration 0011: Create workspaces schema

-- 1. Create workspaces table
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My Workspace',
  logo_url text,
  owner_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspaces_owner_id_idx on public.workspaces(owner_id);

-- 2. Create workspace_members table
create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null,
  email text not null,
  name text not null,
  avatar_url text,
  role text not null default 'member',
  invited_by uuid,
  joined_at timestamptz not null default now()
);

create index if not exists workspace_members_workspace_id_idx on public.workspace_members(workspace_id);
create index if not exists workspace_members_user_id_idx on public.workspace_members(user_id);
create index if not exists workspace_members_email_idx on public.workspace_members(email);

-- 3. Enable RLS on workspaces
alter table public.workspaces enable row level security;

-- 4. Enable RLS on workspace_members
alter table public.workspace_members enable row level security;

-- 5. Policies for workspaces
create policy "Users can insert their own workspaces"
  on public.workspaces for insert
  with check (auth.uid() = owner_id);

create policy "Users can select their workspaces"
  on public.workspaces for select
  using (auth.uid() = owner_id);

create policy "Users can update their own workspaces"
  on public.workspaces for update
  using (auth.uid() = owner_id);

create policy "Users can delete their own workspaces"
  on public.workspaces for delete
  using (auth.uid() = owner_id);

-- 6. Policies for workspace_members
create policy "Users can insert workspace members"
  on public.workspace_members for insert
  with check (auth.uid() = user_id OR auth.uid() = invited_by);

create policy "Users can select workspace members"
  on public.workspace_members for select
  using (auth.uid() = user_id);

create policy "Users can update workspace members"
  on public.workspace_members for update
  using (auth.uid() = user_id);

create policy "Users can delete workspace members"
  on public.workspace_members for delete
  using (auth.uid() = user_id);
