-- Add pipeline_stage column to companies table
-- Valid values: 'new', 'researching', 'contacted', 'in_diligence', 'closed'
-- NULL is treated as 'new' in application logic

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT NULL;

-- Add a check constraint for valid values
ALTER TABLE companies 
ADD CONSTRAINT pipeline_stage_valid_values 
CHECK (pipeline_stage IS NULL OR pipeline_stage IN ('new', 'researching', 'contacted', 'in_diligence', 'closed'));

COMMENT ON COLUMN companies.pipeline_stage IS 'Pipeline stage for kanban board: new, researching, contacted, in_diligence, closed';
