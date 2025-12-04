const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

const missingBaseUrlMessage =
  'VITE_API_BASE_URL is not configured. Create a .env file and set VITE_API_BASE_URL (e.g. http://localhost:3001).';

if (!rawBaseUrl) {
  if (import.meta.env.DEV) {
    throw new Error(missingBaseUrlMessage);
  }
  // eslint-disable-next-line no-console
  console.error(missingBaseUrlMessage);
}

const normalizedBaseUrl =
  rawBaseUrl?.replace(/\/+$/, '') ?? ''; // remove trailing slashes for consistent url joins

export const API_BASE_URL = normalizedBaseUrl;

export function buildApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) {
    return normalizedPath;
  }
  return `${API_BASE_URL}${normalizedPath}`;
}

