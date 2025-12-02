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

