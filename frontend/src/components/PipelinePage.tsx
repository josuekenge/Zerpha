import { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertCircle, GripVertical, ExternalLink, Search, StickyNote, Check, LayoutGrid, BarChart2, Calendar, X } from 'lucide-react';
import { AiLoader } from './ui/ai-loader';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    useDroppable,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    fetchPipeline,
    updatePipelineCompany,
    PipelineResponse,
    PipelineCompany,
    PipelineStage,
    PipelineStageData
} from '../api/client';
import { PipelineDetailModal } from './PipelineDetailModal';
import { PipelineSummary } from './PipelineSummary';
import { PipelineBacklog } from './PipelineBacklog';
import { PipelineDetailPanel } from './PipelineDetailPanel';
import { CompanyAvatar } from './CompanyAvatar';
import { cn } from '../lib/utils';

type PipelineView = 'board' | 'summary' | 'backlog';

interface PipelinePageProps {
    onCompanyClick?: (companyId: string) => void;
}

const STAGE_DOT: Record<PipelineStage, string> = {
    new: 'bg-white/30',
    researching: 'bg-blue-400',
    contacted: 'bg-amber-400',
    in_diligence: 'bg-violet-400',
    closed: 'bg-emerald-400',
};

// Module-level cache so pipeline data persists across tab switches
let _pipelineCache: PipelineResponse | null = null;

export function PipelinePage({ onCompanyClick: _onCompanyClick }: PipelinePageProps) {
    const [pipeline, setPipeline] = useState<PipelineResponse | null>(_pipelineCache);
    const [loading, setLoading] = useState(_pipelineCache === null);
    const [error, setError] = useState<string | null>(null);
    const [activeCard, setActiveCard] = useState<PipelineCompany | null>(null);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [successToast, setSuccessToast] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<PipelineView>('board');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor)
    );

    const loadPipeline = useCallback(async () => {
        try {
            const data = await fetchPipeline();
            _pipelineCache = data;
            setPipeline(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load pipeline');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPipeline();
    }, [loadPipeline]);

    // Filter companies based on search query
    const filteredPipeline = useMemo(() => {
        if (!pipeline || !searchQuery.trim()) return pipeline;

        const query = searchQuery.toLowerCase().trim();
        return {
            stages: pipeline.stages.map(stage => ({
                ...stage,
                companies: stage.companies.filter(company =>
                    company.name.toLowerCase().includes(query) ||
                    company.domain.toLowerCase().includes(query) ||
                    (company.industry?.toLowerCase().includes(query)) ||
                    (company.notesTitle?.toLowerCase().includes(query)) ||
                    (company.notes?.toLowerCase().includes(query))
                ),
            })),
        };
    }, [pipeline, searchQuery]);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        if (!pipeline) return;

        for (const stage of pipeline.stages) {
            const company = stage.companies.find(c => c.id === active.id);
            if (company) {
                setActiveCard(company);
                break;
            }
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveCard(null);

        if (!over || !pipeline) return;

        const companyId = active.id as string;
        const overId = over.id as string;

        // Helper to find which stage contains a given ID (could be stage ID or company ID)
        const findStageForId = (id: string): PipelineStage | null => {
            // First check if it's a stage ID
            const validStages: PipelineStage[] = ['new', 'researching', 'contacted', 'in_diligence', 'closed'];
            if (validStages.includes(id as PipelineStage)) {
                return id as PipelineStage;
            }
            // Otherwise, find which stage contains this company
            for (const stage of pipeline.stages) {
                if (stage.companies.some(c => c.id === id)) {
                    return stage.id;
                }
            }
            return null;
        };

        // Find source stage (where the dragged card came from)
        const sourceStage = findStageForId(companyId);

        // Find target stage (where we're dropping)
        const targetStageId = findStageForId(overId);

        console.log('[Pipeline DnD] Drag end:', {
            companyId,
            overId,
            sourceStage,
            targetStageId,
        });

        if (!sourceStage || !targetStageId) {
            console.error('[Pipeline DnD] Could not determine source or target stage');
            return;
        }

        if (sourceStage === targetStageId) {
            console.log('[Pipeline DnD] Same stage, no update needed');
            return;
        }

        // Optimistic update
        const previousPipeline = pipeline;
        setPipeline(prev => {
            if (!prev) return prev;

            const newStages = prev.stages.map(stage => {
                if (stage.id === sourceStage) {
                    return {
                        ...stage,
                        companies: stage.companies.filter(c => c.id !== companyId),
                    };
                }
                if (stage.id === targetStageId) {
                    const company = previousPipeline.stages
                        .find(s => s.id === sourceStage)
                        ?.companies.find(c => c.id === companyId);
                    if (company) {
                        return {
                            ...stage,
                            companies: [...stage.companies, company],
                        };
                    }
                }
                return stage;
            });

            return { stages: newStages };
        });

        // API call to persist the change
        try {
            console.log('[Pipeline DnD] Calling API:', {
                companyId,
                pipelineStage: targetStageId,
            });

            await updatePipelineCompany(companyId, { pipelineStage: targetStageId });
            setUpdateError(null);
            console.log('[Pipeline DnD] API call successful');
        } catch (err) {
            console.error('[Pipeline DnD] API call failed:', err);
            setPipeline(previousPipeline);
            setUpdateError('Failed to update stage. Please try again.');
            setTimeout(() => setUpdateError(null), 3000);
        }
    };

    const handleCardClick = (companyId: string) => {
        setSelectedCompanyId(companyId);
    };

    const handleNotesClick = (companyId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedCompanyId(companyId);
    };

    const handleModalClose = () => {
        setSelectedCompanyId(null);
    };

    const handleModalUpdate = () => {
        loadPipeline();
        setSuccessToast('Notes updated');
        setTimeout(() => setSuccessToast(null), 3000);
    };

    const handleDeleteCompany = async (companyId: string) => {
        if (!window.confirm('Remove this company from your pipeline?')) return;

        try {
            await updatePipelineCompany(companyId, { pipelineStage: null });
            loadPipeline();
            setSuccessToast('Company removed from pipeline');
            setTimeout(() => setSuccessToast(null), 3000);
        } catch (err) {
            setUpdateError('Failed to remove company');
            setTimeout(() => setUpdateError(null), 3000);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <AiLoader />
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                    <p className="text-sm text-white/60">{error}</p>
                </div>
            </div>
        );
    }

    if (!pipeline) return null;

    const totalCompanies = pipeline.stages.reduce((sum, s) => sum + s.companies.length, 0);

    if (totalCompanies === 0) {
        return (
            <div className="h-full flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto mb-4">
                        <GripVertical className="w-8 h-8 text-white/30" />
                    </div>
                    <h2 className="text-lg font-semibold text-white mb-2">No companies in pipeline</h2>
                    <p className="text-sm text-white/40">
                        Save companies from the Companies page to add them to your pipeline.
                        Drag and drop to move them through stages.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden px-5 pt-5 pb-0 bg-[#09090b]">
            {/* Toolbar: search + view toggle inline */}
            <div className="flex items-center gap-3 mb-4">
                <div className="relative w-64 shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search companies, notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-8 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-violet-400/30 focus:border-violet-400/30 transition-all"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>

                {/* View Toggle — immediately after search */}
                <div className="flex bg-white/[0.04] border border-white/[0.06] rounded-lg p-0.5 gap-0.5">
                    {([ ['board', LayoutGrid, 'Board'], ['summary', BarChart2, 'Summary'], ['backlog', Calendar, 'Backlog'] ] as const).map(([view, Icon, label]) => (
                        <button
                            key={view}
                            onClick={() => setActiveView(view)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                                activeView === view
                                    ? "bg-violet-500/20 text-violet-300"
                                    : "text-white/35 hover:text-white/65 hover:bg-white/[0.04]"
                            )}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                        </button>
                    ))}
                </div>

                <span className="text-[11px] text-white/20 ml-auto">{totalCompanies} companies</span>
            </div>

            {/* Toasts */}
            {updateError && (
                <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/15 rounded-lg text-xs text-red-400">
                    {updateError}
                </div>
            )}
            {successToast && (
                <div className="mb-3 px-3 py-2 bg-violet-500/10 border border-violet-500/15 rounded-lg text-xs text-violet-300 flex items-center gap-2">
                    <Check className="w-3.5 h-3.5" />
                    {successToast}
                </div>
            )}

            {/* Kanban Board */}
            {activeView === 'board' && (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex-1 flex gap-3 overflow-x-auto pb-4 min-w-0">
                        {filteredPipeline?.stages.map(stage => (
                            <PipelineColumn
                                key={stage.id}
                                stage={stage}
                                onCompanyClick={handleCardClick}
                                onNotesClick={handleNotesClick}
                            />
                        ))}
                    </div>

                    <DragOverlay>
                        {activeCard && <PipelineCard company={activeCard} isDragging />}
                    </DragOverlay>
                </DndContext>
            )}

            {/* Summary View */}
            {activeView === 'summary' && (
                <div className="flex-1 overflow-hidden -mx-5 -mb-4">
                    <PipelineSummary pipeline={pipeline} />
                </div>
            )}

            {/* Backlog View with Side Panel */}
            {activeView === 'backlog' && (
                <div className="flex-1 flex overflow-hidden">
                    {/* Backlog List */}
                    <div className={cn(
                        "flex-1 overflow-y-auto transition-all",
                        selectedCompanyId ? "w-1/2" : "w-full"
                    )}>
                        <PipelineBacklog
                            pipeline={pipeline}
                            onCompanyClick={handleCardClick}
                            onDeleteCompany={handleDeleteCompany}
                        />
                    </div>

                    {/* Detail Panel - slides in from right */}
                    {selectedCompanyId && (
                        <div className="w-96 flex-shrink-0">
                            <PipelineDetailPanel
                                companyId={selectedCompanyId}
                                onClose={handleModalClose}
                                onUpdate={() => {
                                    loadPipeline();
                                    setSuccessToast('Updated');
                                    setTimeout(() => setSuccessToast(null), 3000);
                                }}
                                onDelete={() => {
                                    loadPipeline();
                                    setSuccessToast('Company removed');
                                    setTimeout(() => setSuccessToast(null), 3000);
                                }}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Detail Modal - Only for Board and Summary views */}
            {selectedCompanyId && activeView !== 'backlog' && (
                <PipelineDetailModal
                    companyId={selectedCompanyId}
                    onClose={handleModalClose}
                    onUpdate={handleModalUpdate}
                    onDelete={() => {
                        loadPipeline();
                        setSuccessToast('Company removed from pipeline');
                        setTimeout(() => setSuccessToast(null), 3000);
                    }}
                />
            )}
        </div>
    );
}

// Column Component
interface PipelineColumnProps {
    stage: PipelineStageData;
    onCompanyClick?: (companyId: string) => void;
    onNotesClick?: (companyId: string, e: React.MouseEvent) => void;
}

function PipelineColumn({ stage, onCompanyClick, onNotesClick }: PipelineColumnProps) {
    const { setNodeRef } = useDroppable({ id: stage.id });

    return (
        <div
            ref={setNodeRef}
            className="flex-1 min-w-[190px] max-w-xs flex flex-col rounded-xl border border-white/[0.06] bg-[#0c0c10]"
        >
            {/* Column Header */}
            <div className="px-4 py-3 flex items-center gap-3 border-b border-white/[0.06] bg-white/[0.02] shrink-0">
                <h3 className="text-[11px] font-semibold text-white/40 tracking-widest uppercase flex-1">{stage.label}</h3>
                <span className="text-[11px] font-medium text-white/25 tabular-nums">
                    {stage.companies.length}
                </span>
            </div>

            {/* Droppable Area */}
            <SortableContext
                id={stage.id}
                items={stage.companies.map(c => c.id)}
                strategy={verticalListSortingStrategy}
            >
                <div
                    className="flex-1 p-2 space-y-1.5 overflow-y-auto min-h-[120px] scrollbar-hide"
                    data-stage={stage.id}
                >
                    {stage.companies.length === 0 ? (
                        <div className="h-16 border border-dashed border-white/[0.06] rounded-lg flex items-center justify-center mt-1">
                            <p className="text-[10px] text-white/15">Drop here</p>
                        </div>
                    ) : (
                        stage.companies.map(company => (
                            <SortableCard
                                key={company.id}
                                company={company}
                                onCompanyClick={onCompanyClick}
                                onNotesClick={onNotesClick}
                            />
                        ))
                    )}
                </div>
            </SortableContext>
        </div>
    );
}

// Sortable Card Wrapper
interface SortableCardProps {
    company: PipelineCompany;
    onCompanyClick?: (companyId: string) => void;
    onNotesClick?: (companyId: string, e: React.MouseEvent) => void;
}

function SortableCard({ company, onCompanyClick, onNotesClick }: SortableCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: company.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <PipelineCard company={company} onCompanyClick={onCompanyClick} onNotesClick={onNotesClick} />
        </div>
    );
}

// Card Component
interface PipelineCardProps {
    company: PipelineCompany;
    isDragging?: boolean;
    onCompanyClick?: (companyId: string) => void;
    onNotesClick?: (companyId: string, e: React.MouseEvent) => void;
}

const SCORE_ACCENT: Record<string, string> = {
    high: 'border-l-emerald-500/60',
    medium: 'border-l-amber-500/50',
    low: 'border-l-red-500/50',
    none: 'border-l-white/[0.06]',
};

function getScoreTier(score: number | null): 'high' | 'medium' | 'low' | 'none' {
    if (score === null) return 'none';
    if (score >= 7.5) return 'high';
    if (score >= 5) return 'medium';
    return 'low';
}

const SCORE_LABEL: Record<string, string> = {
    high: 'text-emerald-400',
    medium: 'text-amber-400',
    low: 'text-red-400',
    none: 'text-white/25',
};

function PipelineCard({ company, isDragging, onCompanyClick, onNotesClick }: PipelineCardProps) {
    const tier = getScoreTier(company.fitScore);
    const hasNotes = company.notes || company.notesTitle;

    return (
        <div
            className={cn(
                "group relative bg-[#111118] rounded-lg border border-white/[0.07] border-l-2 pl-2.5 pr-3 pt-2.5 pb-2 cursor-grab active:cursor-grabbing hover:bg-[#16161f] hover:border-white/[0.12] transition-all",
                SCORE_ACCENT[tier],
                isDragging && "opacity-50 ring-1 ring-violet-500/40"
            )}
            onClick={() => onCompanyClick?.(company.id)}
        >
            {/* Company name + favicon */}
            <div className="flex items-start gap-2">
                <CompanyAvatar
                    name={company.name}
                    faviconUrl={company.faviconUrl}
                    website={company.domain}
                    size={20}
                    className="flex-shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-medium text-white/90 leading-tight line-clamp-1">{company.name}</span>
                </div>
                {/* Notes icon — visible when notes exist, otherwise on hover */}
                <button
                    onClick={(e) => onNotesClick?.(company.id, e)}
                    className={cn(
                        "shrink-0 p-0.5 rounded transition-all -mt-0.5",
                        hasNotes
                            ? "text-violet-400/80 hover:text-violet-300"
                            : "text-white/0 group-hover:text-white/25 hover:!text-white/50"
                    )}
                    title={hasNotes ? "View notes" : "Add notes"}
                >
                    <StickyNote className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Domain link */}
            <a
                href={`https://${company.domain}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-0.5 ml-7 text-[11px] text-white/25 hover:text-violet-400/70 flex items-center gap-0.5 truncate transition-colors w-fit"
            >
                {company.domain}
                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
            </a>

            {/* Notes preview */}
            {hasNotes && (
                <div className="mt-2 ml-7 px-2 py-1.5 bg-white/[0.03] rounded border border-white/[0.05]">
                    {company.notesTitle && (
                        <p className="text-[11px] font-medium text-white/60 truncate">{company.notesTitle}</p>
                    )}
                    {company.notes && (
                        <p className="text-[11px] text-white/35 line-clamp-2 mt-0.5 leading-relaxed">{company.notes}</p>
                    )}
                </div>
            )}

            {/* Footer: industry + fit score */}
            <div className="mt-2.5 flex items-center gap-2">
                {company.industry && (
                    <span className="text-[10px] text-white/25 bg-white/[0.04] px-1.5 py-0.5 rounded truncate max-w-[70%]">
                        {company.industry}
                    </span>
                )}
                <span className={cn("ml-auto text-[11px] font-semibold tabular-nums shrink-0", SCORE_LABEL[tier])}>
                    {company.fitScore?.toFixed(1) ?? '—'}
                </span>
            </div>
        </div>
    );
}
