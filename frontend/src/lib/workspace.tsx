import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { WorkspaceWithMembers, TeamRole, UpdateWorkspaceRequest, InviteMemberRequest } from '../types/workspace';
import {
    getOrCreateWorkspace,
    updateWorkspace as apiUpdateWorkspace,
    uploadWorkspaceLogo as apiUploadLogo,
    inviteTeamMember as apiInviteMember,
    removeTeamMember as apiRemoveMember,
    updateMemberRole as apiUpdateRole,
    canManageTeam as apiCanManageTeam
} from '../api/workspace';
import { useAuth } from './auth';

interface WorkspaceContextValue {
    workspace: WorkspaceWithMembers | null;
    loading: boolean;
    error: string | null;
    canManage: boolean;
    refreshWorkspace: () => Promise<void>;
    updateWorkspace: (updates: UpdateWorkspaceRequest) => Promise<void>;
    uploadLogo: (file: File) => Promise<void>;
    inviteMember: (request: InviteMemberRequest) => Promise<void>;
    removeMember: (memberId: string) => Promise<void>;
    updateMemberRole: (memberId: string, role: TeamRole) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [workspace, setWorkspace] = useState<WorkspaceWithMembers | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [canManage, setCanManage] = useState(false);

    const refreshWorkspace = useCallback(async () => {
        if (!user) {
            setWorkspace(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const ws = await getOrCreateWorkspace();
            setWorkspace(ws);
            const manage = await apiCanManageTeam();
            setCanManage(manage);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load workspace');
            console.error('Failed to load workspace:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        refreshWorkspace();
    }, [refreshWorkspace]);

    const updateWorkspace = useCallback(async (updates: UpdateWorkspaceRequest) => {
        try {
            setError(null);
            const updated = await apiUpdateWorkspace(updates);
            setWorkspace(updated);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update workspace';
            setError(message);
            throw err;
        }
    }, []);

    const uploadLogo = useCallback(async (file: File) => {
        try {
            setError(null);
            await apiUploadLogo(file);
            await refreshWorkspace();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to upload logo';
            setError(message);
            throw err;
        }
    }, [refreshWorkspace]);

    const inviteMember = useCallback(async (request: InviteMemberRequest) => {
        try {
            setError(null);
            await apiInviteMember(request);
            await refreshWorkspace();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to invite member';
            setError(message);
            throw err;
        }
    }, [refreshWorkspace]);

    const removeMember = useCallback(async (memberId: string) => {
        try {
            setError(null);
            await apiRemoveMember(memberId);
            await refreshWorkspace();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to remove member';
            setError(message);
            throw err;
        }
    }, [refreshWorkspace]);

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

    return (
        <WorkspaceContext.Provider
            value={{
                workspace,
                loading,
                error,
                canManage,
                refreshWorkspace,
                updateWorkspace,
                uploadLogo,
                inviteMember,
                removeMember,
                updateMemberRole: updateMemberRoleHandler,
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
