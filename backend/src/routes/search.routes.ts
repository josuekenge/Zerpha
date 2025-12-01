import { Router } from 'express';
import { z } from 'zod';

import { supabase } from '../config/supabase.js';
import { discoverCompanies } from '../services/discoveryService.js';
import { scrapeCompanySite } from '../services/scraperService.js';
import {
  extractCompanyInsights,
  type ExtractedCompany,
} from '../services/extractionService.js';
import { generateGlobalOpportunities } from '../services/insightsService.js';
import { logger } from '../logger.js';

const searchRequestSchema = z.object({
  query: z.string().min(2).max(200),
});

const searchIdParamSchema = z.object({
  searchId: z.string().uuid(),
});

const searchHistoryItemSchema = z.object({
  id: z.string().uuid(),
  query: z.string(),
  created_at: z.string(),
  company_count: z.number().int().nonnegative(),
});

export type SearchHistoryItem = z.infer<typeof searchHistoryItemSchema>;

export const savedCompanySchema = z.object({
  id: z.string().uuid(),
  search_id: z.string().uuid(),
  name: z.string(),
  domain: z.string(),
  fitScore: z.number().nullable(),
  category: z.string(),
  summary: z.string().nullable(),
  headquarters: z.string().nullable(),
  headcount: z.string().nullable(),
  techStack: z.string().nullable(),
  fit_band: z.enum(['high', 'medium', 'low']).nullable(),
  is_saved: z.boolean(),
  saved_category: z.string().nullable(),
  created_at: z.string().nullable(),
  raw_json: z.record(z.any()),
});

export type SavedCompany = z.infer<typeof savedCompanySchema>;

interface ProcessedCompany {
  name: string;
  website: string;
  status: 'success' | 'failed';
  reason: string;
  extracted?: ExtractedCompany;
}

export interface DatabaseCompany {
  id: string;
  search_id: string;
  name: string;
  website: string;
  vertical_query: string | null;
  raw_json: Record<string, unknown> | null;
  acquisition_fit_score: number | null;
  created_at: string;
  summary?: string | null;
  status?: ProcessedCompany['status'] | null;
  is_saved: boolean;
  saved_category?: string | null;
}

export type ApiCompany = Omit<
  DatabaseCompany,
  'summary' | 'status' | 'raw_json' | 'saved_category'
> & {
  summary: string | null;
  status: ProcessedCompany['status'] | null;
  raw_json: Record<string, unknown>;
  saved_category: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function pickStringField(
  source: Record<string, unknown> | null,
  key: string,
): string | null {
  if (!source) return null;
  const value = source[key];
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function unwrapExtractedPayload(raw: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!raw) return null;
  const maybeExtracted = raw['extracted'];
  if (isRecord(maybeExtracted)) {
    return maybeExtracted;
  }
  return raw;
}

function normalizeStatus(value: unknown): ProcessedCompany['status'] | null {
  if (value === 'success' || value === 'failed') {
    return value;
  }
  return null;
}

export function deriveFitBand(score: number | null): 'high' | 'medium' | 'low' | null {
  if (typeof score !== 'number') {
    return null;
  }
  if (score >= 8) {
    return 'high';
  }
  if (score >= 5) {
    return 'medium';
  }
  return 'low';
}

export function extractDomain(website: string): string {
  try {
    const url = new URL(website);
    return url.hostname.replace(/^www\./i, '');
  } catch {
    return website;
  }
}

export function deriveCategory(company: ApiCompany): string {
  const primary =
    company.vertical_query ??
    pickStringField(company.raw_json, 'industry') ??
    pickStringField(company.raw_json, 'customer_segment');
  return primary ?? 'General';
}

export function transformCompanyForApi(dbCompany: DatabaseCompany): ApiCompany {
  const storedRaw = isRecord(dbCompany.raw_json) ? dbCompany.raw_json : null;
  const extracted = unwrapExtractedPayload(storedRaw);
  const hydratedRaw = { ...(extracted ?? storedRaw ?? {}) };

  if (
    storedRaw &&
    typeof storedRaw['reason'] === 'string' &&
    typeof hydratedRaw['reason'] !== 'string'
  ) {
    hydratedRaw['reason'] = storedRaw['reason'];
  }

  const persistedSummary =
    typeof dbCompany.summary === 'string' ? dbCompany.summary.trim() : null;

  const summary =
    (persistedSummary && persistedSummary.length > 0 ? persistedSummary : null) ??
    pickStringField(extracted, 'summary') ??
    pickStringField(storedRaw, 'summary') ??
    null;

  const status =
    normalizeStatus(dbCompany.status) ??
    normalizeStatus(storedRaw ? storedRaw['status'] : undefined) ??
    normalizeStatus(extracted ? extracted['status'] : undefined) ??
    'success';

  return {
    ...dbCompany,
    raw_json: hydratedRaw,
    summary,
    status,
    is_saved: Boolean(dbCompany.is_saved),
    saved_category: dbCompany.saved_category ?? null,
  };
}

export const searchRouter = Router();

searchRouter.post('/search', async (req, res, next) => {
  try {
    const { query } = searchRequestSchema.parse(req.body);

    const { data: searchInsert, error: searchError } = await supabase
      .from('searches')
      .insert({ query_text: query })
      .select()
      .single();

    if (searchError || !searchInsert) {
      throw new Error(searchError?.message ?? 'Failed to create search');
    }

    const discovered = await discoverCompanies(query);

    if (discovered.length === 0) {
      return res.status(200).json({
        searchId: searchInsert.id,
        global_opportunities: 'No companies found for this query yet.',
        companies: [],
      });
    }

    const processedCompanies: ProcessedCompany[] = [];

    const processCompany = async (company: (typeof discovered)[number]) => {
      try {
        const scrapeResult = await scrapeCompanySite(company.website);

        if (scrapeResult.pages.length === 0) {
          throw new Error('No content could be scraped from the site');
        }

        const combinedText = scrapeResult.pages
          .map((page) => `[${page.type.toUpperCase()}]\n${page.text}`)
          .join('\n\n')
          .slice(0, 20_000);

        const extracted = await extractCompanyInsights({
          companyName: company.name,
          website: company.website,
          combinedText,
        });

        processedCompanies.push({
          name: company.name,
          website: company.website,
          status: 'success',
          reason: company.reason,
          extracted,
        });

      } catch (error) {
        processedCompanies.push({
          name: company.name,
          website: company.website,
          status: 'failed',
          reason: company.reason,
        });

        logger.error(
          {
            err: error,
            companyName: company.name,
            website: company.website,
          },
          'Failed to process company during search',
        );
      }
    };

    const concurrency = 2;
    for (let i = 0; i < discovered.length; i += concurrency) {
      const batch = discovered.slice(i, i + concurrency);
      await Promise.all(batch.map((company) => processCompany(company)));
    }

    const companyRecords = processedCompanies.map((company) => {
      const rawScore = company.extracted?.acquisition_fit_score;
      const numericScore =
        typeof rawScore === 'number'
          ? rawScore
          : typeof rawScore === 'string'
            ? Number(rawScore)
            : NaN;
      const acquisitionFitScore = Number.isFinite(numericScore) ? Math.round(numericScore) : null;
      const extractedSummary = company.extracted?.summary?.trim() ?? '';
      const summary = extractedSummary.length > 0 ? extractedSummary : null;
      const status = company.status ?? 'success';
      const rawJsonPayload = company.extracted
        ? ({ ...company.extracted, reason: company.reason } as Record<string, unknown>)
        : (company as unknown as Record<string, unknown>);

      return {
        search_id: searchInsert.id,
        name: company.extracted?.name ?? company.name,
        website: company.extracted?.website ?? company.website,
        vertical_query: query,
        raw_json: rawJsonPayload,
        acquisition_fit_score: acquisitionFitScore,
        summary,
        status,
      };
    });

    if (companyRecords.length > 0) {
      const { data: insertedRows, error: insertError } = await supabase
        .from('companies')
        .insert(companyRecords);

      if (insertError) {
        logger.error(
          { err: insertError, searchId: searchInsert.id },
          'Failed to persist companies',
        );
      } else {
        const insertedRowsArray = (insertedRows ?? []) as unknown[];
        const insertedCount =
          Array.isArray(insertedRowsArray) && insertedRowsArray.length > 0
            ? insertedRowsArray.length
            : companyRecords.length;
        logger.info(
          { searchId: searchInsert.id, insertedCount },
          'Persisted companies for search',
        );
      }
    }

    const globalOpportunities = await generateGlobalOpportunities({
      query,
      companies: processedCompanies.map((company) => ({
        name: company.name,
        reason: company.reason,
      })),
    });

    await supabase
      .from('searches')
      .update({ global_opportunities: globalOpportunities })
      .eq('id', searchInsert.id);

    const { data: companyRows, error: selectError } = await supabase
      .from('companies')
      .select('*')
      .eq('search_id', searchInsert.id)
      .order('created_at', { ascending: true });

    if (selectError) {
      throw new Error(selectError.message);
    }

    const companiesWithSummary = (companyRows ?? []).map((row) =>
      transformCompanyForApi(row as DatabaseCompany),
    );

    res.status(200).json({
      searchId: searchInsert.id,
      global_opportunities: globalOpportunities,
      companies: companiesWithSummary,
    });
  } catch (error) {
    next(error);
  }
});

searchRouter.get('/search/:searchId', async (req, res, next) => {
  try {
    const { searchId } = searchIdParamSchema.parse(req.params);

    const { data: searchRow, error: searchError } = await supabase
      .from('searches')
      .select('*')
      .eq('id', searchId)
      .single();

    if (searchError || !searchRow) {
      return res.status(404).json({ message: 'Search not found' });
    }

    const { data: companyRows, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('search_id', searchId)
      .order('created_at', { ascending: true });

    if (companyError) {
      throw new Error(companyError.message);
    }

    const companiesWithSummary = (companyRows ?? []).map((row) =>
      transformCompanyForApi(row as DatabaseCompany),
    );

    res.json({
      searchId: searchRow.id,
      global_opportunities: searchRow.global_opportunities,
      companies: companiesWithSummary,
    });
  } catch (error) {
    next(error);
  }
});

searchRouter.get('/search-history', async (_req, res, next) => {
  try {
    const { data: searchRows, error: searchError } = await supabase
      .from('searches')
      .select('id, query_text, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (searchError) {
      logger.error({ err: searchError }, 'Failed to fetch search history');
      throw new Error(searchError.message);
    }

    const searchIds = (searchRows ?? []).map((row) => row.id);
    const companyCounts: Record<string, number> = Object.create(null);

    if (searchIds.length > 0) {
      const { data: companyRows, error: companyError } = await supabase
        .from('companies')
        .select('search_id')
        .in('search_id', searchIds);

      if (companyError) {
        logger.error({ err: companyError }, 'Failed to aggregate company counts');
        throw new Error(companyError.message);
      }

      for (const row of companyRows ?? []) {
        if (row && typeof row.search_id === 'string') {
          companyCounts[row.search_id] = (companyCounts[row.search_id] ?? 0) + 1;
        }
      }
    }

    const historyItems = searchHistoryItemSchema.array().parse(
      (searchRows ?? []).map((row) => ({
        id: row.id,
        query: row.query_text,
        created_at: row.created_at,
        company_count: companyCounts[row.id] ?? 0,
      })),
    );

    res.json(historyItems);
  } catch (error) {
    next(error);
  }
});

