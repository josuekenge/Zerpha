import { Company } from '../types';
import { cn, formatDomain } from '../lib/utils';
import { CompanyAvatar } from './CompanyAvatar';

interface CompanyListItemProps {
  company: Company;
  isSelected: boolean;
  onClick: () => void;
  onSave?: () => void;
  isSaving?: boolean;
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

export function CompanyListItem({
  company,
  isSelected,
  onClick,
  onSave,
  isSaving,
}: CompanyListItemProps) {
  const websiteLabel = formatDomain(company.website);

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 rounded-xl border transition-all duration-200 cursor-pointer bg-white',
        isSelected
          ? 'border-primary bg-primarySoft/60 shadow-sm'
          : 'border-border hover:border-primary/40 hover:shadow-soft'
      )}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <CompanyAvatar
            name={company.name}
            faviconUrl={company.favicon_url}
            website={company.website}
            size={32}
          />
          <div className="min-w-0">
            <h3
              className={cn(
                'font-semibold text-sm truncate',
                isSelected ? 'text-primary' : 'text-text',
              )}
            >
              {company.name}
            </h3>
            <div className="text-xs text-muted font-medium truncate">{websiteLabel}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <FitBadge score={company.acquisition_fit_score} />
          {onSave && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onSave();
              }}
              disabled={isSaving}
              className={cn(
                'text-[11px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border transition',
                company.is_saved
                  ? 'text-success border-success/30 bg-success/10'
                  : 'text-primary border-primary/40 bg-primarySoft/60 hover:bg-primarySoft',
                isSaving && 'opacity-60 cursor-not-allowed',
              )}
            >
              {company.is_saved ? 'Saved' : isSaving ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
