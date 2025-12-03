-- Ensure companies table includes all columns referenced by the backend
alter table public.companies
  add column if not exists summary text,
  add column if not exists status text,
  add column if not exists product_offering text,
  add column if not exists customer_segment text,
  add column if not exists tech_stack jsonb,
  add column if not exists estimated_headcount text,
  add column if not exists hq_location text,
  add column if not exists pricing_model text,
  add column if not exists strengths jsonb,
  add column if not exists risks jsonb,
  add column if not exists opportunities jsonb,
  add column if not exists acquisition_fit_reason text,
  add column if not exists top_competitors jsonb,
  add column if not exists has_summary boolean not null default false,
  add column if not exists primary_industry text,
  add column if not exists secondary_industry text;

alter table public.companies
  alter column acquisition_fit_score type numeric using acquisition_fit_score::numeric;

alter table public.companies
  alter column raw_json type jsonb using raw_json::jsonb;

update public.companies
  set has_summary = true
  where summary is not null and btrim(summary) <> '';





