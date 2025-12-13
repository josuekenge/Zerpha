import { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus, Users, Loader2 } from 'lucide-react';
import { useWorkspace } from '../lib/workspace';
import { WorkspaceSummary } from '../types/workspace';
import { cn } from '../lib/utils';

interface WorkspaceSwitcherProps {
    onNavigateToSettings?: () => void;
}

export function WorkspaceSwitcher({ onNavigateToSettings }: WorkspaceSwitcherProps) {
    const { workspace, allWorkspaces, switchWorkspace, createWorkspace, loading } = useWorkspace();
    const [isOpen, setIsOpen] = useState(false);
    const [switching, setSwitching] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [createError, setCreateError] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowCreateForm(false);
                setNewWorkspaceName('');
                setCreateError(null);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus input when create form opens
    useEffect(() => {
        if (showCreateForm && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showCreateForm]);

    const handleSwitch = async (ws: WorkspaceSummary) => {
        if (ws.id === workspace?.id) {
            setIsOpen(false);
            return;
        }

        try {
            setSwitching(true);
            await switchWorkspace(ws.id);
            setIsOpen(false);
        } catch (err) {
            console.error('Failed to switch workspace:', err);
        } finally {
            setSwitching(false);
        }
    };

    const handleCreateWorkspace = async () => {
        const trimmedName = newWorkspaceName.trim();
        if (!trimmedName) {
            setCreateError('Please enter a workspace name');
            return;
        }

        try {
            setSwitching(true);
            setCreateError(null);
            await createWorkspace(trimmedName);
            setIsOpen(false);
            setShowCreateForm(false);
            setNewWorkspaceName('');
        } catch (err) {
            setCreateError(err instanceof Error ? err.message : 'Failed to create workspace');
        } finally {
            setSwitching(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCreateWorkspace();
        } else if (e.key === 'Escape') {
            setShowCreateForm(false);
            setNewWorkspaceName('');
            setCreateError(null);
        }
    };

    const displayName = workspace?.name || 'Zerpha Intelligence';
    const displayInitial = displayName.charAt(0).toUpperCase();

    // Get role badge color
    const getRoleBadgeClass = (role: string) => {
        switch (role) {
            case 'owner':
                return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300';
            case 'admin':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300';
            default:
                return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={loading || switching}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group disabled:opacity-60"
            >
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold border border-indigo-100 group-hover:border-indigo-200 transition-colors overflow-hidden">
                        {workspace?.logo_url ? (
                            <img src={workspace.logo_url} alt="Workspace Logo" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-indigo-50 text-indigo-600 flex items-center justify-center">{displayInitial}</div>
                        )}
                    </div>
                    <span className="group-hover:text-indigo-900 dark:group-hover:text-indigo-400 transition-colors truncate max-w-[140px]">
                        {switching ? 'Switching...' : displayName}
                    </span>
                </div>
                <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 flex-shrink-0" />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                    {/* Workspaces List */}
                    <div className="max-h-64 overflow-y-auto">
                        {allWorkspaces.length === 0 ? (
                            <div className="px-3 py-4 text-center text-sm text-slate-500">
                                No workspaces found
                            </div>
                        ) : (
                            allWorkspaces.map((ws) => (
                                <button
                                    key={ws.id}
                                    onClick={() => handleSwitch(ws)}
                                    disabled={switching}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors disabled:opacity-50",
                                        ws.id === workspace?.id
                                            ? "bg-indigo-50 dark:bg-indigo-900/20"
                                            : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                    )}
                                >
                                    {/* Workspace Icon */}
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border border-slate-200 dark:border-slate-600 overflow-hidden flex-shrink-0">
                                        {ws.logo_url ? (
                                            <img src={ws.logo_url} alt={ws.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                                {ws.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Workspace Info */}
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-900 dark:text-white truncate">
                                                {ws.name}
                                            </span>
                                            {ws.id === workspace?.id && (
                                                <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize", getRoleBadgeClass(ws.role))}>
                                                {ws.role}
                                            </span>
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {ws.member_count}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-200 dark:border-slate-700" />

                    {/* Create New Workspace Form */}
                    {showCreateForm ? (
                        <div className="p-3 space-y-3">
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Workspace name..."
                                value={newWorkspaceName}
                                onChange={(e) => {
                                    setNewWorkspaceName(e.target.value);
                                    setCreateError(null);
                                }}
                                onKeyDown={handleKeyDown}
                                disabled={switching}
                                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCreateWorkspace}
                                    disabled={switching || !newWorkspaceName.trim()}
                                    className="flex-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                                >
                                    {switching ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <>
                                            <Plus className="w-3 h-3" />
                                            Create Workspace
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCreateForm(false);
                                        setNewWorkspaceName('');
                                        setCreateError(null);
                                    }}
                                    disabled={switching}
                                    className="px-3 py-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors text-xs"
                                >
                                    Cancel
                                </button>
                            </div>
                            {createError && (
                                <p className="text-[10px] text-red-500">{createError}</p>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors font-medium"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create New Workspace</span>
                        </button>
                    )}

                    {/* Divider */}
                    <div className="border-t border-slate-200 dark:border-slate-700" />

                    {/* Manage Workspaces */}
                    {onNavigateToSettings && (
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                onNavigateToSettings();
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                            <span>Manage Workspaces</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
