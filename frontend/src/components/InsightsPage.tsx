import { useMemo } from 'react';
import {
  BarChart, Bar, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Target, TrendingUp, Star, Activity } from 'lucide-react';
import { SavedCompany } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { AiLoader } from './ui/ai-loader';

interface InsightsPageProps {
  companies: SavedCompany[];
  loading: boolean;
  industryFilter: string;
  locationFilter: string;
  fitFilter: string;
  onCompanyClick?: (companyId: string) => void;
}

// ── helpers ────────────────────────────────────────────────────────────────

function applyFilters(
  companies: SavedCompany[],
  industryFilter: string,
  locationFilter: string,
  fitFilter: string,
): SavedCompany[] {
  return companies.filter((c) => {
    if (industryFilter && c.primary_industry !== industryFilter) return false;
    if (locationFilter && c.headquarters !== locationFilter) return false;
    if (fitFilter === 'high' && (c.fitScore ?? 0) < 7.5) return false;
    if (fitFilter === 'medium' && ((c.fitScore ?? 0) < 5 || (c.fitScore ?? 0) >= 7.5)) return false;
    if (fitFilter === 'low' && (c.fitScore ?? 0) >= 5) return false;
    return true;
  });
}

function getDayKey(dateStr: string): string {
  return dateStr.slice(0, 10); // yyyy-mm-dd
}

function last30DaysData(companies: SavedCompany[]) {
  const today = new Date();
  const days: { date: string; label: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    days.push({ date: key, label, count: 0 });
  }
  for (const c of companies) {
    if (!c.created_at) continue;
    const key = getDayKey(c.created_at);
    const slot = days.find((d) => d.date === key);
    if (slot) slot.count += 1;
  }
  // Keep every 5th label to avoid crowding
  return days.map((d, i) => ({ ...d, label: i % 5 === 0 ? d.label : '' }));
}

const STAGE_COLORS: Record<string, string> = {
  new: '#a78bfa',
  researching: '#60a5fa',
  contacted: '#fbbf24',
  in_diligence: '#fb923c',
  closed: '#34d399',
};

const stageLabel: Record<string, string> = {
  new: 'New',
  researching: 'Researching',
  contacted: 'Contacted',
  in_diligence: 'Diligence',
  closed: 'Closed',
};

// ── custom tooltip ──────────────────────────────────────────────────────────

function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#18181b] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white shadow-xl">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? p.fill ?? '#a78bfa' }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ── main component ──────────────────────────────────────────────────────────

export function InsightsPage({
  companies: allCompanies,
  loading,
  industryFilter,
  locationFilter,
  fitFilter,
}: InsightsPageProps) {
  const companies = useMemo(
    () => applyFilters(allCompanies, industryFilter, locationFilter, fitFilter),
    [allCompanies, industryFilter, locationFilter, fitFilter],
  );

  // ── derived metrics ────────────────────────────────────────────────────

  const totalTargets = companies.length;

  const avgFitScore = useMemo(() => {
    const scored = companies.filter((c) => c.fitScore != null);
    if (!scored.length) return 0;
    return scored.reduce((sum, c) => sum + (c.fitScore ?? 0), 0) / scored.length;
  }, [companies]);

  const highFitCount = useMemo(
    () => companies.filter((c) => (c.fitScore ?? 0) >= 7.5).length,
    [companies],
  );

  const inPipelineCount = useMemo(
    () => companies.filter((c) => c.pipeline_stage && c.pipeline_stage !== 'new').length,
    [companies],
  );

  // ── chart data ─────────────────────────────────────────────────────────

  const fitDistribution = useMemo(() => {
    const buckets = [
      { range: '0–3', min: 0, max: 3, count: 0 },
      { range: '3–5', min: 3, max: 5, count: 0 },
      { range: '5–7', min: 5, max: 7, count: 0 },
      { range: '7–8', min: 7, max: 8, count: 0 },
      { range: '8–9', min: 8, max: 9, count: 0 },
      { range: '9–10', min: 9, max: 10, count: 0 },
    ];
    for (const c of companies) {
      const s = c.fitScore ?? 0;
      const bucket = buckets.find((b) => s >= b.min && s < b.max) ?? buckets[buckets.length - 1];
      bucket.count += 1;
    }
    return buckets;
  }, [companies]);

  const pipelineData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of companies) {
      const s = c.pipeline_stage ?? 'new';
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return Object.entries(counts).map(([stage, count]) => ({
      stage: stageLabel[stage] ?? stage,
      count,
      fill: STAGE_COLORS[stage] ?? '#a78bfa',
    }));
  }, [companies]);

  const addedOverTime = useMemo(() => last30DaysData(companies), [companies]);

  const topTargets = useMemo(
    () =>
      [...companies]
        .filter((c) => c.fitScore != null)
        .sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0))
        .slice(0, 12),
    [companies],
  );

  // ── render ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <AiLoader />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 bg-[#09090b]">

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Target className="w-4 h-4" />}
          label="Total Targets"
          value={totalTargets.toString()}
          iconColor="text-violet-400"
          iconBg="bg-violet-500/10"
        />
        <MetricCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Avg Fit Score"
          value={avgFitScore.toFixed(1)}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10"
        />
        <MetricCard
          icon={<Star className="w-4 h-4" />}
          label="High Fit Targets"
          value={highFitCount.toString()}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
        />
        <MetricCard
          icon={<Activity className="w-4 h-4" />}
          label="In Pipeline"
          value={inPipelineCount.toString()}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
          live
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Fit Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Fit Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={fitDistribution} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="range"
                  tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={24}
                />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" name="Targets" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pipeline Stage Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Stage Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {pipelineData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-white/30">No pipeline data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={pipelineData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="stage"
                    tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    width={24}
                  />
                  <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="count" name="Companies" radius={[4, 4, 0, 0]}>
                    {pipelineData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Targets Added — Last 30 Days */}
      <Card>
        <CardHeader>
          <CardTitle>Targets Added — Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={addedOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: 'rgba(255,255,255,0.30)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.30)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={24}
              />
              <Tooltip content={<DarkTooltip />} cursor={{ stroke: 'rgba(167,139,250,0.3)', strokeWidth: 1 }} />
              <Line
                type="monotone"
                dataKey="count"
                name="Added"
                stroke="#a78bfa"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#a78bfa', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Acquisition Targets */}
      <Card>
        <CardHeader>
          <CardTitle>Top Acquisition Targets</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <ScrollArea className="h-[280px] pr-3">
            {topTargets.length === 0 ? (
              <p className="text-sm text-white/30">No scored targets yet</p>
            ) : (
              <div className="space-y-3">
                {topTargets.map((company, i) => {
                  const score = company.fitScore ?? 0;
                  const pct = Math.min(100, score <= 10 ? score * 10 : score);
                  const barColor =
                    pct >= 70 ? '#22c55e' : pct >= 40 ? '#f97316' : '#ef4444';
                  return (
                    <div key={company.id} className="flex items-center gap-3">
                      <span className="text-xs text-white/20 w-5 text-right shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-white truncate">{company.name}</span>
                          <span className="text-xs text-white/40 shrink-0 ml-2">{score.toFixed(1)}</span>
                        </div>
                        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: barColor }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

    </div>
  );
}

// ── sub-components ──────────────────────────────────────────────────────────

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconColor: string;
  iconBg: string;
  live?: boolean;
}

function MetricCard({ icon, label, value, iconColor, iconBg, live }: MetricCardProps) {
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
