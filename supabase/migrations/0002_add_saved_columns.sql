-- Add is_saved and saved_category columns to companies table
alter table public.companies add column if not exists is_saved boolean not null default false;
alter table public.companies add column if not exists saved_category text;

