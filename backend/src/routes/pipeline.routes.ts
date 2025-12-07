import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';

import { supabase } from '../config/supabase.js';
import { logger } from '../logger.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { extractDomain, type DatabaseCompany } from './search.routes.js';

// Pipeline stage enum
const PIPELINE_STAGES = ['new', 'researching', 'contacted', 'in_diligence', 'closed'] as const;
type PipelineStage = typeof PIPELINE_STAGES[number];

// Stage labels for display
const STAGE_LABELS: Record<PipelineStage, string> = {
    new: 'New',
    researching: 'Researching',
    contacted: 'Contacted',
    in_diligence: 'In Diligence',
    closed: 'Closed',
};

// Request body schema for updating pipeline
const updatePipelineSchema = z.object({
    pipelineStage: z.enum(PIPELINE_STAGES).nullable().optional(),
    notesTitle: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
});

// Company in pipeline response
interface PipelineCompany {
    id: string;
    name: string;
    domain: string;
    industry: string | null;
    fitScore: number | null;
    digScore: number | null;
    faviconUrl: string | null;
    notesTitle: string | null;
    notes: string | null;
    notesUpdatedAt: string | null;
}

// Stage with companies
interface PipelineStageData {
    id: PipelineStage;
    label: string;
    companies: PipelineCompany[];
}

// Full pipeline response
interface PipelineResponse {
    stages: PipelineStageData[];
}

export const pipelineRouter = Router();

/**
 * GET /pipeline
 * Returns all saved companies grouped by pipeline stage
 */
pipelineRouter.get('/pipeline', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        if (!user) throw new Error('User not authenticated');

        // Fetch all saved companies for this user
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('is_saved', true)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            logger.error({ err: error, userId: user.id }, '[pipeline] Failed to fetch pipeline companies');
            throw new Error(error.message);
        }

        const companies = (data ?? []) as (DatabaseCompany & {
            pipeline_notes?: string | null;
            pipeline_notes_title?: string | null;
            pipeline_notes_updated_at?: string | null;
        })[];

        // Group companies by pipeline stage
        const stageMap = new Map<PipelineStage, PipelineCompany[]>();
        for (const stage of PIPELINE_STAGES) {
            stageMap.set(stage, []);
        }

        for (const company of companies) {
            // Treat NULL or undefined as 'new'
            const stage = (company.pipeline_stage as PipelineStage) || 'new';
            const mapped: PipelineCompany = {
                id: company.id,
                name: company.name,
                domain: extractDomain(company.website),
                industry: company.primary_industry ?? null,
                fitScore: company.acquisition_fit_score ?? null,
                digScore: company.acquisition_fit_score ?? null,
                faviconUrl: company.favicon_url ?? null,
                notesTitle: company.pipeline_notes_title ?? null,
                notes: company.pipeline_notes ?? null,
                notesUpdatedAt: company.pipeline_notes_updated_at ?? null,
            };
            stageMap.get(stage)?.push(mapped);
        }

        // Build response
        const response: PipelineResponse = {
            stages: PIPELINE_STAGES.map(stageId => ({
                id: stageId,
                label: STAGE_LABELS[stageId],
                companies: stageMap.get(stageId) ?? [],
            })),
        };

        logger.info(
            { userId: user.id, totalCompanies: companies.length },
            '[pipeline] returning pipeline data'
        );

        res.json(response);
    } catch (error) {
        logger.error({ err: error }, '[pipeline] error fetching pipeline');
        next(error);
    }
});

/**
 * GET /pipeline/:companyId
 * Get a single company's pipeline details
 */
pipelineRouter.get('/pipeline/:companyId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        if (!user) throw new Error('User not authenticated');

        const companyId = req.params.companyId;

        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('id', companyId)
            .eq('user_id', user.id)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Company not found' });
        }

        const company = data as DatabaseCompany & {
            pipeline_notes?: string | null;
            pipeline_notes_title?: string | null;
            pipeline_notes_updated_at?: string | null;
        };

        res.json({
            id: company.id,
            name: company.name,
            domain: extractDomain(company.website),
            website: company.website,
            industry: company.primary_industry ?? null,
            fitScore: company.acquisition_fit_score ?? null,
            digScore: company.acquisition_fit_score ?? null,
            faviconUrl: company.favicon_url ?? null,
            summary: company.summary ?? null,
            headquarters: company.hq_location ?? null,
            headcount: company.estimated_headcount ?? null,
            pipelineStage: company.pipeline_stage ?? 'new',
            notesTitle: company.pipeline_notes_title ?? null,
            notes: company.pipeline_notes ?? null,
            notesUpdatedAt: company.pipeline_notes_updated_at ?? null,
        });
    } catch (error) {
        logger.error({ err: error }, '[pipeline] error fetching company detail');
        next(error);
    }
});

/**
 * PATCH /pipeline/:companyId
 * Update a company's pipeline stage and/or notes
 */
pipelineRouter.patch('/pipeline/:companyId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        if (!user) throw new Error('User not authenticated');

        const companyId = req.params.companyId;
        if (!companyId) {
            return res.status(400).json({ error: 'Company ID is required' });
        }

        // Validate request body
        const parseResult = updatePipelineSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({ error: 'Invalid request body', details: parseResult.error.errors });
        }

        const { pipelineStage, notesTitle, notes } = parseResult.data;

        // Build update object
        const updates: Record<string, unknown> = {};
        if (pipelineStage !== undefined) {
            updates.pipeline_stage = pipelineStage;
        }
        if (notesTitle !== undefined) {
            updates.pipeline_notes_title = notesTitle;
        }
        if (notes !== undefined) {
            updates.pipeline_notes = notes;
            updates.pipeline_notes_updated_at = new Date().toISOString();
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        // Update the company
        const { data, error } = await supabase
            .from('companies')
            .update(updates)
            .eq('id', companyId)
            .eq('user_id', user.id)
            .select('id, pipeline_stage, pipeline_notes, pipeline_notes_title, pipeline_notes_updated_at')
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Company not found' });
            }
            logger.error({ err: error, companyId, updates }, '[pipeline] Failed to update pipeline');
            return res.status(500).json({ error: 'Failed to update pipeline' });
        }

        if (!data) {
            return res.status(404).json({ error: 'Company not found' });
        }

        logger.info(
            { userId: user.id, companyId, updates },
            '[pipeline] updated company pipeline'
        );

        res.json({
            id: data.id,
            pipelineStage: data.pipeline_stage,
            notesTitle: data.pipeline_notes_title,
            notes: data.pipeline_notes,
            notesUpdatedAt: data.pipeline_notes_updated_at,
        });
    } catch (error) {
        logger.error({ err: error }, '[pipeline] error updating pipeline');
        res.status(500).json({ error: 'Failed to update pipeline' });
    }
});
