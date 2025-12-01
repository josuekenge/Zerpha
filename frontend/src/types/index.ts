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
  raw_json: CompanyRawJson;
  status?: string;
}

export interface SearchResponse {
  searchId: string;
  global_opportunities: string;
  companies: Company[];
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

