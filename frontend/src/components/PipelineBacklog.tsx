import { ExternalLink, MoreHorizontal, GripVertical, Trash2 } from 'lucide-react';
import { PipelineResponse, PipelineStage, PipelineCompany } from '../api/client';
import { cn } from '../lib/utils';

interface PipelineBacklogProps {
    pipeline: PipelineResponse;
    onCompanyClick?: (companyId: string) => void;
    onDeleteCompany?: (companyId: string) => void;
}

const STAGE_BADGES: Record<PipelineStage, { label: string; bg: string; text: string }> = {
    new: { label: 'NEW', bg: 'bg-slate-100', text: 'text-slate-600' },
    researching: { label: 'RESEARCHING', bg: 'bg-blue-50', text: 'text-blue-600' },
    contacted: { label: 'CONTACTED', bg: 'bg-amber-50', text: 'text-amber-600' },
    in_diligence: { label: 'IN DILIGENCE', bg: 'bg-purple-50', text: 'text-purple-600' },
    closed: { label: 'CLOSED', bg: 'bg-green-50', text: 'text-green-600' },
};

export function PipelineBacklog({ pipeline, onCompanyClick, onDeleteCompany }: PipelineBacklogProps) {
    // Flatten all companies with their stage info
    const allCompanies: Array<{ company: PipelineCompany; stage: PipelineStage }> = [];
    pipeline.stages.forEach((stage) => {
        stage.companies.forEach((company) => {
            allCompanies.push({ company, stage: stage.id });
        });
    });

    // Sort: closed first, then by stage priority
    const stageOrder: PipelineStage[] = ['closed', 'in_diligence', 'contacted', 'researching', 'new'];
    allCompanies.sort((a, b) => {
        const aIdx = stageOrder.indexOf(a.stage);
        const bIdx = stageOrder.indexOf(b.stage);
        return aIdx - bIdx;
    });

    const getScoreColor = (score: number | null) => {
        if (score === null) return 'bg-slate-400';
        if (score >= 7.5) return 'bg-teal-500';
        if (score >= 5) return 'bg-amber-500';
        return 'bg-red-500';
    };

    if (allCompanies.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <p className="text-slate-500">No companies in backlog</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center px-4 py-3 border-b border-slate-200 bg-slate-50">
                <div className="flex-1">
                    <span className="text-sm font-medium text-slate-700">
                        Pipeline Backlog
                    </span>
                    <span className="ml-2 text-xs text-slate-500">
                        ({allCompanies.length} items)
                    </span>
                </div>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100">
                {allCompanies.map(({ company, stage }) => (
                    <BacklogRow
                        key={company.id}
                        company={company}
                        stage={stage}
                        onCompanyClick={onCompanyClick}
                        onDeleteCompany={onDeleteCompany}
                        getScoreColor={getScoreColor}
                    />
                ))}
            </div>
        </div>
    );
}

interface BacklogRowProps {
    company: PipelineCompany;
    stage: PipelineStage;
    onCompanyClick?: (companyId: string) => void;
    onDeleteCompany?: (companyId: string) => void;
    getScoreColor: (score: number | null) => string;
}

function BacklogRow({ company, stage, onCompanyClick, onDeleteCompany, getScoreColor }: BacklogRowProps) {
    const badge = STAGE_BADGES[stage];

    return (
        <div
            className="flex items-center px-4 py-3 hover:bg-slate-50 cursor-pointer group"
            onClick={() => onCompanyClick?.(company.id)}
        >
            {/* Drag Handle */}
            <GripVertical className="w-4 h-4 text-slate-300 mr-3 opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Checkbox area (visual only) */}
            <div className="w-5 h-5 rounded border border-slate-300 mr-3 flex items-center justify-center">
                {stage === 'closed' && (
                    <div className="w-3 h-3 rounded-sm bg-green-400" />
                )}
            </div>

            {/* Company favicon */}
            {company.faviconUrl ? (
                <img src={company.faviconUrl} alt="" className="w-6 h-6 rounded mr-3" />
            ) : (
                <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center mr-3">
                    <span className="text-xs font-medium text-slate-400">
                        {company.name.charAt(0)}
                    </span>
                </div>
            )}

            {/* Company Name & Domain */}
            <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900 truncate">
                        {company.name}
                    </span>
                    <a
                        href={`https://${company.domain}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-slate-400 hover:text-indigo-600"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                </div>
                {company.industry && (
                    <p className="text-xs text-slate-500 truncate">{company.industry}</p>
                )}
            </div>

            {/* Notes indicator */}
            {(company.notes || company.notesTitle) && (
                <div className="mr-4 text-xs text-slate-400 max-w-[150px] truncate hidden sm:block">
                    📝 {company.notesTitle || company.notes?.slice(0, 30)}
                </div>
            )}

            {/* Status Badge */}
            <span className={cn(
                "px-2 py-1 text-xs font-bold rounded uppercase mr-4",
                badge.bg,
                badge.text
            )}>
                {badge.label}
            </span>

            {/* Fit Score indicator */}
            <div className="flex items-center gap-1 mr-4">
                <div className={cn("w-2 h-6 rounded", getScoreColor(company.fitScore))} />
                <span className="text-xs text-slate-500 w-6">
                    {company.fitScore?.toFixed(1) ?? '—'}
                </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCompany?.(company.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Remove from pipeline"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                >
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
