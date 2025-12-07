import { useState, useEffect } from 'react';
import { TrendingUp, Building2, Target, Gem, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { fetchInsights, InsightsResponse, CompanyTarget } from '../api/client';
import { cn } from '../lib/utils';

interface InsightsPageProps {
    industryFilter: string;
    locationFilter: string;
    fitFilter: string;
    onCompanyClick?: (companyId: string) => void;
}

// Fit filter to score range mapping
function getFitScoreRange(fitFilter: string): { minScore?: number; maxScore?: number } {
    switch (fitFilter) {
        case 'high':
            return { minScore: 7.5 };
        case 'medium':
            return { minScore: 5, maxScore: 7.4 };
        case 'low':
            return { maxScore: 4.9 };
        default:
            return {};
    }
}

export function InsightsPage({
    industryFilter,
    locationFilter,
    fitFilter,
    onCompanyClick
}: InsightsPageProps) {
    const [insights, setInsights] = useState<InsightsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadInsights = async () => {
            setLoading(true);
            setError(null);
            try {
                const { minScore, maxScore } = getFitScoreRange(fitFilter);
                const data = await fetchInsights({
                    industry: industryFilter,
                    location: locationFilter,
                    minScore,
                    maxScore,
                });
                setInsights(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load insights');
            } finally {
                setLoading(false);
            }
        };

        loadInsights();
    }, [industryFilter, locationFilter, fitFilter]);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-sm text-slate-600">Loading market insights...</p>
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

    if (!insights) return null;

    const maxIndustryCount = Math.max(...insights.byIndustry.map(i => i.count), 1);

    return (
        <div className="h-full overflow-y-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Market Insights</h1>
                    <p className="text-sm text-slate-500">Analytics for your saved companies</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KpiCard
                    icon={<Building2 className="w-5 h-5" />}
                    label="Total Companies"
                    value={insights.totalCompanies.toString()}
                    color="indigo"
                />
                <KpiCard
                    icon={<TrendingUp className="w-5 h-5" />}
                    label="Average Fit Score"
                    value={insights.averageFitScore?.toFixed(1) ?? '—'}
                    color="teal"
                />
                <KpiCard
                    icon={<TrendingUp className="w-5 h-5" />}
                    label="Average Dig Score"
                    value={insights.averageDigScore?.toFixed(1) ?? '—'}
                    color="amber"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Industry Breakdown Chart */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-900 mb-4">Companies by Industry</h2>
                    {insights.byIndustry.length === 0 ? (
                        <p className="text-sm text-slate-500">No industry data available</p>
                    ) : (
                        <div className="space-y-3">
                            {insights.byIndustry.slice(0, 8).map((item) => (
                                <div key={item.industry} className="group">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm text-slate-700 truncate max-w-[150px]">{item.industry}</span>
                                        <span className="text-xs text-slate-500">{item.count} companies</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                                            style={{ width: `${(item.count / maxIndustryCount) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Targets */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Target className="w-4 h-4 text-indigo-600" />
                        <h2 className="text-sm font-semibold text-slate-900">Top Targets</h2>
                    </div>
                    <CompanyTable
                        companies={insights.topTargets}
                        onCompanyClick={onCompanyClick}
                        emptyText="No targets found"
                    />
                </div>
            </div>

            {/* Hidden Gems */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                    <Gem className="w-4 h-4 text-amber-500" />
                    <h2 className="text-sm font-semibold text-slate-900">Hidden Gems</h2>
                </div>
                <p className="text-xs text-slate-500 mb-4">Medium fit, strong potential — companies worth a closer look</p>
                <CompanyTable
                    companies={insights.hiddenGems}
                    onCompanyClick={onCompanyClick}
                    emptyText="No hidden gems found"
                />
            </div>
        </div>
    );
}

// KPI Card Component
interface KpiCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    color: 'indigo' | 'teal' | 'amber';
}

function KpiCard({ icon, label, value, color }: KpiCardProps) {
    const colorClasses = {
        indigo: 'bg-indigo-50 text-indigo-600',
        teal: 'bg-teal-50 text-teal-600',
        amber: 'bg-amber-50 text-amber-600',
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', colorClasses[color])}>
                    {icon}
                </div>
                <div>
                    <p className="text-xs text-slate-500 font-medium">{label}</p>
                    <p className="text-2xl font-bold text-slate-900">{value}</p>
                </div>
            </div>
        </div>
    );
}

// Company Table Component
interface CompanyTableProps {
    companies: CompanyTarget[];
    onCompanyClick?: (companyId: string) => void;
    emptyText: string;
}

function CompanyTable({ companies, onCompanyClick, emptyText }: CompanyTableProps) {
    if (companies.length === 0) {
        return <p className="text-sm text-slate-500">{emptyText}</p>;
    }

    const getScoreColor = (score: number) => {
        if (score >= 7.5) return 'text-teal-600 bg-teal-50';
        if (score >= 5) return 'text-amber-600 bg-amber-50';
        return 'text-red-600 bg-red-50';
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                        <th className="py-2 pr-4">Name</th>
                        <th className="py-2 pr-4 hidden sm:table-cell">Domain</th>
                        <th className="py-2 pr-4 hidden md:table-cell">Industry</th>
                        <th className="py-2 text-right">Fit</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {companies.map((company) => (
                        <tr
                            key={company.id}
                            onClick={() => onCompanyClick?.(company.id)}
                            className={cn(
                                "hover:bg-slate-50 transition-colors",
                                onCompanyClick && "cursor-pointer"
                            )}
                        >
                            <td className="py-2.5 pr-4">
                                <span className="font-medium text-slate-900">{company.name}</span>
                            </td>
                            <td className="py-2.5 pr-4 hidden sm:table-cell">
                                <a
                                    href={`https://${company.domain}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                >
                                    {company.domain}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </td>
                            <td className="py-2.5 pr-4 text-slate-600 hidden md:table-cell">{company.industry}</td>
                            <td className="py-2.5 text-right">
                                <span className={cn(
                                    "inline-block px-2 py-0.5 rounded-full text-xs font-medium",
                                    getScoreColor(company.fitScore)
                                )}>
                                    {company.fitScore.toFixed(1)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
