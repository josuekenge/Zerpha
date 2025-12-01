import { Company } from '../types';
import { cn } from '../lib/utils';
import { ChevronRight } from 'lucide-react';

interface CompanyListItemProps {
  company: Company;
  isSelected: boolean;
  onClick: () => void;
}

function FitBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs font-medium text-muted bg-background px-2 py-1 rounded">Fit N/A</span>;
  
  let colorClass = 'bg-background text-muted border-border';
  if (score >= 8) colorClass = 'bg-success/10 text-success border-success/20';
  else if (score >= 5) colorClass = 'bg-warning/10 text-warning border-warning/20';
  else colorClass = 'bg-danger/10 text-danger border-danger/20';

  return (
    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", colorClass)}>
      Fit {score}/10
    </span>
  );
}

export function CompanyListItem({ company, isSelected, onClick }: CompanyListItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer mb-2",
        isSelected 
          ? "bg-primarySoft border-primary shadow-sm" 
          : "bg-surface border-border hover:border-primary/30 hover:shadow-soft"
      )}
    >
      <div className="flex justify-between items-start mb-1">
        <div>
          <h3 className={cn("font-bold text-sm mb-0.5", isSelected ? "text-primary" : "text-text")}>
            {company.name}
          </h3>
          <div className="text-xs text-muted font-medium truncate max-w-[160px]">
            {company.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
          </div>
        </div>
        <FitBadge score={company.acquisition_fit_score} />
      </div>
      
      {isSelected && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary">
           <ChevronRight className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
