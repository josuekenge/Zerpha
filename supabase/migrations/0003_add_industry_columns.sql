-- Add primary and secondary industry columns to companies
alter table public.companies
  add column if not exists primary_industry text,
  add column if not exists secondary_industry text;




