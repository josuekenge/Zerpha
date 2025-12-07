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

// Request body schema for updating pipeline stage
const updatePipelineStageSchema = z.object({
    pipelineStage: z.enum(PIPELINE_STAGES).nullable(),
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

        const companies = (data ?? []) as DatabaseCompany[];

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
                digScore: company.acquisition_fit_score ?? null, // Using fit score as dig score
                faviconUrl: company.favicon_url ?? null,
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
 * PATCH /pipeline/:companyId
 * Update a company's pipeline stage
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
        const parseResult = updatePipelineStageSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({ error: 'Invalid pipeline stage', details: parseResult.error.errors });
        }

        const { pipelineStage } = parseResult.data;

        // Update the company's pipeline stage
        const { data, error } = await supabase
            .from('companies')
            .update({ pipeline_stage: pipelineStage })
            .eq('id', companyId)
            .eq('user_id', user.id)
            .select('id, pipeline_stage')
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Company not found' });
            }
            logger.error({ err: error, companyId, pipelineStage }, '[pipeline] Failed to update pipeline stage');
            return res.status(500).json({ error: 'Failed to update pipeline stage' });
        }

        if (!data) {
            return res.status(404).json({ error: 'Company not found' });
        }

        logger.info(
            { userId: user.id, companyId, pipelineStage },
            '[pipeline] updated company pipeline stage'
        );

        res.json({
            id: data.id,
            pipelineStage: data.pipeline_stage,
        });
    } catch (error) {
        logger.error({ err: error }, '[pipeline] error updating pipeline stage');
        res.status(500).json({ error: 'Failed to update pipeline stage' });
    }
});
