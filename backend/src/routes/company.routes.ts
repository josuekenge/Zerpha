import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';

import { supabase } from '../config/supabase.js';
import { logger } from '../logger.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import {
  savedCompanySchema,
  type DatabaseCompany,
  type SavedCompany,
  transformCompanyForApi,
  pickStringField,
  deriveCategory,
  extractDomain,
  deriveFitBand,
} from './search.routes.js';

const savedCompaniesQuerySchema = z.object({
  category: z.string().min(1).optional(),
  searchId: z.string().uuid().optional(),
  minScore: z.number().optional(),
  maxScore: z.number().optional(),
});

const companyIdParamSchema = z.object({
  companyId: z.string().uuid(),
});

const saveCompanyBodySchema = z.object({
  category: z.string().trim().min(1).optional(),
});

export const companyRouter = Router();

companyRouter.get('/companies', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) throw new Error('User not authenticated');

    const normalizedQuery = {
      category:
        typeof req.query.category === 'string' && req.query.category.trim().length > 0
          ? req.query.category.trim()
          : undefined,
      searchId:
        typeof req.query.searchId === 'string' && req.query.searchId.length > 0
          ? req.query.searchId
          : undefined,
      minScore:
        typeof req.query.minScore === 'string' && req.query.minScore.length > 0
          ? Number(req.query.minScore)
          : undefined,
      maxScore:
        typeof req.query.maxScore === 'string' && req.query.maxScore.length > 0
          ? Number(req.query.maxScore)
          : undefined,
    };

    const parsedQuery = savedCompaniesQuerySchema.parse(normalizedQuery);

    let query = supabase
      .from('companies')
      .select('*')
      .eq('is_saved', true)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (parsedQuery.category) {
      query = query.eq('saved_category', parsedQuery.category);
    }

    if (parsedQuery.searchId) {
      query = query.eq('search_id', parsedQuery.searchId);
    }

    if (typeof parsedQuery.minScore === 'number' && !Number.isNaN(parsedQuery.minScore)) {
      query = query.gte('acquisition_fit_score', parsedQuery.minScore);
    }

    if (typeof parsedQuery.maxScore === 'number' && !Number.isNaN(parsedQuery.maxScore)) {
      query = query.lte('acquisition_fit_score', parsedQuery.maxScore);
    }

    const { data, error } = await query.limit(200);

    if (error) {
      logger.error({ err: error, query: parsedQuery, userId: user.id }, 'Failed to fetch saved companies');
      throw new Error(error.message);
    }

    const mapped = savedCompanySchema.array().parse(
      (data ?? []).map((row) => mapToSavedCompany(row as DatabaseCompany)),
    );

    logger.info(
      { userId: user.id, companyCount: mapped.length, filters: parsedQuery },
      '[companies] returning saved companies'
    );

    res.json(mapped);
  } catch (error) {
    const authReq = req as AuthenticatedRequest;
    logger.error({ err: error, userId: authReq.user?.id }, '[companies] error fetching saved companies');
    next(error);
  }
});

const createCompanyBodySchema = z.object({
  name: z.string().min(1),
  domain: z.string().optional(),
  description: z.string().optional(),
  headquarters: z.string().optional(),
  linkedin_url: z.string().optional(),
});

companyRouter.post('/companies', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) throw new Error('User not authenticated');

    const body = createCompanyBodySchema.parse(req.body);

    const { data, error } = await supabase
      .from('companies')
      .insert({
        user_id: user.id,
        name: body.name,
        website: body.domain,
        summary: body.description,
        raw_json: {
          hq_location: body.headquarters,
          linkedin_url: body.linkedin_url,
          short_description: body.description,
        },
        is_saved: true, // Auto-save created companies
        saved_category: 'manual',
        acquisition_fit_score: 0, // Default
      })
      .select('*')
      .single();

    if (error) {
      logger.error({ err: error, body }, 'Failed to create company');
      throw new Error(error.message);
    }

    const payload = mapToSavedCompany(data as DatabaseCompany);
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

companyRouter.post('/companies/:companyId/save', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) throw new Error('User not authenticated');

    const { companyId } = companyIdParamSchema.parse(req.params);
    const { category } = saveCompanyBodySchema.parse(req.body ?? {});

    const updates = {
      is_saved: true,
      saved_category: category ?? null,
    };

    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', companyId)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) {
      logger.error({ err: error, companyId }, 'Failed to save company');
      throw new Error(error.message);
    }

    if (!data) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const payload = mapToSavedCompany(data as DatabaseCompany);
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

companyRouter.post('/companies/:companyId/unsave', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) throw new Error('User not authenticated');

    const { companyId } = companyIdParamSchema.parse(req.params);

    const { data, error } = await supabase
      .from('companies')
      .update({ is_saved: false, saved_category: null })
      .eq('id', companyId)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) {
      logger.error({ err: error, companyId }, 'Failed to unsave company');
      throw new Error(error.message);
    }

    if (!data) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const transformed = transformCompanyForApi(data as DatabaseCompany);
    res.json({
      id: transformed.id,
      is_saved: transformed.is_saved,
      saved_category: transformed.saved_category,
    });
  } catch (error) {
    next(error);
  }
});

function mapToSavedCompany(row: DatabaseCompany): SavedCompany {
  const apiCompany = transformCompanyForApi(row);
  const category = apiCompany.saved_category ?? deriveCategory(apiCompany);

  return {
    id: apiCompany.id,
    search_id: apiCompany.search_id,
    name: apiCompany.name,
    domain: extractDomain(apiCompany.website),
    fitScore: apiCompany.acquisition_fit_score,
    category,
    summary: apiCompany.summary,
    headquarters: pickStringField(apiCompany.raw_json, 'hq_location'),
    headcount: pickStringField(apiCompany.raw_json, 'estimated_headcount'),
    techStack: pickStringField(apiCompany.raw_json, 'tech_stack'),
    fit_band: deriveFitBand(apiCompany.acquisition_fit_score),
    is_saved: apiCompany.is_saved,
    saved_category: apiCompany.saved_category,
    created_at: apiCompany.created_at ?? null,
    raw_json: apiCompany.raw_json,
  };
}

