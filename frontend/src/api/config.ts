/**
 * =============================================================================
 * API CONFIGURATION
 * =============================================================================
 * 
 * This file configures the base URL for all API requests.
 * 
 * PRODUCTION SETUP (Netlify):
 *   VITE_API_BASE_URL must be set to your Railway backend URL:
 *   VITE_API_BASE_URL=https://zerpha-production.up.railway.app
 * 
 * LOCAL DEVELOPMENT:
 *   Create a .env.local file with:
 *   VITE_API_BASE_URL=http://localhost:3001
 * 
 * IMPORTANT: All new API calls MUST use buildApiUrl() to avoid hardcoded URLs.
 * =============================================================================
 */

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

// Validate that VITE_API_BASE_URL is set
if (!rawBaseUrl) {
  const errorMsg = `
    ❌ VITE_API_BASE_URL is not defined!
    
    For Production (Netlify): Set in Netlify Dashboard → Site Settings → Environment Variables:
      VITE_API_BASE_URL=https://zerpha-production.up.railway.app
    
    For Local Development: Create frontend/.env.local with:
      VITE_API_BASE_URL=http://localhost:3001
  `;
  console.error(errorMsg);

  // In development, throw to make it obvious
  if (import.meta.env.DEV) {
    throw new Error('VITE_API_BASE_URL is not defined. See console for setup instructions.');
  }
}

// Normalize: remove trailing slashes for consistent URL joins
const normalizedBaseUrl = rawBaseUrl?.replace(/\/+$/, '') ?? '';

export const API_BASE_URL = normalizedBaseUrl;

// Log the API URL so developers can verify where requests are going
// This is intentional and helps debug production issues
console.log(`🔌 API Client connecting to: ${API_BASE_URL || '(NOT SET - API calls will fail!)'}`);

/**
 * Build a full API URL from a relative path.
 * 
 * @param path - The API path (e.g., '/api/companies' or '/api/search')
 * @returns The full URL to the backend API
 * 
 * @example
 * buildApiUrl('/api/companies') → 'https://zerpha-production.up.railway.app/api/companies'
 */
export function buildApiUrl(path: string): string {
  // If already a full URL, return as-is
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // If no base URL configured, this will fail but at least return the path
  if (!API_BASE_URL) {
    console.error(`❌ API call to ${normalizedPath} will fail: VITE_API_BASE_URL is not set`);
    return normalizedPath;
  }

  return `${API_BASE_URL}${normalizedPath}`;
}
