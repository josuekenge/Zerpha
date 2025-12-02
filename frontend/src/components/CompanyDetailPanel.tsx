import { Company } from '../types';
import {
  ExternalLink,
  Download,
  Loader2,
  FileText,
  Target,
} from 'lucide-react';
import { cn, downloadInfographicPdf } from '../lib/utils';
import { useState } from 'react';
import { exportInfographic } from '../api/client';

interface CompanyDetailPanelProps {
  company: Company;
  onGenerateInfographic?: () => void; // Made optional to match usage in App.tsx
}

export function CompanyDetailPanel({ company }: CompanyDetailPanelProps) {
  const { raw_json } = company;
  const [isExporting, setIsExporting] = useState(false);

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

  const score = company.acquisition_fit_score ?? null;
  let fitLabel = 'Low Fit';
  let fitColor = 'bg-red-50 text-red-700 border-red-100';
  
  if (score !== null) {
    if (score >= 8) {
      fitLabel = 'High Fit';
      fitColor = 'bg-green-50 text-green-700 border-green-100';
    } else if (score >= 5) {
      fitLabel = 'Medium Fit';
      fitColor = 'bg-yellow-50 text-yellow-700 border-yellow-100';
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
          <div className="flex gap-2">
            {score !== null && (
              <span className={cn("inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border", fitColor)}>
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
