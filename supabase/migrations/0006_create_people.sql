create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  full_name text,
  first_name text,
  last_name text,
  role text,
  seniority text,
  department text,
  email text,
  phone text,
  linkedin_url text,
  twitter_url text,
  source text,
  confidence_score numeric,
  created_at timestamptz not null default now(),
  location_city text,
  location_country text,
  work_history jsonb,
  skills jsonb,
  tags jsonb,
  notes text,
  is_ceo boolean not null default false,
  is_founder boolean not null default false,
  is_executive boolean not null default false
);

create index if not exists people_company_id_idx on public.people(company_id);
create index if not exists people_email_idx on public.people(email);
create index if not exists people_full_name_idx on public.people(full_name);



