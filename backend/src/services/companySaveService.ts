import { supabase } from '../config/supabase.js';
import { logger } from '../logger.js';
import type { ExtractedCompany } from '../types/company.js';

interface SaveCompanyParams {
  userId: string;
  searchId: string;
  verticalQuery: string;
  extracted: ExtractedCompany;
  reason?: string;
}

function normalizeString(value?: string | null): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeStringArray(values?: string[] | null): string[] | null {
  if (!Array.isArray(values) || values.length === 0) {
    return null;
  }

  const cleaned = values
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter((value) => value.length > 0);

  return cleaned.length > 0 ? cleaned : null;
}

export async function saveExtractedCompany({
  userId,
  searchId,
  verticalQuery,
  extracted,
  reason,
}: SaveCompanyParams) {
  const summary = normalizeString(extracted.summary);
  const payload = {
    user_id: userId,
    search_id: searchId,
    name: extracted.name,
    website: extracted.website,
    vertical_query: verticalQuery,
    raw_json: {
      ...extracted,
      ...(reason ? { reason } : {}),
    },
    acquisition_fit_score: extracted.acquisition_fit_score,
    acquisition_fit_reason: normalizeString(extracted.acquisition_fit_reason),
    summary,
    has_summary: Boolean(summary),
    status: 'success' as const,
    primary_industry: extracted.primary_industry,
    secondary_industry: extracted.secondary_industry,
    product_offering: normalizeString(extracted.product_offering),
    customer_segment: normalizeString(extracted.customer_segment),
    tech_stack: normalizeStringArray(extracted.tech_stack),
    estimated_headcount: normalizeString(extracted.estimated_headcount),
    hq_location: normalizeString(extracted.hq_location),
    pricing_model: normalizeString(extracted.pricing_model),
    strengths: normalizeStringArray(extracted.strengths),
    risks: normalizeStringArray(extracted.risks),
    opportunities: normalizeStringArray(extracted.opportunities),
    top_competitors: normalizeStringArray(extracted.top_competitors),
  };

  const { data, error } = await supabase.from('companies').insert(payload).select('*').single();

  if (error) {
    logger.error(
      { err: error, searchId, company: extracted.name },
      '[companies] failed to insert extracted company',
    );
    throw error;
  }

  logger.info(
    { searchId, companyId: data.id, company: data.name },
    '[companies] inserted extracted company',
  );

  return data;
}

