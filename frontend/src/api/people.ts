import { Person } from '../types';
import { supabase } from '../lib/supabase';

const API_BASE_URL = 'http://localhost:3001';

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    return {
      'Content-Type': 'application/json',
    };
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = await getAuthHeaders();
  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
}

async function handleResponse<T>(
  response: Response,
  defaultMessage: string,
): Promise<T> {
  if (response.ok) {
    return (await response.json()) as T;
  }

  let errorDetails: { message?: string } | null = null;
  try {
    errorDetails = await response.json();
  } catch {
    // ignore
  }

  const error = new Error(errorDetails?.message ?? defaultMessage);
  (error as any).status = response.status;
  throw error;
}

export async function getPeopleByCompanyId(
  companyId: string,
): Promise<Person[]> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/companies/${companyId}/people`,
  );
  return handleResponse<Person[]>(response, 'Failed to load contacts');
}

/**
 * Fetch all people for the current user across all companies
 */
export async function getAllPeople(): Promise<Person[]> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/people`);
  return handleResponse<Person[]>(response, 'Failed to load people');
}

