-- Zerpha initial schema for Supabase/Postgres

create extension if not exists "pgcrypto";

create table if not exists public.searches (
  id uuid primary key default gen_random_uuid(),
  query_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  search_id uuid not null references public.searches(id) on delete cascade,
  name text not null,
  website text not null,
  vertical_query text,
  raw_json jsonb,
  acquisition_fit_score integer,
  is_saved boolean not null default false,
  saved_category text,
  created_at timestamptz not null default now()
);

create index if not exists companies_search_id_idx on public.companies(search_id);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  pdf_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists reports_company_id_idx on public.reports(company_id);
