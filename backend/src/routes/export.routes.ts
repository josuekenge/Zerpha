import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';

import { generateInfographicForCompany } from '../services/reportService.js';
import { logger } from '../logger.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

const exportRequestSchema = z.object({
  companyId: z.string().uuid(),
});

export const exportRouter = Router();

exportRouter.post('/export-report', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  const parsed = exportRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'companyId is required' });
  }

  try {
    const result = await generateInfographicForCompany(parsed.data.companyId, user.id);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'INFOPGRAPHIC_PROVIDER_UNAVAILABLE') {
      logger.warn(
        { err: error, companyId: parsed.data.companyId },
        'Infographic provider unavailable',
      );
      return res.status(503).json({ message: 'infographic_provider_unavailable' });
    }

    logger.error({ err: error, body: req.body }, 'Failed to generate infographic report');
    if (error instanceof Error && error.message === 'Gemini failed to produce infographic JSON') {
      return res.status(502).json({ message: 'gemini_failed_to_generate' });
    }
    res.status(500).json({ message: 'Failed to generate report' });
  }
});

