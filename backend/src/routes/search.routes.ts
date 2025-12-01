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

interface ProcessedCompany {
  name: string;
  website: string;
  status: 'success' | 'failed';
  reason: string;
  extracted?: ExtractedCompany;
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
      const extractedStatus = (company.extracted as { status?: string } | undefined)?.status;
      const status = extractedStatus ?? company.status ?? 'success';

      return {
        search_id: searchInsert.id,
        name: company.extracted?.name ?? company.name,
        website: company.extracted?.website ?? company.website,
        vertical_query: query,
        raw_json: company as unknown as Record<string, unknown>,
        acquisition_fit_score: acquisitionFitScore,
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

    res.status(200).json({
      searchId: searchInsert.id,
      global_opportunities: globalOpportunities,
      companies: companyRows ?? [],
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

    res.json({
      searchId: searchRow.id,
      global_opportunities: searchRow.global_opportunities,
      companies: companyRows ?? [],
    });
  } catch (error) {
    next(error);
  }
});

