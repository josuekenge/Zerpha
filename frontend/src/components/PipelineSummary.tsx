import { useMemo } from 'react';
import { BarChart2, CheckCircle, Clock, Activity, TrendingUp, Zap } from 'lucide-react';
import { PipelineResponse, PipelineStage } from '../api/client';
import { CompanyAvatar } from './CompanyAvatar';
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
                    icon={<Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                    label="Total Companies"
                    value={stats.total}
                    iconBg="bg-indigo-100 dark:bg-indigo-900/50"
                />
                <MetricCard
                    icon={<Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
                    label="Active Deals"
                    value={stats.activeDeals}
                    iconBg="bg-orange-100 dark:bg-orange-900/50"
                />
                <MetricCard
                    icon={<CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />}
                    label="Closed Deals"
                    value={stats.closedDeals.length}
                    iconBg="bg-green-100 dark:bg-green-900/50"
                />
                <MetricCard
                    icon={<TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                    label="Conversion Rate"
                    value={stats.total > 0 ? `${Math.round((stats.closedDeals.length / stats.total) * 100)}%` : '0%'}
                    iconBg="bg-blue-100 dark:bg-blue-900/50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pipeline by Stage (Takes up 2 columns) */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-8">
                        <BarChart2 className="w-5 h-5 text-slate-400" />
                        <h3 className="font-semibold text-slate-900 dark:text-white">Pipeline by Stage</h3>
                    </div>
                    <div className="space-y-6">
                        {stats.stageBreakdown.map((stage) => (
                            <div key={stage.id} className="flex items-center gap-4">
                                <div className="w-24 text-sm font-medium text-slate-600 dark:text-slate-300 truncate">{stage.label}</div>
                                <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-full h-4 overflow-hidden">
                                    <div
                                        className="h-full rounded-full flex items-center justify-end pr-2 text-[10px] font-bold text-white transition-all duration-500"
                                        style={{
                                            width: `${Math.max(stage.percentage, 5)}%`,
                                            backgroundColor: STAGE_COLORS[stage.id as PipelineStage],
                                        }}
                                    >
                                        {stage.count > 0 && stage.count}
                                    </div>
                                </div>
                                <div className="w-12 text-right text-sm text-slate-500 dark:text-slate-400">
                                    {stage.percentage}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stage Overview (Donut) */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <Activity className="w-5 h-5 text-slate-400" />
                        <h3 className="font-semibold text-slate-900 dark:text-white">Stage Overview</h3>
                    </div>
                    <div className="flex items-center justify-center py-4">
                        <div className="relative">
                            <DonutChart stages={stats.stageBreakdown} total={stats.total} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</span>
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-3">
                        {stats.stageBreakdown.map((stage) => (
                            <div key={stage.id} className="flex items-center gap-2">
                                <div
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: STAGE_COLORS[stage.id as PipelineStage] }}
                                />
                                <span className="text-xs text-slate-600 dark:text-slate-400 truncate flex-1">{stage.label}</span>
                                <span className="text-xs font-semibold text-slate-900 dark:text-white">{stage.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recently Closed */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <h3 className="font-semibold text-slate-900 dark:text-white">Recently Closed</h3>
                </div>
                {stats.closedDeals.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-500 dark:text-slate-400">No closed deals yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {stats.closedDeals.slice(0, 8).map((company) => (
                            <div
                                key={company.id}
                                className="flex items-center gap-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-lg transition-colors -mx-2"
                            >
                                <CompanyAvatar
                                    name={company.name}
                                    faviconUrl={company.faviconUrl}
                                    website={company.domain}
                                    size={40}
                                    className="rounded-lg"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{company.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{company.domain}</p>
                                </div>
                                {company.fitScore && (
                                    <span className={cn(
                                        "text-xs font-bold px-2.5 py-1 rounded-md",
                                        company.fitScore >= 7.5 ? "text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30" :
                                            company.fitScore >= 5 ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30" :
                                                "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30"
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
    iconBg,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    iconBg: string;
}) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-4", iconBg)}>
                {icon}
            </div>
            <div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">{value}</p>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
            </div>
        </div>
    );
}

function DonutChart({ stages, total }: { stages: { id: string; percentage: number }[]; total: number }) {
    const size = 180;
    const strokeWidth = 24;
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
                    stroke="#f1f5f9"
                    className="dark:stroke-slate-800"
                    strokeWidth={strokeWidth}
                />
            </svg>
        );
    }

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            {/* Background Circle */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#f1f5f9"
                className="dark:stroke-slate-800"
                strokeWidth={strokeWidth}
            />
            {stages.map((stage) => {
                const offset = (cumulativePercentage / 100) * circumference;
                const dashLength = (stage.percentage / 100) * circumference;
                cumulativePercentage += stage.percentage;

                // Don't render if 0 to avoid artifacts
                if (stage.percentage === 0) return null;

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
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                );
            })}
        </svg>
    );
}
