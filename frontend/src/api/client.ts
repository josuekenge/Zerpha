import {
  SearchResponse,
  InfographicReportResult,
  SearchHistoryItem,
  SavedCompany,
} from '../types';

const API_BASE_URL = 'http://localhost:3001';

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
  (error as Record<string, unknown>).status = response.status;
  throw error;
}

export async function searchCompanies(query: string): Promise<SearchResponse> {
  const response = await fetch(`${API_BASE_URL}/api/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  return handleResponse<SearchResponse>(response, 'Failed to complete search');
}

export async function exportInfographic(companyId: string): Promise<InfographicReportResult> {
  const response = await fetch(`${API_BASE_URL}/api/export-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
  const response = await fetch(`${API_BASE_URL}/api/search-history`);
  return handleResponse<SearchHistoryItem[]>(response, 'Failed to load search history');
}

export async function fetchSearchById(searchId: string): Promise<SearchResponse> {
  const response = await fetch(`${API_BASE_URL}/api/search/${searchId}`);
  return handleResponse<SearchResponse>(response, 'Failed to load saved search');
}

export interface SavedCompanyQuery {
  searchId?: string;
  category?: string;
  minScore?: number;
  maxScore?: number;
}

export async function fetchSavedCompanies(params: SavedCompanyQuery = {}): Promise<SavedCompany[]> {
  const url = new URL(`${API_BASE_URL}/api/companies`);

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

  const response = await fetch(url.toString());
  return handleResponse<SavedCompany[]>(response, 'Failed to load companies');
}

export async function saveCompany(companyId: string, category?: string): Promise<SavedCompany> {
  const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ category }),
  });

  return handleResponse<SavedCompany>(response, 'Failed to save company');
}

export async function unsaveCompany(companyId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/unsave`, {
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
    (err as Record<string, unknown>).status = response.status;
    throw err;
  }
}


