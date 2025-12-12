-- Migration 0015: Fix invite claiming - allow users to see and claim their invites by email
-- The key issue is that invited users can't see their pending invites because 
-- the RLS policy only checks user_id, but invites have a placeholder user_id

-- First, drop ALL existing policies to start completely fresh
DROP POLICY IF EXISTS "Users can insert workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can select workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can update workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can delete workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert_policy" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_select_policy" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_update_policy" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_delete_policy" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_select" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_update" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_delete" ON public.workspace_members;

DROP POLICY IF EXISTS "Users can insert their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can select their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can update their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can delete their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_select" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_insert" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_update" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_delete" ON public.workspaces;

-- Drop and recreate helper functions
DROP FUNCTION IF EXISTS public.get_user_workspace_ids(uuid);
DROP FUNCTION IF EXISTS public.get_workspace_ids_by_email(text);

-- Helper function to get workspace IDs by user_id (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_workspace_ids(user_uuid uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT workspace_id FROM public.workspace_members WHERE user_id = user_uuid;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_workspace_ids(uuid) TO authenticated;

-- Helper function to get workspace IDs by email (for finding pending invites)
CREATE OR REPLACE FUNCTION public.get_workspace_ids_by_email(user_email text)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT workspace_id FROM public.workspace_members WHERE lower(email) = lower(user_email);
$$;

GRANT EXECUTE ON FUNCTION public.get_workspace_ids_by_email(text) TO authenticated;

-- Helper function to get the current user's email from auth.users
CREATE OR REPLACE FUNCTION public.get_auth_email()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_auth_email() TO authenticated;

-- ============================================
-- WORKSPACE_MEMBERS POLICIES
-- ============================================

-- INSERT: Allow users to add themselves OR owners/admins to invite others
CREATE POLICY "workspace_members_insert"
  ON public.workspace_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR auth.uid() = invited_by
  );

-- SELECT: Allow users to see:
-- 1. All members in workspaces they belong to (by user_id)
-- 2. All members in workspaces where they have a pending invite (by email)
-- This is CRITICAL for invite claiming to work!
CREATE POLICY "workspace_members_select"
  ON public.workspace_members FOR SELECT
  USING (
    -- User is already a member of this workspace
    workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid()))
    -- OR user has a pending invite to this workspace (matched by email)
    OR workspace_id IN (SELECT public.get_workspace_ids_by_email(public.get_auth_email()))
  );

-- UPDATE: Allow users to:
-- 1. Update their own membership record
-- 2. Update records where their email matches (for claiming invites)
-- 3. Update records in workspaces they're already members of (admin functions)
CREATE POLICY "workspace_members_update"
  ON public.workspace_members FOR UPDATE
  USING (
    -- User can update their own membership record
    user_id = auth.uid()
    -- OR the record's email matches the current user's email (for claiming invites)
    OR lower(email) = lower(public.get_auth_email())
    -- OR user is already a member of this workspace (admin/owner updating others)
    OR workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid()))
  );

-- DELETE: Allow workspace members to delete other members (permission checked in app)
CREATE POLICY "workspace_members_delete"
  ON public.workspace_members FOR DELETE
  USING (
    workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid()))
  );

-- ============================================
-- WORKSPACES POLICIES
-- ============================================

-- INSERT: Allow users to create workspaces (they become owner)
CREATE POLICY "workspaces_insert"
  ON public.workspaces FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- SELECT: Allow users to see workspaces they:
-- 1. Own
-- 2. Are members of
-- 3. Have pending invites to (by email)
CREATE POLICY "workspaces_select"
  ON public.workspaces FOR SELECT
  USING (
    auth.uid() = owner_id
    OR id IN (SELECT public.get_user_workspace_ids(auth.uid()))
    OR id IN (SELECT public.get_workspace_ids_by_email(public.get_auth_email()))
  );

-- UPDATE: Only owners can update workspace details
CREATE POLICY "workspaces_update"
  ON public.workspaces FOR UPDATE
  USING (auth.uid() = owner_id);

-- DELETE: Only owners can delete workspaces
CREATE POLICY "workspaces_delete"
  ON public.workspaces FOR DELETE
  USING (auth.uid() = owner_id);
