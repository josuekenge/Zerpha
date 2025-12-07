import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';

import { supabase } from '../config/supabase.js';
import { logger } from '../logger.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { extractDomain, type DatabaseCompany } from './search.routes.js';

// Query schema for insights filters
const insightsQuerySchema = z.object({
    minScore: z.number().optional(),
    maxScore: z.number().optional(),
    industry: z.string().optional(),
    location: z.string().optional(),
});

// Response types
interface CompanyTarget {
    id: string;
    name: string;
    domain: string;
    industry: string;
    fitScore: number;
    digScore: number;
}

interface IndustryBreakdown {
    industry: string;
    count: number;
    averageFitScore: number;
    averageDigScore: number;
}

interface InsightsResponse {
    totalCompanies: number;
    averageFitScore: number | null;
    averageDigScore: number | null;
    byIndustry: IndustryBreakdown[];
    topTargets: CompanyTarget[];
    hiddenGems: CompanyTarget[];
}

export const insightsRouter = Router();

insightsRouter.get('/insights/companies', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        if (!user) throw new Error('User not authenticated');

        // Parse query parameters
        const normalizedQuery = {
            minScore:
                typeof req.query.minScore === 'string' && req.query.minScore.length > 0
                    ? Number(req.query.minScore)
                    : undefined,
            maxScore:
                typeof req.query.maxScore === 'string' && req.query.maxScore.length > 0
                    ? Number(req.query.maxScore)
                    : undefined,
            industry:
                typeof req.query.industry === 'string' && req.query.industry.trim().length > 0
                    ? req.query.industry.trim()
                    : undefined,
            location:
                typeof req.query.location === 'string' && req.query.location.trim().length > 0
                    ? req.query.location.trim()
                    : undefined,
        };

        const parsedQuery = insightsQuerySchema.parse(normalizedQuery);

        // Build query for saved companies
        let query = supabase
            .from('companies')
            .select('*')
            .eq('is_saved', true)
            .eq('user_id', user.id);

        // Apply filters
        if (typeof parsedQuery.minScore === 'number' && !Number.isNaN(parsedQuery.minScore)) {
            query = query.gte('acquisition_fit_score', parsedQuery.minScore);
        }

        if (typeof parsedQuery.maxScore === 'number' && !Number.isNaN(parsedQuery.maxScore)) {
            query = query.lte('acquisition_fit_score', parsedQuery.maxScore);
        }

        if (parsedQuery.industry && parsedQuery.industry !== 'all') {
            query = query.eq('primary_industry', parsedQuery.industry);
        }

        if (parsedQuery.location) {
            query = query.ilike('hq_location', `%${parsedQuery.location}%`);
        }

        const { data, error } = await query;

        if (error) {
            logger.error({ err: error, filters: parsedQuery, userId: user.id }, '[insights] Failed to fetch companies');
            throw new Error(error.message);
        }

        const companies = (data ?? []) as DatabaseCompany[];

        // If no companies, return empty response
        if (companies.length === 0) {
            const emptyResponse: InsightsResponse = {
                totalCompanies: 0,
                averageFitScore: null,
                averageDigScore: null,
                byIndustry: [],
                topTargets: [],
                hiddenGems: [],
            };
            return res.json(emptyResponse);
        }

        // Calculate total and averages
        const totalCompanies = companies.length;

        const fitScores = companies
            .map(c => c.acquisition_fit_score)
            .filter((s): s is number => typeof s === 'number' && !Number.isNaN(s));

        const averageFitScore = fitScores.length > 0
            ? Math.round((fitScores.reduce((a, b) => a + b, 0) / fitScores.length) * 10) / 10
            : null;

        // Using fit score as dig score (per user's choice - option A)
        const averageDigScore = averageFitScore;

        // Calculate by industry
        const industryMap = new Map<string, { count: number; scores: number[] }>();
        for (const company of companies) {
            const industry = company.primary_industry || 'Unknown';
            const current = industryMap.get(industry) || { count: 0, scores: [] };
            current.count++;
            if (typeof company.acquisition_fit_score === 'number') {
                current.scores.push(company.acquisition_fit_score);
            }
            industryMap.set(industry, current);
        }

        const byIndustry: IndustryBreakdown[] = Array.from(industryMap.entries())
            .map(([industry, data]) => ({
                industry,
                count: data.count,
                averageFitScore: data.scores.length > 0
                    ? Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 10) / 10
                    : 0,
                averageDigScore: data.scores.length > 0
                    ? Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 10) / 10
                    : 0,
            }))
            .sort((a, b) => b.count - a.count);

        // Helper to map company to target format
        const mapToTarget = (company: DatabaseCompany): CompanyTarget => ({
            id: company.id,
            name: company.name,
            domain: extractDomain(company.website),
            industry: company.primary_industry || 'Unknown',
            fitScore: company.acquisition_fit_score ?? 0,
            digScore: company.acquisition_fit_score ?? 0, // Using fit score as dig score
        });

        // Top targets: top 10 by fit score
        const topTargets = [...companies]
            .filter(c => typeof c.acquisition_fit_score === 'number')
            .sort((a, b) => (b.acquisition_fit_score ?? 0) - (a.acquisition_fit_score ?? 0))
            .slice(0, 10)
            .map(mapToTarget);

        // Hidden gems: fit 6-8, dig >= 8 (using fit for both)
        // Since dig = fit, this means fit between 6-8 AND fit >= 8, which is just fit = 8
        // Relaxing to: fit between 6.0 and 8.0 inclusive
        const hiddenGems = [...companies]
            .filter(c => {
                const score = c.acquisition_fit_score ?? 0;
                return score >= 6.0 && score <= 8.0;
            })
            .sort((a, b) => (b.acquisition_fit_score ?? 0) - (a.acquisition_fit_score ?? 0))
            .slice(0, 10)
            .map(mapToTarget);

        const response: InsightsResponse = {
            totalCompanies,
            averageFitScore,
            averageDigScore,
            byIndustry,
            topTargets,
            hiddenGems,
        };

        logger.info(
            { userId: user.id, totalCompanies, filters: parsedQuery },
            '[insights] returning company insights'
        );

        res.json(response);
    } catch (error) {
        logger.error({ err: error }, '[insights] error fetching insights');
        res.status(500).json({ error: 'Failed to load insights' });
    }
});
