-- Add color column to workspace_members for user identification
-- Migration 0012: Add member colors

ALTER TABLE workspace_members 
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT NULL;

COMMENT ON COLUMN workspace_members.color IS 'Hex color code for user identification (e.g., #6366F1)';
