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
 * Returns all people associated with a company in the active WORKSPACE
 */
peopleRouter.get(
  '/companies/:id/people',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = authReq.user;
      const workspaceId = authReq.workspaceId;

      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      if (!workspaceId) {
        return res.status(400).json({ message: 'No workspace selected' });
      }

      const { id: companyId } = companyIdSchema.parse(req.params);

      logger.debug({ companyId, workspaceId }, '[people] fetching people for company');

      // Verify company exists and belongs to workspace
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('id', companyId)
        .eq('workspace_id', workspaceId)
        .single();

      if (companyError || !company) {
        logger.warn(
          { companyId, workspaceId, err: companyError },
          '[people] company not found in workspace',
        );
        return res.status(404).json({ message: 'Company not found' });
      }

      // Fetch people for this company
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('company_id', companyId)
        .eq('workspace_id', workspaceId)
        .order('full_name', { ascending: true });

      if (error) {
        logger.error(
          { companyId, workspaceId, err: error },
          '[people] failed to fetch people',
        );
        throw new Error(error.message);
      }

      logger.info(
        { companyId, workspaceId, count: (data ?? []).length },
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
 * Returns all people for the active WORKSPACE across all companies
 */
peopleRouter.get(
  '/people',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = authReq.user;
      const workspaceId = authReq.workspaceId;

      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      if (!workspaceId) {
        return res.status(400).json({ message: 'No workspace selected' });
      }

      logger.debug({ workspaceId }, '[people] fetching all people for workspace');

      // Fetch all people for workspace, joined with company name
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
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error(
          { workspaceId, err: error },
          '[people] failed to fetch all people',
        );
        throw new Error(error.message);
      }

      logger.info(
        { workspaceId, count: (data ?? []).length },
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



const createPersonBodySchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.string().optional(),
  company_id: z.string().uuid().optional(),
  linkedin_url: z.string().optional(),
});

/**
 * POST /api/people
 * Create a new person in the active WORKSPACE
 */
peopleRouter.post('/people', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;
    const workspaceId = authReq.workspaceId;

    if (!user) throw new Error('User not authenticated');
    if (!workspaceId) {
      return res.status(400).json({ message: 'No workspace selected' });
    }

    const body = createPersonBodySchema.parse(req.body);

    const { data, error } = await supabase
      .from('people')
      .insert({
        user_id: user.id,  // For attribution
        workspace_id: workspaceId,  // WORKSPACE owns the data
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email || null,
        phone: body.phone,
        role: body.role,
        company_id: body.company_id || null,
        linkedin_url: body.linkedin_url,
        source: 'manual',
      })
      .select('*')
      .single();

    if (error) {
      logger.error({ err: error, body, workspaceId }, 'Failed to create person');
      throw new Error(error.message);
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/people/:id
 * Delete a person from the active WORKSPACE
 */
peopleRouter.delete('/people/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;
    const workspaceId = authReq.workspaceId;

    if (!user) throw new Error('User not authenticated');
    if (!workspaceId) {
      return res.status(400).json({ message: 'No workspace selected' });
    }

    const { id } = req.params;

    const { error } = await supabase
      .from('people')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId);

    if (error) {
      logger.error({ err: error, personId: id, workspaceId }, 'Failed to delete person');
      throw new Error(error.message);
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { peopleRouter };
