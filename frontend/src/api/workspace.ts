import { supabase } from '../lib/supabase';
import {
    WorkspaceWithMembers,
    WorkspaceSummary,
    TeamMember,
    TeamRole,
    UpdateWorkspaceRequest,
    InviteMemberRequest
} from '../types/workspace';

// Vibrant color palette for team members
const MEMBER_COLORS = [
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#EF4444', // Red
    '#F97316', // Orange
    '#EAB308', // Yellow
    '#22C55E', // Green
    '#14B8A6', // Teal
    '#06B6D4', // Cyan
    '#3B82F6', // Blue
];

// Get a color based on member index
function getMemberColor(index: number): string {
    return MEMBER_COLORS[index % MEMBER_COLORS.length];
}

// Helper to validate Google email
export function isValidGoogleEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.toLowerCase().endsWith('@gmail.com');
}

// Get or create workspace for the current user
// This also auto-joins workspaces when user has pending invites
export async function getOrCreateWorkspace(): Promise<WorkspaceWithMembers> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Step 1: Check for pending invites by email and claim them
    // This auto-joins a user to workspaces they were invited to
    if (user.email) {
        const { data: pendingInvites, error: inviteError } = await supabase
            .from('workspace_members')
            .select('id, workspace_id')
            .eq('email', user.email.toLowerCase())
            .neq('user_id', user.id); // Only get invites not yet claimed

        if (!inviteError && pendingInvites && pendingInvites.length > 0) {
            // Claim all pending invites
            for (const invite of pendingInvites) {
                const { error: claimError } = await supabase
                    .from('workspace_members')
                    .update({
                        user_id: user.id,
                        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                        avatar_url: user.user_metadata?.avatar_url || null,
                    })
                    .eq('id', invite.id);

                if (claimError) {
                    console.error('Error claiming invite:', claimError);
                } else {
                    console.log(`✅ Auto-joined workspace from invite: ${invite.workspace_id}`);
                }
            }
        }
    }

    // Step 2: Try to find a workspace where the user is a member
    const { data: memberData, error: memberError } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

    if (memberError && memberError.code !== 'PGRST116') {
        console.error('Error fetching workspace member:', memberError);
    }

    let workspaceId = memberData?.workspace_id;

    // Step 3: If user has no workspace, create one
    if (!workspaceId) {
        const { data: newWorkspace, error: createError } = await supabase
            .from('workspaces')
            .insert({
                name: 'Zerpha Intelligence',
                owner_id: user.id,
            })
            .select()
            .single();

        if (createError) {
            console.error('Error creating workspace:', createError);
            throw new Error('Failed to create workspace');
        }

        workspaceId = newWorkspace.id;

        // Add the user as owner
        const { error: addMemberError } = await supabase
            .from('workspace_members')
            .insert({
                workspace_id: workspaceId,
                user_id: user.id,
                email: user.email || '',
                name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                avatar_url: user.user_metadata?.avatar_url || null,
                role: 'owner',
                color: getMemberColor(0), // First color for owner
            });

        if (addMemberError) {
            console.error('Error adding workspace owner:', addMemberError);
        }
    }

    // Step 4: Fetch workspace with members
    const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();

    if (workspaceError || !workspace) {
        console.error('Error fetching workspace:', workspaceError);
        throw new Error('Failed to fetch workspace');
    }

    const { data: members, error: membersError } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('joined_at', { ascending: true });

    if (membersError) {
        console.error('Error fetching workspace members:', membersError);
    }

    return {
        id: workspace.id,
        name: workspace.name,
        logo_url: workspace.logo_url,
        owner_id: workspace.owner_id,
        created_at: workspace.created_at,
        updated_at: workspace.updated_at,
        members: (members || []).map((m: Record<string, unknown>, index: number) => ({
            id: m.id as string,
            email: m.email as string,
            name: m.name as string,
            avatar_url: m.avatar_url as string | null,
            role: m.role as TeamRole,
            color: (m.color as string) || getMemberColor(index),
            joined_at: m.joined_at as string,
        })),
    };
}

// Get all workspaces the current user belongs to
export async function getAllUserWorkspaces(): Promise<WorkspaceSummary[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get all workspace memberships for the current user
    const { data: memberships, error: memberError } = await supabase
        .from('workspace_members')
        .select('workspace_id, role')
        .eq('user_id', user.id);

    if (memberError) {
        console.error('Error fetching user workspaces:', memberError);
        throw new Error('Failed to fetch workspaces');
    }

    if (!memberships || memberships.length === 0) {
        return [];
    }

    const workspaceIds = memberships.map(m => m.workspace_id);
    const roleMap = new Map(memberships.map(m => [m.workspace_id, m.role as TeamRole]));

    // Fetch all workspaces
    const { data: workspaces, error: wsError } = await supabase
        .from('workspaces')
        .select('id, name, logo_url, owner_id')
        .in('id', workspaceIds);

    if (wsError || !workspaces) {
        console.error('Error fetching workspaces:', wsError);
        throw new Error('Failed to fetch workspaces');
    }

    // Get member counts for each workspace
    const { data: memberCounts, error: countError } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .in('workspace_id', workspaceIds);

    if (countError) {
        console.error('Error fetching member counts:', countError);
    }

    // Count members per workspace
    const countMap = new Map<string, number>();
    (memberCounts || []).forEach((m: { workspace_id: string }) => {
        countMap.set(m.workspace_id, (countMap.get(m.workspace_id) || 0) + 1);
    });

    return workspaces.map(ws => ({
        id: ws.id,
        name: ws.name,
        logo_url: ws.logo_url,
        owner_id: ws.owner_id,
        role: roleMap.get(ws.id) || 'member',
        member_count: countMap.get(ws.id) || 1,
    }));
}

// Get a specific workspace by ID with all its members
export async function getWorkspaceById(workspaceId: string): Promise<WorkspaceWithMembers> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Verify user has access to this workspace
    const { data: membership, error: memberError } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .single();

    if (memberError || !membership) {
        console.error('Access denied to workspace:', memberError);
        throw new Error('You do not have access to this workspace');
    }

    // Fetch workspace
    const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();

    if (wsError || !workspace) {
        console.error('Error fetching workspace:', wsError);
        throw new Error('Failed to fetch workspace');
    }

    // Fetch all members
    const { data: members, error: membersError } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('joined_at', { ascending: true });

    if (membersError) {
        console.error('Error fetching workspace members:', membersError);
    }

    return {
        id: workspace.id,
        name: workspace.name,
        logo_url: workspace.logo_url,
        owner_id: workspace.owner_id,
        created_at: workspace.created_at,
        updated_at: workspace.updated_at,
        members: (members || []).map((m: Record<string, unknown>, index: number) => ({
            id: m.id as string,
            email: m.email as string,
            name: m.name as string,
            avatar_url: m.avatar_url as string | null,
            role: m.role as TeamRole,
            color: (m.color as string) || getMemberColor(index),
            joined_at: m.joined_at as string,
        })),
    };
}

// Create a brand new empty workspace with custom name
export async function createNewWorkspace(name: string): Promise<WorkspaceWithMembers> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const trimmedName = name.trim();
    if (!trimmedName) {
        throw new Error('Workspace name is required');
    }

    // Create the workspace
    const { data: newWorkspace, error: createError } = await supabase
        .from('workspaces')
        .insert({
            name: trimmedName,
            owner_id: user.id,
        })
        .select()
        .single();

    if (createError) {
        console.error('Error creating workspace:', createError);
        throw new Error('Failed to create workspace');
    }

    // Add the user as owner
    const { error: addMemberError } = await supabase
        .from('workspace_members')
        .insert({
            workspace_id: newWorkspace.id,
            user_id: user.id,
            email: user.email || '',
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            avatar_url: user.user_metadata?.avatar_url || null,
            role: 'owner',
            color: getMemberColor(0),
        });

    if (addMemberError) {
        console.error('Error adding workspace owner:', addMemberError);
        // Try to cleanup the orphaned workspace
        await supabase.from('workspaces').delete().eq('id', newWorkspace.id);
        throw new Error('Failed to set up workspace');
    }

    return {
        id: newWorkspace.id,
        name: newWorkspace.name,
        logo_url: newWorkspace.logo_url,
        owner_id: newWorkspace.owner_id,
        created_at: newWorkspace.created_at,
        updated_at: newWorkspace.updated_at,
        members: [{
            id: crypto.randomUUID(), // temporary ID
            email: user.email || '',
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            avatar_url: user.user_metadata?.avatar_url || null,
            role: 'owner',
            color: getMemberColor(0),
            joined_at: new Date().toISOString(),
        }],
    };
}

export async function updateWorkspace(updates: UpdateWorkspaceRequest): Promise<WorkspaceWithMembers> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const workspace = await getOrCreateWorkspace();

    const { error } = await supabase
        .from('workspaces')
        .update({
            name: updates.name ?? workspace.name,
            logo_url: updates.logo_url ?? workspace.logo_url,
        })
        .eq('id', workspace.id);

    if (error) {
        console.error('Error updating workspace:', error);
        throw new Error('Failed to update workspace');
    }

    return getOrCreateWorkspace();
}

// Upload workspace logo to Supabase Storage
export async function uploadWorkspaceLogo(file: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const workspace = await getOrCreateWorkspace();

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${workspace.id}/logo-${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
        .from('workspace-logos')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true,
        });

    if (error) {
        console.error('Error uploading logo:', error);
        // Fallback to base64 if storage fails
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = reader.result as string;
                try {
                    await updateWorkspace({ logo_url: base64 });
                    resolve(base64);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('workspace-logos')
        .getPublicUrl(data.path);

    // Update workspace with logo URL
    await updateWorkspace({ logo_url: publicUrl });

    return publicUrl;
}

// Invite team member (Google emails only)
export async function inviteTeamMember(request: InviteMemberRequest): Promise<TeamMember> {
    if (!isValidGoogleEmail(request.email)) {
        throw new Error('Only Google emails (@gmail.com) can be invited at this time.');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const workspace = await getOrCreateWorkspace();

    // Check if already a member
    const existingMember = workspace.members.find(
        (m: TeamMember) => m.email.toLowerCase() === request.email.toLowerCase()
    );
    if (existingMember) {
        throw new Error('This email is already a team member.');
    }

    // Check permission
    const currentMember = workspace.members.find((m: TeamMember) => m.email === user.email);
    if (!currentMember || !['owner', 'admin'].includes(currentMember.role)) {
        throw new Error('You do not have permission to invite members.');
    }

    // Add the member with a placeholder user_id (will be updated when they sign in)
    const { data: newMember, error } = await supabase
        .from('workspace_members')
        .insert({
            workspace_id: workspace.id,
            user_id: crypto.randomUUID(), // Placeholder until they sign up
            email: request.email.toLowerCase(),
            name: request.email.split('@')[0],
            role: request.role,
            color: getMemberColor(workspace.members.length), // Assign next color
            invited_by: user.id,
        })
        .select()
        .single();

    if (error) {
        console.error('Error inviting member:', error);
        throw new Error('Failed to invite member');
    }

    return {
        id: newMember.id,
        email: newMember.email,
        name: newMember.name,
        avatar_url: newMember.avatar_url,
        role: newMember.role,
        color: newMember.color || getMemberColor(0),
        joined_at: newMember.joined_at,
    };
}

// Remove team member
export async function removeTeamMember(memberId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const workspace = await getOrCreateWorkspace();

    // Check permission
    const currentMember = workspace.members.find((m: TeamMember) => m.email === user.email);
    if (!currentMember || !['owner', 'admin'].includes(currentMember.role)) {
        throw new Error('You do not have permission to remove team members.');
    }

    const memberToRemove = workspace.members.find((m: TeamMember) => m.id === memberId);
    if (!memberToRemove) {
        throw new Error('Member not found.');
    }

    // Cannot remove the last owner
    const owners = workspace.members.filter((m: TeamMember) => m.role === 'owner');
    if (memberToRemove.role === 'owner' && owners.length <= 1) {
        throw new Error('Cannot remove the last owner. Transfer ownership first.');
    }

    const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId);

    if (error) {
        console.error('Error removing member:', error);
        throw new Error('Failed to remove member');
    }
}

// Update team member role
export async function updateMemberRole(memberId: string, newRole: TeamRole): Promise<TeamMember> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const workspace = await getOrCreateWorkspace();

    // Check permission
    const currentMember = workspace.members.find((m: TeamMember) => m.email === user.email);
    if (!currentMember || !['owner', 'admin'].includes(currentMember.role)) {
        throw new Error('You do not have permission to update member roles.');
    }

    const member = workspace.members.find((m: TeamMember) => m.id === memberId);
    if (!member) {
        throw new Error('Member not found.');
    }

    // Only owners can change someone to/from owner
    if ((member.role === 'owner' || newRole === 'owner') && currentMember.role !== 'owner') {
        throw new Error('Only owners can change owner roles.');
    }

    // Cannot demote yourself from owner if you're the only owner
    if (member.email === user.email && member.role === 'owner' && newRole !== 'owner') {
        const owners = workspace.members.filter((m: TeamMember) => m.role === 'owner');
        if (owners.length <= 1) {
            throw new Error('Cannot demote yourself. Transfer ownership first.');
        }
    }

    const { data: updatedMember, error } = await supabase
        .from('workspace_members')
        .update({ role: newRole })
        .eq('id', memberId)
        .select()
        .single();

    if (error) {
        console.error('Error updating role:', error);
        throw new Error('Failed to update role');
    }

    return {
        id: updatedMember.id,
        email: updatedMember.email,
        name: updatedMember.name,
        avatar_url: updatedMember.avatar_url,
        role: updatedMember.role,
        color: updatedMember.color || getMemberColor(0),
        joined_at: updatedMember.joined_at,
    };
}

// Get current user's role in the workspace
export async function getCurrentUserRole(): Promise<TeamRole | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const workspace = await getOrCreateWorkspace();
        const member = workspace.members.find((m: TeamMember) => m.email === user.email);
        return member?.role || null;
    } catch {
        return null;
    }
}

// Check if current user can manage team
export async function canManageTeam(): Promise<boolean> {
    const role = await getCurrentUserRole();
    return role === 'owner' || role === 'admin';
}
