import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, AlertCircle, GripVertical, ExternalLink, Search, StickyNote, Check, LayoutGrid, BarChart2, Calendar } from 'lucide-react';
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
import { PipelineTimeline } from './PipelineTimeline';
import { cn } from '../lib/utils';

type PipelineView = 'board' | 'summary' | 'timeline';

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

export function PipelinePage({ onCompanyClick: _onCompanyClick }: PipelinePageProps) {
    const [pipeline, setPipeline] = useState<PipelineResponse | null>(null);
    const [loading, setLoading] = useState(true);
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
        const targetStageId = over.id as PipelineStage;

        // Find source stage
        let sourceStage: PipelineStage | null = null;
        for (const stage of pipeline.stages) {
            if (stage.companies.some(c => c.id === companyId)) {
                sourceStage = stage.id;
                break;
            }
        }

        if (!sourceStage || sourceStage === targetStageId) return;

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

        // API call
        try {
            await updatePipelineCompany(companyId, { pipelineStage: targetStageId });
            setUpdateError(null);
        } catch (err) {
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

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-sm text-slate-600">Loading pipeline...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                    <p className="text-sm text-slate-600">{error}</p>
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
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <GripVertical className="w-8 h-8 text-slate-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 mb-2">No companies in pipeline</h2>
                    <p className="text-sm text-slate-500">
                        Save companies from the Companies page to add them to your pipeline.
                        Drag and drop to move them through stages.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden p-6 bg-slate-50">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Pipeline</h1>
                    <p className="text-sm text-slate-500">{totalCompanies} companies in your pipeline</p>
                </div>
                {/* View Toggle */}
                <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                    <button
                        onClick={() => setActiveView('board')}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                            activeView === 'board'
                                ? "bg-indigo-100 text-indigo-700"
                                : "text-slate-600 hover:text-slate-900"
                        )}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Board
                    </button>
                    <button
                        onClick={() => setActiveView('summary')}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                            activeView === 'summary'
                                ? "bg-indigo-100 text-indigo-700"
                                : "text-slate-600 hover:text-slate-900"
                        )}
                    >
                        <BarChart2 className="w-4 h-4" />
                        Summary
                    </button>
                    <button
                        onClick={() => setActiveView('timeline')}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                            activeView === 'timeline'
                                ? "bg-indigo-100 text-indigo-700"
                                : "text-slate-600 hover:text-slate-900"
                        )}
                    >
                        <Calendar className="w-4 h-4" />
                        Timeline
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search companies, notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Error toast */}
            {updateError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {updateError}
                </div>
            )}

            {/* Success toast */}
            {successToast && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
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

            {/* Timeline View */}
            {activeView === 'timeline' && (
                <div className="flex-1 overflow-y-auto">
                    <PipelineTimeline pipeline={pipeline} onCompanyClick={handleCardClick} />
                </div>
            )}

            {/* Detail Modal */}
            {selectedCompanyId && (
                <PipelineDetailModal
                    companyId={selectedCompanyId}
                    onClose={handleModalClose}
                    onUpdate={handleModalUpdate}
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
            className="flex-shrink-0 w-72 flex flex-col rounded-xl border border-slate-200 bg-white"
        >
            {/* Column Header */}
            <div className="p-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", STAGE_BADGE_COLORS[stage.id])} />
                    <h3 className="font-semibold text-sm text-slate-800">{stage.label}</h3>
                    <span className="ml-auto text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
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
                            <p className="text-xs text-slate-400 text-center p-4">
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
        if (score === null) return 'text-slate-400 bg-slate-100';
        if (score >= 7.5) return 'text-teal-700 bg-teal-100';
        if (score >= 5) return 'text-amber-700 bg-amber-100';
        return 'text-red-700 bg-red-100';
    };

    const hasNotes = company.notes || company.notesTitle;

    return (
        <div
            className={cn(
                "bg-white rounded-lg border border-slate-200 p-3 shadow-sm cursor-grab active:cursor-grabbing hover:border-slate-300 hover:shadow transition-all",
                isDragging && "shadow-lg ring-2 ring-indigo-500"
            )}
            onClick={() => onCompanyClick?.(company.id)}
        >
            <div className="flex items-start gap-2">
                {company.faviconUrl ? (
                    <img
                        src={company.faviconUrl}
                        alt=""
                        className="w-6 h-6 rounded flex-shrink-0"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                ) : (
                    <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-slate-400">
                            {company.name.charAt(0)}
                        </span>
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-slate-900 truncate">{company.name}</h4>
                    <a
                        href={`https://${company.domain}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 truncate"
                    >
                        {company.domain}
                        <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                </div>

                {/* Quick Notes Action */}
                <button
                    onClick={(e) => onNotesClick?.(company.id, e)}
                    className={cn(
                        "p-1 rounded hover:bg-slate-100 flex-shrink-0 transition-colors",
                        hasNotes ? "text-indigo-500" : "text-slate-300 hover:text-slate-500"
                    )}
                    title={hasNotes ? "View notes" : "Add notes"}
                >
                    <StickyNote className="w-4 h-4" />
                </button>
            </div>

            {/* Notes Preview */}
            {hasNotes && (
                <div className="mt-2 p-2 bg-slate-50 rounded-md border border-slate-100">
                    {company.notesTitle && (
                        <p className="text-xs font-medium text-slate-700 truncate">{company.notesTitle}</p>
                    )}
                    {company.notes && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{company.notes}</p>
                    )}
                </div>
            )}

            <div className="mt-2 flex items-center justify-between">
                {company.industry && (
                    <span className="text-xs text-slate-500 truncate max-w-[60%]">{company.industry}</span>
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
