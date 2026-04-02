import { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertCircle, GripVertical, ExternalLink, Search, StickyNote, Check, LayoutGrid, BarChart2, Calendar } from 'lucide-react';
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

// Header badge colors only - columns are white
const STAGE_BADGE_COLORS: Record<PipelineStage, string> = {
    new: 'bg-slate-500',
    researching: 'bg-blue-500',
    contacted: 'bg-amber-500',
    in_diligence: 'bg-purple-500',
    closed: 'bg-green-500',
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
        <div className="h-full flex flex-col overflow-hidden p-6 bg-[#09090b]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-xl font-bold text-white">Pipeline</h1>
                    <p className="text-sm text-white/60">{totalCompanies} companies in your pipeline</p>
                </div>
            </div>

            {/* Search Bar + View Toggle */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                        type="text"
                        placeholder="Search companies, notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30 hover:text-white/60"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* View Toggle */}
                <div className="flex bg-white/[0.04] rounded-lg p-1 gap-1">
                    <button
                        onClick={() => setActiveView('board')}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                            activeView === 'board'
                                ? "bg-white/[0.08] text-white"
                                : "text-white/60 hover:text-white hover:bg-white/[0.06]"
                        )}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Board
                    </button>
                    <button
                        onClick={() => setActiveView('summary')}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                            activeView === 'summary'
                                ? "bg-white/[0.08] text-white"
                                : "text-white/60 hover:text-white hover:bg-white/[0.06]"
                        )}
                    >
                        <BarChart2 className="w-4 h-4" />
                        Summary
                    </button>
                    <button
                        onClick={() => setActiveView('backlog')}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                            activeView === 'backlog'
                                ? "bg-white/[0.08] text-white"
                                : "text-white/60 hover:text-white hover:bg-white/[0.06]"
                        )}
                    >
                        <Calendar className="w-4 h-4" />
                        Backlog
                    </button>
                </div>
            </div>

            {/* Error toast */}
            {updateError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                    {updateError}
                </div>
            )}

            {/* Success toast */}
            {successToast && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-400 flex items-center gap-2">
                    <Check className="w-4 h-4" />
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
                    <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
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
                <div className="flex-1 overflow-y-auto">
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
            className="flex-shrink-0 w-72 flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.02]"
        >
            {/* Column Header */}
            <div className="p-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", STAGE_BADGE_COLORS[stage.id])} />
                    <h3 className="font-semibold text-sm text-white">{stage.label}</h3>
                    <span className="ml-auto text-xs font-medium text-white/50 bg-white/[0.08] px-2 py-0.5 rounded-full">
                        {stage.companies.length}
                    </span>
                </div>
            </div>

            {/* Droppable Area */}
            <SortableContext
                id={stage.id}
                items={stage.companies.map(c => c.id)}
                strategy={verticalListSortingStrategy}
            >
                <div
                    className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px]"
                    data-stage={stage.id}
                >
                    {stage.companies.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-xs text-white/30 text-center p-4">
                                Drop companies here
                            </p>
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

function PipelineCard({ company, isDragging, onCompanyClick, onNotesClick }: PipelineCardProps) {
    const getScoreColor = (score: number | null) => {
        if (score === null) return 'text-white/30 bg-white/[0.06]';
        if (score >= 7.5) return 'text-teal-400 bg-teal-500/15';
        if (score >= 5) return 'text-amber-400 bg-amber-500/15';
        return 'text-red-400 bg-red-500/15';
    };

    const hasNotes = company.notes || company.notesTitle;

    return (
        <div
            className={cn(
                "bg-[#0e0e11] rounded-lg border border-white/[0.06] p-3 cursor-grab active:cursor-grabbing hover:border-white/[0.12] hover:bg-white/[0.04] transition-all",
                isDragging && "ring-2 ring-indigo-400"
            )}
            onClick={() => onCompanyClick?.(company.id)}
        >
            <div className="flex items-start gap-2">
                <CompanyAvatar
                    name={company.name}
                    faviconUrl={company.faviconUrl}
                    website={company.domain}
                    size={24}
                    className="flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-white truncate">{company.name}</h4>
                    <a
                        href={`https://${company.domain}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 truncate"
                    >
                        {company.domain}
                        <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                </div>

                {/* Quick Notes Action */}
                <button
                    onClick={(e) => onNotesClick?.(company.id, e)}
                    className={cn(
                        "p-1 rounded hover:bg-white/[0.06] flex-shrink-0 transition-colors",
                        hasNotes ? "text-indigo-400" : "text-white/30 hover:text-white/60"
                    )}
                    title={hasNotes ? "View notes" : "Add notes"}
                >
                    <StickyNote className="w-4 h-4" />
                </button>
            </div>

            {/* Notes Preview */}
            {hasNotes && (
                <div className="mt-2 p-2 bg-white/[0.04] rounded-md border border-white/[0.06]">
                    {company.notesTitle && (
                        <p className="text-xs font-medium text-white truncate">{company.notesTitle}</p>
                    )}
                    {company.notes && (
                        <p className="text-xs text-white/60 truncate mt-0.5">{company.notes}</p>
                    )}
                </div>
            )}

            <div className="mt-2 flex items-center justify-between">
                {company.industry && (
                    <span className="text-xs text-white/60 truncate max-w-[60%]">{company.industry}</span>
                )}
                <span
                    className={cn(
                        "text-xs font-medium px-1.5 py-0.5 rounded ml-auto",
                        getScoreColor(company.fitScore)
                    )}
                >
                    {company.fitScore?.toFixed(1) ?? '—'}
                </span>
            </div>
        </div>
    );
}
