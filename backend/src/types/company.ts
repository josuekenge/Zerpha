export const allowedIndustries = [
  'AI',
  'Logistics',
  'Healthcare',
  'Fintech',
  'Retail',
  'Real Estate',
  'Transportation',
  'HR Tech',
  'Cybersecurity',
  'EdTech',
  'Marketing',
  'Sales',
  'Productivity',
  'Communication',
  'Customer Support',
  'DevTools',
  'Vertical SaaS',
  'Marketplace',
  'E Commerce',
  'Hardware Enabled SaaS',
] as const;

export type Industry = (typeof allowedIndustries)[number];

export interface ExtractedCompany {
  name: string;
  website: string;
  summary: string;
  product_offering: string;
  customer_segment: string;
  tech_stack: string[];
  estimated_headcount: string;
  hq_location: string;
  pricing_model: string;
  strengths: string[];
  risks: string[];
  opportunities: string[];
  acquisition_fit_score: number;
  acquisition_fit_reason: string;
  top_competitors: string[];
  primary_industry: Industry;
  secondary_industry: Industry | null;
}

export type ExtractionResult = ExtractedCompany;

export function isValidExtractionResult(value: unknown): value is ExtractionResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  if (typeof candidate.name !== 'string') return false;
  if (typeof candidate.website !== 'string') return false;
  if (typeof candidate.acquisition_fit_score !== 'number') return false;

  if (!allowedIndustries.includes(candidate.primary_industry as Industry)) {
    return false;
  }

  if (
    candidate.secondary_industry !== null &&
    candidate.secondary_industry !== undefined &&
    !allowedIndustries.includes(candidate.secondary_industry as Industry)
  ) {
    return false;
  }

  return true;
}


