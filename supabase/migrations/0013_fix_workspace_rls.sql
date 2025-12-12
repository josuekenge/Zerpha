-- Migration 0013: Fix workspace_members RLS policies
-- This allows users to see all members in their workspace, not just their own record

-- First, drop existing policies
DROP POLICY IF EXISTS "Users can insert workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can select workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can update workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can delete workspace members" ON public.workspace_members;

-- Recreate with proper policies

-- INSERT: Allow users to add themselves OR invite others (via invited_by)
CREATE POLICY "workspace_members_insert_policy"
  ON public.workspace_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR auth.uid() = invited_by
  );

-- SELECT: Allow users to see all members in workspaces they belong to
CREATE POLICY "workspace_members_select_policy"
  ON public.workspace_members FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Allow admins/owners to update members in their workspace
-- For simplicity, allow any member to update records in their workspace
CREATE POLICY "workspace_members_update_policy"
  ON public.workspace_members FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- DELETE: Allow admins/owners to delete members (handled in application logic)
CREATE POLICY "workspace_members_delete_policy"
  ON public.workspace_members FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Also fix workspaces SELECT policy to allow members to see the workspace
DROP POLICY IF EXISTS "Users can select their workspaces" ON public.workspaces;

CREATE POLICY "workspaces_select_policy"
  ON public.workspaces FOR SELECT
  USING (
    auth.uid() = owner_id
    OR id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );
