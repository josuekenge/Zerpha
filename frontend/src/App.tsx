import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, List, Loader2, Check, Bookmark } from 'lucide-react';

import { Layout } from './components/Layout';
import { CompanyListItem } from './components/CompanyListItem';
import { CompanyDetailPanel } from './components/CompanyDetailPanel';
import { LoadingOverlay } from './components/LoadingOverlay';
import { DetailSkeleton, ResultListSkeleton } from './components/Skeletons';
import { InfographicModal } from './components/InfographicModal';
import {
  exportInfographic,
  fetchSavedCompanies,
  fetchSearchById,
  fetchSearchHistory,
  saveCompany,
  searchCompanies,
  unsaveCompany,
} from './api/client';
import { Company, InfographicPage, SavedCompany, SearchHistoryItem } from './types';
import { cn } from './lib/utils';

type WorkspaceView = 'search' | 'companies' | 'history';
type FitFilter = 'all' | 'high' | 'medium' | 'low';

const NAV_LINKS: { label: string; value: WorkspaceView }[] = [
  { label: 'Search', value: 'search' },
  { label: 'Companies', value: 'companies' },
  { label: 'Search history', value: 'history' },
];

const QUICK_FILTERS = [
  'logistics SaaS in North America',
  'healthcare payments SaaS',
  'construction project management',
];

const DEFAULT_CATEGORY = 'General';

const fitFilterRanges: Record<FitFilter, { minScore?: number; maxScore?: number }> = {
  all: {},
  high: { minScore: 8 },
  medium: { minScore: 5, maxScore: 7 },
  low: { maxScore: 4 },
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
};

const normalizeWebsite = (domain: string) => {
  if (!domain) return '';
  return /^https?:\/\//i.test(domain) ? domain : `https://${domain}`;
};

const savedCompanyToCompany = (saved: SavedCompany): Company => ({
  id: saved.id,
  name: saved.name,
  website: normalizeWebsite(saved.domain),
  vertical_query: saved.category,
  acquisition_fit_score: saved.fitScore ?? null,
  summary: saved.summary,
  raw_json: saved.raw_json ?? {},
  is_saved: saved.is_saved,
  saved_category: saved.saved_category,
  created_at: saved.created_at ?? undefined,
});

function App() {
  const [activeView, setActiveView] = useState<WorkspaceView>('search');

  // Search state
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchCompaniesList, setSearchCompaniesList] = useState<Company[]>([]);
  const [selectedSearchCompanyId, setSelectedSearchCompanyId] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Workspace state
  const [workspaceCompanies, setWorkspaceCompanies] = useState<SavedCompany[]>([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [workspaceCategory, setWorkspaceCategory] = useState<string>('all');
  const [workspaceFitFilter, setWorkspaceFitFilter] = useState<FitFilter>('all');
  const [workspaceCategories, setWorkspaceCategories] = useState<string[]>([]);
  const [selectedWorkspaceCompanyId, setSelectedWorkspaceCompanyId] = useState<string | null>(
    null,
  );

  // History state
  const [historyItems, setHistoryItems] = useState<SearchHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [historyCompanies, setHistoryCompanies] = useState<Company[]>([]);
  const [historyCompaniesLoading, setHistoryCompaniesLoading] = useState(false);
  const [historyCompaniesError, setHistoryCompaniesError] = useState<string | null>(null);
  const [selectedHistoryCompanyId, setSelectedHistoryCompanyId] = useState<string | null>(null);

  // Infographic modal
  const [isInfographicOpen, setIsInfographicOpen] = useState(false);
  const [infographicLoading, setInfographicLoading] = useState(false);
  const [infographicData, setInfographicData] = useState<InfographicPage | null>(null);
  const [infographicError, setInfographicError] = useState<string | null>(null);
  const [infographicTargetId, setInfographicTargetId] = useState<string | null>(null);

  // Save mutations and toasts
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});
  const toastTimeout = useRef<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimeout.current) {
      window.clearTimeout(toastTimeout.current);
    }
    setToast({ message, type });
    toastTimeout.current = window.setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(
    () => () => {
      if (toastTimeout.current) {
        window.clearTimeout(toastTimeout.current);
      }
    },
    [],
  );

  const loadWorkspaceCompanies = useCallback(
    async (options?: { category?: string; fit?: FitFilter; autoSelectId?: string }) => {
      const categoryValue = options?.category ?? workspaceCategory;
      const fitValue = options?.fit ?? workspaceFitFilter;
      const range = fitFilterRanges[fitValue];

      const queryParams: Record<string, string> = {};
      if (categoryValue !== 'all') {
        queryParams.category = categoryValue;
      }
      if (range.minScore !== undefined) {
        queryParams.minScore = String(range.minScore);
      }
      if (range.maxScore !== undefined) {
        queryParams.maxScore = String(range.maxScore);
      }

      setWorkspaceLoading(true);
      setWorkspaceError(null);
      try {
        const result = await fetchSavedCompanies(queryParams);
        setWorkspaceCompanies(result);
        const categories = Array.from(
          new Set(result.map((company) => company.saved_category ?? DEFAULT_CATEGORY)),
        );
        setWorkspaceCategories(categories);
        
        let nextSelected: string | null = null;
        if (options?.autoSelectId && result.some((c) => c.id === options.autoSelectId)) {
          nextSelected = options.autoSelectId;
        } else if (result.length > 0) {
          nextSelected = result[0].id;
        }
        
        setSelectedWorkspaceCompanyId(nextSelected);
      } catch (error) {
        console.error(error);
        setWorkspaceError('Unable to load saved companies.');
      } finally {
        setWorkspaceLoading(false);
      }
    },
    [workspaceCategory, workspaceFitFilter],
  );

  // Initial load of workspace
  useEffect(() => {
    loadWorkspaceCompanies();
  }, [loadWorkspaceCompanies]);

  // Initial load of history
  const loadSearchHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const items = await fetchSearchHistory();
      setHistoryItems(items);
    } catch (error) {
      console.error(error);
      setHistoryError('Unable to load search history.');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSearchHistory();
  }, [loadSearchHistory]);

  const executeSearch = async (nextQuery?: string) => {
    const targetQuery = typeof nextQuery === 'string' ? nextQuery : query;
    const normalizedQuery = targetQuery.trim();
    if (!normalizedQuery) return;

    if (typeof nextQuery === 'string') {
      setQuery(nextQuery);
    }

    setIsSearching(true);
    setSearchError(null);
    try {
      const response = await searchCompanies(normalizedQuery);
      setSearchCompaniesList(response.companies);
      setHasSearched(true);
      setSelectedSearchCompanyId(response.companies[0]?.id ?? null);
    } catch (error) {
      console.error(error);
      setSearchError('Failed to complete search. The vertical may be too broad or unavailable.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickFilter = (value: string) => {
    void executeSearch(value);
  };

  const runInfographic = async (companyId: string) => {
    setInfographicLoading(true);
    setInfographicError(null);
    setInfographicData(null);
    try {
      const result = await exportInfographic(companyId);
      setInfographicData(result.infographic);
    } catch (error) {
      console.error(error);
      const message =
        (error as { message?: string })?.message === 'infographic_provider_unavailable'
          ? 'infographic_provider_unavailable'
          : 'Failed to generate infographic. Please try again.';
      setInfographicError(message);
    } finally {
      setInfographicLoading(false);
    }
  };

  const openInfographicModal = (companyId: string | null) => {
    if (!companyId) return;
    setInfographicTargetId(companyId);
    setIsInfographicOpen(true);
    void runInfographic(companyId);
  };

  const retryInfographic = () => {
    if (infographicTargetId) {
      void runInfographic(infographicTargetId);
    }
  };

  const updateCompanySavedState = (companyId: string, saved: boolean, category: string | null) => {
    const updater = (list: Company[]) =>
      list.map((c) =>
        c.id === companyId ? { ...c, is_saved: saved, saved_category: category } : c,
      );
    setSearchCompaniesList(updater);
    setHistoryCompanies(updater);
  };

  const handleSaveCompany = async (companyId: string, category = DEFAULT_CATEGORY) => {
    if (savingMap[companyId]) return;
    setSavingMap((prev) => ({ ...prev, [companyId]: true }));
    try {
      const saved = await saveCompany(companyId, category);
      updateCompanySavedState(saved.id, true, saved.saved_category ?? category);
      showToast('Company saved to workspace');
      // Refresh workspace without changing view
      await loadWorkspaceCompanies({ autoSelectId: saved.id });
    } catch (error) {
      console.error(error);
      showToast('Unable to save company', 'error');
    } finally {
      setSavingMap((prev) => {
        const next = { ...prev };
        delete next[companyId];
        return next;
      });
    }
  };

  const handleUnsaveCompany = async (companyId: string) => {
    if (savingMap[companyId]) return;
    setSavingMap((prev) => ({ ...prev, [companyId]: true }));
    try {
      await unsaveCompany(companyId);
      updateCompanySavedState(companyId, false, null);
      showToast('Company removed from workspace');
      await loadWorkspaceCompanies();
    } catch (error) {
      console.error(error);
      showToast('Unable to unsave company', 'error');
    } finally {
      setSavingMap((prev) => {
        const next = { ...prev };
        delete next[companyId];
        return next;
      });
    }
  };

  const handleHistoryRowClick = async (item: SearchHistoryItem) => {
    setSelectedHistoryId(item.id);
    setHistoryCompanies([]);
    setHistoryCompaniesLoading(true);
    setHistoryCompaniesError(null);
    try {
      const response = await fetchSearchById(item.id);
      setHistoryCompanies(response.companies);
      setSelectedHistoryCompanyId(response.companies[0]?.id ?? null);
    } catch (error) {
      console.error(error);
      setHistoryCompaniesError('Unable to load companies for this search.');
    } finally {
      setHistoryCompaniesLoading(false);
    }
  };

  const navigateToWorkspaceFromHistory = (companyId: string) => {
    setWorkspaceCategory('all');
    setWorkspaceFitFilter('all');
    setActiveView('companies');
    void loadWorkspaceCompanies({ category: 'all', fit: 'all', autoSelectId: companyId });
  };

  const selectedSearchCompany = searchCompaniesList.find(
    (c) => c.id === selectedSearchCompanyId,
  );

  const workspaceSelection = workspaceCompanies.find(
    (c) => c.id === selectedWorkspaceCompanyId,
  );
  const workspaceSelectionDetail = workspaceSelection
    ? savedCompanyToCompany(workspaceSelection)
    : null;

  const historySelection = historyCompanies.find(
    (c) => c.id === selectedHistoryCompanyId,
  );

  const workspaceCategoryPills = [
    { label: 'All companies', value: 'all' },
    ...workspaceCategories.map((category) => ({
      label: category,
      value: category,
    })),
  ];

  const workspaceFitFilters: { label: string; value: FitFilter }[] = [
    { label: 'All Scores', value: 'all' },
    { label: 'High (8-10)', value: 'high' },
    { label: 'Medium (5-7)', value: 'medium' },
    { label: 'Low (0-4)', value: 'low' },
  ];

  // Helper to render the search empty state, replacing any undefined variable usage
  const renderSearchEmptyState = () => {
    if (isSearching && searchCompaniesList.length === 0) {
      return <DetailSkeleton />;
    }
    if (hasSearched && !isSearching && searchCompaniesList.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-center text-muted px-6">
          No companies matched this search. Try a different vertical or tweak your filters.
        </div>
      );
    }
    if (!hasSearched && searchCompaniesList.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-center text-muted px-6">
          Results will appear here after you run a search.
        </div>
      );
    }
    return null;
  };

  return (
    <Layout>
      <LoadingOverlay isVisible={isSearching} />

      {toast && (
        <div
          className={cn(
            'fixed top-20 right-6 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-card animate-in slide-in-from-right',
            toast.type === 'success'
              ? 'bg-white border border-success/30 text-success'
              : 'bg-white border border-danger/30 text-danger',
          )}
        >
          {toast.message}
        </div>
      )}

      <InfographicModal
        isOpen={isInfographicOpen}
        onClose={() => setIsInfographicOpen(false)}
        isLoading={infographicLoading}
        data={infographicData}
        error={infographicError}
        onRetry={retryInfographic}
      />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-background">
        <aside className="w-full md:w-[320px] flex-shrink-0 border-b md:border-b-0 md:border-r border-border bg-white flex flex-col">
          <div className="px-6 py-5 border-b border-border">
            <p className="text-xs font-semibold text-muted uppercase tracking-widest">
              Workspace
            </p>
            <p className="mt-2 text-lg font-bold text-text">Zerpha Intelligence</p>
          </div>
          <div className="px-6 py-5 border-b border-border space-y-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.value}
                onClick={() => setActiveView(link.value)}
                className={cn(
                  'w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition',
                  activeView === link.value
                    ? 'bg-primarySoft text-primary'
                    : 'text-muted hover:bg-background',
                )}
              >
                <span>{link.label}</span>
                {activeView === link.value && (
                  <span className="text-[10px] font-semibold uppercase tracking-widest">Now</span>
                )}
              </button>
            ))}
          </div>

          {activeView === 'search' && (
            <div className="px-6 py-5 border-b border-border">
              <div className="flex items-center justify-between mb-3 text-xs font-semibold text-muted uppercase tracking-widest">
                <span>Score filters</span>
                <span>{searchCompaniesList.length}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['All Scores', 'High Fit', 'Medium'].map((label, index) => (
                  <span
                    key={label}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-semibold border',
                      index === 0
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-muted border-border',
                    )}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {activeView === 'companies' && (
            <div className="px-6 py-5 border-b border-border space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">
                  View
                </p>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white flex items-center gap-2">
                    <List className="w-3.5 h-3.5" />
                    Table
                  </button>
                  <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted border border-border opacity-50 cursor-not-allowed">
                    Cards
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">
                  Fit Score
                </p>
                <div className="space-y-2">
                  {workspaceFitFilters.map((filter) => (
                    <label
                      key={filter.value}
                      className={cn(
                        'flex items-center gap-2 text-sm font-medium cursor-pointer',
                        workspaceFitFilter === filter.value ? 'text-text' : 'text-muted',
                      )}
                    >
                      <input
                        type="radio"
                        name="fit-filter"
                        value={filter.value}
                        checked={workspaceFitFilter === filter.value}
                        onChange={() => setWorkspaceFitFilter(filter.value)}
                        className="accent-primary"
                      />
                      {filter.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeView === 'history' && (
            <div className="px-6 py-5 border-b border-border text-sm text-muted">
              {selectedHistoryId
                ? 'Saved companies for the selected search appear in the main panel.'
                : 'Select a search to load its companies and mark favorites.'}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-background/40">
            {activeView === 'search' ? (
              searchCompaniesList.length === 0 ? (
                isSearching ? (
                  <ResultListSkeleton />
                ) : (
                  <div className="text-sm text-muted px-2 py-3">
                    {hasSearched
                      ? 'No companies found. Refine your filters.'
                      : 'Run a search to populate this list.'}
                  </div>
                )
              ) : (
                searchCompaniesList.map((company) => (
                  <CompanyListItem
                    key={company.id}
                    company={company}
                    isSelected={company.id === selectedSearchCompanyId}
                    onClick={() => setSelectedSearchCompanyId(company.id)}
                    onSave={() => handleSaveCompany(company.id)}
                    isSaving={savingMap[company.id]}
                  />
                ))
              )
            ) : activeView === 'companies' ? (
              workspaceCompanies.length === 0 ? (
                workspaceLoading ? (
                  <ResultListSkeleton />
                ) : (
                  <div className="text-sm text-muted px-2 py-3">
                    Save a company from search or history to populate this list.
                  </div>
                )
              ) : (
                <div className="text-sm text-muted px-2 py-3">
                  Select a row from the table to view its details.
                </div>
              )
            ) : historyItems.length === 0 ? (
              historyLoading ? (
                <ResultListSkeleton />
              ) : (
                <div className="text-sm text-muted px-2 py-3">
                  Searches will appear here once you run them.
                </div>
              )
            ) : (
              historyItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleHistoryRowClick(item)}
                  className={cn(
                    'w-full rounded-xl border px-3 py-2 text-left',
                    selectedHistoryId === item.id
                      ? 'border-primary bg-primarySoft/50'
                      : 'border-border hover:border-primary/30',
                  )}
                >
                  <p className="text-sm font-semibold text-text">{item.query}</p>
                  <p className="text-xs text-muted">
                    {formatDate(item.created_at)} · {item.company_count} companies
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col">
          {activeView === 'search' && (
            <>
              <div className="border-b border-border bg-white px-4 sm:px-8 py-6 space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                      Search
                    </p>
                    <h2 className="text-lg font-semibold text-text">
                      Use Zerpha AI to find the right vertical SaaS companies
                    </h2>
                  </div>
                  <div className="w-full lg:max-w-xl">
                    <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-4 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
                      <Search className="w-4 h-4 text-muted flex-shrink-0" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && void executeSearch()}
                        placeholder="Example: logistics SaaS in North America"
                        className="flex-1 bg-transparent text-sm text-text placeholder:text-muted focus:outline-none"
                      />
                      <button
                        onClick={() => void executeSearch()}
                        disabled={isSearching}
                        className="px-4 py-1.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition disabled:opacity-60"
                      >
                        {isSearching ? 'Searching...' : 'Search'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {QUICK_FILTERS.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => handleQuickFilter(filter)}
                      className="px-3 py-1.5 rounded-full border border-border text-xs font-medium text-muted hover:border-primary hover:text-primary transition"
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                {searchError && (
                  <div className="rounded-lg border border-danger/30 bg-danger/5 text-danger text-sm px-4 py-2">
                    {searchError}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                {selectedSearchCompany ? (
                  <CompanyDetailPanel
                    company={selectedSearchCompany}
                    onGenerateInfographic={() => openInfographicModal(selectedSearchCompany.id)}
                  />
                ) : (
                  renderSearchEmptyState()
                )}
              </div>
            </>
          )}

          {activeView === 'companies' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="border-b border-border bg-white px-4 sm:px-8 py-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                      Saved companies
                    </p>
                    <h2 className="text-lg font-semibold text-text">
                      Operate like Apollo with your Zerpha shortlist
                    </h2>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openInfographicModal(selectedWorkspaceCompanyId)}
                      disabled={!selectedWorkspaceCompanyId}
                      className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50"
                    >
                      Export selection
                    </button>
                    {selectedWorkspaceCompanyId && (
                      <button
                        onClick={() => handleUnsaveCompany(selectedWorkspaceCompanyId)}
                        className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-muted hover:text-danger hover:border-danger/50"
                      >
                        Unsave
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {workspaceCategoryPills.map((pill) => (
                    <button
                      key={pill.value}
                      onClick={() => setWorkspaceCategory(pill.value)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-semibold border capitalize',
                        workspaceCategory === pill.value
                          ? 'bg-primary text-white border-primary'
                          : 'text-muted border-border',
                      )}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>

                {workspaceError && (
                  <div className="rounded-lg border border-danger/30 bg-danger/5 text-danger text-sm px-4 py-2">
                    {workspaceError}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto">
                  {workspaceLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    </div>
                  ) : workspaceCompanies.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted text-sm">
                      No saved companies yet. Save one from search or history to get started.
                    </div>
                  ) : (
                    <table className="min-w-full text-sm text-left">
                      <thead>
                        <tr className="text-xs uppercase tracking-widest text-muted border-b border-border/70">
                          <th className="py-3 px-4">Name</th>
                          <th className="py-3 px-4">Domain</th>
                          <th className="py-3 px-4">Vertical</th>
                          <th className="py-3 px-4">Fit</th>
                          <th className="py-3 px-4">Headcount</th>
                          <th className="py-3 px-4">Location</th>
                          <th className="py-3 px-4">Saved Category</th>
                          <th className="py-3 px-4">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workspaceCompanies.map((company) => (
                          <tr
                            key={company.id}
                            onClick={() => setSelectedWorkspaceCompanyId(company.id)}
                            className={cn(
                              'border-b border-border/40 cursor-pointer hover:bg-primarySoft/30',
                              selectedWorkspaceCompanyId === company.id && 'bg-primarySoft/70',
                            )}
                          >
                            <td className="py-3 px-4 font-semibold text-text">{company.name}</td>
                            <td className="py-3 px-4 text-muted">{company.domain}</td>
                            <td className="py-3 px-4 text-muted capitalize">{company.category}</td>
                            <td className="py-3 px-4 text-text">
                              {company.fitScore ?? '—'}
                              {company.fit_band && (
                                <span className="text-xs uppercase tracking-widest text-muted ml-1">
                                  ({company.fit_band})
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-muted">{company.headcount ?? '—'}</td>
                            <td className="py-3 px-4 text-muted">{company.headquarters ?? '—'}</td>
                            <td className="py-3 px-4 text-muted">
                              {company.saved_category ?? DEFAULT_CATEGORY}
                            </td>
                            <td className="py-3 px-4 text-muted">{formatDate(company.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="border-t border-border bg-white p-4 sm:p-6 overflow-y-auto">
                  {workspaceSelectionDetail ? (
                    <CompanyDetailPanel
                      company={workspaceSelectionDetail}
                      onGenerateInfographic={() => openInfographicModal(workspaceSelectionDetail.id)}
                    />
                  ) : (
                    <p className="text-sm text-muted">
                      Select a saved company to review its executive summary and metrics.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeView === 'history' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="border-b border-border bg-white px-4 sm:px-8 py-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                  Search history
                </p>
                <h2 className="text-lg font-semibold text-text">
                  Review past discovery runs and save promising targets
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
                <section className="bg-white rounded-2xl border border-border shadow-soft p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-text uppercase tracking-widest">
                      Companies
                    </h3>
                    <span className="text-xs text-muted">{historyCompanies.length} results</span>
                  </div>
                  {historyCompaniesLoading ? (
                    <ResultListSkeleton />
                  ) : historyCompaniesError ? (
                    <p className="text-sm text-danger">{historyCompaniesError}</p>
                  ) : historyCompanies.length === 0 ? (
                    <p className="text-sm text-muted">
                      Select a search from the sidebar to load its companies.
                    </p>
                  ) : (
                    <div className="grid gap-3">
                      {historyCompanies.map((company) => {
                        const isSelected = selectedHistoryCompanyId === company.id;
                        return (
                          <div
                            key={company.id}
                            className={cn(
                              'rounded-xl border p-4 transition',
                              isSelected
                                ? 'border-primary bg-primarySoft/50'
                                : 'border-border hover:border-primary/30',
                            )}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div
                                className="cursor-pointer"
                                onClick={() => setSelectedHistoryCompanyId(company.id)}
                              >
                                <p className="text-sm font-semibold text-text">{company.name}</p>
                                <p className="text-xs text-muted">
                                  {company.website ? company.website.replace(/^https?:\/\//, '') : '—'}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {company.is_saved ? (
                                  <button
                                    className="px-3 py-1 rounded-full text-xs font-semibold bg-success/10 text-success flex items-center gap-1"
                                    onClick={() => navigateToWorkspaceFromHistory(company.id)}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    View
                                  </button>
                                ) : (
                                  <button
                                    className="px-3 py-1 rounded-full text-xs font-semibold bg-primary text-white flex items-center gap-1"
                                    onClick={() => handleSaveCompany(company.id)}
                                    disabled={savingMap[company.id]}
                                  >
                                    <Bookmark className="w-3.5 h-3.5" />
                                    {savingMap[company.id] ? 'Saving' : 'Save'}
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-muted flex flex-wrap gap-4">
                              <span>Fit: {company.acquisition_fit_score ?? '—'}</span>
                              <span>
                                Saved category: {company.saved_category ?? 'Not saved yet'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
                <section className="bg-white rounded-2xl border border-border shadow-soft p-4 sm:p-6">
                  {historySelection ? (
                    <CompanyDetailPanel
                      company={historySelection}
                      onGenerateInfographic={() => openInfographicModal(historySelection.id)}
                    />
                  ) : (
                    <p className="text-sm text-muted">
                      Select a company above to inspect the full executive summary and metrics.
                    </p>
                  )}
                </section>
              </div>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
}

export default App;
