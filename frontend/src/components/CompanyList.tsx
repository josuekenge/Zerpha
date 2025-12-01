import { Company } from '../types';
import { CompanyListItem } from './CompanyListItem';

interface CompanyListProps {
  companies: Company[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function CompanyList({ companies, selectedId, onSelect }: CompanyListProps) {
  return (
    <div className="bg-white shadow-sm border-r border-slate-200 h-full overflow-y-auto">
      {companies.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-sm">
          No companies found.
        </div>
      ) : (
        companies.map((company) => (
          <CompanyListItem
            key={company.id}
            company={company}
            isSelected={company.id === selectedId}
            onClick={() => onSelect(company.id)}
          />
        ))
      )}
    </div>
  );
}


