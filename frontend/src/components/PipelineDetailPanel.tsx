import { useState, useEffect } from 'react';
import { X, Loader2, ExternalLink, ChevronDown, Check, Clock, Users, Mail, Linkedin, Trash2, Edit2 } from 'lucide-react';
import {
    fetchPipelineCompany,
    updatePipelineCompany,
    PipelineCompanyDetail,
    PipelineStage
} from '../api/client';
import { getPeopleByCompanyId } from '../api/people';
import { Person } from '../types';
import { CompanyAvatar } from './CompanyAvatar';
import { cn } from '../lib/utils';

const PIPELINE_STAGES: { id: PipelineStage; label: string }[] = [
    { id: 'new', label: 'New' },
    { id: 'researching', label: 'Researching' },
    { id: 'contacted', label: 'Contacted' },
    { id: 'in_diligence', label: 'In Diligence' },
    { id: 'closed', label: 'Closed' },
];

const STAGE_BADGE_STYLES: Record<PipelineStage, { bg: string; text: string }> = {
    new: { bg: 'bg-white/[0.06]', text: 'text-white/50' },
    researching: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
    contacted: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
    in_diligence: { bg: 'bg-purple-500/15', text: 'text-purple-400' },
    closed: { bg: 'bg-green-500', text: 'text-white' },
};

interface PipelineDetailPanelProps {
    companyId: string;
    onClose: () => void;
    onUpdate: () => void;
    onDelete?: () => void;
}

export function PipelineDetailPanel({ companyId, onClose, onUpdate, onDelete }: PipelineDetailPanelProps) {
    const [company, setCompany] = useState<PipelineCompanyDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [contacts, setContacts] = useState<Person[]>([]);
    const [contactsLoading, setContactsLoading] = useState(true);

    const [notesTitle, setNotesTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedStage, setSelectedStage] = useState<PipelineStage>('new');
    const [stageDropdownOpen, setStageDropdownOpen] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [editingNotes, setEditingNotes] = useState(false);

    useEffect(() => {
        const loadCompany = async () => {
            setLoading(true);
            try {
                const data = await fetchPipelineCompany(companyId);
                setCompany(data);
                setNotesTitle(data.notesTitle || '');
                setNotes(data.notes || '');
                setSelectedStage(data.pipelineStage);
                setHasChanges(false);
                setEditingNotes(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load company');
            } finally {
                setLoading(false);
            }
        };
        loadCompany();
    }, [companyId]);

    useEffect(() => {
        const loadContacts = async () => {
            setContactsLoading(true);
            try {
                const people = await getPeopleByCompanyId(companyId);
                setContacts(people);
            } catch (err) {
                console.error('Failed to load contacts:', err);
            } finally {
                setContactsLoading(false);
            }
        };
        loadContacts();
    }, [companyId]);

    const handleSave = async () => {
        if (!company) return;
        setSaving(true);
        try {
            await updatePipelineCompany(companyId, {
                pipelineStage: selectedStage,
                notesTitle: notesTitle || null,
                notes: notes || null,
            });
            setHasChanges(false);
            setEditingNotes(false);
            onUpdate();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Remove this company from your pipeline?')) return;

        setSaving(true);
        try {
            await updatePipelineCompany(companyId, { pipelineStage: null });
            onDelete?.();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove');
        } finally {
            setSaving(false);
        }
    };

    const handleStageChange = async (stage: PipelineStage) => {
        setSelectedStage(stage);
        setStageDropdownOpen(false);

        // Auto-save stage change
        setSaving(true);
        try {
            await updatePipelineCompany(companyId, { pipelineStage: stage });
            onUpdate();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update stage');
        } finally {
            setSaving(false);
        }
    };

    const getScoreColor = (score: number | null) => {
        if (score === null) return 'text-white/30 bg-white/[0.06]';
        if (score >= 7.5) return 'text-teal-400 bg-teal-500/15';
        if (score >= 5) return 'text-amber-400 bg-amber-500/15';
        return 'text-red-400 bg-red-500/15';
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return null;
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-[#0e0e11] border-l border-white/[0.06]">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            </div>
        );
    }

    if (error || !company) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-[#0e0e11] border-l border-white/[0.06] p-6">
                <p className="text-red-400 text-sm mb-4">{error || 'Company not found'}</p>
                <button onClick={onClose} className="text-sm text-white/60 hover:text-white">
                    Close
                </button>
            </div>
        );
    }

    const stageBadge = STAGE_BADGE_STYLES[selectedStage];

    return (
        <div className="h-full flex flex-col bg-[#0e0e11] border-l border-white/[0.06] overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between p-4 border-b border-white/[0.06]">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <CompanyAvatar
                            name={company.name}
                            faviconUrl={company.faviconUrl}
                            website={company.domain}
                            size={24}
                        />
                        <h2 className="text-lg font-semibold text-white truncate">{company.name}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Stage Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setStageDropdownOpen(!stageDropdownOpen)}
                                className={cn(
                                    "px-2 py-1 text-xs font-bold rounded flex items-center gap-1",
                                    stageBadge.bg,
                                    stageBadge.text
                                )}
                            >
                                {PIPELINE_STAGES.find(s => s.id === selectedStage)?.label?.toUpperCase()}
                                <ChevronDown className="w-3 h-3" />
                            </button>
                            {stageDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setStageDropdownOpen(false)} />
                                    <div className="absolute left-0 mt-1 bg-[#0e0e11] border border-white/[0.08] rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
                                        {PIPELINE_STAGES.map((stage) => (
                                            <button
                                                key={stage.id}
                                                onClick={() => handleStageChange(stage.id)}
                                                className="w-full px-3 py-2 text-left text-sm text-white/60 hover:bg-white/[0.04] flex items-center justify-between"
                                            >
                                                <span className={cn(
                                                    "px-2 py-0.5 text-xs font-bold rounded",
                                                    STAGE_BADGE_STYLES[stage.id].bg,
                                                    STAGE_BADGE_STYLES[stage.id].text
                                                )}>
                                                    {stage.label.toUpperCase()}
                                                </span>
                                                {selectedStage === stage.id && <Check className="w-4 h-4 text-indigo-400" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        <a
                            href={`https://${company.domain}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                            {company.domain}
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-white/[0.06] rounded-lg">
                    <X className="w-4 h-4 text-white/60" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Description / Summary */}
                <section>
                    <h3 className="text-xs font-semibold text-white/60 uppercase mb-2">Description</h3>
                    <p className="text-sm text-white/60">
                        {company.summary || 'No description available'}
                    </p>
                </section>

                {/* Notes Section */}
                <section>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold text-white/60 uppercase">Notes</h3>
                        {!editingNotes && (
                            <button
                                onClick={() => setEditingNotes(true)}
                                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                            >
                                <Edit2 className="w-3 h-3" />
                                Edit
                            </button>
                        )}
                    </div>
                    {editingNotes ? (
                        <div className="space-y-2">
                            <input
                                type="text"
                                placeholder="Note title"
                                value={notesTitle}
                                onChange={(e) => { setNotesTitle(e.target.value); setHasChanges(true); }}
                                className="w-full px-2 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <textarea
                                placeholder="Add notes..."
                                value={notes}
                                onChange={(e) => { setNotes(e.target.value); setHasChanges(true); }}
                                className="w-full px-2 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded text-sm text-white min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !hasChanges}
                                    className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                                </button>
                                <button
                                    onClick={() => {
                                        setNotesTitle(company.notesTitle || '');
                                        setNotes(company.notes || '');
                                        setHasChanges(false);
                                        setEditingNotes(false);
                                    }}
                                    className="px-3 py-1.5 text-xs text-white/60 hover:bg-white/[0.06] rounded"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/[0.04] border border-white/[0.06] rounded-md p-3">
                            {notesTitle && <p className="text-sm font-medium text-white mb-1">{notesTitle}</p>}
                            <p className="text-sm text-white/60">{notes || 'No notes yet. Click Edit to add notes.'}</p>
                            {company.notesUpdatedAt && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-white/30">
                                    <Clock className="w-3 h-3" />
                                    Updated {formatDate(company.notesUpdatedAt)}
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Key Contacts */}
                <section>
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="w-3.5 h-3.5 text-white/60" />
                        <h3 className="text-xs font-semibold text-white/60 uppercase">Key Contacts</h3>
                    </div>
                    {contactsLoading ? (
                        <div className="flex justify-center py-3">
                            <Loader2 className="w-4 h-4 animate-spin text-white/30" />
                        </div>
                    ) : contacts.length === 0 ? (
                        <p className="text-xs text-white/30">No contacts added</p>
                    ) : (
                        <div className="space-y-2">
                            {contacts.slice(0, 4).map((contact) => (
                                <div key={contact.id} className="flex items-center gap-2 py-1">
                                    <div className="w-6 h-6 rounded-full bg-indigo-400/[0.08] flex items-center justify-center">
                                        <span className="text-xs font-medium text-indigo-400">
                                            {contact.first_name?.charAt(0) || '?'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white truncate">
                                            {[contact.first_name, contact.last_name].filter(Boolean).join(' ')}
                                        </p>
                                        {contact.role && <p className="text-xs text-white/60 truncate">{contact.role}</p>}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {contact.email && (
                                            <a href={`mailto:${contact.email}`} className="p-1 text-white/30 hover:text-white/60">
                                                <Mail className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                        {contact.linkedin_url && (
                                            <a href={contact.linkedin_url} target="_blank" rel="noreferrer" className="p-1 text-white/30 hover:text-blue-400">
                                                <Linkedin className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Details */}
                <section>
                    <h3 className="text-xs font-semibold text-white/60 uppercase mb-3">Details</h3>
                    <div className="space-y-3">
                        <DetailRow label="Industry" value={company.industry} />
                        <DetailRow
                            label="Fit Score"
                            value={
                                <span className={cn("px-2 py-0.5 rounded text-xs font-medium", getScoreColor(company.fitScore))}>
                                    {company.fitScore?.toFixed(1) ?? '—'}
                                </span>
                            }
                        />
                        <DetailRow label="Headquarters" value={company.headquarters} />
                        <DetailRow label="Headcount" value={company.headcount} />
                        <DetailRow label="Domain" value={company.domain} />
                    </div>
                </section>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-white/[0.06]">
                <button
                    onClick={handleDelete}
                    disabled={saving}
                    className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300"
                >
                    <Trash2 className="w-4 h-4" />
                    Remove from pipeline
                </button>
            </div>
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start">
            <div className="w-28 text-xs text-white/60">{label}</div>
            <div className="flex-1 text-sm text-white">{value || '—'}</div>
        </div>
    );
}
