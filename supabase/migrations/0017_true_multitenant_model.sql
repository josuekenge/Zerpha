-- Migration 0017: TRUE Multi-Tenant Data Model
-- Data belongs to WORKSPACES, not USERS
-- Users access data through workspace membership ONLY
--
-- This migration:
-- 1. First drops all dependent policies (workspace_members, workspaces, data tables)
-- 2. Then drops old helper functions
-- 3. Backfills existing data to workspaces
-- 4. Creates new workspace-based RLS policies

-- ============================================
-- PHASE 1: Drop ALL dependent policies FIRST
-- (Must do this before dropping functions)
-- ============================================

-- Drop workspace_members policies (these use get_user_workspace_ids)
DROP POLICY IF EXISTS "workspace_members_insert" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_select" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_update" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_delete" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can insert workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can select workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can update workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can delete workspace members" ON public.workspace_members;

-- Drop workspaces policies (these use get_user_workspace_ids)
DROP POLICY IF EXISTS "workspaces_select" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_insert" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_update" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_delete" ON public.workspaces;
DROP POLICY IF EXISTS "Users can insert their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can select their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can update their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can delete their own workspaces" ON public.workspaces;

-- Drop searches policies
DROP POLICY IF EXISTS "Users can insert their own searches" ON public.searches;
DROP POLICY IF EXISTS "Users can select their own searches" ON public.searches;
DROP POLICY IF EXISTS "Users can update their own searches" ON public.searches;
DROP POLICY IF EXISTS "Users can delete their own searches" ON public.searches;
DROP POLICY IF EXISTS "workspace_searches_insert" ON public.searches;
DROP POLICY IF EXISTS "workspace_searches_select" ON public.searches;
DROP POLICY IF EXISTS "workspace_searches_update" ON public.searches;
DROP POLICY IF EXISTS "workspace_searches_delete" ON public.searches;

-- Drop companies policies
DROP POLICY IF EXISTS "Users can insert their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can select their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can delete their own companies" ON public.companies;
DROP POLICY IF EXISTS "workspace_companies_insert" ON public.companies;
DROP POLICY IF EXISTS "workspace_companies_select" ON public.companies;
DROP POLICY IF EXISTS "workspace_companies_update" ON public.companies;
DROP POLICY IF EXISTS "workspace_companies_delete" ON public.companies;

-- Drop niche_history policies
DROP POLICY IF EXISTS "Users can view own niche history" ON public.niche_history;
DROP POLICY IF EXISTS "Users can insert own niche history" ON public.niche_history;
DROP POLICY IF EXISTS "Users can update own niche history" ON public.niche_history;
DROP POLICY IF EXISTS "workspace_niche_history_select" ON public.niche_history;
DROP POLICY IF EXISTS "workspace_niche_history_insert" ON public.niche_history;
DROP POLICY IF EXISTS "workspace_niche_history_update" ON public.niche_history;
DROP POLICY IF EXISTS "workspace_niche_history_delete" ON public.niche_history;

-- Drop people policies (if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'people') THEN
    DROP POLICY IF EXISTS "Users can view own people" ON public.people;
    DROP POLICY IF EXISTS "Users can insert own people" ON public.people;
    DROP POLICY IF EXISTS "Users can update own people" ON public.people;
    DROP POLICY IF EXISTS "Users can delete own people" ON public.people;
    DROP POLICY IF EXISTS "workspace_people_select" ON public.people;
    DROP POLICY IF EXISTS "workspace_people_insert" ON public.people;
    DROP POLICY IF EXISTS "workspace_people_update" ON public.people;
    DROP POLICY IF EXISTS "workspace_people_delete" ON public.people;
    DROP POLICY IF EXISTS "people_select" ON public.people;
    DROP POLICY IF EXISTS "people_insert" ON public.people;
    DROP POLICY IF EXISTS "people_update" ON public.people;
    DROP POLICY IF EXISTS "people_delete" ON public.people;
  END IF;
END $$;

-- ============================================
-- PHASE 2: Drop old functions (now safe)
-- ============================================

DROP FUNCTION IF EXISTS public.get_user_workspace_ids(uuid);
DROP FUNCTION IF EXISTS public.get_workspace_ids_by_email(text);
DROP FUNCTION IF EXISTS public.get_auth_email();
DROP FUNCTION IF EXISTS public.user_workspace_ids();

-- ============================================
-- PHASE 3: Add workspace_id columns if missing
-- ============================================

-- Add workspace_id to searches
ALTER TABLE public.searches 
ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Add workspace_id to companies
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Add workspace_id to niche_history
ALTER TABLE public.niche_history 
ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Add workspace_id to people (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'people') THEN
    ALTER TABLE public.people 
    ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS searches_workspace_id_idx ON public.searches(workspace_id);
CREATE INDEX IF NOT EXISTS companies_workspace_id_idx ON public.companies(workspace_id);
CREATE INDEX IF NOT EXISTS niche_history_workspace_id_idx ON public.niche_history(workspace_id);

-- ============================================
-- PHASE 4: Backfill existing data to workspaces
-- ============================================

-- First, ensure every user has at least one workspace
-- (Create default workspace for users who don't have any)
INSERT INTO public.workspaces (name, owner_id)
SELECT 'My Workspace', u.id
FROM (
  SELECT DISTINCT user_id AS id FROM public.searches
  UNION
  SELECT DISTINCT user_id AS id FROM public.companies
) u
WHERE u.id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.workspace_members wm WHERE wm.user_id = u.id
  );

-- Add the owner as a member of their new workspace
INSERT INTO public.workspace_members (workspace_id, user_id, email, name, role)
SELECT w.id, w.owner_id, 'user@workspace.local', 'Owner', 'owner'
FROM public.workspaces w
WHERE NOT EXISTS (
  SELECT 1 FROM public.workspace_members wm 
  WHERE wm.workspace_id = w.id AND wm.user_id = w.owner_id
);

-- Backfill searches - assign each user's searches to their OWNED workspace first
-- CRITICAL: Prefer workspaces the user OWNS, not just earliest membership
-- This prevents data from accidentally landing in someone else's workspace
UPDATE public.searches s
SET workspace_id = (
  -- First try: Find a workspace the user OWNS
  SELECT COALESCE(
    (SELECT w.id FROM public.workspaces w WHERE w.owner_id = s.user_id LIMIT 1),
    -- Fallback: Use any workspace they're a member of (ordered by join date)
    (SELECT wm.workspace_id FROM public.workspace_members wm WHERE wm.user_id = s.user_id ORDER BY wm.joined_at ASC LIMIT 1)
  )
)
WHERE s.workspace_id IS NULL AND s.user_id IS NOT NULL;

-- Backfill companies - assign to workspace via their search
UPDATE public.companies c
SET workspace_id = (
  SELECT s.workspace_id 
  FROM public.searches s 
  WHERE s.id = c.search_id AND s.workspace_id IS NOT NULL
)
WHERE c.workspace_id IS NULL AND c.search_id IS NOT NULL;

-- For companies without search_id, prefer user's OWNED workspace
UPDATE public.companies c
SET workspace_id = (
  SELECT COALESCE(
    (SELECT w.id FROM public.workspaces w WHERE w.owner_id = c.user_id LIMIT 1),
    (SELECT wm.workspace_id FROM public.workspace_members wm WHERE wm.user_id = c.user_id ORDER BY wm.joined_at ASC LIMIT 1)
  )
)
WHERE c.workspace_id IS NULL AND c.user_id IS NOT NULL;

-- Backfill people - assign via their company's workspace
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'people') THEN
    -- Update people based on company's workspace
    UPDATE public.people p
    SET workspace_id = (
      SELECT c.workspace_id 
      FROM public.companies c 
      WHERE c.id = p.company_id AND c.workspace_id IS NOT NULL
    )
    WHERE p.workspace_id IS NULL AND p.company_id IS NOT NULL;
    
    -- For people without company_id, prefer user's OWNED workspace
    UPDATE public.people p
    SET workspace_id = (
      SELECT COALESCE(
        (SELECT w.id FROM public.workspaces w WHERE w.owner_id = p.user_id LIMIT 1),
        (SELECT wm.workspace_id FROM public.workspace_members wm WHERE wm.user_id = p.user_id ORDER BY wm.joined_at ASC LIMIT 1)
      )
    )
    WHERE p.workspace_id IS NULL AND p.user_id IS NOT NULL;
  END IF;
END $$;

-- Backfill niche_history - prefer user's OWNED workspace
UPDATE public.niche_history nh
SET workspace_id = (
  SELECT COALESCE(
    (SELECT w.id FROM public.workspaces w WHERE w.owner_id = nh.user_id LIMIT 1),
    (SELECT wm.workspace_id FROM public.workspace_members wm WHERE wm.user_id = nh.user_id ORDER BY wm.joined_at ASC LIMIT 1)
  )
)
WHERE nh.workspace_id IS NULL AND nh.user_id IS NOT NULL;

-- ============================================
-- PHASE 5: Update niche_history constraint
-- ============================================

-- Drop old unique constraint if it exists
ALTER TABLE public.niche_history DROP CONSTRAINT IF EXISTS niche_history_user_id_niche_key_company_domain_key;

-- Handle any duplicate workspace/niche/domain combinations
DELETE FROM public.niche_history a   --cv
  USING public.niche_history b
  WHERE a.workspace_id = b.workspace_id 
    AND a.niche_key = b.niche_key 
    AND a.company_domain = b.company_domain
    AND a.id < b.id;

-- Create new constraint (only if workspace_id is not null for all rows with data)
DO $$
BEGIN
  -- First drop the new constraint if it already exists (from partial run)
  ALTER TABLE public.niche_history 
    DROP CONSTRAINT IF EXISTS niche_history_workspace_niche_domain_key;
  
  -- Only create if all rows have workspace_id
  IF NOT EXISTS (SELECT 1 FROM public.niche_history WHERE workspace_id IS NULL) THEN
    ALTER TABLE public.niche_history 
      ADD CONSTRAINT niche_history_workspace_niche_domain_key 
      UNIQUE (workspace_id, niche_key, company_domain);
  END IF;
END $$;

-- ============================================
-- PHASE 6: Create new helper functions
-- ============================================

-- Simple function: returns TRUE if user is member of workspace
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = ws_id AND user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid) TO authenticated;

-- Function to get workspace IDs by user_id (for workspace_members and workspaces policies)
CREATE OR REPLACE FUNCTION public.get_user_workspace_ids(user_uuid uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT workspace_id FROM public.workspace_members WHERE user_id = user_uuid;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_workspace_ids(uuid) TO authenticated;

-- Function to get workspace IDs by email (for invite claiming)
CREATE OR REPLACE FUNCTION public.get_workspace_ids_by_email(user_email text)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT workspace_id FROM public.workspace_members WHERE lower(email) = lower(user_email);
$$;

GRANT EXECUTE ON FUNCTION public.get_workspace_ids_by_email(text) TO authenticated;

-- Function to get current user's email
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
-- PHASE 7: Create workspace_members policies
-- ============================================

CREATE POLICY "workspace_members_insert"
  ON public.workspace_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR auth.uid() = invited_by
  );

CREATE POLICY "workspace_members_select"
  ON public.workspace_members FOR SELECT
  USING (
    workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid()))
    OR workspace_id IN (SELECT public.get_workspace_ids_by_email(public.get_auth_email()))
  );

CREATE POLICY "workspace_members_update"
  ON public.workspace_members FOR UPDATE
  USING (
    user_id = auth.uid()
    OR lower(email) = lower(public.get_auth_email())
    OR workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid()))
  );

CREATE POLICY "workspace_members_delete"
  ON public.workspace_members FOR DELETE
  USING (
    workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid()))
  );

-- ============================================
-- PHASE 8: Create workspaces policies
-- ============================================

CREATE POLICY "workspaces_insert"
  ON public.workspaces FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "workspaces_select"
  ON public.workspaces FOR SELECT
  USING (
    auth.uid() = owner_id
    OR id IN (SELECT public.get_user_workspace_ids(auth.uid()))
    OR id IN (SELECT public.get_workspace_ids_by_email(public.get_auth_email()))
  );

CREATE POLICY "workspaces_update"
  ON public.workspaces FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "workspaces_delete"
  ON public.workspaces FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================
-- PHASE 9: Create DATA policies (WORKSPACE-BASED)
-- NO USER_ID FILTERING - WORKSPACE IS THE ONLY FILTER
-- ============================================

-- SEARCHES: All workspace members see ALL workspace searches
CREATE POLICY "workspace_searches_select"
  ON public.searches FOR SELECT
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "workspace_searches_insert"
  ON public.searches FOR INSERT
  WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "workspace_searches_update"
  ON public.searches FOR UPDATE
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "workspace_searches_delete"
  ON public.searches FOR DELETE
  USING (public.is_workspace_member(workspace_id));

-- COMPANIES: All workspace members see ALL workspace companies
CREATE POLICY "workspace_companies_select"
  ON public.companies FOR SELECT
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "workspace_companies_insert"
  ON public.companies FOR INSERT
  WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "workspace_companies_update"
  ON public.companies FOR UPDATE
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "workspace_companies_delete"
  ON public.companies FOR DELETE
  USING (public.is_workspace_member(workspace_id));

-- NICHE_HISTORY: All workspace members share niche history
CREATE POLICY "workspace_niche_history_select"
  ON public.niche_history FOR SELECT
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "workspace_niche_history_insert"
  ON public.niche_history FOR INSERT
  WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "workspace_niche_history_update"
  ON public.niche_history FOR UPDATE
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "workspace_niche_history_delete"
  ON public.niche_history FOR DELETE
  USING (public.is_workspace_member(workspace_id));

-- PEOPLE: All workspace members see ALL workspace people
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'people') THEN
    EXECUTE 'CREATE POLICY "workspace_people_select" ON public.people FOR SELECT USING (public.is_workspace_member(workspace_id))';
    EXECUTE 'CREATE POLICY "workspace_people_insert" ON public.people FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id))';
    EXECUTE 'CREATE POLICY "workspace_people_update" ON public.people FOR UPDATE USING (public.is_workspace_member(workspace_id))';
    EXECUTE 'CREATE POLICY "workspace_people_delete" ON public.people FOR DELETE USING (public.is_workspace_member(workspace_id))';
  END IF;
END $$;

-- ============================================
-- PHASE 10: Add comments explaining the model
-- ============================================

COMMENT ON TABLE public.searches IS 'Searches belong to WORKSPACES. All workspace members see all workspace searches.';
COMMENT ON TABLE public.companies IS 'Companies belong to WORKSPACES. All workspace members see all workspace companies.';
COMMENT ON TABLE public.niche_history IS 'Niche history belongs to WORKSPACES. Shared across all workspace members.';

COMMENT ON COLUMN public.searches.workspace_id IS 'The workspace that owns this search. This is the ONLY access control.';
COMMENT ON COLUMN public.companies.workspace_id IS 'The workspace that owns this company. This is the ONLY access control.';
COMMENT ON COLUMN public.searches.user_id IS 'The user who created this search. Used for attribution only, NOT access control.';
COMMENT ON COLUMN public.companies.user_id IS 'The user who created this company. Used for attribution only, NOT access control.';
