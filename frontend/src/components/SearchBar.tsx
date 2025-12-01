import { Search, ArrowRight } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSearch: () => void;
  isLoading: boolean;
}

const SAMPLE_QUERIES = [
  "logistics SaaS in North America",
  "healthcare payments SaaS",
  "construction project management"
];

export function SearchBar({ value, onChange, onSearch, isLoading }: SearchBarProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative group">
        <div className="relative flex items-center bg-surface rounded-full border border-border shadow-soft transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
          <Search className="absolute left-5 w-5 h-5 text-muted" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="e.g. logistics SaaS in North America"
            className="w-full py-4 pl-12 pr-32 text-base text-text placeholder:text-muted/60 bg-transparent border-none outline-none rounded-full font-medium"
            disabled={isLoading}
          />
          <div className="absolute right-1.5 top-1.5 bottom-1.5">
            <button
              onClick={onSearch}
              disabled={isLoading || !value.trim()}
              className="h-full flex items-center gap-2 px-6 bg-primary hover:bg-primary-hover text-white rounded-full font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Scanning...' : 'Search'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {SAMPLE_QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => onChange(q)}
            className="px-3 py-1.5 rounded-full bg-primarySoft text-primary text-xs font-medium hover:bg-blue-100 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
