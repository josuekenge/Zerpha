-- Track which companies have been shown to each user per niche
-- Used for diversity in search results

CREATE TABLE IF NOT EXISTS public.niche_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  niche_key text NOT NULL,
  company_domain text NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  seen_count integer NOT NULL DEFAULT 1,
  UNIQUE(user_id, niche_key, company_domain)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS niche_history_user_niche_idx 
  ON public.niche_history(user_id, niche_key);

CREATE INDEX IF NOT EXISTS niche_history_last_seen_idx 
  ON public.niche_history(last_seen_at);

-- Enable RLS
ALTER TABLE public.niche_history ENABLE ROW LEVEL SECURITY;

-- Users can only see/modify their own history
CREATE POLICY "Users can view own niche history"
  ON public.niche_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own niche history"
  ON public.niche_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own niche history"
  ON public.niche_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Comment
COMMENT ON TABLE public.niche_history IS 'Tracks which companies have been shown to users per niche for result diversity';

