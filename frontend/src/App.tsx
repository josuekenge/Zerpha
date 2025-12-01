import { useState } from 'react';
import { Layout } from './components/Layout';
import { SearchBar } from './components/SearchBar';
import { CompanyListItem } from './components/CompanyListItem';
import { CompanyDetailPanel } from './components/CompanyDetailPanel';
import { LoadingOverlay } from './components/LoadingOverlay';
import { DetailSkeleton, ResultListSkeleton } from './components/Skeletons';
import { InfographicModal } from './components/InfographicModal';
import { ParticleBackground } from './components/ParticleBackground';
import { searchCompanies, exportInfographic } from './api/client';
import { Company, InfographicPage } from './types';
import { cn } from './lib/utils';

function App() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Infographic State
  const [isInfographicOpen, setIsInfographicOpen] = useState(false);
  const [infographicLoading, setInfographicLoading] = useState(false);
  const [infographicData, setInfographicData] = useState<InfographicPage | null>(null);
  const [infographicError, setInfographicError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      const response = await searchCompanies(query);
      setCompanies(response.companies);
      setHasSearched(true);
      if (response.companies.length > 0) {
        setSelectedId(response.companies[0].id);
      }
    } catch (err) {
      setSearchError('Failed to complete search. The vertical may be too broad or unavailable.');
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateInfographic = async () => {
    if (!selectedId) return;
    
    setIsInfographicOpen(true);
    setInfographicLoading(true);
    setInfographicError(null);
    setInfographicData(null);

    try {
      const result = await exportInfographic(selectedId);
      setInfographicData(result.infographic);
    } catch (err) {
      console.error(err);
      setInfographicError('Failed to generate infographic. Please try again.');
    } finally {
      setInfographicLoading(false);
    }
  };

  const selectedCompany = companies.find((c) => c.id === selectedId);

  return (
    <Layout>
      <LoadingOverlay isVisible={isSearching} />
      
      <InfographicModal 
        isOpen={isInfographicOpen}
        onClose={() => setIsInfographicOpen(false)}
        isLoading={infographicLoading}
        data={infographicData}
        error={infographicError}
        onRetry={handleGenerateInfographic}
      />

      {!hasSearched ? (
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Particle Background */}
          <ParticleBackground />
          
          <div className="relative z-10 w-full max-w-3xl px-6 text-center">
             <div className="bg-surface/80 backdrop-blur-md rounded-2xl p-12 shadow-card border border-white/60">
               <h1 className="text-5xl md:text-6xl font-display font-bold text-text mb-4 tracking-tight">
                 Find your next acquisition target
               </h1>
               <p className="text-xl text-muted mb-10 font-light max-w-xl mx-auto leading-relaxed">
                 AI-powered scouting that identifies, enriches, and scores vertical SaaS companies.
               </p>
               
               <SearchBar 
                 value={query} 
                 onChange={setQuery} 
                 onSearch={handleSearch} 
                 isLoading={isSearching} 
               />

               {searchError && (
                 <div className="mt-8 p-4 bg-danger/5 border border-danger/10 text-danger rounded-lg text-sm">
                   {searchError}
                 </div>
               )}
             </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden bg-background">
          {/* Left Sidebar: Results */}
          <div className="w-[380px] flex-shrink-0 flex flex-col border-r border-border bg-gradient-to-b from-white to-primarySoft/30 z-10">
            <div className="px-4 py-4 border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-20">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-text">{companies.length} Results</h2>
                <button 
                  onClick={() => setHasSearched(false)} 
                  className="text-xs font-medium text-muted hover:text-primary transition-colors"
                >
                  New Search
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {['All Scores', 'High Fit', 'Medium'].map((label, i) => (
                  <button 
                    key={label}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap border",
                      i === 0 ? "bg-primary text-white border-primary shadow-sm" : "bg-surface text-muted border-border hover:border-primary/30"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {companies.length === 0 ? <ResultListSkeleton /> : (
                companies.map((company) => (
                  <CompanyListItem
                    key={company.id}
                    company={company}
                    isSelected={company.id === selectedId}
                    onClick={() => setSelectedId(company.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right Panel: Detail */}
          <div className="flex-1 bg-white overflow-hidden relative shadow-xl shadow-black/5 rounded-tl-2xl ml-[-1px] border-l border-border z-20">
             {selectedCompany ? (
                <CompanyDetailPanel 
                  company={selectedCompany} 
                  onGenerateInfographic={handleGenerateInfographic}
                />
             ) : (
                <DetailSkeleton />
             )}
          </div>
        </div>
      )}
    </Layout>
  );
}

export default App;
