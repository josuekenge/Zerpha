import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { WorkspaceWithMembers, WorkspaceSummary, TeamRole, UpdateWorkspaceRequest, InviteMemberRequest } from '../types/workspace';
import {
    getOrCreateWorkspace,
    getAllUserWorkspaces,
    getWorkspaceById,
    createNewWorkspace as apiCreateWorkspace,
    updateWorkspace as apiUpdateWorkspace,
    uploadWorkspaceLogo as apiUploadLogo,
    inviteTeamMember as apiInviteMember,
    removeTeamMember as apiRemoveMember,
    updateMemberRole as apiUpdateRole,
    leaveActiveWorkspace as apiLeaveActiveWorkspace,
    fetchMyWorkspaceRole,
} from '../api/workspace';
import { useAuth } from './auth';

// Key for storing active workspace ID in localStorage
const ACTIVE_WORKSPACE_KEY = 'zerpha_active_workspace_id';

interface WorkspaceContextValue {
    // Current active workspace (full data with members)
    workspace: WorkspaceWithMembers | null;
    // All workspaces user belongs to (summary data for switcher)
    allWorkspaces: WorkspaceSummary[];
    loading: boolean;
    error: string | null;
    canManage: boolean;
    currentUserRole: TeamRole | null;
    // Switch to a different workspace
    switchWorkspace: (workspaceId: string) => Promise<void>;
    // Create a new empty workspace
    createWorkspace: (name: string) => Promise<void>;
    refreshWorkspace: () => Promise<void>;
    refreshAllWorkspaces: () => Promise<void>;
    updateWorkspace: (updates: UpdateWorkspaceRequest) => Promise<void>;
    uploadLogo: (file: File) => Promise<void>;
    inviteMember: (request: InviteMemberRequest) => Promise<void>;
    removeMember: (memberId: string) => Promise<void>;
    updateMemberRole: (memberId: string, role: TeamRole) => Promise<void>;
    leaveWorkspace: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [workspace, setWorkspace] = useState<WorkspaceWithMembers | null>(null);
    const [allWorkspaces, setAllWorkspaces] = useState<WorkspaceSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [canManage, setCanManage] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState<TeamRole | null>(null);

    // Load all workspaces user belongs to
    const refreshAllWorkspaces = useCallback(async () => {
        if (!user) {
            setAllWorkspaces([]);
            return;
        }

        try {
            const workspaces = await getAllUserWorkspaces();
            setAllWorkspaces(workspaces);
        } catch (err) {
            console.error('Failed to load all workspaces:', err);
        }
    }, [user]);

    // Load a specific workspace (or default to first/saved)
    const loadWorkspace = useCallback(async (workspaceId?: string) => {
        if (!user) {
            setWorkspace(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            let ws: WorkspaceWithMembers;

            if (workspaceId) {
                // Load specific workspace
                ws = await getWorkspaceById(workspaceId);
            } else {
                // Check if we have a saved active workspace
                const savedId = localStorage.getItem(ACTIVE_WORKSPACE_KEY);
                if (savedId) {
                    try {
                        ws = await getWorkspaceById(savedId);
                    } catch {
                        // Saved workspace no longer accessible, fall back to default
                        ws = await getOrCreateWorkspace();
                    }
                } else {
                    // No saved preference, use default
                    ws = await getOrCreateWorkspace();
                }
            }

            setWorkspace(ws);
            localStorage.setItem(ACTIVE_WORKSPACE_KEY, ws.id);

            // Calculate canManage from the loaded workspace's members
            // Find current user in the workspace members list
            const currentUserEmail = user?.email?.toLowerCase();
            const currentMember = ws.members.find(
                (m) => m.email?.toLowerCase() === currentUserEmail
            );
            let userRole = (currentMember?.role ?? null) as TeamRole | null;
            let manage = userRole === 'owner' || userRole === 'admin';

            // If role not found locally, fetch authoritative role from backend
            if (!userRole) {
                try {
                    const { role, canManage } = await fetchMyWorkspaceRole();
                    userRole = role;
                    manage = canManage;
                } catch (err) {
                    console.error('Failed to fetch backend role; using local role', err);
                }
            }

            console.log('[Workspace] User role:', userRole, 'canManage:', manage);
            setCanManage(manage);
            setCurrentUserRole(userRole);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load workspace');
            console.error('Failed to load workspace:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Switch to a different workspace
    const switchWorkspace = useCallback(async (workspaceId: string) => {
        await loadWorkspace(workspaceId);
        // Refresh all workspaces to update member counts etc.
        await refreshAllWorkspaces();
    }, [loadWorkspace, refreshAllWorkspaces]);

    // Create a new empty workspace and switch to it
    const createWorkspace = useCallback(async (name: string) => {
        try {
            setLoading(true);
            setError(null);
            const newWs = await apiCreateWorkspace(name);
            setWorkspace(newWs);
            localStorage.setItem(ACTIVE_WORKSPACE_KEY, newWs.id);
            setCanManage(true); // User is owner of new workspace
            await refreshAllWorkspaces();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create workspace';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [refreshAllWorkspaces]);

    // Refresh current workspace
    const refreshWorkspace = useCallback(async () => {
        if (workspace) {
            await loadWorkspace(workspace.id);
        } else {
            await loadWorkspace();
        }
    }, [workspace, loadWorkspace]);

    // Initial load
    useEffect(() => {
        const init = async () => {
            await refreshAllWorkspaces();
            await loadWorkspace();
        };
        init();
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    const updateWorkspace = useCallback(async (updates: UpdateWorkspaceRequest) => {
        try {
            setError(null);
            const updated = await apiUpdateWorkspace(updates);
            setWorkspace(updated);
            await refreshAllWorkspaces();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update workspace';
            setError(message);
            throw err;
        }
    }, [refreshAllWorkspaces]);

    const uploadLogo = useCallback(async (file: File) => {
        try {
            setError(null);
            await apiUploadLogo(file);
            await refreshWorkspace();
            await refreshAllWorkspaces();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to upload logo';
            setError(message);
            throw err;
        }
    }, [refreshWorkspace, refreshAllWorkspaces]);

    const inviteMember = useCallback(async (request: InviteMemberRequest) => {
        try {
            setError(null);
            await apiInviteMember(request);
            await refreshWorkspace();
            await refreshAllWorkspaces();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to invite member';
            setError(message);
            throw err;
        }
    }, [refreshWorkspace, refreshAllWorkspaces]);

    const removeMember = useCallback(async (memberId: string) => {
        try {
            setError(null);
            await apiRemoveMember(memberId);
            await refreshWorkspace();
            await refreshAllWorkspaces();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to remove member';
            setError(message);
            throw err;
        }
    }, [refreshWorkspace, refreshAllWorkspaces]);

    const updateMemberRoleHandler = useCallback(async (memberId: string, role: TeamRole) => {
        try {
            setError(null);
            await apiUpdateRole(memberId, role);
            await refreshWorkspace();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update role';
            setError(message);
            throw err;
        }
    }, [refreshWorkspace]);

    const leaveWorkspace = useCallback(async () => {
        try {
            setError(null);
            await apiLeaveActiveWorkspace();

            // If user left the active workspace, clear preference so we fall back cleanly
            localStorage.removeItem(ACTIVE_WORKSPACE_KEY);

            // Reload workspace lists + select a new default (or create)
            await refreshAllWorkspaces();
            await loadWorkspace();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to leave workspace';
            setError(message);
            throw err;
        }
    }, [refreshAllWorkspaces, loadWorkspace]);

    return (
        <WorkspaceContext.Provider
            value={{
                workspace,
                allWorkspaces,
                loading,
                error,
                canManage,
                currentUserRole,
                switchWorkspace,
                createWorkspace,
                refreshWorkspace,
                refreshAllWorkspaces,
                updateWorkspace,
                uploadLogo,
                inviteMember,
                removeMember,
                updateMemberRole: updateMemberRoleHandler,
                leaveWorkspace,
            }}
        >
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
}
