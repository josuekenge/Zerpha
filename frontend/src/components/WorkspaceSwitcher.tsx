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

    useEffect(() => {
        if (showCreateForm && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showCreateForm]);

    const handleSwitch = async (ws: WorkspaceSummary) => {
        if (ws.id === workspace?.id) { setIsOpen(false); return; }
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
        if (!trimmedName) { setCreateError('Please enter a workspace name'); return; }
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
        if (e.key === 'Enter') { e.preventDefault(); handleCreateWorkspace(); }
        else if (e.key === 'Escape') { setShowCreateForm(false); setNewWorkspaceName(''); setCreateError(null); }
    };

    const displayName = workspace?.name || 'Zerpha Intelligence';
    const displayInitial = displayName.charAt(0).toUpperCase();

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={loading || switching}
                className="w-full flex items-center justify-between px-2 h-9 text-sm font-ui text-white/70 hover:bg-white/[0.05] hover:text-white rounded-lg transition-colors disabled:opacity-50 group"
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold bg-white/[0.08] border border-white/[0.10] text-white flex-shrink-0 overflow-hidden">
                        {workspace?.logo_url
                            ? <img src={workspace.logo_url} alt="logo" className="w-full h-full object-cover" />
                            : displayInitial}
                    </div>
                    <span className="truncate">{switching ? 'Switching...' : displayName}</span>
                </div>
                <ChevronsUpDown className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#0a0a0a] rounded-xl border border-white/[0.08] shadow-2xl overflow-hidden z-50">
                    {/* Workspace list */}
                    <div className="max-h-64 overflow-y-auto py-1">
                        {allWorkspaces.length === 0 ? (
                            <p className="px-3 py-4 text-center text-xs text-white/30">No workspaces found</p>
                        ) : (
                            allWorkspaces.map((ws) => (
                                <button
                                    key={ws.id}
                                    onClick={() => handleSwitch(ws)}
                                    disabled={switching}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors disabled:opacity-50",
                                        ws.id === workspace?.id
                                            ? "bg-white/[0.06]"
                                            : "hover:bg-white/[0.04]"
                                    )}
                                >
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold bg-white/[0.08] border border-white/[0.10] text-white flex-shrink-0 overflow-hidden">
                                        {ws.logo_url
                                            ? <img src={ws.logo_url} alt={ws.name} className="w-full h-full object-cover" />
                                            : ws.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-white truncate text-sm">{ws.name}</span>
                                            {ws.id === workspace?.id && (
                                                <Check className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize bg-white/[0.06] text-white/40 border border-white/[0.08]">
                                                {ws.role}
                                            </span>
                                            <span className="text-[10px] text-white/25 flex items-center gap-1">
                                                <Users className="w-3 h-3" />{ws.member_count}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    <div className="border-t border-white/[0.06]" />

                    {/* Create form */}
                    {showCreateForm ? (
                        <div className="p-3 space-y-2">
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Workspace name..."
                                value={newWorkspaceName}
                                onChange={(e) => { setNewWorkspaceName(e.target.value); setCreateError(null); }}
                                onKeyDown={handleKeyDown}
                                disabled={switching}
                                className="w-full px-3 py-1.5 text-sm font-ui bg-black border border-white/[0.08] rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/40 disabled:opacity-50"
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCreateWorkspace}
                                    disabled={switching || !newWorkspaceName.trim()}
                                    className="flex-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                                >
                                    {switching ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Plus className="w-3 h-3" />Create</>}
                                </button>
                                <button
                                    onClick={() => { setShowCreateForm(false); setNewWorkspaceName(''); setCreateError(null); }}
                                    disabled={switching}
                                    className="px-3 py-1.5 text-white/40 hover:text-white/70 border border-white/[0.08] rounded-lg transition-colors text-xs"
                                >
                                    Cancel
                                </button>
                            </div>
                            {createError && <p className="text-[10px] text-red-400">{createError}</p>}
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-ui text-white/40 hover:bg-white/[0.04] hover:text-white/70 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Create New Workspace
                        </button>
                    )}

                    {onNavigateToSettings && (
                        <>
                            <div className="border-t border-white/[0.06]" />
                            <button
                                onClick={() => { setIsOpen(false); onNavigateToSettings(); }}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-ui text-white/40 hover:bg-white/[0.04] hover:text-white/70 transition-colors"
                            >
                                Manage Workspaces
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
