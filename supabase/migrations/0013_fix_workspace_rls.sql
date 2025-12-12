-- Migration 0013: Fix workspace_members RLS policies (v2)
-- This version avoids circular dependency issues

-- First, drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can insert workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can select workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can update workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can delete workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert_policy" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_select_policy" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_update_policy" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_delete_policy" ON public.workspace_members;

DROP POLICY IF EXISTS "Users can select their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_select_policy" ON public.workspaces;

-- Create a security definer function to check workspace membership
-- This avoids the circular RLS dependency
CREATE OR REPLACE FUNCTION public.get_user_workspace_ids(user_uuid uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT workspace_id FROM public.workspace_members WHERE user_id = user_uuid;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_workspace_ids(uuid) TO authenticated;

-- Now create the policies using the function

-- INSERT: Allow users to add themselves OR invite others
CREATE POLICY "workspace_members_insert"
  ON public.workspace_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR auth.uid() = invited_by
  );

-- SELECT: Allow users to see all members in workspaces they belong to
CREATE POLICY "workspace_members_select"
  ON public.workspace_members FOR SELECT
  USING (
    workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid()))
  );

-- UPDATE: Allow members to update records in their workspace
CREATE POLICY "workspace_members_update"
  ON public.workspace_members FOR UPDATE
  USING (
    workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid()))
  );

-- DELETE: Allow members to delete records in their workspace
CREATE POLICY "workspace_members_delete"
  ON public.workspace_members FOR DELETE
  USING (
    workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid()))
  );

-- Fix workspaces SELECT policy
CREATE POLICY "workspaces_select"
  ON public.workspaces FOR SELECT
  USING (
    auth.uid() = owner_id
    OR id IN (SELECT public.get_user_workspace_ids(auth.uid()))
  );
