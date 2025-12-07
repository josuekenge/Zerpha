export interface CompanyRawJson {
  summary?: string;
  product_offering?: string;
  customer_segment?: string;
  tech_stack?: string;
  estimated_headcount?: string;
  hq_location?: string;
  pricing_model?: string;
  acquisition_fit_score?: number;
  acquisition_fit_reason?: string;
  global_opportunities?: string;
  [key: string]: unknown;
}

export interface Company {
  id: string;
  name: string;
  website: string;
  vertical_query: string;
  acquisition_fit_score: number | null;
  summary: string | null;
  raw_json: CompanyRawJson;
  status?: string;
  is_saved?: boolean;
  saved_category?: string | null;
  created_at?: string;
  primary_industry?: string;
  secondary_industry?: string;
  favicon_url?: string | null;
}

export interface SearchResponse {
  searchId: string;
  global_opportunities: string;
  companies: Company[];
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  created_at: string;
  company_count: number;
}

export type FitBand = 'high' | 'medium' | 'low' | null;

export interface SavedCompany {
  id: string;
  search_id: string;
  name: string;
  domain: string;
  fitScore: number | null;
  category: string;
  summary: string | null;
  headquarters: string | null;
  headcount: string | null;
  techStack: string | null;
  fit_band: FitBand;
  is_saved: boolean;
  saved_category: string | null;
  created_at: string | null;
  raw_json: CompanyRawJson;
  primary_industry?: string;
  secondary_industry?: string;
  favicon_url?: string | null;
}

export interface InfographicPage {
  title: string;
  subtitle: string;
  key_metrics: { label: string; value: string }[];
  bullets: string[];
}

export interface InfographicReportResult {
  companyId: string;
  infographic: InfographicPage;
}

export interface Person {
  id: string;
  company_id: string;
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
  // Added from join with companies table
  company_name?: string | null;
  company_website?: string | null;
}

/** Person summary for search details (lighter weight) */
export interface PersonSummary {
  id: string;
  company_id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  is_ceo: boolean;
  is_founder: boolean;
  is_executive: boolean;
}

/** Company with embedded people for search details */
export interface CompanyWithPeople extends Company {
  people: PersonSummary[];
}

/** Full search details response */
export interface SearchDetailsResponse {
  search: {
    id: string;
    query: string;
    created_at: string;
    global_opportunities?: string;
  };
  companies: CompanyWithPeople[];
}

