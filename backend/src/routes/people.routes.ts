import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';

import { supabase } from '../config/supabase.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { logger } from '../logger.js';
import type { Person } from '../types/people.js';

const peopleRouter = Router();

const companyIdSchema = z.object({
  id: z.string().uuid(),
});

/**
 * GET /api/companies/:id/people
 * Returns all people associated with a company, filtered by user_id for RLS
 */
peopleRouter.get(
  '/companies/:id/people',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { id: companyId } = companyIdSchema.parse(req.params);

      logger.debug({ companyId, userId: user.id }, '[people] fetching people for company');

      // Verify company exists and belongs to user
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id, user_id')
        .eq('id', companyId)
        .eq('user_id', user.id)
        .single();

      if (companyError || !company) {
        logger.warn(
          { companyId, userId: user.id, err: companyError },
          '[people] company not found or not owned by user',
        );
        return res.status(404).json({ message: 'Company not found' });
      }

      // Fetch people for this company, filtered by user_id
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('company_id', companyId)
        .eq('user_id', user.id)
        .order('full_name', { ascending: true });

      if (error) {
        logger.error(
          { companyId, userId: user.id, err: error },
          '[people] failed to fetch people',
        );
        throw new Error(error.message);
      }

      logger.info(
        { companyId, userId: user.id, count: (data ?? []).length },
        '[people] returning people',
      );

      res.json((data ?? []) as Person[]);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/people
 * Returns all people for the authenticated user across all companies
 */
peopleRouter.get(
  '/people',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      logger.debug({ userId: user.id }, '[people] fetching all people for user');

      // Fetch all people for this user, joined with company name
      const { data, error } = await supabase
        .from('people')
        .select(`
          *,
          companies:company_id (
            id,
            name,
            website
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error(
          { userId: user.id, err: error },
          '[people] failed to fetch all people',
        );
        throw new Error(error.message);
      }

      logger.info(
        { userId: user.id, count: (data ?? []).length },
        '[people] returning all people',
      );

      // Transform to include company info at top level
      const transformed = (data ?? []).map((person) => ({
        ...person,
        company_name: person.companies?.name ?? null,
        company_website: person.companies?.website ?? null,
      }));

      res.json(transformed);
    } catch (error) {
      next(error);
    }
  },
);

export { peopleRouter };

