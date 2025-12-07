import { useMemo } from 'react';
import { BarChart2, CheckCircle2, Clock, Activity, TrendingUp } from 'lucide-react';
import { PipelineResponse, PipelineStage } from '../api/client';
import { cn } from '../lib/utils';

interface PipelineSummaryProps {
    pipeline: PipelineResponse;
}

const STAGE_COLORS: Record<PipelineStage, string> = {
    new: '#64748b',
    researching: '#3b82f6',
    contacted: '#f59e0b',
    in_diligence: '#8b5cf6',
    closed: '#10b981',
};

export function PipelineSummary({ pipeline }: PipelineSummaryProps) {
    const stats = useMemo(() => {
        const total = pipeline.stages.reduce((sum, s) => sum + s.companies.length, 0);
        const stageBreakdown = pipeline.stages.map(s => ({
            id: s.id,
            label: s.label,
            count: s.companies.length,
            percentage: total > 0 ? Math.round((s.companies.length / total) * 100) : 0,
        }));
        const closedDeals = pipeline.stages.find(s => s.id === 'closed')?.companies || [];
        const activeDeals = total - closedDeals.length;

        return { total, stageBreakdown, closedDeals, activeDeals };
    }, [pipeline]);

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard
                    icon={<Activity className="w-5 h-5 text-indigo-600" />}
                    label="Total Companies"
                    value={stats.total}
                    color="bg-indigo-50"
                />
                <MetricCard
                    icon={<Clock className="w-5 h-5 text-amber-600" />}
                    label="Active Deals"
                    value={stats.activeDeals}
                    color="bg-amber-50"
                />
                <MetricCard
                    icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
                    label="Closed Deals"
                    value={stats.closedDeals.length}
                    color="bg-green-50"
                />
                <MetricCard
                    icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
                    label="Conversion Rate"
                    value={stats.total > 0 ? `${Math.round((stats.closedDeals.length / stats.total) * 100)}%` : '0%'}
                    color="bg-blue-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stage Distribution */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart2 className="w-5 h-5 text-slate-500" />
                        <h3 className="font-semibold text-slate-900">Pipeline by Stage</h3>
                    </div>
                    <div className="space-y-4">
                        {stats.stageBreakdown.map((stage) => (
                            <div key={stage.id} className="flex items-center gap-3">
                                <div className="w-24 text-sm text-slate-600 truncate">{stage.label}</div>
                                <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                                    <div
                                        className="h-full rounded-full flex items-center justify-end pr-2 text-xs font-medium text-white"
                                        style={{
                                            width: `${Math.max(stage.percentage, 5)}%`,
                                            backgroundColor: STAGE_COLORS[stage.id as PipelineStage],
                                        }}
                                    >
                                        {stage.count}
                                    </div>
                                </div>
                                <div className="w-10 text-right text-xs text-slate-500">
                                    {stage.percentage}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Donut Chart Visualization */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Activity className="w-5 h-5 text-slate-500" />
                        <h3 className="font-semibold text-slate-900">Stage Overview</h3>
                    </div>
                    <div className="flex items-center justify-center">
                        <div className="relative">
                            <DonutChart stages={stats.stageBreakdown} total={stats.total} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold text-slate-900">{stats.total}</span>
                                <span className="text-sm text-slate-500">Total</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-2">
                        {stats.stageBreakdown.map((stage) => (
                            <div key={stage.id} className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: STAGE_COLORS[stage.id as PipelineStage] }}
                                />
                                <span className="text-xs text-slate-600">{stage.label}</span>
                                <span className="text-xs font-medium text-slate-900 ml-auto">{stage.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Closed Deals Timeline */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-slate-900">Recently Closed</h3>
                </div>
                {stats.closedDeals.length === 0 ? (
                    <p className="text-sm text-slate-500 py-4 text-center">No closed deals yet</p>
                ) : (
                    <div className="space-y-3">
                        {stats.closedDeals.slice(0, 8).map((company) => (
                            <div
                                key={company.id}
                                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                            >
                                {company.faviconUrl ? (
                                    <img src={company.faviconUrl} alt="" className="w-8 h-8 rounded" />
                                ) : (
                                    <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 truncate">{company.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{company.domain}</p>
                                </div>
                                {company.fitScore && (
                                    <span className={cn(
                                        "text-xs font-medium px-2 py-0.5 rounded",
                                        company.fitScore >= 7.5 ? "text-teal-700 bg-teal-100" :
                                            company.fitScore >= 5 ? "text-amber-700 bg-amber-100" :
                                                "text-red-700 bg-red-100"
                                    )}>
                                        {company.fitScore.toFixed(1)}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function MetricCard({
    icon,
    label,
    value,
    color,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: string;
}) {
    return (
        <div className={cn("rounded-xl p-4", color)}>
            <div className="flex items-center gap-3">
                {icon}
                <div>
                    <p className="text-2xl font-bold text-slate-900">{value}</p>
                    <p className="text-sm text-slate-600">{label}</p>
                </div>
            </div>
        </div>
    );
}

function DonutChart({ stages, total }: { stages: { id: string; percentage: number }[]; total: number }) {
    const size = 160;
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    let cumulativePercentage = 0;

    if (total === 0) {
        return (
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth={strokeWidth}
                />
            </svg>
        );
    }

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            {stages.map((stage) => {
                const offset = (cumulativePercentage / 100) * circumference;
                const dashLength = (stage.percentage / 100) * circumference;
                cumulativePercentage += stage.percentage;

                return (
                    <circle
                        key={stage.id}
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={STAGE_COLORS[stage.id as PipelineStage]}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                        strokeDashoffset={-offset}
                    />
                );
            })}
        </svg>
    );
}
