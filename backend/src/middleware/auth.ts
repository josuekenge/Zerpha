import { type Request, type Response, type NextFunction } from 'express';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import { logger } from '../logger.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
  // Workspace context for data isolation
  workspaceId?: string;
}

/**
 * Validates that the user is a member of the specified workspace
 */
async function validateWorkspaceMembership(userId: string, workspaceId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .single();

    // Using service role key, so RLS is bypassed
    return !error && !!data;
  } catch (err) {
    logger.error({ err }, 'Error validating workspace membership');
    return false;
  }
}

/**
 * Gets the user's default workspace (first one they're a member of)
 */
async function getDefaultWorkspaceId(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data.workspace_id;
  } catch (err) {
    logger.error({ err }, 'Error getting default workspace');
    return null;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    logger.error('Supabase not configured - cannot authenticate');
    return res.status(503).json({
      message: 'Service temporarily unavailable',
      error: 'Database not configured'
    });
  }

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

    const authReq = req as AuthenticatedRequest;
    authReq.user = {
      id: data.user.id,
      email: data.user.email,
    };

    // Extract workspace ID from header
    const workspaceIdHeader = req.headers['x-workspace-id'];
    let workspaceId: string | null = null;

    if (workspaceIdHeader && typeof workspaceIdHeader === 'string') {
      // Validate that user has access to this workspace
      const hasAccess = await validateWorkspaceMembership(data.user.id, workspaceIdHeader);
      if (hasAccess) {
        workspaceId = workspaceIdHeader;
      } else {
        logger.warn({ userId: data.user.id, workspaceId: workspaceIdHeader }, 'User does not have access to workspace');
        // Fall back to default workspace instead of rejecting
      }
    }

    // If no valid workspace from header, get user's default workspace
    if (!workspaceId) {
      workspaceId = await getDefaultWorkspaceId(data.user.id);
    }

    // Set workspace context (may be null for users without workspaces - legacy fallback)
    authReq.workspaceId = workspaceId || undefined;

    next();
  } catch (error) {
    logger.error({ err: error }, 'Auth middleware error');
    res.status(500).json({ message: 'Internal server error' });
  }
}
