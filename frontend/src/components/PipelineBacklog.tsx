import { ExternalLink, MoreHorizontal, GripVertical, Trash2 } from 'lucide-react';
import { PipelineResponse, PipelineStage, PipelineCompany } from '../api/client';
import { CompanyAvatar } from './CompanyAvatar';
import { cn } from '../lib/utils';

interface PipelineBacklogProps {
    pipeline: PipelineResponse;
    onCompanyClick?: (companyId: string) => void;
    onDeleteCompany?: (companyId: string) => void;
}

const STAGE_BADGES: Record<PipelineStage, { label: string; bg: string; text: string }> = {
    new: { label: 'NEW', bg: 'bg-white/[0.06]', text: 'text-white/50' },
    researching: { label: 'RESEARCHING', bg: 'bg-blue-500/15', text: 'text-blue-400' },
    contacted: { label: 'CONTACTED', bg: 'bg-amber-500/15', text: 'text-amber-400' },
    in_diligence: { label: 'IN DILIGENCE', bg: 'bg-purple-500/15', text: 'text-purple-400' },
    closed: { label: 'CLOSED', bg: 'bg-green-500/15', text: 'text-green-400' },
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
        if (score === null) return 'bg-white/[0.06]';
        if (score >= 7.5) return 'bg-teal-500';
        if (score >= 5) return 'bg-amber-500';
        return 'bg-red-500';
    };

    if (allCompanies.length === 0) {
        return (
            <div className="bg-[#0e0e11] rounded-xl border border-white/[0.06] p-8 text-center">
                <p className="text-white/60">No companies in backlog</p>
            </div>
        );
    }

    return (
        <div className="bg-[#0e0e11] rounded-xl border border-white/[0.06] overflow-hidden">
            {/* Header */}
            <div className="flex items-center px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex-1">
                    <span className="text-sm font-medium text-white">
                        Pipeline Backlog
                    </span>
                    <span className="ml-2 text-xs text-white/60">
                        ({allCompanies.length} items)
                    </span>
                </div>
            </div>

            {/* List */}
            <div className="divide-y divide-white/[0.06]">
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
            className="flex items-center px-4 py-3 hover:bg-white/[0.04] cursor-pointer group"
            onClick={() => onCompanyClick?.(company.id)}
        >
            {/* Drag Handle */}
            <GripVertical className="w-4 h-4 text-white/30 mr-3 opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Checkbox area (visual only) */}
            <div className="w-5 h-5 rounded border border-white/[0.08] mr-3 flex items-center justify-center">
                {stage === 'closed' && (
                    <div className="w-3 h-3 rounded-sm bg-green-400" />
                )}
            </div>

            {/* Company favicon */}
            <CompanyAvatar
                name={company.name}
                faviconUrl={company.faviconUrl}
                website={company.domain}
                size={24}
                className="mr-3"
            />

            {/* Company Name & Domain */}
            <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">
                        {company.name}
                    </span>
                    <a
                        href={`https://${company.domain}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-white/30 hover:text-indigo-400"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                </div>
                {company.industry && (
                    <p className="text-xs text-white/60 truncate">{company.industry}</p>
                )}
            </div>

            {/* Notes indicator */}
            {(company.notes || company.notesTitle) && (
                <div className="mr-4 text-xs text-white/30 max-w-[150px] truncate hidden sm:block">
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
                <span className="text-xs text-white/60 w-6">
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
                    className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded"
                    title="Remove from pipeline"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-white/30 hover:text-white/60 hover:bg-white/[0.06] rounded"
                >
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
