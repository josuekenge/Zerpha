import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Company, InfographicPage, SavedCompany } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDomain(url?: string | null): string {
  if (!url || typeof url !== 'string') {
    return '—';
  }
  return url
    .replace(/^https?:\/\/(www\.)?/i, '')
    .replace(/\/$/, '')
    .trim() || '—';
}

/**
 * Format a date string for display
 */
export function formatDate(value?: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

/**
 * Normalize a domain/URL to have https:// prefix
 */
export function normalizeWebsite(domain: string): string {
  if (!domain) return '';
  return /^https?:\/\//i.test(domain) ? domain : `https://${domain}`;
}

/**
 * Check if a company matches the selected industry filter.
 */
export function matchesIndustry(
  companyIndustry: string | null | undefined,
  selectedIndustry: string
): boolean {
  // "all" means show everything
  if (selectedIndustry === 'all') {
    return true;
  }

  // If company has no industry, it only shows when "all" is selected
  if (!companyIndustry || typeof companyIndustry !== 'string') {
    return false;
  }

  const companyValue = companyIndustry.trim().toLowerCase();
  const filterValue = selectedIndustry.toLowerCase();

  // Direct match (case-insensitive)
  if (companyValue === filterValue) {
    return true;
  }

  // Handle common variations
  const normalize = (s: string): string => {
    return s
      .replace(/[-_]/g, ' ')  // Replace dashes/underscores with spaces
      .replace(/\s+/g, '')    // Remove all spaces
      .toLowerCase();
  };

  return normalize(companyValue) === normalize(filterValue);
}

/**
 * Convert a SavedCompany to a Company type
 */
export function savedCompanyToCompany(saved: SavedCompany): Company {
  return {
    id: saved.id,
    name: saved.name,
    website: normalizeWebsite(saved.domain),
    vertical_query: saved.category,
    acquisition_fit_score: saved.fitScore ?? null,
    summary: saved.summary,
    raw_json: saved.raw_json ?? {},
    is_saved: saved.is_saved,
    saved_category: saved.saved_category,
    created_at: saved.created_at ?? undefined,
    primary_industry: saved.primary_industry,
    secondary_industry: saved.secondary_industry,
  };
}

export function downloadInfographicPdf(data: InfographicPage) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    return;
  }

  const documentHtml = `
    <html>
      <head>
        <title>${data.title}</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 32px; color: #0f172a; }
          h1 { font-size: 28px; margin-bottom: 8px; }
          h2 { font-size: 18px; margin-top: 24px; }
          ul { padding-left: 20px; }
          li { margin-bottom: 8px; }
          .metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
          .metric { padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; }
          .muted { color: #64748b; }
        </style>
      </head>
      <body>
        <h1>${data.title}</h1>
        <p class="muted">${data.subtitle}</p>
        <h2>Key Metrics</h2>
        <div class="metrics">
          ${data.key_metrics
      .map(
        (metric) =>
          `<div class="metric"><div class="muted">${metric.label}</div><strong>${metric.value}</strong></div>`,
      )
      .join('')}
        </div>
        <h2>Strategic Analysis</h2>
        <ul>
          ${data.bullets.map((b) => `<li>${b}</li>`).join('')}
        </ul>
      </body>
    </html>
  `;

  printWindow.document.write(documentHtml);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}

