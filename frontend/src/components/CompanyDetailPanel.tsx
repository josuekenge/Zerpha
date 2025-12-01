import { Company } from '../types';
import { ExternalLink, Building2, Users, Globe, Wallet, BarChart3, FileText } from 'lucide-react';
import { cn } from '../lib/utils';

interface CompanyDetailPanelProps {
  company: Company;
  onGenerateInfographic: () => void;
}

function SectionCard({ title, icon: Icon, children, className }: { title: string, icon?: any, children: React.ReactNode, className?: string }) {
  return (
    <section className={cn("bg-surface rounded-xl border border-border shadow-soft p-6", className)}>
      <h3 className="flex items-center text-xs font-bold text-text uppercase tracking-wider mb-4 gap-2">
        {Icon ? <Icon className="w-4 h-4 text-primary" /> : <div className="w-1 h-4 bg-primary rounded-full" />}
        {title}
      </h3>
      {children}
    </section>
  );
}

export function CompanyDetailPanel({ company, onGenerateInfographic }: CompanyDetailPanelProps) {
  const { raw_json } = company;

  const score = company.acquisition_fit_score ?? 0;
  let fitLabel = "Low Fit";
  let fitColor = "text-danger bg-danger/10";
  if (score >= 8) {
    fitLabel = "High Fit";
    fitColor = "text-success bg-success/10";
  } else if (score >= 5) {
    fitLabel = "Medium Fit";
    fitColor = "text-warning bg-warning/10";
  }

  return (
    <div className="h-full overflow-y-auto bg-background p-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 bg-surface p-4 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-text mb-1">{company.name}</h1>
          <a
            href={company.website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center text-muted hover:text-primary text-sm font-medium transition-colors"
          >
            {company.website} <ExternalLink className="w-3 h-3 ml-1.5 opacity-50" />
          </a>
        </div>
        <button
          onClick={onGenerateInfographic}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-border hover:border-primary hover:text-primary text-muted text-sm font-semibold rounded-lg shadow-sm transition-all"
        >
          <FileText className="w-4 h-4" />
          Generate Infographic
        </button>
      </div>

      <div className="grid gap-6 max-w-4xl mx-auto">
        {/* Summary */}
        <SectionCard title="Executive Summary" icon={null}>
          <p className="text-text text-base leading-relaxed">
            {company.summary || <span className="text-muted italic">Not available</span>}
          </p>
        </SectionCard>

        {/* Fit Score Analysis */}
        <SectionCard title="Acquisition Fit Analysis" icon={BarChart3}>
           <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 text-center">
                 <div className="text-5xl font-bold text-text mb-2">
                    {company.acquisition_fit_score ?? '-'}<span className="text-xl text-muted font-normal">/10</span>
                 </div>
                 <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase", fitColor)}>
                    {fitLabel}
                 </span>
              </div>
              <div className="flex-1 pt-1 border-l border-border pl-6">
                <p className="text-text leading-relaxed">
                   {raw_json.acquisition_fit_reason || 'No detailed fit analysis provided.'}
                </p>
              </div>
           </div>
        </SectionCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Market */}
          <SectionCard title="Product & Market" icon={Building2}>
             <dl className="space-y-4">
                <div>
                   <dt className="text-xs font-medium text-muted mb-1">Product Offering</dt>
                   <dd className="text-text font-medium text-sm leading-relaxed">{raw_json.product_offering || <span className="text-muted">Not available</span>}</dd>
                </div>
                <div>
                   <dt className="text-xs font-medium text-muted mb-1">Customer Segment</dt>
                   <dd className="text-text font-medium text-sm">{raw_json.customer_segment || <span className="text-muted">Not available</span>}</dd>
                </div>
                <div>
                   <dt className="text-xs font-medium text-muted mb-1">Pricing Model</dt>
                   <dd className="text-text font-medium text-sm">{raw_json.pricing_model || <span className="text-muted">Not available</span>}</dd>
                </div>
             </dl>
          </SectionCard>

          {/* Operations */}
          <SectionCard title="Operations" icon={Users}>
             <dl className="space-y-4">
                <div>
                   <dt className="text-xs font-medium text-muted mb-1">Headquarters</dt>
                   <dd className="text-text font-medium text-sm flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted" /> {raw_json.hq_location || <span className="text-muted">Not available</span>}
                   </dd>
                </div>
                <div>
                   <dt className="text-xs font-medium text-muted mb-1">Estimated Headcount</dt>
                   <dd className="text-text font-medium text-sm">{raw_json.estimated_headcount || <span className="text-muted">Not available</span>}</dd>
                </div>
                <div>
                   <dt className="text-xs font-medium text-muted mb-1">Tech Stack</dt>
                   <dd className="text-text font-medium text-sm">
                      {raw_json.tech_stack || <span className="text-muted">Not available</span>}
                   </dd>
                </div>
             </dl>
          </SectionCard>
        </div>

        {/* Global Opportunities */}
        <SectionCard title="Global Opportunities" icon={Wallet}>
          <p className="text-text text-sm leading-relaxed">
            {raw_json.global_opportunities || <span className="text-muted">No specific opportunities identified.</span>}
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
