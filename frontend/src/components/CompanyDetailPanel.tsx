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
  let fitLabel = 'Low Fit';
  // Premium enterprise color palette using inline styles
  let fitStyle = { backgroundColor: '#FDEDED', color: '#B91C1C', borderColor: '#DC2626' };

  if (score !== null) {
    if (score >= 7.5) {
      fitLabel = 'High Fit';
      fitStyle = { backgroundColor: '#E6F4F1', color: '#0F766E', borderColor: '#0D9488' };
    } else if (score >= 5) {
      fitLabel = 'Medium Fit';
      fitStyle = { backgroundColor: '#FFF7E6', color: '#B45309', borderColor: '#D97706' };
    }
  }

  const renderTechStack = (stack: unknown) => {
    if (Array.isArray(stack)) {
      return stack.map((tech: string) => (
        <span key={tech} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200">
          {tech}
        </span>
      ));
    }
    if (typeof stack === 'string') {
      return stack.split(',').map((tech: string) => (
        <span key={tech.trim()} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200">
          {tech.trim()}
        </span>
      ));
    }
    return <span className="text-slate-400 italic">N/A</span>;
  };

  return (
    <>
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-5 z-20">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <CompanyAvatar
              name={company.name}
              faviconUrl={company.favicon_url}
              website={company.website}
              size={40}
            />
            <div>
              <h2 className="text-xl font-semibold text-slate-900 tracking-tight">{company.name}</h2>
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-0.5"
              >
                {company.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
          <div className="flex gap-2">
            {score !== null && (
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold"
                style={{
                  backgroundColor: fitStyle.backgroundColor,
                  color: fitStyle.color,
                  border: `1px solid ${fitStyle.borderColor}`
                }}
              >
                {fitLabel} {score}
              </span>
            )}
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">

        {/* Section: Executive Summary */}
        <section>
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" /> Executive Summary
          </h3>
          <div className="text-base text-slate-600 leading-relaxed border border-slate-100 rounded-lg p-4 bg-slate-50/50">
            <p>
              {company.summary || 'No executive summary available.'}
            </p>
          </div>
        </section>

        {/* Section: Acquisition Fit */}
        <section>
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-slate-400" /> Acquisition Fit
          </h3>
          <div className="text-base text-slate-600 leading-relaxed space-y-4">
            <p>
              {raw_json.acquisition_fit_reason || 'No detailed fit analysis provided.'}
            </p>
          </div>
        </section>

        {/* Section: Product & Market */}
        <section className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">Product & Market</h3>
          </div>
          <div className="divide-y divide-slate-100">
            <div className="p-4 grid grid-cols-3 gap-4">
              <div className="text-sm font-medium text-slate-500">Offering</div>
              <div className="col-span-2 text-sm text-slate-700 leading-relaxed">
                {raw_json.product_offering || 'N/A'}
              </div>
            </div>
            <div className="p-4 grid grid-cols-3 gap-4">
              <div className="text-sm font-medium text-slate-500">Segment</div>
              <div className="col-span-2 text-sm text-slate-700 leading-relaxed">
                {raw_json.customer_segment || 'N/A'}
              </div>
            </div>
            <div className="p-4 grid grid-cols-3 gap-4">
              <div className="text-sm font-medium text-slate-500">Pricing</div>
              <div className="col-span-2 text-sm text-slate-700 leading-relaxed">
                {raw_json.pricing_model || 'N/A'}
              </div>
            </div>
          </div>
        </section>

        {/* Section: Operations */}
        <section className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">Operations</h3>
          </div>
          <div className="divide-y divide-slate-100">
            <div className="p-4 flex justify-between items-center">
              <span className="text-sm font-medium text-slate-500">HQ Location</span>
              <span className="text-sm font-medium text-slate-900">{raw_json.hq_location || 'Unknown'}</span>
            </div>
            <div className="p-4 flex justify-between items-center">
              <span className="text-sm font-medium text-slate-500">Headcount</span>
              <span className="text-sm font-medium text-slate-900">{raw_json.estimated_headcount || 'Unknown'}</span>
            </div>
            <div className="p-4">
              <span className="text-sm font-medium text-slate-500 block mb-2">Tech Stack</span>
              <div className="flex flex-wrap gap-2">
                {renderTechStack(raw_json.tech_stack)}
              </div>
            </div>
          </div>
        </section>

        {/* Section: People */}
        <section className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              People
            </h3>
          </div>

          <div className="p-4">
            {peopleLoading ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Fetching decision makers…
              </div>
            ) : people.length === 0 ? (
              <p className="text-sm text-slate-500">
                No contacts found for this company.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
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
                        isHighlighted && "bg-amber-50/50 -mx-4 px-4 rounded-lg"
                      )}
                    >
                      <div>
                        <p className={cn(
                          "text-sm text-slate-900",
                          isHighlighted ? "font-bold" : "font-semibold"
                        )}>
                          {person.full_name || 'Unknown contact'}
                          {badges.length > 0 && (
                            <span className="ml-2 inline-flex gap-1">
                              {badges.map((badge) => (
                                <span
                                  key={badge}
                                  className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700 rounded"
                                >
                                  {badge}
                                </span>
                              ))}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">
                          {person.role || 'Unknown role'}
                        </p>
                      </div>
                      <div className="text-sm text-slate-600 space-y-1">
                        {person.email && (
                          <a
                            href={`mailto:${person.email}`}
                            className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
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
        <section className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Key Info</h3>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex justify-between">
              <span className="text-xs text-slate-400 font-mono">ID</span>
              <span className="text-xs text-slate-500 font-mono">{company.id.slice(0, 24)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">Added</span>
              <span className="text-xs text-slate-600">
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
