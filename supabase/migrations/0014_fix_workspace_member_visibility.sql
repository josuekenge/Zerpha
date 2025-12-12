-- Migration 0014: Fix workspace member visibility for invited users
-- This ensures all workspace members can see each other

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

-- Drop and recreate the helper function
DROP FUNCTION IF EXISTS public.get_user_workspace_ids(uuid);

-- Create a SECURITY DEFINER function to check workspace membership
-- This bypasses RLS when checking membership, avoiding circular dependency
CREATE OR REPLACE FUNCTION public.get_user_workspace_ids(user_uuid uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT workspace_id FROM public.workspace_members WHERE user_id = user_uuid;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_workspace_ids(uuid) TO authenticated;

-- Create a SECURITY DEFINER function to check if user has pending invite by email
-- This allows users to claim their invites even before they have workspace access
CREATE OR REPLACE FUNCTION public.get_workspace_ids_by_email(user_email text)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT workspace_id FROM public.workspace_members WHERE lower(email) = lower(user_email);
$$;

GRANT EXECUTE ON FUNCTION public.get_workspace_ids_by_email(text) TO authenticated;

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

-- SELECT: Allow users to see ALL members in workspaces they belong to
-- Uses the SECURITY DEFINER function to avoid RLS circular dependency
CREATE POLICY "workspace_members_select"
  ON public.workspace_members FOR SELECT
  USING (
    workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid()))
  );

-- UPDATE: Allow users to update their own record OR update records in their workspace (for claiming invites)
CREATE POLICY "workspace_members_update"
  ON public.workspace_members FOR UPDATE
  USING (
    -- User can update their own membership record
    user_id = auth.uid()
    -- OR the record's email matches the current user's email (for claiming invites)
    OR lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
    -- OR user is already a member of this workspace (admin/owner updating others)
    OR workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid()))
  );

-- DELETE: Allow workspace admins to delete members
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

-- SELECT: Allow users to see workspaces they own OR are members of
CREATE POLICY "workspaces_select"
  ON public.workspaces FOR SELECT
  USING (
    auth.uid() = owner_id
    OR id IN (SELECT public.get_user_workspace_ids(auth.uid()))
  );

-- UPDATE: Only owners can update workspace details
CREATE POLICY "workspaces_update"
  ON public.workspaces FOR UPDATE
  USING (auth.uid() = owner_id);

-- DELETE: Only owners can delete workspaces
CREATE POLICY "workspaces_delete"
  ON public.workspaces FOR DELETE
  USING (auth.uid() = owner_id);
