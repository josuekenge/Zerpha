import { useState, useEffect } from 'react';
import { X, Loader2, ExternalLink, ChevronDown, Check, Clock } from 'lucide-react';
import {
    fetchPipelineCompany,
    updatePipelineCompany,
    PipelineCompanyDetail,
    PipelineStage
} from '../api/client';
import { cn } from '../lib/utils';

const PIPELINE_STAGES: { id: PipelineStage; label: string }[] = [
    { id: 'new', label: 'New' },
    { id: 'researching', label: 'Researching' },
    { id: 'contacted', label: 'Contacted' },
    { id: 'in_diligence', label: 'In Diligence' },
    { id: 'closed', label: 'Closed' },
];

interface PipelineDetailModalProps {
    companyId: string;
    onClose: () => void;
    onUpdate: () => void;
}

export function PipelineDetailModal({ companyId, onClose, onUpdate }: PipelineDetailModalProps) {
    const [company, setCompany] = useState<PipelineCompanyDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [notesTitle, setNotesTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedStage, setSelectedStage] = useState<PipelineStage>('new');
    const [stageDropdownOpen, setStageDropdownOpen] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        const loadCompany = async () => {
            try {
                const data = await fetchPipelineCompany(companyId);
                setCompany(data);
                setNotesTitle(data.notesTitle || '');
                setNotes(data.notes || '');
                setSelectedStage(data.pipelineStage);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load company');
            } finally {
                setLoading(false);
            }
        };
        loadCompany();
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
            onUpdate();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleStageChange = (stage: PipelineStage) => {
        setSelectedStage(stage);
        setStageDropdownOpen(false);
        setHasChanges(true);
    };

    const getScoreColor = (score: number | null) => {
        if (score === null) return 'text-slate-400 bg-slate-100';
        if (score >= 7.5) return 'text-teal-700 bg-teal-100';
        if (score >= 5) return 'text-amber-700 bg-amber-100';
        return 'text-red-700 bg-red-100';
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return null;
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-xl p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
            </div>
        );
    }

    if (error || !company) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-xl p-8 max-w-md">
                    <p className="text-red-600">{error || 'Company not found'}</p>
                    <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-100 rounded-lg">
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        {company.faviconUrl ? (
                            <img src={company.faviconUrl} alt="" className="w-8 h-8 rounded" />
                        ) : (
                            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-slate-400">{company.name.charAt(0)}</span>
                            </div>
                        )}
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">{company.name}</h2>
                            <a
                                href={`https://${company.domain}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                            >
                                {company.domain}
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Stage Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setStageDropdownOpen(!stageDropdownOpen)}
                                className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium flex items-center gap-2"
                            >
                                {PIPELINE_STAGES.find(s => s.id === selectedStage)?.label}
                                <ChevronDown className="w-4 h-4" />
                            </button>
                            {stageDropdownOpen && (
                                <>
                                    <div className="fixed inset-0" onClick={() => setStageDropdownOpen(false)} />
                                    <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1 min-w-[150px]">
                                        {PIPELINE_STAGES.map((stage) => (
                                            <button
                                                key={stage.id}
                                                onClick={() => handleStageChange(stage.id)}
                                                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center justify-between"
                                            >
                                                {stage.label}
                                                {selectedStage === stage.id && <Check className="w-4 h-4 text-indigo-600" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto flex">
                    {/* Left Panel - Notes */}
                    <div className="flex-1 p-6 border-r border-slate-100">
                        {/* Summary */}
                        {company.summary && (
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-slate-700 mb-2">Summary</h3>
                                <p className="text-sm text-slate-600">{company.summary}</p>
                            </div>
                        )}

                        {/* Notes Section */}
                        <div>
                            <h3 className="text-sm font-medium text-slate-700 mb-2">Notes</h3>
                            <input
                                type="text"
                                placeholder="Note title (optional)"
                                value={notesTitle}
                                onChange={(e) => { setNotesTitle(e.target.value); setHasChanges(true); }}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <textarea
                                placeholder="Write your notes here... Research findings, contact method, due diligence notes, etc."
                                value={notes}
                                onChange={(e) => { setNotes(e.target.value); setHasChanges(true); }}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm min-h-[200px] resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            {company.notesUpdatedAt && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                                    <Clock className="w-3 h-3" />
                                    Last updated: {formatDate(company.notesUpdatedAt)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Details */}
                    <div className="w-72 p-6 bg-slate-50">
                        <h3 className="text-sm font-medium text-slate-700 mb-4">Details</h3>
                        <div className="space-y-4">
                            <DetailRow label="Industry" value={company.industry} />
                            <DetailRow
                                label="Fit Score"
                                value={
                                    <span className={cn("px-2 py-0.5 rounded text-xs font-medium", getScoreColor(company.fitScore))}>
                                        {company.fitScore?.toFixed(1) ?? '—'}
                                    </span>
                                }
                            />
                            <DetailRow label="Domain" value={company.domain} />
                            <DetailRow label="Headquarters" value={company.headquarters} />
                            <DetailRow label="Headcount" value={company.headcount} />
                            <DetailRow label="Stage" value={PIPELINE_STAGES.find(s => s.id === selectedStage)?.label} />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
                    <div className="text-xs text-slate-400">
                        {hasChanges && 'Unsaved changes'}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || !hasChanges}
                            className={cn(
                                "px-4 py-2 text-sm font-medium rounded-lg",
                                hasChanges
                                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                            )}
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <div className="text-xs text-slate-500 mb-1">{label}</div>
            <div className="text-sm text-slate-900">{value || '—'}</div>
        </div>
    );
}
