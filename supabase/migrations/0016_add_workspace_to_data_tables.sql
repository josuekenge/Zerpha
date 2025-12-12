-- Migration 0016: Add workspace_id to data tables for workspace-level data isolation
-- This enables each workspace to have its own companies, searches, and contacts

-- ============================================
-- STEP 1: Add workspace_id column to tables
-- ============================================

-- Add workspace_id to searches table
ALTER TABLE public.searches 
ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Add workspace_id to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Add workspace_id to people table (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'people') THEN
        ALTER TABLE public.people 
        ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add workspace_id to niche_history table
ALTER TABLE public.niche_history 
ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- ============================================
-- STEP 2: Create indexes for workspace_id
-- ============================================

CREATE INDEX IF NOT EXISTS searches_workspace_id_idx ON public.searches(workspace_id);
CREATE INDEX IF NOT EXISTS companies_workspace_id_idx ON public.companies(workspace_id);
CREATE INDEX IF NOT EXISTS niche_history_workspace_id_idx ON public.niche_history(workspace_id);

-- For people table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'people') THEN
        CREATE INDEX IF NOT EXISTS people_workspace_id_idx ON public.people(workspace_id);
    END IF;
END $$;

-- ============================================
-- STEP 3: Helper function to get user's workspaces (for RLS)
-- ============================================

-- This function returns workspace IDs that a user belongs to
CREATE OR REPLACE FUNCTION public.user_workspace_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.user_workspace_ids() TO authenticated;

-- ============================================
-- STEP 4: Update RLS policies for searches
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can insert their own searches" ON public.searches;
DROP POLICY IF EXISTS "Users can select their own searches" ON public.searches;
DROP POLICY IF EXISTS "Users can update their own searches" ON public.searches;
DROP POLICY IF EXISTS "Users can delete their own searches" ON public.searches;

-- New policies: User can access data if they belong to the workspace
CREATE POLICY "workspace_searches_insert"
  ON public.searches FOR INSERT
  WITH CHECK (
    workspace_id IN (SELECT public.user_workspace_ids())
    OR workspace_id IS NULL -- Allow legacy data or fallback to user_id
  );

CREATE POLICY "workspace_searches_select"
  ON public.searches FOR SELECT
  USING (
    workspace_id IN (SELECT public.user_workspace_ids())
    OR (workspace_id IS NULL AND user_id = auth.uid()) -- Legacy data fallback
  );

CREATE POLICY "workspace_searches_update"
  ON public.searches FOR UPDATE
  USING (
    workspace_id IN (SELECT public.user_workspace_ids())
    OR (workspace_id IS NULL AND user_id = auth.uid())
  );

CREATE POLICY "workspace_searches_delete"
  ON public.searches FOR DELETE
  USING (
    workspace_id IN (SELECT public.user_workspace_ids())
    OR (workspace_id IS NULL AND user_id = auth.uid())
  );

-- ============================================
-- STEP 5: Update RLS policies for companies
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can insert their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can select their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can delete their own companies" ON public.companies;

-- New policies
CREATE POLICY "workspace_companies_insert"
  ON public.companies FOR INSERT
  WITH CHECK (
    workspace_id IN (SELECT public.user_workspace_ids())
    OR workspace_id IS NULL
  );

CREATE POLICY "workspace_companies_select"
  ON public.companies FOR SELECT
  USING (
    workspace_id IN (SELECT public.user_workspace_ids())
    OR (workspace_id IS NULL AND user_id = auth.uid())
  );

CREATE POLICY "workspace_companies_update"
  ON public.companies FOR UPDATE
  USING (
    workspace_id IN (SELECT public.user_workspace_ids())
    OR (workspace_id IS NULL AND user_id = auth.uid())
  );

CREATE POLICY "workspace_companies_delete"
  ON public.companies FOR DELETE
  USING (
    workspace_id IN (SELECT public.user_workspace_ids())
    OR (workspace_id IS NULL AND user_id = auth.uid())
  );

-- ============================================
-- STEP 6: Update RLS policies for niche_history
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own niche history" ON public.niche_history;
DROP POLICY IF EXISTS "Users can insert own niche history" ON public.niche_history;
DROP POLICY IF EXISTS "Users can update own niche history" ON public.niche_history;

-- New policies
CREATE POLICY "workspace_niche_history_select"
  ON public.niche_history FOR SELECT
  USING (
    workspace_id IN (SELECT public.user_workspace_ids())
    OR (workspace_id IS NULL AND user_id = auth.uid())
  );

CREATE POLICY "workspace_niche_history_insert"
  ON public.niche_history FOR INSERT
  WITH CHECK (
    workspace_id IN (SELECT public.user_workspace_ids())
    OR workspace_id IS NULL
  );

CREATE POLICY "workspace_niche_history_update"
  ON public.niche_history FOR UPDATE
  USING (
    workspace_id IN (SELECT public.user_workspace_ids())
    OR (workspace_id IS NULL AND user_id = auth.uid())
  );

-- ============================================
-- STEP 7: Update RLS policies for people (if exists)
-- ============================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'people') THEN
        -- Drop old policies
        DROP POLICY IF EXISTS "Users can view own people" ON public.people;
        DROP POLICY IF EXISTS "Users can insert own people" ON public.people;
        DROP POLICY IF EXISTS "Users can update own people" ON public.people;
        DROP POLICY IF EXISTS "Users can delete own people" ON public.people;
        
        -- New policies
        EXECUTE 'CREATE POLICY "workspace_people_select" ON public.people FOR SELECT USING (workspace_id IN (SELECT public.user_workspace_ids()) OR (workspace_id IS NULL AND user_id = auth.uid()))';
        EXECUTE 'CREATE POLICY "workspace_people_insert" ON public.people FOR INSERT WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()) OR workspace_id IS NULL)';
        EXECUTE 'CREATE POLICY "workspace_people_update" ON public.people FOR UPDATE USING (workspace_id IN (SELECT public.user_workspace_ids()) OR (workspace_id IS NULL AND user_id = auth.uid()))';
        EXECUTE 'CREATE POLICY "workspace_people_delete" ON public.people FOR DELETE USING (workspace_id IN (SELECT public.user_workspace_ids()) OR (workspace_id IS NULL AND user_id = auth.uid()))';
    END IF;
END $$;

-- ============================================
-- COMMENT
-- ============================================

COMMENT ON COLUMN public.searches.workspace_id IS 'The workspace this search belongs to. Data is isolated per workspace.';
COMMENT ON COLUMN public.companies.workspace_id IS 'The workspace this company belongs to. Data is isolated per workspace.';
COMMENT ON COLUMN public.niche_history.workspace_id IS 'The workspace this niche history belongs to. Data is isolated per workspace.';
