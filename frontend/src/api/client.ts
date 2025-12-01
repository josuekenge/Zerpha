import { SearchResponse, InfographicReportResult } from '../types';

const API_BASE_URL = 'http://localhost:3001';

export async function searchCompanies(query: string): Promise<SearchResponse> {
  const response = await fetch(`${API_BASE_URL}/api/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error('Search failed');
  }

  return response.json();
}

export async function exportInfographic(companyId: string): Promise<InfographicReportResult> {
  const response = await fetch(`${API_BASE_URL}/api/export-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ companyId }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate infographic');
  }

  return response.json();
}

