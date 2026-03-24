import { Company, Person } from '../types';
import {
  ExternalLink,
  Download,
  Loader2,
  FileText,
  Target,
  Users,
  Mail,
  Phone,
} from 'lucide-react';
import { cn, downloadInfographicPdf } from '../lib/utils';
import { useEffect, useState } from 'react';
import { exportInfographic } from '../api/client';
import { getPeopleByCompanyId } from '../api/people';
import { CompanyAvatar } from './CompanyAvatar';
import { FitScoreBar } from './FitScoreBar';

interface CompanyDetailPanelProps {
  company: Company;
  onGenerateInfographic?: () => void; // Made optional to match usage in App.tsx
}

export function CompanyDetailPanel({ company }: CompanyDetailPanelProps) {
  const { raw_json } = company;
  const [isExporting, setIsExporting] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const result = await exportInfographic(company.id);
      downloadInfographicPdf(result.infographic);
    } catch (error) {
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    let isActive = true;
    setPeople([]);
    setPeopleLoading(true);

    getPeopleByCompanyId(company.id)
      .then((results) => {
        if (isActive) {
          setPeople(results);
        }
      })
      .catch((error) => {
        console.error('Failed to load people', error);
      })
      .finally(() => {
        if (isActive) {
          setPeopleLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [company.id]);

  const score = company.acquisition_fit_score ?? null;

  const renderTechStack = (stack: unknown) => {
    if (Array.isArray(stack)) {
      return stack.map((tech: string) => (
        <span key={tech} className="px-2 py-1 bg-white/[0.06] text-white/60 text-xs rounded border border-white/[0.06]">
          {tech}
        </span>
      ));
    }
    if (typeof stack === 'string') {
      return stack.split(',').map((tech: string) => (
        <span key={tech.trim()} className="px-2 py-1 bg-white/[0.06] text-white/60 text-xs rounded border border-white/[0.06]">
          {tech.trim()}
        </span>
      ));
    }
    return <span className="text-white/30 italic">N/A</span>;
  };

  return (
    <>
      {/* Sticky Header */}
      <div className="sticky top-0 bg-[#0e0e11]/90 backdrop-blur-md border-b border-white/[0.06] px-6 py-5 z-20">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <CompanyAvatar
              name={company.name}
              faviconUrl={company.favicon_url}
              website={company.website}
              size={40}
            />
            <div>
              <h2 className="text-xl font-semibold text-white tracking-tight">{company.name}</h2>
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-0.5"
              >
                {company.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Fit Score Bar */}
            <div className="min-w-[120px]">
              <FitScoreBar score={score} />
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">

        {/* Section: Executive Summary */}
        <section className="border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="bg-white/[0.03] px-4 py-2.5 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-white/30" /> Executive Summary
            </h3>
          </div>
          <div className="bg-white/[0.03] p-4">
            <p className="text-sm text-white/60 leading-relaxed">
              {company.summary || 'No executive summary available.'}
            </p>
          </div>
        </section>

        {/* Section: Acquisition Fit */}
        <section className="border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="bg-white/[0.03] px-4 py-2.5 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-white/30" /> Fit Analysis
            </h3>
          </div>
          <div className="bg-white/[0.03] p-4">
            <p className="text-sm text-white/60 leading-relaxed">
              {raw_json.acquisition_fit_reason || 'No detailed fit analysis provided.'}
            </p>
          </div>
        </section>

        {/* Section: Product & Market */}
        <section className="border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="bg-white/[0.03] px-4 py-2.5 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white">Product & Market</h3>
          </div>
          <div className="bg-white/[0.03] divide-y divide-white/[0.06]">
            <div className="p-4 grid grid-cols-3 gap-4">
              <div className="text-sm font-medium text-white/60">Offering</div>
              <div className="col-span-2 text-sm text-white/60 leading-relaxed">
                {raw_json.product_offering || 'N/A'}
              </div>
            </div>
            <div className="p-4 grid grid-cols-3 gap-4">
              <div className="text-sm font-medium text-white/60">Segment</div>
              <div className="col-span-2 text-sm text-white/60 leading-relaxed">
                {raw_json.customer_segment || 'N/A'}
              </div>
            </div>
            <div className="p-4 grid grid-cols-3 gap-4">
              <div className="text-sm font-medium text-white/60">Pricing</div>
              <div className="col-span-2 text-sm text-white/60 leading-relaxed">
                {raw_json.pricing_model || 'N/A'}
              </div>
            </div>
          </div>
        </section>

        {/* Section: Operations */}
        <section className="border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="bg-white/[0.03] px-4 py-2.5 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white">Operations</h3>
          </div>
          <div className="bg-white/[0.03] divide-y divide-white/[0.06]">
            <div className="p-4 flex justify-between items-center">
              <span className="text-sm font-medium text-white/60">HQ Location</span>
              <span className="text-sm font-medium text-white">{raw_json.hq_location || 'Unknown'}</span>
            </div>
            <div className="p-4 flex justify-between items-center">
              <span className="text-sm font-medium text-white/60">Headcount</span>
              <span className="text-sm font-medium text-white">{raw_json.estimated_headcount || 'Unknown'}</span>
            </div>
            <div className="p-4">
              <span className="text-sm font-medium text-white/60 block mb-2">Tech Stack</span>
              <div className="flex flex-wrap gap-2">
                {renderTechStack(raw_json.tech_stack)}
              </div>
            </div>
          </div>
        </section>

        {/* Section: People */}
        <section className="border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="bg-white/[0.03] px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-white/30" />
              People
            </h3>
          </div>
          <div className="bg-white/[0.03] p-4">
            {peopleLoading ? (
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Fetching decision makers…
              </div>
            ) : people.length === 0 ? (
              <p className="text-sm text-white/60">
                No contacts found for this company.
              </p>
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {people.map((person) => {
                  const isHighlighted = person.is_ceo || person.is_founder || person.is_executive;
                  const badges: string[] = [];
                  if (person.is_ceo) badges.push('CEO');
                  if (person.is_founder) badges.push('Founder');
                  if (person.is_executive && !person.is_ceo) badges.push('Executive');

                  return (
                    <li
                      key={person.id}
                      className={cn(
                        "py-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between",
                        isHighlighted && "bg-indigo-500/10 -mx-4 px-4 rounded-lg"
                      )}
                    >
                      <div>
                        <p className={cn(
                          "text-sm text-white",
                          isHighlighted ? "font-bold" : "font-semibold"
                        )}>
                          {person.full_name || 'Unknown contact'}
                          {badges.length > 0 && (
                            <span className="ml-2 inline-flex gap-1">
                              {badges.map((badge) => (
                                <span
                                  key={badge}
                                  className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-indigo-500/20 text-indigo-400 rounded border border-indigo-500/30"
                                >
                                  {badge}
                                </span>
                              ))}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-white/60">
                          {person.role || 'Unknown role'}
                        </p>
                      </div>
                      <div className="text-sm text-white/60 space-y-1">
                        {person.email && (
                          <a
                            href={`mailto:${person.email}`}
                            className="flex items-center gap-1 hover:text-indigo-300 transition-colors"
                          >
                            <Mail className="w-4 h-4" />
                            {person.email}
                          </a>
                        )}
                        {person.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {person.phone}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* Key Info */}
        <section className="border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="bg-white/[0.03] px-4 py-2.5 border-b border-white/[0.06]">
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Key Info</h3>
          </div>
          <div className="bg-white/[0.03] p-4 grid grid-cols-1 gap-2">
            <div className="flex justify-between">
              <span className="text-xs text-white/30 font-mono">ID</span>
              <span className="text-xs text-white/60 font-mono">{company.id.slice(0, 24)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-white/30">Added</span>
              <span className="text-xs text-white/60">
                {company.created_at ? new Date(company.created_at).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
          </div>
        </section>

        <div className="h-8"></div> {/* Spacing at bottom */}
      </div>
    </>
  );
}
