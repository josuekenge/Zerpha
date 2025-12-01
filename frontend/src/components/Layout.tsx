import { ReactNode } from 'react';
import { LayoutGrid } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col font-sans text-text">
      <nav className="flex-shrink-0 h-16 px-6 md:px-8 flex items-center justify-between bg-surface border-b border-border z-50 sticky top-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-text">
              Zerpha
            </span>
          </div>
          <div className="hidden md:block h-6 w-px bg-border" />
          <span className="hidden md:block text-sm font-medium text-muted">
            AI M&A Vertical Scouting
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="px-3 py-1 rounded-full bg-primarySoft text-primary text-xs font-semibold uppercase tracking-wide">
            Private Beta
          </span>
        </div>
      </nav>
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}
