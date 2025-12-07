import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';

import { supabase } from '../config/supabase.js';
import { discoverCompanies, DEFAULT_RESULT_COUNT } from '../services/discoveryService.js';
import { scrapeCompanySite } from '../services/scraperService.js';
import {
  extractCompanyInsights,
} from '../services/extractionService.js';
import { generateGlobalOpportunities } from '../services/insightsService.js';
import { logger } from '../logger.js';
import type { ExtractedCompany } from '../types/company.js';
import { saveExtractedCompany } from '../services/companySaveService.js';
import { scrapePeople } from '../services/apifyService.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { getCachedExtraction, setCachedExtraction, normalizeDomain } from '../services/cacheService.js';
import {
  deriveNicheKey,
  getSeenDomains,
  getSavedCompanyDomains,
  selectDiverseCompanies,
  recordSeenCompanies,
} from '../services/diversityService.js';

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
  primary_industry: z.string().nullable().optional(),
  secondary_industry: z.string().nullable().optional(),
  favicon_url: z.string().nullable().optional(),
});

export type SavedCompany = z.infer<typeof savedCompanySchema>;

interface ProcessedCompany {
  name: string;
  website: string;
  status: 'success' | 'failed';
  description: string;  // From discovery - why company fits the query
  industry?: string;    // From discovery
  country?: string;     // From discovery
  extracted?: ExtractedCompany;
}

export interface DatabaseCompany {
  id: string;
  user_id: string;
  search_id: string;
  name: string;
  website: string;
  vertical_query: string | null;
  raw_json: Record<string, unknown> | null;
  acquisition_fit_score: number | null;
  acquisition_fit_reason?: string | null;
  created_at: string;
  summary?: string | null;
  status?: ProcessedCompany['status'] | null;
  is_saved: boolean;
  saved_category?: string | null;
  primary_industry?: string | null;
  secondary_industry?: string | null;
  product_offering?: string | null;
  customer_segment?: string | null;
  tech_stack?: unknown;
  estimated_headcount?: string | null;
  hq_location?: string | null;
  pricing_model?: string | null;
  strengths?: unknown;
  risks?: unknown;
  opportunities?: unknown;
  top_competitors?: unknown;
  has_summary?: boolean | null;
  favicon_url?: string | null;
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
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (Array.isArray(value)) {
    const joined = value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0)
      .join(', ');
    return joined.length > 0 ? joined : null;
  }
  return null;
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
    company.saved_category ??
    company.primary_industry ??
    company.secondary_industry ??
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

  const primaryIndustry =
    (typeof dbCompany.primary_industry === 'string' && dbCompany.primary_industry.trim().length > 0
      ? dbCompany.primary_industry.trim()
      : null) ??
    pickStringField(hydratedRaw, 'primary_industry');

  const secondaryIndustry =
    (typeof dbCompany.secondary_industry === 'string' &&
      dbCompany.secondary_industry.trim().length > 0
      ? dbCompany.secondary_industry.trim()
      : null) ??
    pickStringField(hydratedRaw, 'secondary_industry');

  const hasSummary =
    typeof dbCompany.has_summary === 'boolean'
      ? dbCompany.has_summary
      : Boolean(summary && summary.length > 0);

  return {
    ...dbCompany,
    raw_json: hydratedRaw,
    summary,
    status,
    is_saved: Boolean(dbCompany.is_saved),
    saved_category: dbCompany.saved_category ?? null,
    primary_industry: primaryIndustry ?? null,
    secondary_industry: secondaryIndustry ?? null,
    has_summary: hasSummary,
  };
}

export const searchRouter = Router();

searchRouter.post('/search', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  const searchStartTime = Date.now();

  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) throw new Error('User not authenticated');

    const { query } = searchRequestSchema.parse(req.body);

    logger.info({ query, userId: user.id }, '[search] received search request');

    const enrichCompanyPeople = async (companyId: string, companyName: string, website: string, userId: string) => {
      console.log("ENRICH PEOPLE CALLED FOR", companyName);
      console.log("DEBUG: companyId =", companyId, "userId =", userId, "website =", website);

      try {
        logger.info({ companyId, companyName, website }, '[people] starting website-contacts scraper');

        // Use the scrapePeople function with the full website URL
        const people = await scrapePeople(website);

        console.log('People scraped for', companyName, people);

        if (!Array.isArray(people) || people.length === 0) {
          console.log("DEBUG: No people returned from scrapePeople for", companyName);
          logger.debug({ companyId, companyName, website }, '[people] no contacts found by Apify');
          return [];
        }

        logger.info(
          { companyId, companyName, contactCount: people.length },
          '[people] received contacts from Apify website-contacts',
        );

        // Insert each person directly into public.people
        for (const p of people) {
          // Skip entries with no email and no phone
          if (!p.email && !p.phone) continue;

          console.log("INSERTING PERSON", p, "WITH USER", userId, "AND COMPANY", companyId);

          const { data, error } = await supabase
            .from('people')
            .insert({
              company_id: companyId,
              first_name: p.first_name,
              last_name: p.last_name,
              full_name: p.first_name && p.last_name
                ? `${p.first_name} ${p.last_name}`
                : p.first_name || p.last_name || null,
              email: p.email,
              phone: p.phone,
              role: p.role || 'Unknown',
              source: 'apify-website-contacts',
              user_id: userId,
            })
            .select();

          console.log("SUPABASE INSERT RESULT", { data, error });

          if (error) {
            logger.warn({ err: error, email: p.email }, '[people] failed to insert person');
          }
        }

        logger.info({ companyId, companyName, insertedCount: people.length }, '[people] inserted people records');
        return people;
      } catch (error) {
        console.log("DEBUG: enrichCompanyPeople CAUGHT ERROR", error);
        logger.warn(
          { companyId, website, err: error },
          '[people] enrichment failed - continuing without people data',
        );
        return [];
      }
    };

    const { data: searchInsert, error: searchError } = await supabase
      .from('searches')
      .insert({ query_text: query, user_id: user.id })
      .select()
      .single();

    if (searchError || !searchInsert) {
      logger.error({ err: searchError, query }, '[search] failed to insert search row');
      throw new Error(searchError?.message ?? 'Failed to create search');
    }

    // Derive niche key for diversity tracking
    const nicheKey = deriveNicheKey(query);
    logger.info({ query, nicheKey, userId: user.id }, '[search] derived niche key');

    // Get previously seen domains for this user/niche
    const seenDomains = await getSeenDomains(user.id, nicheKey);
    logger.info(
      { nicheKey, seenDomainsCount: seenDomains.size },
      '[search] fetched seen domains for diversity',
    );

    // Get saved company domains to deprioritize in results
    const savedDomains = await getSavedCompanyDomains(user.id);
    logger.info(
      { savedDomainsCount: savedDomains.size },
      '[search] fetched saved company domains for filtering',
    );

    // Discover companies (up to 20 candidates for filtering)
    const allCandidates = await discoverCompanies(query, {
      temperature: 0.3, // Add some randomness for variety
    });

    logger.info(
      {
        query,
        searchId: searchInsert.id,
        totalCandidates: allCandidates.length,
        candidates: allCandidates.map((company) => company.name),
      },
      '[search] discovery results (all candidates)',
    );

    if (allCandidates.length === 0) {
      logger.warn({ query, searchId: searchInsert.id }, '[search] no companies discovered');
      return res.status(200).json({
        searchId: searchInsert.id,
        global_opportunities: 'No companies found for this query yet.',
        companies: [],
      });
    }

    // Select diverse companies, prioritizing unseen and unsaved ones
    const { selected: discovered, stats: diversityStats } = selectDiverseCompanies(
      allCandidates,
      seenDomains,
      DEFAULT_RESULT_COUNT,
      true, // Enable randomness
      savedDomains, // Filter out saved companies when possible
    );

    logger.info(
      {
        query,
        searchId: searchInsert.id,
        nicheKey,
        diversityStats,
        selectedCompanies: discovered.map((c) => c.name),
      },
      '[search] diversity selection complete',
    );

    const processedCompanies: ProcessedCompany[] = [];
    const failedCompanyRecords: Array<Record<string, unknown>> = [];

    const processCompany = async (company: (typeof discovered)[number]) => {
      try {
        // Check cache first for this domain
        const website = company.website || '';
        const cachedExtraction = getCachedExtraction(website);
        let extracted: ExtractedCompany;

        if (cachedExtraction) {
          logger.info(
            { company: company.name, website: company.website },
            '[search] using cached extraction',
          );
          // Use cached data but update name/website to match current company
          extracted = {
            ...cachedExtraction,
            name: company.name,
            website: website,
          };
        } else {
          // No cache - scrape and extract
          const scrapeResult = await scrapeCompanySite(website);

          if (scrapeResult.pages.length === 0) {
            const errorMessage = 'No content could be scraped from the site';
            logger.warn(
              {
                company: company.name,
                website: company.website,
                searchId: searchInsert.id,
                errors: scrapeResult.errors,
              },
              '[search] empty scrape result',
            );
            throw new Error(errorMessage);
          }

          // Truncate content more aggressively for faster Claude calls
          const combinedText = scrapeResult.pages
            .map((page) => `[${page.type.toUpperCase()}]\n${page.text}`)
            .join('\n\n')
            .slice(0, 15_000); // Reduced from 20k to 15k

          extracted = await extractCompanyInsights({
            companyName: company.name,
            website: website,
            combinedText,
          });

          // Cache the extraction for future use
          setCachedExtraction(website, extracted);
        }

        logger.info(
          {
            company: company.name,
            website: company.website,
            searchId: searchInsert.id,
            acquisitionFitScore: extracted.acquisition_fit_score,
            primaryIndustry: extracted.primary_industry,
            hasSummary: Boolean(extracted.summary),
            cached: Boolean(cachedExtraction),
          },
          '[search] extraction successful',
        );

        const savedCompany = await saveExtractedCompany({
          userId: user.id,
          searchId: searchInsert.id,
          verticalQuery: query,
          extracted,
          description: company.description,
          industry: company.industry,
          country: company.country,
        });

        // Run enrichment in background - do not await
        void enrichCompanyPeople(savedCompany.id, savedCompany.name, savedCompany.website, user.id);

        processedCompanies.push({
          name: company.name,
          website: website,
          status: 'success',
          description: company.description,
          industry: company.industry,
          country: company.country,
          extracted,
        });

      } catch (error) {
        const websiteFallback = company.website || '';
        processedCompanies.push({
          name: company.name,
          website: websiteFallback,
          status: 'failed',
          description: company.description,
        });

        failedCompanyRecords.push({
          user_id: user.id,
          search_id: searchInsert.id,
          name: company.name,
          website: websiteFallback,
          vertical_query: query,
          raw_json: {
            description: company.description,
            error: (error as Error).message,
          },
          acquisition_fit_score: null,
          acquisition_fit_reason: null,
          summary: null,
          status: 'failed',
          primary_industry: null,
          secondary_industry: null,
          product_offering: null,
          customer_segment: null,
          tech_stack: null,
          estimated_headcount: null,
          hq_location: null,
          pricing_model: null,
          strengths: null,
          risks: null,
          opportunities: null,
          top_competitors: null,
          has_summary: false,
        });

        logger.error(
          {
            err: error,
            companyName: company.name,
            website: company.website,
            searchId: searchInsert.id,
          },
          'Failed to process company during search',
        );
      }
    };

    const concurrency = 5;
    for (let i = 0; i < discovered.length; i += concurrency) {
      const batch = discovered.slice(i, i + concurrency);
      await Promise.all(batch.map((company) => processCompany(company)));
    }

    // Batch insert failed companies (non-blocking)
    if (failedCompanyRecords.length > 0) {
      void supabase.from('companies').insert(failedCompanyRecords).then(({ error: insertError }) => {
        if (insertError) {
          logger.error(
            { err: insertError, searchId: searchInsert.id },
            'Failed to persist failed company records',
          );
        } else {
          logger.info(
            { searchId: searchInsert.id, insertedCount: failedCompanyRecords.length },
            'Persisted failed company records',
          );
        }
      });
    }

    // Generate global opportunities in background - don't block response
    void (async () => {
      try {
        const globalOpportunities = await generateGlobalOpportunities({
          query,
          companies: processedCompanies.map((company) => ({
            name: company.name,
            description: company.description,
          })),
        });

        await supabase
          .from('searches')
          .update({ global_opportunities: globalOpportunities })
          .eq('id', searchInsert.id);

        logger.info({ searchId: searchInsert.id }, '[search] global opportunities saved');
      } catch (err) {
        logger.error({ err, searchId: searchInsert.id }, '[search] failed to generate global opportunities');
      }
    })();

    const { data: companyRows, error: selectError } = await supabase
      .from('companies')
      .select('*')
      .eq('search_id', searchInsert.id)
      .order('created_at', { ascending: true });

    if (selectError) {
      logger.error({ err: selectError, searchId: searchInsert.id }, '[search] select failed');
      throw new Error(selectError.message);
    }

    const companiesWithSummary = (companyRows ?? []).map((row) =>
      transformCompanyForApi(row as DatabaseCompany),
    );

    // Record the companies shown to this user for this niche (non-blocking)
    void recordSeenCompanies(
      user.id,
      nicheKey,
      companiesWithSummary.map((c) => ({ website: c.website })),
    ).catch((err) => {
      logger.warn({ err, nicheKey, userId: user.id }, '[search] failed to record seen companies');
    });

    const totalDurationMs = Date.now() - searchStartTime;

    logger.info(
      {
        searchId: searchInsert.id,
        returnedCompanies: companiesWithSummary.length,
        totalDurationMs,
        durationSec: (totalDurationMs / 1000).toFixed(2),
        nicheKey,
        diversityStats,
      },
      '[search] returning companies',
    );

    // Log sample company structure for verification
    if (companiesWithSummary.length > 0) {
      const sample = companiesWithSummary[0];
      logger.debug(
        {
          sampleCompany: {
            name: sample.name,
            hasSummary: Boolean(sample.summary),
            hasAcquisitionFitScore: typeof sample.acquisition_fit_score === 'number',
            hasRawJson: Boolean(sample.raw_json),
            rawJsonKeys: sample.raw_json ? Object.keys(sample.raw_json) : [],
          },
        },
        '[search] sample company structure',
      );
    }

    res.status(200).json({
      searchId: searchInsert.id,
      global_opportunities: 'Generating insights...', // Placeholder - will be updated async
      companies: companiesWithSummary,
    });
  } catch (error) {
    logger.error({ err: error }, '[search] unhandled error');
    next(error);
  }
});

searchRouter.get('/search/:searchId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) throw new Error('User not authenticated');

    const { searchId } = searchIdParamSchema.parse(req.params);

    const { data: searchRow, error: searchError } = await supabase
      .from('searches')
      .select('*')
      .eq('id', searchId)
      .eq('user_id', user.id)
      .single();

    if (searchError || !searchRow) {
      return res.status(404).json({ message: 'Search not found' });
    }

    const { data: companyRows, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('search_id', searchId)
      .eq('user_id', user.id)
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

/**
 * GET /api/searches/:searchId/details
 * Returns a search with all its companies and people for each company
 */
searchRouter.get('/searches/:searchId/details', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) throw new Error('User not authenticated');

    const { searchId } = searchIdParamSchema.parse(req.params);

    logger.info({ searchId, userId: user.id }, '[search] fetching search details with companies and people');

    // Fetch the search row
    const { data: searchRow, error: searchError } = await supabase
      .from('searches')
      .select('id, query_text, created_at')
      .eq('id', searchId)
      .eq('user_id', user.id)
      .single();

    if (searchError || !searchRow) {
      logger.warn({ searchId, userId: user.id, err: searchError }, '[search] search not found');
      return res.status(404).json({ message: 'Search not found' });
    }

    // Fetch all companies for this search
    const { data: companyRows, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('search_id', searchId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (companyError) {
      logger.error({ searchId, err: companyError }, '[search] failed to fetch companies');
      throw new Error(companyError.message);
    }

    const companies = companyRows ?? [];
    const companyIds = companies.map((c) => c.id);

    // Fetch all people for these companies
    let peopleByCompany: Record<string, any[]> = {};

    if (companyIds.length > 0) {
      const { data: peopleRows, error: peopleError } = await supabase
        .from('people')
        .select('id, company_id, full_name, first_name, last_name, role, email, phone, source, is_ceo, is_founder, is_executive')
        .in('company_id', companyIds)
        .eq('user_id', user.id)
        .order('full_name', { ascending: true });

      if (peopleError) {
        logger.warn({ searchId, err: peopleError }, '[search] failed to fetch people - continuing without');
      } else {
        // Group people by company_id
        for (const person of peopleRows ?? []) {
          if (!peopleByCompany[person.company_id]) {
            peopleByCompany[person.company_id] = [];
          }
          peopleByCompany[person.company_id].push(person);
        }
      }
    }

    // Transform companies and attach people
    const companiesWithPeople = companies.map((row) => {
      const transformed = transformCompanyForApi(row as DatabaseCompany);
      return {
        ...transformed,
        people: peopleByCompany[row.id] ?? [],
      };
    });

    logger.info(
      { searchId, companyCount: companiesWithPeople.length },
      '[search] returning search details',
    );

    res.json({
      search: {
        id: searchRow.id,
        query: searchRow.query_text,
        created_at: searchRow.created_at,
      },
      companies: companiesWithPeople,
    });
  } catch (error) {
    logger.error({ err: error }, '[search] error fetching search details');
    next(error);
  }
});

searchRouter.get('/search-history', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) throw new Error('User not authenticated');

    const { data: searchRows, error: searchError } = await supabase
      .from('searches')
      .select('id, query_text, created_at')
      .eq('user_id', user.id)
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
        .in('search_id', searchIds)
        .eq('user_id', user.id);

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

    logger.info(
      { userId: user.id, historyCount: historyItems.length },
      '[search-history] returning search history'
    );

    res.json(historyItems);
  } catch (error) {
    const authReq = req as AuthenticatedRequest;
    logger.error({ err: error, userId: authReq.user?.id }, '[search-history] error fetching history');
    next(error);
  }
});

