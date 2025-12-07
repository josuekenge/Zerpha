import { useMemo } from 'react';
import { Calendar, ChevronRight, ExternalLink } from 'lucide-react';
import { PipelineResponse, PipelineStage } from '../api/client';
import { cn } from '../lib/utils';

interface PipelineTimelineProps {
    pipeline: PipelineResponse;
    onCompanyClick?: (companyId: string) => void;
}

const STAGE_COLORS: Record<PipelineStage, { bg: string; border: string; text: string }> = {
    new: { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-700' },
    researching: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700' },
    contacted: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-700' },
    in_diligence: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700' },
    closed: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700' },
};

export function PipelineTimeline({ pipeline, onCompanyClick }: PipelineTimelineProps) {

    // Get current month and next months for timeline header
    const months = useMemo(() => {
        const now = new Date();
        const result = [];
        for (let i = 0; i < 6; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
            result.push({
                label: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                date,
            });
        }
        return result;
    }, []);

    const getScoreColor = (score: number | null) => {
        if (score === null) return 'text-slate-400 bg-slate-100';
        if (score >= 7.5) return 'text-teal-700 bg-teal-100';
        if (score >= 5) return 'text-amber-700 bg-amber-100';
        return 'text-red-700 bg-red-100';
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Timeline Header */}
            <div className="flex border-b border-slate-200">
                <div className="w-72 flex-shrink-0 p-4 border-r border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">Work Items</span>
                    </div>
                </div>
                <div className="flex-1 flex">
                    {months.map((month, i) => (
                        <div
                            key={i}
                            className="flex-1 min-w-[120px] p-4 text-center border-r border-slate-100 last:border-r-0 bg-slate-50"
                        >
                            <span className="text-sm font-medium text-slate-600">{month.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Timeline Body */}
            <div className="max-h-[500px] overflow-y-auto">
                {/* Stage Groups */}
                {pipeline.stages.map((stage) => (
                    <div key={stage.id} className="border-b border-slate-100 last:border-b-0">
                        {/* Stage Header */}
                        <div className="flex items-center px-4 py-2 bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                                <span className={cn(
                                    "text-xs font-medium px-2 py-0.5 rounded",
                                    STAGE_COLORS[stage.id].bg,
                                    STAGE_COLORS[stage.id].text
                                )}>
                                    {stage.label}
                                </span>
                                <span className="text-xs text-slate-500">
                                    ({stage.companies.length} items)
                                </span>
                            </div>
                        </div>

                        {/* Companies in this stage */}
                        {stage.companies.map((company) => (
                            <div
                                key={company.id}
                                className="flex hover:bg-slate-50 cursor-pointer"
                                onClick={() => onCompanyClick?.(company.id)}
                            >
                                {/* Company Info */}
                                <div className="w-72 flex-shrink-0 p-3 border-r border-slate-100">
                                    <div className="flex items-center gap-2">
                                        {company.faviconUrl ? (
                                            <img src={company.faviconUrl} alt="" className="w-6 h-6 rounded" />
                                        ) : (
                                            <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center">
                                                <span className="text-xs font-medium text-slate-400">
                                                    {company.name.charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 truncate">{company.name}</p>
                                            <a
                                                href={`https://${company.domain}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                                            >
                                                {company.domain}
                                                <ExternalLink className="w-2.5 h-2.5" />
                                            </a>
                                        </div>
                                        <span className={cn(
                                            "text-xs font-medium px-1.5 py-0.5 rounded",
                                            getScoreColor(company.fitScore)
                                        )}>
                                            {company.fitScore?.toFixed(1) ?? '—'}
                                        </span>
                                    </div>
                                </div>

                                {/* Timeline Bar */}
                                <div className="flex-1 flex relative">
                                    {months.map((_, i) => (
                                        <div key={i} className="flex-1 min-w-[120px] border-r border-slate-50 last:border-r-0" />
                                    ))}
                                    {/* Progress bar */}
                                    <div className="absolute top-1/2 -translate-y-1/2 left-4 right-[70%]">
                                        <div className={cn(
                                            "h-6 rounded-md border flex items-center px-2",
                                            STAGE_COLORS[stage.id].bg,
                                            STAGE_COLORS[stage.id].border
                                        )}>
                                            <span className="text-xs font-medium text-slate-700 truncate">
                                                {company.name}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {stage.companies.length === 0 && (
                            <div className="flex">
                                <div className="w-72 flex-shrink-0 p-3 border-r border-slate-100">
                                    <p className="text-xs text-slate-400">No companies in this stage</p>
                                </div>
                                <div className="flex-1" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
