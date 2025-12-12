import { useState, useRef, useEffect } from 'react';
import { Upload, Plus, Trash2, AlertCircle, Check } from 'lucide-react';
import { SettingsSectionCard } from '../../components/settings/SettingsSectionCard';
import { useWorkspace } from '../../lib/workspace';
import { isValidGoogleEmail } from '../../api/workspace';
import { TeamRole } from '../../types/workspace';

export function WorkspaceSettings() {
    const {
        workspace,
        loading,
        error: workspaceError,
        canManage,
        currentUserRole,
        updateWorkspace,
        uploadLogo,
        inviteMember,
        removeMember,
        updateMemberRole,
        leaveWorkspace,
    } = useWorkspace();

    const [workspaceName, setWorkspaceName] = useState(workspace?.name || 'Zerpha Intelligence');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<TeamRole>('member');
    const [isSaving, setIsSaving] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
    const [isLeaving, setIsLeaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync local state with workspace data
    useEffect(() => {
        if (workspace) {
            setWorkspaceName(workspace.name);
        }
    }, [workspace]);

    // Clear messages after 3 seconds
    useEffect(() => {
        if (successMessage || errorMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
                setErrorMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage, errorMessage]);

    const handleSaveWorkspaceName = async () => {
        if (!workspaceName.trim()) return;

        setIsSaving(true);
        setErrorMessage(null);
        try {
            await updateWorkspace({ name: workspaceName.trim() });
            setSuccessMessage('Workspace name updated successfully!');
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : 'Failed to update workspace name');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (!validTypes.includes(file.type)) {
            setErrorMessage('Please upload a valid image file (JPEG, PNG, GIF, WebP, or SVG)');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setErrorMessage('Image size must be less than 2MB');
            return;
        }

        setIsSaving(true);
        setErrorMessage(null);
        try {
            await uploadLogo(file);
            setSuccessMessage('Logo uploaded successfully!');
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : 'Failed to upload logo');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const email = e.target.value;
        setInviteEmail(email);
        setEmailError(null);

        if (email && !isValidGoogleEmail(email)) {
            setEmailError('Only Google emails (@gmail.com) can be invited');
        }
    };

    const handleInvite = async () => {
        if (!inviteEmail.trim()) return;

        if (!isValidGoogleEmail(inviteEmail)) {
            setEmailError('Only Google emails (@gmail.com) can be invited');
            return;
        }

        setIsInviting(true);
        setErrorMessage(null);
        setEmailError(null);
        try {
            await inviteMember({ email: inviteEmail.trim(), role: inviteRole });
            setInviteEmail('');
            setInviteRole('member');
            setSuccessMessage('Invitation sent successfully!');
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : 'Failed to send invitation');
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        setRemovingMemberId(memberId);
        setErrorMessage(null);
        try {
            await removeMember(memberId);
            setSuccessMessage('Team member removed successfully!');
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : 'Failed to remove team member');
        } finally {
            setRemovingMemberId(null);
        }
    };

    const handleRoleChange = async (memberId: string, newRole: TeamRole) => {
        setErrorMessage(null);
        try {
            await updateMemberRole(memberId, newRole);
            setSuccessMessage('Role updated successfully!');
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : 'Failed to update role');
        }
    };

    const handleLeaveWorkspace = async () => {
        setErrorMessage(null);

        const confirmed = window.confirm('Are you sure you want to leave this workspace?');
        if (!confirmed) return;

        setIsLeaving(true);
        try {
            await leaveWorkspace();
            setSuccessMessage('You left the workspace.');
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : 'Failed to leave workspace');
        } finally {
            setIsLeaving(false);
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const members = workspace?.members || [];
    const maxSeats = 5;
    const ownerCount = members.filter((m) => m.role === 'owner').length;
    const isLastOwner = currentUserRole === 'owner' && ownerCount <= 1;

    return (
        <div className="space-y-6">
            {/* Success/Error Messages */}
            {(successMessage || errorMessage || workspaceError) && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${successMessage
                    ? 'bg-green-50 border border-green-100'
                    : 'bg-red-50 border border-red-100'
                    }`}>
                    {successMessage ? (
                        <Check className="w-5 h-5 text-green-600" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <p className={`text-sm ${successMessage ? 'text-green-700' : 'text-red-700'}`}>
                        {successMessage || errorMessage || workspaceError}
                    </p>
                </div>
            )}

            <SettingsSectionCard
                title="Workspace Details"
                description="Manage your workspace identity and branding."
            >
                <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                        <div
                            className="w-20 h-20 rounded-lg bg-indigo-600 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden cursor-pointer group relative"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {workspace?.logo_url ? (
                                <img
                                    src={workspace.logo_url}
                                    alt="Workspace Logo"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-2xl font-bold text-white">
                                    {workspaceName.charAt(0).toUpperCase()}
                                </span>
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                            onChange={handleLogoUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center justify-center w-full gap-1"
                        >
                            <Upload className="w-3 h-3" />
                            Upload Logo
                        </button>
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Workspace Name</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={workspaceName}
                                    onChange={(e) => setWorkspaceName(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Enter workspace name"
                                />
                                <button
                                    onClick={handleSaveWorkspaceName}
                                    disabled={isSaving || !workspaceName.trim() || workspaceName === workspace?.name}
                                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSaving ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                        <Check className="w-4 h-4" />
                                    )}
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </SettingsSectionCard>

            <SettingsSectionCard
                title="Team Members"
                description="Manage access and roles for your team."
                action={
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500 dark:text-slate-400">{members.length} / {maxSeats} seats used</span>
                    </div>
                }
            >
                <div className="space-y-6">
                    {/* Invite Form */}
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <input
                                    type="email"
                                    placeholder="Enter Gmail address (e.g., user@gmail.com)"
                                    value={inviteEmail}
                                    onChange={handleEmailChange}
                                    disabled={members.length >= maxSeats}
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:text-white ${emailError ? 'border-red-300 bg-red-50 dark:bg-red-900/10 dark:border-red-800' : 'border-slate-200 dark:border-slate-700'
                                        } ${members.length >= maxSeats ? 'bg-slate-50 dark:bg-slate-800 cursor-not-allowed' : ''}`}
                                />
                            </div>
                            <select
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value as TeamRole)}
                                disabled={members.length >= maxSeats}
                                className="px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="admin">Admin</option>
                                <option value="member">Member</option>
                                <option value="viewer">Viewer</option>
                            </select>
                            <button
                                onClick={handleInvite}
                                disabled={isInviting || !inviteEmail.trim() || !!emailError || members.length >= maxSeats}
                                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isInviting ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                    <Plus className="w-4 h-4" />
                                )}
                                Invite
                            </button>
                        </div>
                        {emailError && (
                            <p className="text-xs text-red-600 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {emailError}
                            </p>
                        )}
                        {members.length >= maxSeats && (
                            <p className="text-xs text-amber-600 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Maximum seats reached. Upgrade to add more team members.
                            </p>
                        )}
                    </div>

                    {/* Team Members List */}
                    <div className="space-y-3">
                        {members.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white overflow-hidden"
                                        style={{ backgroundColor: member.color || '#6366F1' }}
                                    >
                                        {member.avatar_url ? (
                                            <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                                        ) : (
                                            getInitials(member.name)
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{member.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <select
                                        className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-transparent border border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                                        value={member.role}
                                        onChange={(e) => handleRoleChange(member.id, e.target.value as TeamRole)}
                                        disabled={!canManage || member.role === 'owner'}
                                    >
                                        <option value="owner">Owner</option>
                                        <option value="admin">Admin</option>
                                        <option value="member">Member</option>
                                        <option value="viewer">Viewer</option>
                                    </select>
                                    {(() => {
                                        const canRemoveThisMember =
                                            canManage &&
                                            member.role !== 'owner' &&
                                            (currentUserRole === 'owner' || member.role !== 'admin');

                                        if (!canRemoveThisMember) {
                                            return null;
                                        }

                                        return (
                                        <button
                                            onClick={() => handleRemoveMember(member.id)}
                                            disabled={removingMemberId === member.id}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            title="Remove member"
                                        >
                                            {removingMemberId === member.id ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                        );
                                    })()}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Leave Workspace (self-service) */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">Leave workspace</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                You can leave this workspace at any time. Owners must transfer ownership first.
                            </p>
                        </div>
                        <button
                            onClick={handleLeaveWorkspace}
                            disabled={isLeaving || isLastOwner}
                            className="px-4 py-2 text-sm font-medium rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={isLastOwner ? 'You are the last owner. Transfer ownership first.' : 'Leave workspace'}
                        >
                            {isLeaving ? 'Leaving…' : 'Leave'}
                        </button>
                    </div>
                </div>
            </SettingsSectionCard>
        </div>
    );
}
