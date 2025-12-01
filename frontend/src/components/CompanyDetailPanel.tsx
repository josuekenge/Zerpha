import { Company } from '../types';
import {
  ExternalLink,
  Building2,
  Users,
  Globe,
  BarChart3,
  FileText,
  Mail,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface CompanyDetailPanelProps {
  company: Company;
  onGenerateInfographic: () => void;
}

function SectionCard({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon?: any;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('bg-white rounded-2xl border border-border/70 shadow-soft p-6', className)}>
      <h3 className="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-widest mb-4">
        {Icon ? <Icon className="w-4 h-4 text-primary" /> : <div className="w-1.5 h-4 rounded-full bg-primary" />}
        {title}
      </h3>
      {children}
    </section>
  );
}

function InfoField({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{label}</p>
      <p className="text-sm text-text mt-1">
        {value || <span className="text-muted">Not available</span>}
      </p>
    </div>
  );
}

export function CompanyDetailPanel({ company, onGenerateInfographic }: CompanyDetailPanelProps) {
  const { raw_json } = company;

  const score = company.acquisition_fit_score ?? null;
  let fitLabel = 'Low Fit';
  let fitColor = 'text-danger bg-danger/10';
  if (score !== null && score >= 8) {
    fitLabel = 'High Fit';
    fitColor = 'text-success bg-success/10';
  } else if (score !== null && score >= 5) {
    fitLabel = 'Medium Fit';
    fitColor = 'text-warning bg-warning/10';
  }

  return (
    <div className="h-full overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <section className="bg-white border border-border/70 rounded-2xl shadow-soft p-6 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text">{company.name}</h1>
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-muted hover:text-primary text-sm font-medium transition-colors"
              >
                {company.website} <ExternalLink className="w-3 h-3 ml-1.5" />
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-semibold border',
                  score === null ? 'text-muted border-border' : fitColor,
                )}
              >
                {score === null ? 'Fit N/A' : `${fitLabel} (${score}/10)`}
              </span>
              <button
                onClick={onGenerateInfographic}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-primary-hover transition"
              >
                <FileText className="w-4 h-4" />
                Generate Infographic
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/70 pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primarySoft text-primary">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted">Headquarters</p>
                <p className="text-sm text-text">
                  {raw_json.hq_location || <span className="text-muted">Not available</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primarySoft text-primary">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                  Estimated headcount
                </p>
                <p className="text-sm text-text">
                  {raw_json.estimated_headcount || <span className="text-muted">Not available</span>}
                </p>
              </div>
            </div>
          </div>
        </section>

        <SectionCard title="Executive Summary">
          <p className="text-sm leading-relaxed text-text">
            {company.summary || <span className="text-muted italic">Not available</span>}
          </p>
        </SectionCard>

        <SectionCard title="Acquisition Fit" icon={BarChart3}>
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            <div className="flex items-center gap-3">
              <div className="text-4xl font-bold text-text">
                {score ?? '-'}
                <span className="text-base text-muted font-normal"> /10</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm leading-relaxed text-text">
                {raw_json.acquisition_fit_reason || 'No detailed fit analysis provided.'}
              </p>
            </div>
          </div>
        </SectionCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SectionCard title="Product & Market" icon={Building2}>
            <div className="space-y-4">
              <InfoField label="Product Offering" value={raw_json.product_offering} />
              <InfoField label="Customer Segment" value={raw_json.customer_segment} />
              <InfoField label="Pricing Model" value={raw_json.pricing_model} />
            </div>
          </SectionCard>

          <SectionCard title="Operations" icon={Users}>
            <div className="space-y-4">
              <InfoField label="Headquarters" value={raw_json.hq_location} />
              <InfoField label="Estimated Headcount" value={raw_json.estimated_headcount} />
              <InfoField label="Tech Stack" value={raw_json.tech_stack} />
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Contacts" icon={Mail}>
          <p className="text-sm text-muted">
            Executive contact and email coming soon. Once available, Zerpha will surface primary deal
            contacts here for quick outreach.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
