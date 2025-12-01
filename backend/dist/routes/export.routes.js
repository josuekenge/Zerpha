import { Router } from 'express';
import { z } from 'zod';
import { generateInfographicForCompany } from '../services/reportService.js';
import { logger } from '../logger.js';
const exportRequestSchema = z.object({
    companyId: z.string().uuid(),
});
export const exportRouter = Router();
exportRouter.post('/export-report', async (req, res) => {
    const parsed = exportRequestSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: 'companyId is required' });
    }
    try {
        const result = await generateInfographicForCompany(parsed.data.companyId);
        res.status(200).json(result);
    }
    catch (error) {
        logger.error({ err: error, body: req.body }, 'Failed to generate infographic report');
        res.status(500).json({ message: 'Failed to generate report' });
    }
});
