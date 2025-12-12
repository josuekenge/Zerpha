import { supabase } from '../lib/supabase';
import {
  SearchResponse,
  InfographicReportResult,
  SearchHistoryItem,
  SavedCompany,
  SearchDetailsResponse,
} from '../types';
import { buildApiUrl } from './config';

// Key for storing active workspace ID (must match workspace.tsx)
const ACTIVE_WORKSPACE_KEY = 'zerpha_active_workspace_id';

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const workspaceId = localStorage.getItem(ACTIVE_WORKSPACE_KEY);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (workspaceId) {
    headers['X-Workspace-ID'] = workspaceId;
  }

  return headers;
}

async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = await getAuthHeaders();

  return fetch(url, {
    ...options,
    credentials: 'include', // Required for cross-origin requests with cookies
    headers: {
      ...headers,
      ...options.headers,
    },
  });
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json();
  return data as T;
}

async function handleResponse<T>(response: Response, defaultMessage: string): Promise<T> {
  if (response.ok) {
    return parseJson<T>(response);
  }

  let errorDetails: { message?: string } | null = null;
  try {
    errorDetails = await response.json();
  } catch {
    // ignore parse error
  }

  const error = new Error(errorDetails?.message ?? defaultMessage);
  (error as any).status = response.status;
  throw error;
}

export async function searchCompanies(query: string): Promise<SearchResponse> {
  const response = await authenticatedFetch(buildApiUrl('/api/search'), {
    method: 'POST',
    body: JSON.stringify({ query }),
  });

  return handleResponse<SearchResponse>(response, 'Failed to complete search');
}

export async function exportInfographic(companyId: string): Promise<InfographicReportResult> {
  const response = await authenticatedFetch(buildApiUrl('/api/export-report'), {
    method: 'POST',
    body: JSON.stringify({ companyId }),
  });

  try {
    return await handleResponse<InfographicReportResult>(response, 'Failed to generate infographic');
  } catch (error) {
    // ensure legacy callers still see friendly message
    throw error;
  }
}

export async function fetchSearchHistory(): Promise<SearchHistoryItem[]> {
  const response = await authenticatedFetch(buildApiUrl('/api/search-history'));
  return handleResponse<SearchHistoryItem[]>(response, 'Failed to load search history');
}

export async function fetchSearchById(searchId: string): Promise<SearchResponse> {
  const response = await authenticatedFetch(buildApiUrl(`/api/search/${searchId}`));
  return handleResponse<SearchResponse>(response, 'Failed to load saved search');
}

/**
 * Fetch full search details including companies and their people
 */
export async function fetchSearchDetails(searchId: string): Promise<SearchDetailsResponse> {
  const response = await authenticatedFetch(buildApiUrl(`/api/searches/${searchId}/details`));
  return handleResponse<SearchDetailsResponse>(response, 'Failed to load search details');
}

export interface SavedCompanyQuery {
  searchId?: string;
  category?: string;
  minScore?: number;
  maxScore?: number;
}

export async function fetchSavedCompanies(params: SavedCompanyQuery = {}): Promise<SavedCompany[]> {
  const baseUrl = buildApiUrl('/api/companies');
  const url = new URL(baseUrl, window.location.origin);

  if (params.searchId) {
    url.searchParams.set('searchId', params.searchId);
  }
  if (params.category) {
    url.searchParams.set('category', params.category);
  }
  if (typeof params.minScore === 'number') {
    url.searchParams.set('minScore', String(params.minScore));
  }
  if (typeof params.maxScore === 'number') {
    url.searchParams.set('maxScore', String(params.maxScore));
  }

  const response = await authenticatedFetch(url.toString());
  return handleResponse<SavedCompany[]>(response, 'Failed to load companies');
}

export async function saveCompany(companyId: string, category?: string): Promise<SavedCompany> {
  const response = await authenticatedFetch(buildApiUrl(`/api/companies/${companyId}/save`), {
    method: 'POST',
    body: JSON.stringify({ category }),
  });

  return handleResponse<SavedCompany>(response, 'Failed to save company');
}

export async function unsaveCompany(companyId: string): Promise<void> {
  const response = await authenticatedFetch(buildApiUrl(`/api/companies/${companyId}/unsave`), {
    method: 'POST',
  });

  if (!response.ok) {
    let errorDetails: { message?: string } | null = null;
    try {
      errorDetails = await response.json();
    } catch {
      // ignore
    }
    const err = new Error(errorDetails?.message ?? 'Failed to unsave company');
    (err as any).status = response.status;
    throw err;
  }
}

export interface CreateCompanyParams {
  name: string;
  domain?: string;
  description?: string;
  headquarters?: string;
  linkedin_url?: string;
}

export async function createCompany(params: CreateCompanyParams): Promise<SavedCompany> {
  const response = await authenticatedFetch(buildApiUrl('/api/companies'), {
    method: 'POST',
    body: JSON.stringify(params),
  });

  return handleResponse<SavedCompany>(response, 'Failed to create company');
}

// Insights types
export interface CompanyTarget {
  id: string;
  name: string;
  domain: string;
  industry: string;
  fitScore: number;
  digScore: number;
}

export interface IndustryBreakdown {
  industry: string;
  count: number;
  averageFitScore: number;
  averageDigScore: number;
}

export interface InsightsResponse {
  totalCompanies: number;
  averageFitScore: number | null;
  averageDigScore: number | null;
  byIndustry: IndustryBreakdown[];
  topTargets: CompanyTarget[];
  hiddenGems: CompanyTarget[];
}

export interface InsightsQuery {
  minScore?: number;
  maxScore?: number;
  industry?: string;
  location?: string;
}

export async function fetchInsights(params: InsightsQuery = {}): Promise<InsightsResponse> {
  const baseUrl = buildApiUrl('/api/insights/companies');
  const url = new URL(baseUrl, window.location.origin);

  if (typeof params.minScore === 'number') {
    url.searchParams.set('minScore', String(params.minScore));
  }
  if (typeof params.maxScore === 'number') {
    url.searchParams.set('maxScore', String(params.maxScore));
  }
  if (params.industry && params.industry !== 'all') {
    url.searchParams.set('industry', params.industry);
  }
  if (params.location) {
    url.searchParams.set('location', params.location);
  }

  const response = await authenticatedFetch(url.toString());
  return handleResponse<InsightsResponse>(response, 'Failed to load insights');
}

// Pipeline types
export type PipelineStage = 'new' | 'researching' | 'contacted' | 'in_diligence' | 'closed';

export interface PipelineCompany {
  id: string;
  name: string;
  domain: string;
  industry: string | null;
  fitScore: number | null;
  digScore: number | null;
  faviconUrl: string | null;
  notesTitle: string | null;
  notes: string | null;
  notesUpdatedAt: string | null;
}

export interface PipelineCompanyDetail extends PipelineCompany {
  website: string | null;
  summary: string | null;
  headquarters: string | null;
  headcount: string | null;
  pipelineStage: PipelineStage;
}

export interface PipelineStageData {
  id: PipelineStage;
  label: string;
  companies: PipelineCompany[];
}

export interface PipelineResponse {
  stages: PipelineStageData[];
}

export async function fetchPipeline(): Promise<PipelineResponse> {
  const response = await authenticatedFetch(buildApiUrl('/api/pipeline'));
  return handleResponse<PipelineResponse>(response, 'Failed to load pipeline');
}

export async function fetchPipelineCompany(companyId: string): Promise<PipelineCompanyDetail> {
  const response = await authenticatedFetch(buildApiUrl(`/api/pipeline/${companyId}`));
  return handleResponse<PipelineCompanyDetail>(response, 'Failed to load company detail');
}

export interface UpdatePipelineParams {
  pipelineStage?: PipelineStage | null;
  notesTitle?: string | null;
  notes?: string | null;
}

export async function updatePipelineCompany(
  companyId: string,
  params: UpdatePipelineParams
): Promise<{ id: string; pipelineStage: string | null; notesTitle: string | null; notes: string | null; notesUpdatedAt: string | null }> {
  const response = await authenticatedFetch(buildApiUrl(`/api/pipeline/${companyId}`), {
    method: 'PATCH',
    body: JSON.stringify(params),
  });
  return handleResponse(response, 'Failed to update pipeline');
}
