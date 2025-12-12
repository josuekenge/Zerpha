import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';

import { supabase } from '../config/supabase.js';
import { logger } from '../logger.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

export const workspaceRouter = Router();

// Zod schemas
const updateMemberRoleSchema = z.object({
    role: z.enum(['owner', 'admin', 'member', 'viewer']),
});

const memberIdParamSchema = z.object({
    memberId: z.string().uuid(),
});

/**
 * Helper: Get current user's role in the active workspace
 */
async function getCurrentUserRole(userId: string, workspaceId: string): Promise<string | null> {
    const { data, error } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .single();

    if (error || !data) return null;
    return data.role;
}

/**
 * Helper: Check if user can manage the workspace (owner or admin)
 */
async function canUserManageWorkspace(userId: string, workspaceId: string): Promise<boolean> {
    const role = await getCurrentUserRole(userId, workspaceId);
    return role === 'owner' || role === 'admin';
}

/**
 * PATCH /api/workspace/members/:memberId/role
 * Update a team member's role
 * Only owners and admins can do this
 */
workspaceRouter.patch(
    '/workspace/members/:memberId/role',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authReq = req as AuthenticatedRequest;
            const user = authReq.user;
            const workspaceId = authReq.workspaceId;

            if (!user) {
                return res.status(401).json({ message: 'Not authenticated' });
            }
            if (!workspaceId) {
                return res.status(400).json({ message: 'No workspace selected' });
            }

            const { memberId } = memberIdParamSchema.parse(req.params);
            const { role: newRole } = updateMemberRoleSchema.parse(req.body);

            // Get current user's role
            const currentUserRole = await getCurrentUserRole(user.id, workspaceId);
            if (!currentUserRole || !['owner', 'admin'].includes(currentUserRole)) {
                return res.status(403).json({ message: 'You do not have permission to update member roles' });
            }

            // Get the target member
            const { data: targetMember, error: targetError } = await supabase
                .from('workspace_members')
                .select('id, user_id, role, email')
                .eq('id', memberId)
                .eq('workspace_id', workspaceId)
                .single();

            if (targetError || !targetMember) {
                return res.status(404).json({ message: 'Member not found in this workspace' });
            }

            // Only owners can change someone to/from owner
            if ((targetMember.role === 'owner' || newRole === 'owner') && currentUserRole !== 'owner') {
                return res.status(403).json({ message: 'Only owners can change owner roles' });
            }

            // Cannot demote yourself from owner if you're the only owner
            if (targetMember.user_id === user.id && targetMember.role === 'owner' && newRole !== 'owner') {
                const { data: owners } = await supabase
                    .from('workspace_members')
                    .select('id')
                    .eq('workspace_id', workspaceId)
                    .eq('role', 'owner');

                if (!owners || owners.length <= 1) {
                    return res.status(400).json({ message: 'Cannot demote yourself. Transfer ownership first.' });
                }
            }

            // Perform the update using service role (bypasses RLS)
            const { data: updatedMember, error: updateError } = await supabase
                .from('workspace_members')
                .update({ role: newRole })
                .eq('id', memberId)
                .eq('workspace_id', workspaceId)
                .select('*')
                .single();

            if (updateError) {
                logger.error({ err: updateError, memberId, workspaceId }, '[workspace] Failed to update member role');
                throw new Error(updateError.message);
            }

            logger.info(
                { memberId, workspaceId, oldRole: targetMember.role, newRole, updatedBy: user.id },
                '[workspace] Member role updated'
            );

            res.json({
                id: updatedMember.id,
                email: updatedMember.email,
                name: updatedMember.name,
                role: updatedMember.role,
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ message: 'Invalid request', errors: error.errors });
            }
            next(error);
        }
    }
);

/**
 * DELETE /api/workspace/members/:memberId
 * Remove a team member from the workspace
 * Only owners and admins can do this
 */
workspaceRouter.delete(
    '/workspace/members/:memberId',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authReq = req as AuthenticatedRequest;
            const user = authReq.user;
            const workspaceId = authReq.workspaceId;

            if (!user) {
                return res.status(401).json({ message: 'Not authenticated' });
            }
            if (!workspaceId) {
                return res.status(400).json({ message: 'No workspace selected' });
            }

            const { memberId } = memberIdParamSchema.parse(req.params);

            // Get current user's role
            const currentUserRole = await getCurrentUserRole(user.id, workspaceId);
            if (!currentUserRole || !['owner', 'admin'].includes(currentUserRole)) {
                return res.status(403).json({ message: 'You do not have permission to remove members' });
            }

            // Get the target member
            const { data: targetMember, error: targetError } = await supabase
                .from('workspace_members')
                .select('id, user_id, role, email')
                .eq('id', memberId)
                .eq('workspace_id', workspaceId)
                .single();

            if (targetError || !targetMember) {
                return res.status(404).json({ message: 'Member not found in this workspace' });
            }

            // Cannot remove an owner (must transfer ownership first)
            if (targetMember.role === 'owner') {
                return res.status(403).json({ message: 'Cannot remove an owner. Transfer ownership first.' });
            }

            // Admins cannot remove other admins (only owners can)
            if (targetMember.role === 'admin' && currentUserRole !== 'owner') {
                return res.status(403).json({ message: 'Only owners can remove admins' });
            }

            // Perform the deletion using service role (bypasses RLS)
            const { error: deleteError } = await supabase
                .from('workspace_members')
                .delete()
                .eq('id', memberId)
                .eq('workspace_id', workspaceId);

            if (deleteError) {
                logger.error({ err: deleteError, memberId, workspaceId }, '[workspace] Failed to remove member');
                throw new Error(deleteError.message);
            }

            logger.info(
                { memberId, workspaceId, removedEmail: targetMember.email, removedBy: user.id },
                '[workspace] Member removed from workspace'
            );

            res.status(204).send();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ message: 'Invalid request', errors: error.errors });
            }
            next(error);
        }
    }
);

/**
 * GET /api/workspace/members
 * Get all members of the active workspace
 */
workspaceRouter.get(
    '/workspace/members',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authReq = req as AuthenticatedRequest;
            const user = authReq.user;
            const workspaceId = authReq.workspaceId;

            if (!user) {
                return res.status(401).json({ message: 'Not authenticated' });
            }
            if (!workspaceId) {
                return res.status(400).json({ message: 'No workspace selected' });
            }

            const { data: members, error } = await supabase
                .from('workspace_members')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('joined_at', { ascending: true });

            if (error) {
                logger.error({ err: error, workspaceId }, '[workspace] Failed to fetch members');
                throw new Error(error.message);
            }

            res.json(members ?? []);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/workspace/my-role
 * Get current user's role in the active workspace
 */
workspaceRouter.get(
    '/workspace/my-role',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authReq = req as AuthenticatedRequest;
            const user = authReq.user;
            const workspaceId = authReq.workspaceId;

            if (!user) {
                return res.status(401).json({ message: 'Not authenticated' });
            }
            if (!workspaceId) {
                return res.status(400).json({ message: 'No workspace selected' });
            }

            const role = await getCurrentUserRole(user.id, workspaceId);
            const canManage = role === 'owner' || role === 'admin';

            res.json({ role, canManage });
        } catch (error) {
            next(error);
        }
    }
);
