export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface TeamMember {
    id: string;
    email: string;
    name: string;
    avatar_url?: string | null;
    role: TeamRole;
    color: string; // Hex color for user identification
    joined_at: string;
}

export interface Workspace {
    id: string;
    name: string;
    logo_url: string | null;
    owner_id: string;
    created_at: string;
    updated_at: string;
}

export interface WorkspaceWithMembers extends Workspace {
    members: TeamMember[];
}

export interface InviteMemberRequest {
    email: string;
    role: TeamRole;
}

export interface UpdateWorkspaceRequest {
    name?: string;
    logo_url?: string | null;
}

// Summary of workspace for switcher (lighter than full WorkspaceWithMembers)
export interface WorkspaceSummary {
    id: string;
    name: string;
    logo_url: string | null;
    owner_id: string;
    role: TeamRole; // User's role in this workspace
    member_count: number;
}
