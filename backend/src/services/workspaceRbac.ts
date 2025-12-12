export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

/**
 * RBAC: can actor remove target from a workspace?
 *
 * Rules:
 * - Nobody can remove an owner (ownership must be transferred first)
 * - Owner can remove admin/member/viewer
 * - Admin can remove member/viewer, but cannot remove admins
 * - Member/viewer cannot remove anyone
 */
export function canRemoveWorkspaceMember(actorRole: WorkspaceRole, targetRole: WorkspaceRole): boolean {
  if (targetRole === 'owner') return false;

  if (actorRole === 'owner') return true;

  if (actorRole === 'admin') {
    return targetRole === 'member' || targetRole === 'viewer';
  }

  return false;
}

/**
 * RBAC: can a user leave a workspace?
 *
 * Rules:
 * - Non-owners can always leave
 * - Owners can leave only if there is at least one other owner
 */
export function canLeaveWorkspace(role: WorkspaceRole, ownerCount: number): boolean {
  if (role !== 'owner') return true;
  return ownerCount > 1;
}


