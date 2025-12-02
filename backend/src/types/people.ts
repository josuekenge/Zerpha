export interface Person {
  id: string;
  company_id: string;
  user_id?: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  seniority: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  source: string | null;
  confidence_score: number | null;
  created_at: string;
  location_city: string | null;
  location_country: string | null;
  work_history: Record<string, unknown> | null;
  skills: Record<string, unknown> | null;
  tags: Record<string, unknown> | null;
  notes: string | null;
  is_ceo: boolean;
  is_founder: boolean;
  is_executive: boolean;
}

