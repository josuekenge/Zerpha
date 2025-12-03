import { type Request, type Response, type NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { logger } from '../logger.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Missing authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      logger.warn({ err: error }, 'Invalid auth token');
      return res.status(401).json({ message: 'Invalid token' });
    }

    (req as AuthenticatedRequest).user = {
      id: data.user.id,
      email: data.user.email,
    };

    next();
  } catch (error) {
    logger.error({ err: error }, 'Auth middleware error');
    res.status(500).json({ message: 'Internal server error' });
  }
}




