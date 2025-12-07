-- Add pipeline_notes column and notes_updated_at timestamp to companies table
-- For storing notes/comments per company in the pipeline

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS pipeline_notes TEXT DEFAULT NULL;

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS pipeline_notes_title TEXT DEFAULT NULL;

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS pipeline_notes_updated_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN companies.pipeline_notes IS 'Notes/comments for pipeline stage';
COMMENT ON COLUMN companies.pipeline_notes_title IS 'Title for pipeline notes';
COMMENT ON COLUMN companies.pipeline_notes_updated_at IS 'Timestamp of last notes update';
