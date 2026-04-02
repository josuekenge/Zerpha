import { useMemo } from 'react';
import {
  BarChart, Bar, Cell, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Layers, Activity, CheckCircle, TrendingUp } from 'lucide-react';
import { PipelineResponse, PipelineStage } from '../api/client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { CompanyAvatar } from './CompanyAvatar';
import { cn } from '../lib/utils';

interface PipelineSummaryProps {
  pipeline: PipelineResponse;
}

const STAGE_COLORS: Record<PipelineStage, string> = {
  new: '#6b7280',
  researching: '#60a5fa',
  contacted: '#fbbf24',
  in_diligence: '#a78bfa',
  closed: '#34d399',
};

// ── custom tooltip ─────────────────────────────────────────────────────────

function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#18181b] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white shadow-xl">
      {label && <p className="text-white/50 mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? p.fill ?? '#a78bfa' }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ── main ───────────────────────────────────────────────────────────────────

export function PipelineSummary({ pipeline }: PipelineSummaryProps) {
  const stats = useMemo(() => {
    const total = pipeline.stages.reduce((sum, s) => sum + s.companies.length, 0);

    const stageBreakdown = pipeline.stages.map(s => ({
      id: s.id,
      label: s.label,
      count: s.companies.length,
      pct: total > 0 ? Math.round((s.companies.length / total) * 100) : 0,
      fill: STAGE_COLORS[s.id],
    }));

    const closedStage = pipeline.stages.find(s => s.id === 'closed');
    const closedDeals = closedStage?.companies ?? [];
    const activeDeals = total - closedDeals.length;
    const conversionRate = total > 0 ? Math.round((closedDeals.length / total) * 100) : 0;

    // Avg fit score across all companies
    const allCompanies = pipeline.stages.flatMap(s => s.companies);
    const scored = allCompanies.filter(c => c.fitScore != null);
    const avgFit = scored.length > 0
      ? (scored.reduce((sum, c) => sum + (c.fitScore ?? 0), 0) / scored.length).toFixed(1)
      : '—';

    return { total, stageBreakdown, closedDeals, activeDeals, conversionRate, avgFit, allCompanies };
  }, [pipeline]);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 bg-[#09090b]">

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<Layers className="w-4 h-4" />} label="Total Companies" value={stats.total.toString()} iconColor="text-violet-400" iconBg="bg-violet-500/10" />
        <MetricCard icon={<Activity className="w-4 h-4" />} label="Active Deals" value={stats.activeDeals.toString()} iconColor="text-blue-400" iconBg="bg-blue-500/10" live />
        <MetricCard icon={<CheckCircle className="w-4 h-4" />} label="Closed Deals" value={stats.closedDeals.length.toString()} iconColor="text-emerald-400" iconBg="bg-emerald-500/10" />
        <MetricCard icon={<TrendingUp className="w-4 h-4" />} label="Conversion Rate" value={`${stats.conversionRate}%`} iconColor="text-amber-400" iconBg="bg-amber-500/10" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Stage bar chart */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.stageBreakdown} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" name="Companies" radius={[4, 4, 0, 0]}>
                  {stats.stageBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Donut / pie */}
        <Card>
          <CardHeader>
            <CardTitle>Stage Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative shrink-0">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={stats.stageBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={72}
                      paddingAngle={2}
                      dataKey="count"
                      strokeWidth={0}
                    >
                      {stats.stageBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} opacity={entry.count === 0 ? 0.15 : 1} />
                      ))}
                    </Pie>
                    <Tooltip content={<DarkTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-white">{stats.total}</span>
                  <span className="text-[10px] text-white/30 uppercase tracking-widest">Total</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-2.5">
                {stats.stageBreakdown.map(s => (
                  <div key={s.id} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.fill }} />
                    <span className="text-xs text-white/50 flex-1 truncate">{s.label}</span>
                    <span className="text-xs font-semibold text-white tabular-nums">{s.count}</span>
                    <span className="text-[10px] text-white/25 w-8 text-right tabular-nums">{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recently Closed */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Closed</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          {stats.closedDeals.length === 0 ? (
            <p className="text-sm text-white/30 py-4">No closed deals yet</p>
          ) : (
            <ScrollArea className="h-[240px] pr-3">
              <div className="space-y-1">
                {stats.closedDeals.map((company) => {
                  const score = company.fitScore;
                  const scoreColor = score == null ? 'text-white/25' : score >= 7.5 ? 'text-emerald-400' : score >= 5 ? 'text-amber-400' : 'text-red-400';
                  return (
                    <div key={company.id} className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors">
                      <CompanyAvatar name={company.name} faviconUrl={company.faviconUrl} website={company.domain} size={28} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/90 truncate">{company.name}</p>
                        <p className="text-[11px] text-white/30 truncate">{company.domain}</p>
                      </div>
                      <span className={cn("text-xs font-semibold tabular-nums", scoreColor)}>
                        {score?.toFixed(1) ?? '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

// ── MetricCard ─────────────────────────────────────────────────────────────

function MetricCard({ icon, label, value, iconColor, iconBg, live }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconColor: string;
  iconBg: string;
  live?: boolean;
}) {
  return (
    <div className="bg-[#0e0e11] rounded-xl border border-white/[0.06] p-4">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${iconBg} ${iconColor}`}>{icon}</div>
        {live && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-white/30 mt-0.5">{label}</p>
    </div>
  );
}
