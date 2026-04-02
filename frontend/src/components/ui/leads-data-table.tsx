import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown, ExternalLink, Mail, Linkedin } from "lucide-react";
import { SavedCompany, PersonSummary } from "../../types";
import { CompanyAvatar } from "../CompanyAvatar";
import { cn, formatDate, normalizeWebsite } from "../../lib/utils";

function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  onClick,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (v: boolean) => void;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      onClick={(e) => { onClick?.(e); onChange(!checked); }}
      className={cn(
        "w-3.5 h-3.5 rounded-sm border flex items-center justify-center flex-shrink-0 transition-all duration-150",
        checked || indeterminate
          ? "bg-violet-500/70 border-violet-400/60"
          : "bg-white/[0.03] border-white/[0.10] hover:border-white/20"
      )}
    >
      {indeterminate && <div className="w-1.5 h-px bg-white/80 rounded-full" />}
      {checked && !indeterminate && (
        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

interface LeadsDataTableProps {
  companies?: SavedCompany[];
  onCompanyAction?: (companyId: string, action: "remove") => void;
  className?: string;
}

type SortField = "fitScore" | "added" | "lastName";
type SortDirection = "asc" | "desc";

type LeadRow = {
  person: PersonSummary | null;
  company: SavedCompany;
  rowKey: string;
};

const PIPELINE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  new:          { label: "NEW",          bg: "bg-purple-500/10",  text: "text-purple-400",  border: "border-purple-500/20"  },
  researching:  { label: "RESEARCHING",  bg: "bg-blue-500/10",    text: "text-blue-400",    border: "border-blue-500/20"    },
  contacted:    { label: "CONTACTED",    bg: "bg-yellow-500/10",  text: "text-yellow-400",  border: "border-yellow-500/20"  },
  in_diligence: { label: "IN DILIGENCE", bg: "bg-orange-500/10",  text: "text-orange-400",  border: "border-orange-500/20"  },
  closed:       { label: "CLOSED",       bg: "bg-green-500/10",   text: "text-green-400",   border: "border-green-500/20"   },
};

function StagePill({ stage }: { stage: string | null | undefined }) {
  if (!stage) return <span className="text-xs text-white/20 italic">—</span>;
  const cfg = PIPELINE_CONFIG[stage] ?? {
    label: stage.toUpperCase(),
    bg: "bg-white/[0.06]",
    text: "text-white/50",
    border: "border-white/10",
  };
  return (
    <span className={cn("px-2 py-1 rounded-lg text-xs font-medium border", cfg.bg, cfg.text, cfg.border)}>
      {cfg.label}
    </span>
  );
}

function FitScoreBar({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-white/20 italic">—</span>;
  // Scores are on a 0–10 scale; normalise to 0–100 for bar width
  const normalised = score <= 10 ? score * 10 : score;
  const pct = Math.min(Math.max(normalised, 0), 100);
  const color =
    pct >= 70 ? "bg-green-500" :
    pct >= 40 ? "bg-orange-500" :
                "bg-red-500";
  return (
    <div className="flex items-center gap-2 min-w-[72px]">
      <div className="flex-1 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-white/70 w-6 text-right">{score}</span>
    </div>
  );
}

function SeniorityBadge({ person }: { person: PersonSummary }) {
  if (person.is_ceo) return (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">CEO</span>
  );
  if (person.is_founder) return (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">FOUNDER</span>
  );
  if (person.is_executive) return (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">EXEC</span>
  );
  return null;
}

const containerVariants = {
  visible: { transition: { staggerChildren: 0.03, delayChildren: 0.05 } },
};

const rowVariants = {
  hidden:  { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 400, damping: 28, mass: 0.6 },
  },
};

export function LeadsDataTable({
  companies = [],
  onCompanyAction,
  className = "",
}: LeadsDataTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set()); // keyed by rowKey
  const [sortField, setSortField] = useState<SortField>("fitScore");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  useReducedMotion();

  // ── Flatten companies → one row per person (or one row per company if no people) ──
  const allRows: LeadRow[] = [];
  for (const company of companies) {
    if (company.people && company.people.length > 0) {
      for (const person of company.people) {
        allRows.push({ person, company, rowKey: `${company.id}_${person.id}` });
      }
    } else {
      allRows.push({ person: null, company, rowKey: company.id });
    }
  }

  // ── Sorting ──────────────────────────────────────────────────────────────────
  const sorted = [...allRows].sort((a, b) => {
    let av = 0, bv = 0;
    if (sortField === "fitScore") {
      av = a.company.fitScore ?? -1;
      bv = b.company.fitScore ?? -1;
    } else if (sortField === "added") {
      av = new Date(a.company.created_at ?? 0).getTime();
      bv = new Date(b.company.created_at ?? 0).getTime();
    } else if (sortField === "lastName") {
      const al = (a.person?.last_name ?? a.company.name).toLowerCase();
      const bl = (b.person?.last_name ?? b.company.name).toLowerCase();
      return sortDir === "asc" ? al.localeCompare(bl) : bl.localeCompare(al);
    }
    return sortDir === "desc" ? bv - av : av - bv;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  // ── Selection ────────────────────────────────────────────────────────────────
  const isAllSelected = selected.size === sorted.length && sorted.length > 0;
  const isIndeterminate = selected.size > 0 && selected.size < sorted.length;
  const toggleOne = (key: string, checked: boolean) => {
    const next = new Set(selected);
    checked ? next.add(key) : next.delete(key);
    setSelected(next);
  };
  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(sorted.map((r) => r.rowKey)) : new Set());
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <div className="flex items-center gap-1 cursor-pointer select-none" onClick={() => toggleSort(field)}>
      {children}
      <ChevronDown className={cn(
        "w-3 h-3 text-white/30 transition-transform",
        sortField === field && sortDir === "asc" && "rotate-180",
        sortField !== field && "opacity-0 group-hover:opacity-100",
      )} />
    </div>
  );

  return (
    <div className={cn("w-full", className)}>
      <div className="border border-white/[0.06] rounded-2xl overflow-hidden">

        {/* Header */}
        <div className="grid grid-cols-[1fr_1fr_1.5fr_2.2fr_1.8fr_1fr_1.1fr_0.8fr] gap-3 px-5 py-3 text-xs font-medium text-white/30 uppercase tracking-wide bg-white/[0.02] border-b border-white/[0.06] group">
          <div className="flex items-center gap-2.5">
            <Checkbox
              checked={isAllSelected}
              indeterminate={isIndeterminate}
              onChange={toggleAll}
            />
            <span>First Name</span>
          </div>
          <SortHeader field="lastName">Last Name</SortHeader>
          <div>Title / Role</div>
          <div>Email</div>
          <div>Company</div>
          <div>Stage</div>
          <SortHeader field="fitScore">Fit Score</SortHeader>
          <SortHeader field="added">Added</SortHeader>
        </div>

        {/* Rows */}
        {sorted.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-white/30">
            No leads yet. Run a search and save companies to see them here.
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            {sorted.map(({ person, company, rowKey }, index) => (
              <motion.div key={rowKey} variants={rowVariants}>
                <div className={cn(
                  "grid grid-cols-[1fr_1fr_1.5fr_2.2fr_1.8fr_1fr_1.1fr_0.8fr] gap-3 px-5 py-3 transition-colors",
                  "hover:bg-white/[0.025]",
                  selected.has(rowKey) && "bg-violet-500/[0.05]",
                  index < sorted.length - 1 && "border-b border-white/[0.04]",
                )}>

                  {/* First Name */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Checkbox
                      checked={selected.has(rowKey)}
                      onChange={(v) => toggleOne(rowKey, v)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-sm text-white/80 truncate">
                      {person?.first_name ?? <span className="text-white/20 italic">—</span>}
                    </span>
                  </div>

                  {/* Last Name */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm text-white/80 truncate">
                      {person?.last_name ?? <span className="text-white/20 italic">—</span>}
                    </span>
                    {person && <SeniorityBadge person={person} />}
                  </div>

                  {/* Title / Role */}
                  <div className="flex items-center min-w-0">
                    <span className="text-xs text-white/55 truncate">
                      {person?.role ?? <span className="italic text-white/20">—</span>}
                    </span>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    {person?.email ? (
                      <>
                        <a
                          href={`mailto:${person.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-white/60 hover:text-violet-400 truncate transition-colors flex items-center gap-1 min-w-0"
                        >
                          <Mail className="w-3 h-3 flex-shrink-0 text-white/30" />
                          <span className="truncate">{person.email}</span>
                        </a>
                        {person.linkedin_url && (
                          <a
                            href={person.linkedin_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-white/25 hover:text-blue-400 transition-colors flex-shrink-0"
                          >
                            <Linkedin className="w-3 h-3" />
                          </a>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-white/20 italic">—</span>
                    )}
                  </div>

                  {/* Company */}
                  <div className="flex items-center gap-2 min-w-0">
                    <CompanyAvatar
                      name={company.name}
                      faviconUrl={company.favicon_url}
                      website={normalizeWebsite(company.domain)}
                      size={24}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-white/80 truncate">{company.name}</div>
                      <a
                        href={normalizeWebsite(company.domain)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] text-violet-400/60 hover:text-violet-400 truncate flex items-center gap-0.5 transition-colors"
                      >
                        {company.domain}
                        <ExternalLink className="w-2 h-2 flex-shrink-0" />
                      </a>
                    </div>
                  </div>

                  {/* Stage */}
                  <div className="flex items-center">
                    <StagePill stage={company.pipeline_stage} />
                  </div>

                  {/* Fit Score */}
                  <div className="flex items-center">
                    <FitScoreBar score={company.fitScore} />
                  </div>

                  {/* Added */}
                  <div className="flex items-center">
                    <span className="text-xs text-white/30">{formatDate(company.created_at)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* ── Bulk Action Bar ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0, filter: "blur(8px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: 100, opacity: 0, filter: "blur(8px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-[#16161a]/95 backdrop-blur-lg border border-white/[0.08] rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-4">
              <span className="text-xs font-medium text-white/60">
                {selected.size} {selected.size === 1 ? "lead" : "leads"} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const selectedRows = sorted.filter((r) => selected.has(r.rowKey));
                    const csv = [
                      "Company,Domain,First Name,Last Name,Title,Email,Fit Score,Stage",
                      ...selectedRows.map(({ person, company }) =>
                        [
                          company.name,
                          company.domain,
                          person?.first_name ?? "",
                          person?.last_name ?? "",
                          person?.role ?? "",
                          person?.email ?? "",
                          company.fitScore ?? "",
                          company.pipeline_stage ?? "",
                        ].join(",")
                      ),
                    ].join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "zerpha-leads.csv";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.10] text-white/70 rounded-lg text-xs font-medium transition-colors"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => {
                    const companyIds = new Set(
                      sorted.filter((r) => selected.has(r.rowKey)).map((r) => r.company.id)
                    );
                    companyIds.forEach((id) => onCompanyAction?.(id, "remove"));
                    setSelected(new Set());
                  }}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
