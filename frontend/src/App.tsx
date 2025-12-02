import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { 
  Search, 
  Loader2, 
  Check, 
  Download, 
  Trash2, 
  ChevronDown,
  Zap,
  ChevronsUpDown,
  Building2,
  History,
  Table2,
  LayoutGrid,
  Users,
  Mail,
  Phone,
  Linkedin,
  MapPin,
  ExternalLink
} from 'lucide-react';

import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CompanyDetailPanel } from './components/CompanyDetailPanel';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ResultListSkeleton } from './components/Skeletons';
import { InfographicModal } from './components/InfographicModal';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth, signOut } from './lib/auth';
import {
  exportInfographic,
  fetchSavedCompanies,
  fetchSearchById,
  fetchSearchHistory,
  saveCompany,
  searchCompanies,
  unsaveCompany,
} from './api/client';
import { Company, InfographicPage, Person, SavedCompany, SearchHistoryItem } from './types';
import { getAllPeople } from './api/people';
import { cn } from './lib/utils';

type WorkspaceView = 'search' | 'companies' | 'people' | 'history';
type FitFilter = 'all' | 'high' | 'medium' | 'low';
type IndustryCarrier = {
  primary_industry?: string | null;
  secondary_industry?: string | null;
  primaryIndustry?: string | null;
  secondaryIndustry?: string | null;
};

const QUICK_FILTERS = [
  'logistics SaaS in North America',
  'healthcare payments SaaS',
  'construction project management',
];

const INDUSTRIES = [
  "AI",
  "Logistics",
  "Healthcare",
  "Fintech",
  "Retail",
  "Real Estate",
  "Transportation",
  "HR Tech",
  "Cybersecurity",
  "EdTech",
  "Marketing",
  "Sales",
  "Productivity",
  "Communication",
  "Customer Support",
  "DevTools",
  "Vertical SaaS",
  "Marketplace",
  "E Commerce",
  "Hardware Enabled SaaS"
];

const DEFAULT_CATEGORY = 'General';

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
  primary_industry: saved.primary_industry,
  secondary_industry: saved.secondary_industry,
});

export function WorkspaceApp() {
  const navigate = useNavigate();
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
  const [workspaceCategory, setWorkspaceCategory] = useState<string>('all');
  const [workspaceFitFilter, setWorkspaceFitFilter] = useState<FitFilter>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [workspaceCategories, setWorkspaceCategories] = useState<string[]>([]);
  const [selectedWorkspaceCompanyId, setSelectedWorkspaceCompanyId] = useState<string | null>(
    null,
  );
  const [shortlistSearchQuery, setShortlistSearchQuery] = useState('');

  // History state
  const [historyItems, setHistoryItems] = useState<SearchHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [historyCompanies, setHistoryCompanies] = useState<Company[]>([]);

  // People state
  const [allPeople, setAllPeople] = useState<Person[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [peopleSearchQuery, setPeopleSearchQuery] = useState('');

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

  const viewMeta = useMemo(() => {
    if (activeView === 'companies') {
      return { title: 'Shortlist', subtitle: 'Saved Companies' };
    }
    if (activeView === 'people') {
      return { title: 'Contacts', subtitle: 'Decision Makers' };
    }
    if (activeView === 'history') {
      return { title: 'Past Searches', subtitle: 'History' };
    }
    return { title: 'Market Discovery', subtitle: 'New Search' };
  }, [activeView]);

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

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Failed to sign out', error);
    }
  };

  // Load workspace companies - now client-side filtering for fit score
  const loadWorkspaceCompanies = useCallback(
    async (options?: { category?: string; autoSelectId?: string }) => {
      const categoryValue = options?.category ?? workspaceCategory;
      
      const queryParams: Record<string, string> = {};
      if (categoryValue !== 'all') {
        queryParams.category = categoryValue;
      }
      // Removed backend fit score params (minScore/maxScore) to support client-side filtering

      setWorkspaceLoading(true);
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
        } else {
          // If no auto select and result exists, we don't auto select first anymore to respect requirement 4
          nextSelected = null;
        }
        
        setSelectedWorkspaceCompanyId(nextSelected);
      } catch (error) {
        console.error(error);
      } finally {
        setWorkspaceLoading(false);
      }
    },
    [workspaceCategory], // Removed workspaceFitFilter from dependencies
  );

  // Initial load of workspace
  useEffect(() => {
    loadWorkspaceCompanies();
  }, [loadWorkspaceCompanies]);

const normalizeIndustry = (value?: string | null): string | null => {
  if (!value || typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const getCompanyIndustryValues = (
  company?: IndustryCarrier | null,
): { primary: string | null; secondary: string | null } => {
  if (!company) {
    return { primary: null, secondary: null };
  }

  const primary = company.primary_industry ?? company.primaryIndustry ?? null;
  const secondary = company.secondary_industry ?? company.secondaryIndustry ?? null;

  return {
    primary: normalizeIndustry(primary),
    secondary: normalizeIndustry(secondary),
  };
};

const matchesFitFilter = (
  score: number | null | undefined,
  filter: FitFilter,
): boolean => {
  if (filter === 'all') {
    return true;
  }

  if (!Number.isFinite(score)) {
    return false;
  }

  const numericScore = Number(score);
  if (filter === 'high') {
    return numericScore >= 8;
  }
  if (filter === 'medium') {
    return numericScore >= 5 && numericScore < 8;
  }
  if (filter === 'low') {
    return numericScore >= 0 && numericScore < 5;
  }

  return true;
};

const matchesIndustryFilter = (
  company: IndustryCarrier | null | undefined,
  filter: string,
): boolean => {
  if (!filter || filter.trim().toLowerCase() === 'all') {
    return true;
  }

  const normalizedFilter = filter.trim().toLowerCase();
  const { primary, secondary } = getCompanyIndustryValues(company);

  if (!primary && !secondary) {
    return false;
  }

  const normalizedPrimary = primary?.toLowerCase();
  const normalizedSecondary = secondary?.toLowerCase();

  const matchesPrimary =
    normalizedPrimary === normalizedFilter ||
    (normalizedPrimary && normalizedPrimary.includes(normalizedFilter));

  const matchesSecondary =
    normalizedSecondary === normalizedFilter ||
    (normalizedSecondary && normalizedSecondary.includes(normalizedFilter));

  return Boolean(matchesPrimary || matchesSecondary);
};

  const filteredWorkspaceCompanies = useMemo(() => {
    if (workspaceCompanies.length === 0) {
      return [];
    }

    return workspaceCompanies.filter((company) => {
      // Apply Search Filter
      if (shortlistSearchQuery.trim()) {
        const q = shortlistSearchQuery.trim().toLowerCase();
        const name = company.name.toLowerCase();
        const domain = company.domain.toLowerCase();
        const summary = company.summary?.toLowerCase() ?? '';
        const primaryIndustry = company.primary_industry?.toLowerCase() ?? '';
        
        if (
          !name.includes(q) && 
          !domain.includes(q) && 
          !summary.includes(q) &&
          !primaryIndustry.includes(q)
        ) {
          return false;
        }
      }

      // Apply Fit Filter
      const scoreMatches = matchesFitFilter(company.fitScore ?? null, workspaceFitFilter);
      if (!scoreMatches) {
        return false;
      }

      // Apply Industry Filter
      const industryMatches = matchesIndustryFilter(company, industryFilter);
      return industryMatches;
    });
  }, [workspaceCompanies, workspaceFitFilter, industryFilter, shortlistSearchQuery]);

  // Initial load of history
  const loadSearchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const items = await fetchSearchHistory();
      setHistoryItems(items);
    } catch (error) {
      console.error(error);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSearchHistory();
  }, [loadSearchHistory]);

  // Load all people
  const loadAllPeople = useCallback(async () => {
    setPeopleLoading(true);
    try {
      const people = await getAllPeople();
      setAllPeople(people);
    } catch (error) {
      console.error(error);
    } finally {
      setPeopleLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeView === 'people') {
      loadAllPeople();
    }
  }, [activeView, loadAllPeople]);

  // Filter people by search query
  const filteredPeople = useMemo(() => {
    if (!peopleSearchQuery.trim()) {
      return allPeople;
    }
    const q = peopleSearchQuery.trim().toLowerCase();
    return allPeople.filter((person) => {
      const name = person.full_name?.toLowerCase() ?? '';
      const email = person.email?.toLowerCase() ?? '';
      const role = person.role?.toLowerCase() ?? '';
      const company = person.company_name?.toLowerCase() ?? '';
      return name.includes(q) || email.includes(q) || role.includes(q) || company.includes(q);
    });
  }, [allPeople, peopleSearchQuery]);

  const selectedPerson = allPeople.find((p) => p.id === selectedPersonId);

  const handleClearSearchData = () => {
    setQuery('');
    setSearchCompaniesList([]);
    setSelectedSearchCompanyId(null);
    setHasSearched(false);
    setSearchError(null);
    // Also clear selected items in other views to ensure a truly fresh feel
    setSelectedWorkspaceCompanyId(null);
    setSelectedHistoryId(null);
    setHistoryCompanies([]);
  };

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
      // Only auto-select if we are already in the workspace view to avoid jumping
      if (activeView === 'companies') {
         await loadWorkspaceCompanies({ autoSelectId: saved.id });
      } else {
         // Just reload in background
         await loadWorkspaceCompanies();
      }
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
      
      // Clear selection if the unsaved company was selected
      if (selectedWorkspaceCompanyId === companyId) {
        setSelectedWorkspaceCompanyId(null);
      }
      
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
    try {
      const response = await fetchSearchById(item.id);
      setHistoryCompanies(response.companies);
    } catch (error) {
      console.error(error);
    }
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

  const workspaceFitFilters: { label: string; value: FitFilter }[] = [
    { label: 'All Scores', value: 'all' },
    { label: 'High (> 8.0)', value: 'high' },
    { label: 'Medium (> 6.0)', value: 'medium' },
    { label: 'Low (< 6.0)', value: 'low' },
  ];

  return (
    <Layout>
      <LoadingOverlay isVisible={isSearching} />

      {toast && (
        <div
          className={cn(
            'fixed top-20 right-6 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-card animate-in slide-in-from-right',
            toast.type === 'success'
              ? 'bg-white border border-green-200 text-green-700'
              : 'bg-white border border-red-200 text-red-700',
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

      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 border-r border-slate-200 bg-slate-50/50 flex flex-col h-full">
        {/* Brand */}
        <div className="h-16 flex items-center px-5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2.5 text-slate-900">
            <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center text-white">
              <Zap className="w-3 h-3 fill-current" />
            </div>
            <span className="font-semibold tracking-tight text-sm">Zerpha</span>
          </div>
          <span className="mx-2 text-slate-300">/</span>
          <span className="text-slate-500 text-sm font-medium">Scouting</span>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-8">
          
          {/* Workspace */}
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 block px-2">Workspace</label>
            <button className="w-full flex items-center justify-between px-2 py-1.5 text-sm font-medium text-slate-700 hover:bg-white hover:shadow-sm rounded-md transition-all border border-transparent hover:border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-xs text-slate-600">Z</div>
                Zerpha Intelligence
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Search */}
          {activeView === 'search' && (
             <div className="relative group">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search vertical..." 
                 value={query} 
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void executeSearch()}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-md text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all" 
              />
            </div>
          )}

          {/* Navigation */}
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block px-2">Menu</label>
            <nav className="space-y-0.5">
              <button 
                onClick={() => setActiveView('search')}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  activeView === 'search' 
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-100" 
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Search className={cn("w-4 h-4", activeView === 'search' ? "text-indigo-600" : "text-slate-400")} />
                New Search
              </button>

              <button 
                onClick={() => setActiveView('companies')}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  activeView === 'companies' 
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-100" 
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Building2 className={cn("w-4 h-4", activeView === 'companies' ? "text-indigo-600" : "text-slate-400")} />
                Companies
                {activeView === 'companies' && <span className="ml-auto text-[10px] font-semibold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">NOW</span>}
              </button>

              <button 
                onClick={() => setActiveView('people')}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  activeView === 'people' 
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-100" 
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Users className={cn("w-4 h-4", activeView === 'people' ? "text-indigo-600" : "text-slate-400")} />
                People
              </button>

              <button 
                onClick={() => setActiveView('history')}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  activeView === 'history' 
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-100" 
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <History className={cn("w-4 h-4", activeView === 'history' ? "text-indigo-600" : "text-slate-400")} />
                Search history
              </button>
            </nav>
          </div>

          {/* View Toggle (Only visible in Companies view) */}
          {activeView === 'companies' && (
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block px-2">View</label>
              <div className="flex p-0.5 bg-slate-100 rounded-md border border-slate-200 mb-4">
                <button className="flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium bg-white text-slate-900 rounded shadow-sm border border-slate-100">
                  <Table2 className="w-3.5 h-3.5" /> Table
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 cursor-not-allowed opacity-50">
                  <LayoutGrid className="w-3.5 h-3.5" /> Cards
                </button>
              </div>
                 </div>
               )}

          {/* Filters (Only visible in Companies view) */}
          {activeView === 'companies' && (
            <div className="space-y-4">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider px-2">Filters</label>
              
              <div className="px-2 space-y-3">
                <div>
                  <span className="text-xs font-medium text-slate-500 mb-1.5 block">Fit Score</span>
                  <div className="relative">
                    <select 
                      value={workspaceFitFilter}
                      onChange={(e) => setWorkspaceFitFilter(e.target.value as FitFilter)}
                      className="w-full appearance-none bg-white border border-slate-200 text-sm text-slate-700 py-2 pl-3 pr-8 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {workspaceFitFilters.map((filter) => (
                        <option key={filter.value} value={filter.value}>
                          {filter.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <span className="text-xs font-medium text-slate-500 mb-1.5 block">Industry</span>
                  <div className="relative z-50">
                    <select 
                      value={industryFilter}
                      onChange={(e) => setIndustryFilter(e.target.value)}
                      className="w-full appearance-none bg-white border border-slate-200 text-sm text-slate-700 py-2 pl-3 pr-8 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="all">All Industries</option>
                      {INDUSTRIES.map((industry) => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
             </div>
          </div>
        </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex-shrink-0">
          <p className="text-xs text-slate-400 leading-relaxed px-2">
            {activeView === 'companies' 
              ? "Select a row to view detailed insights." 
              : activeView === 'search' 
                ? "Enter a query to start scouting." 
                : "Select a past search to review results."}
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 border-b border-slate-200 flex-shrink-0 bg-white/80">
          <div>
            <div className="text-xs text-slate-500 mb-0.5 font-medium">{viewMeta.subtitle}</div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{viewMeta.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            {activeView === 'search' && (hasSearched || query) && (
              <button
                onClick={handleClearSearchData}
                className="px-3.5 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-red-50 hover:text-red-700 hover:border-red-200 shadow-sm transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Clear Data
              </button>
            )}
            {activeView === 'companies' && (
              <button
                onClick={() => openInfographicModal(selectedWorkspaceCompanyId)}
                disabled={!selectedWorkspaceCompanyId}
                className="px-3.5 py-1.5 text-sm font-medium text-white bg-slate-900 border border-transparent rounded-md hover:bg-slate-800 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" /> Export selection
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-500 shadow-sm transition-all"
            >
              Logout
            </button>
          </div>
        </header>
        <div className="flex-1 flex flex-col min-h-0">
        {activeView === 'search' && (
            <div className="flex-1 overflow-auto px-8 py-6">
               {!hasSearched && !isSearching && searchCompaniesList.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                      <Search className="w-8 h-8 text-indigo-600" />
              </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Start a new market scan</h3>
                    <p className="text-slate-500 mb-8">Enter a vertical description in the sidebar search to discover and analyze companies with AI.</p>
                    
                    <div className="flex flex-wrap justify-center gap-2">
                      {QUICK_FILTERS.map(filter => (
                  <button 
                          key={filter}
                          onClick={() => handleQuickFilter(filter)}
                          className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm transition-all"
                        >
                          {filter}
                  </button>
                ))}
              </div>
            </div>
               )}

               {(hasSearched || isSearching || searchCompaniesList.length > 0) && (
                  <div className="flex h-full gap-6">
                     <div className="flex-1 flex flex-col min-h-0 border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                           <span className="text-sm font-medium text-slate-700">Results ({searchCompaniesList.length})</span>
                           {searchError && <span className="text-xs text-red-600">{searchError}</span>}
                        </div>
                        <div className="flex-1 overflow-auto bg-white">
                           {isSearching ? (
                              <div className="p-4"><ResultListSkeleton /></div>
                           ) : searchCompaniesList.length === 0 ? (
                              <div className="p-8 text-center text-slate-500 text-sm">No results found.</div>
                           ) : (
                             <table className="w-full text-left border-collapse">
                               <thead className="sticky top-0 bg-white z-10 shadow-sm">
                                 <tr>
                                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Name</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">Fit</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">Action</th>
                                 </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100">
                                  {searchCompaniesList.map(company => (
                                    <tr 
                    key={company.id}
                                      onClick={() => setSelectedSearchCompanyId(company.id)}
                                      className={cn(
                                        "group cursor-pointer hover:bg-slate-50 transition-colors",
                                        selectedSearchCompanyId === company.id ? "bg-indigo-50/50" : ""
                                      )}
                                    >
                                      <td className="py-3 px-4">
                                        <div className="font-medium text-slate-900">{company.name}</div>
                                        <div className="text-xs text-slate-500">{company.website}</div>
                                      </td>
                                      <td className="py-3 px-4 text-right">
                                         <span className={cn(
                                           "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                           (company.acquisition_fit_score ?? 0) >= 8 ? "bg-green-100 text-green-800" :
                                           (company.acquisition_fit_score ?? 0) >= 5 ? "bg-yellow-100 text-yellow-800" :
                                           "bg-slate-100 text-slate-600"
                                         )}>
                                           {company.acquisition_fit_score ?? '-'}
                                         </span>
                                      </td>
                                      <td className="py-3 px-4 text-right">
                                         <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleSaveCompany(company.id);
                                            }}
                                            disabled={savingMap[company.id]}
                                            className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                                         >
                                            {savingMap[company.id] ? 'Saved' : 'Save'}
                                         </button>
                                      </td>
                                    </tr>
                                  ))}
                               </tbody>
                             </table>
              )}
            </div>
          </div>

                     {/* Detail View for Search */}
                     {selectedSearchCompany && (
                        <aside className="w-[400px] flex-shrink-0 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm flex flex-col">
                           <div className="flex-1 overflow-y-auto">
                <CompanyDetailPanel 
                               company={selectedSearchCompany} 
                             />
                           </div>
                        </aside>
                     )}
                  </div>
               )}
            </div>
        )}

        {activeView === 'companies' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Filters / Tabs */}
            <div className="px-8 pt-6 pb-4 space-y-4">
              <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
                <button 
                   onClick={() => setWorkspaceCategory('all')}
                   className={cn(
                     "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                     workspaceCategory === 'all' ? "text-indigo-600 border-indigo-600" : "text-slate-500 border-transparent hover:text-slate-700"
                   )}
                >
                  All Companies
                </button>
                {workspaceCategories.map(cat => (
                   <button 
                    key={cat}
                    onClick={() => setWorkspaceCategory(cat)}
                    className={cn(
                      "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap capitalize",
                      workspaceCategory === cat ? "text-indigo-600 border-indigo-600" : "text-slate-500 border-transparent hover:text-slate-700"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Client-side Search Bar under Tabs */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter shortlist by name, domain..."
                  value={shortlistSearchQuery}
                  onChange={(e) => setShortlistSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-md text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
                />
              </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-hidden px-8 py-4">
              <div className="flex h-full overflow-hidden">
                <div className={cn(
                  "border-r border-slate-200 bg-white overflow-y-auto flex flex-col transition-all duration-300",
                  selectedWorkspaceCompanyId ? "w-[45%]" : "w-full border-r-0"
                )}>
                  {workspaceLoading ? (
                     <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 text-indigo-600 animate-spin" /></div>
                  ) : filteredWorkspaceCompanies.length === 0 ? (
                     <div className="p-8 text-center text-slate-500 text-sm bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                       {workspaceCompanies.length > 0 ? "No companies match the selected filters." : "No saved companies yet."}
                     </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-white z-10">
                        <tr>
                          <th className="py-3 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 w-8 pl-2">
                            <div className="w-4 h-4 rounded border border-slate-300 bg-white"></div>
                          </th>
                          <th className="py-3 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 w-1/3">Name</th>
                          <th className="py-3 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 w-1/3 hidden sm:table-cell">Domain</th>
                          <th className="py-3 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right hidden md:table-cell">Fit Score</th>
                          <th className="py-3 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-slate-100">
                        {filteredWorkspaceCompanies.map(company => (
                          <tr 
                            key={company.id}
                            onClick={() => {
                              if (selectedWorkspaceCompanyId === company.id) {
                                setSelectedWorkspaceCompanyId(null);
                              } else {
                                setSelectedWorkspaceCompanyId(company.id);
                              }
                            }}
                            className={cn(
                              "group hover:bg-slate-50 transition-colors cursor-pointer",
                              selectedWorkspaceCompanyId === company.id ? "bg-indigo-50/30" : ""
                            )}
                          >
                            <td className={cn(
                              "py-3 pr-4 pl-4 border-l-2", 
                              selectedWorkspaceCompanyId === company.id ? "border-indigo-600" : "border-transparent"
                            )}>
                               <div className={cn(
                                 "w-4 h-4 rounded border flex items-center justify-center",
                                 selectedWorkspaceCompanyId === company.id ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white"
                               )}>
                                 {selectedWorkspaceCompanyId === company.id && <Check className="w-3 h-3" />}
                               </div>
                            </td>
                            <td className="py-3 pr-4 font-medium text-slate-900">
                              <div className="truncate max-w-[180px]">{company.name}</div>
                            </td>
                            <td className="py-3 pr-4 hidden sm:table-cell">
                               <a 
                                 href={normalizeWebsite(company.domain)} 
                                 target="_blank" 
                                 rel="noreferrer" 
                                 onClick={(e) => e.stopPropagation()}
                                 className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 w-fit truncate max-w-[150px]"
                               >
                                 {company.domain} 
                               </a>
                            </td>
                            <td className="py-3 pr-4 text-right font-medium hidden md:table-cell">
                               <span className={cn(
                                 "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                 (company.fitScore ?? 0) >= 8 ? "bg-green-100 text-green-800" :
                                 (company.fitScore ?? 0) >= 5 ? "bg-yellow-100 text-yellow-800" :
                                 (company.fitScore ?? 0) > 0 ? "bg-red-100 text-red-800" : "text-slate-400"
                               )}>
                                 {company.fitScore ?? '—'}
                               </span>
                            </td>
                            <td className="py-3 pr-4 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnsaveCompany(company.id);
                                }}
                                className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Remove from shortlist"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {selectedWorkspaceCompanyId && workspaceSelectionDetail && (
                  <div className="w-[55%] max-w-[600px] bg-white overflow-y-auto border-l border-slate-200 shadow-xl shadow-slate-200/50 z-20 h-full animate-in slide-in-from-right duration-300">
                    <CompanyDetailPanel company={workspaceSelectionDetail} />
                  </div>
             )}
          </div>
            </div>
          </div>
        )}

        {activeView === 'history' && (
            <div className="flex-1 overflow-auto p-8">
                {historyLoading ? (
                  <div className="flex justify-center"><Loader2 className="w-6 h-6 text-indigo-600 animate-spin" /></div>
                ) : historyItems.length === 0 ? (
                   <div className="text-center text-slate-500">No search history yet.</div>
                ) : (
                   <div className="grid gap-4 max-w-3xl">
                      {historyItems.map(item => (
                        <div 
                          key={item.id}
                          onClick={() => handleHistoryRowClick(item)}
                          className={cn(
                            "p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer flex justify-between items-center",
                            selectedHistoryId === item.id ? "border-indigo-500 ring-1 ring-indigo-500" : "border-slate-200"
                          )}
                        >
                           <div>
                             <h3 className="font-medium text-slate-900">{item.query}</h3>
                             <p className="text-xs text-slate-500 mt-1">{formatDate(item.created_at)}</p>
                           </div>
                           <div className="flex items-center gap-4">
                              <span className="text-sm font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">{item.company_count} results</span>
                              <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">View</button>
                           </div>
                        </div>
                      ))}

                      {selectedHistoryId && historyCompanies.length > 0 && (
                         <div className="mt-8 border-t border-slate-200 pt-8 animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Results for selected search</h3>
                             <table className="w-full text-left border-collapse bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                               <thead className="bg-slate-50 border-b border-slate-200">
                                 <tr>
                                   <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Name</th>
                                   <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Domain</th>
                                   <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase text-right">Fit</th>
                                   <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase text-right">Action</th>
                                 </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100">
                                 {historyCompanies.map(company => (
                                   <tr key={company.id} className="hover:bg-slate-50">
                                     <td className="py-3 px-4 font-medium text-slate-900">{company.name}</td>
                                     <td className="py-3 px-4 text-slate-500 text-sm">{company.website}</td>
                                     <td className="py-3 px-4 text-right">{company.acquisition_fit_score}</td>
                                     <td className="py-3 px-4 text-right">
                                       {company.is_saved ? (
                                          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">Saved</span>
                                       ) : (
                                          <button 
                                            onClick={() => handleSaveCompany(company.id)}
                                            disabled={savingMap[company.id]}
                                            className="text-xs font-medium text-white bg-indigo-600 px-2 py-1 rounded hover:bg-indigo-700"
                                          >
                                            Save
                                          </button>
                                       )}
                                     </td>
                                   </tr>
                                 ))}
                               </tbody>
                             </table>
                         </div>
                      )}
                   </div>
                )}
            </div>
        )}

        {/* People View */}
        {activeView === 'people' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search Bar */}
            <div className="px-8 pt-6 pb-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by name, email, role, or company..."
                  value={peopleSearchQuery}
                  onChange={(e) => setPeopleSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-md text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
                />
              </div>
            </div>

            {/* People Table */}
            <div className="flex-1 overflow-hidden px-8 py-4">
              <div className="flex h-full overflow-hidden">
                {/* People List */}
                <div className={cn(
                  "bg-white overflow-y-auto flex flex-col transition-all duration-300 border border-slate-200 rounded-lg",
                  selectedPersonId ? "w-[50%] border-r-0 rounded-r-none" : "w-full"
                )}>
                  {peopleLoading ? (
                    <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 text-indigo-600 animate-spin" /></div>
                  ) : filteredPeople.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm bg-slate-50 rounded-lg border border-slate-100 border-dashed m-4">
                      {allPeople.length > 0 ? "No people match your search." : "No contacts found yet. Run a search to discover companies and their decision makers."}
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-white z-10">
                        <tr>
                          <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Name</th>
                          <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 hidden md:table-cell">Role</th>
                          <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Email</th>
                          <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 hidden lg:table-cell">Company</th>
                          <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 hidden sm:table-cell">Source</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-slate-100">
                        {filteredPeople.map((person) => {
                          const isHighlighted = person.is_ceo || person.is_founder || person.is_executive;
                          return (
                            <tr
                              key={person.id}
                              onClick={() => setSelectedPersonId(selectedPersonId === person.id ? null : person.id)}
                              className={cn(
                                "group hover:bg-slate-50 transition-colors cursor-pointer",
                                selectedPersonId === person.id ? "bg-indigo-50/30" : "",
                                isHighlighted ? "bg-amber-50/30" : ""
                              )}
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    "font-medium text-slate-900",
                                    isHighlighted && "font-bold"
                                  )}>
                                    {person.full_name || 'Unknown'}
                                  </span>
                                  {person.is_ceo && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700 rounded">CEO</span>
                                  )}
                                  {person.is_founder && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-purple-100 text-purple-700 rounded">Founder</span>
                                  )}
                                  {person.is_executive && !person.is_ceo && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-blue-100 text-blue-700 rounded">Exec</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-600 hidden md:table-cell">
                                {person.role || '—'}
                              </td>
                              <td className="py-3 px-4">
                                {person.email ? (
                                  <a
                                    href={`mailto:${person.email}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                    <span className="truncate max-w-[180px]">{person.email}</span>
                                  </a>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-slate-600 hidden lg:table-cell">
                                {person.company_name || '—'}
                              </td>
                              <td className="py-3 px-4 hidden sm:table-cell">
                                <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded capitalize">
                                  {person.source || 'unknown'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Person Detail Panel */}
                {selectedPersonId && selectedPerson && (
                  <div className="w-[50%] max-w-[500px] bg-white overflow-y-auto border border-slate-200 rounded-r-lg shadow-xl shadow-slate-200/50 z-20 h-full animate-in slide-in-from-right duration-300">
                    {/* Header */}
                    <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-5 z-20">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                            {selectedPerson.full_name || 'Unknown Contact'}
                            {selectedPerson.is_ceo && (
                              <span className="px-2 py-0.5 text-xs font-semibold uppercase bg-amber-100 text-amber-700 rounded">CEO</span>
                            )}
                            {selectedPerson.is_founder && (
                              <span className="px-2 py-0.5 text-xs font-semibold uppercase bg-purple-100 text-purple-700 rounded">Founder</span>
                            )}
                          </h2>
                          <p className="text-sm text-slate-500 mt-0.5">{selectedPerson.role || 'Unknown Role'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Contact Info */}
                      <section className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                          <h3 className="text-sm font-semibold text-slate-900">Contact Information</h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {selectedPerson.email && (
                            <div className="p-4 flex items-center gap-3">
                              <Mail className="w-4 h-4 text-slate-400" />
                              <a href={`mailto:${selectedPerson.email}`} className="text-sm text-indigo-600 hover:text-indigo-800">
                                {selectedPerson.email}
                              </a>
                            </div>
                          )}
                          {selectedPerson.phone && (
                            <div className="p-4 flex items-center gap-3">
                              <Phone className="w-4 h-4 text-slate-400" />
                              <a href={`tel:${selectedPerson.phone}`} className="text-sm text-slate-700">
                                {selectedPerson.phone}
                              </a>
                            </div>
                          )}
                          {selectedPerson.linkedin_url && (
                            <div className="p-4 flex items-center gap-3">
                              <Linkedin className="w-4 h-4 text-slate-400" />
                              <a href={selectedPerson.linkedin_url} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                LinkedIn Profile <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                          {(selectedPerson.location_city || selectedPerson.location_country) && (
                            <div className="p-4 flex items-center gap-3">
                              <MapPin className="w-4 h-4 text-slate-400" />
                              <span className="text-sm text-slate-700">
                                {[selectedPerson.location_city, selectedPerson.location_country].filter(Boolean).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Company Info */}
                      {selectedPerson.company_name && (
                        <section className="border border-slate-200 rounded-lg overflow-hidden">
                          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                            <h3 className="text-sm font-semibold text-slate-900">Company</h3>
                          </div>
                          <div className="p-4">
                            <div className="flex items-center gap-3">
                              <Building2 className="w-4 h-4 text-slate-400" />
                              <div>
                                <p className="text-sm font-medium text-slate-900">{selectedPerson.company_name}</p>
                                {selectedPerson.company_website && (
                                  <a 
                                    href={normalizeWebsite(selectedPerson.company_website)} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                  >
                                    {selectedPerson.company_website} <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </section>
                      )}

                      {/* Professional Info */}
                      <section className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                          <h3 className="text-sm font-semibold text-slate-900">Professional Details</h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {selectedPerson.department && (
                            <div className="p-4 grid grid-cols-3 gap-4">
                              <div className="text-sm font-medium text-slate-500">Department</div>
                              <div className="col-span-2 text-sm text-slate-700">{selectedPerson.department}</div>
                            </div>
                          )}
                          {selectedPerson.seniority && (
                            <div className="p-4 grid grid-cols-3 gap-4">
                              <div className="text-sm font-medium text-slate-500">Seniority</div>
                              <div className="col-span-2 text-sm text-slate-700">{selectedPerson.seniority}</div>
                            </div>
                          )}
                          <div className="p-4 grid grid-cols-3 gap-4">
                            <div className="text-sm font-medium text-slate-500">Source</div>
                            <div className="col-span-2">
                              <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded capitalize">
                                {selectedPerson.source || 'unknown'}
                              </span>
                            </div>
                          </div>
                          {selectedPerson.confidence_score !== null && (
                            <div className="p-4 grid grid-cols-3 gap-4">
                              <div className="text-sm font-medium text-slate-500">Confidence</div>
                              <div className="col-span-2 text-sm text-slate-700">{selectedPerson.confidence_score}%</div>
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Notes */}
                      {selectedPerson.notes && (
                        <section className="border border-slate-200 rounded-lg overflow-hidden">
                          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                            <h3 className="text-sm font-semibold text-slate-900">Notes</h3>
                          </div>
                          <div className="p-4">
                            <p className="text-sm text-slate-600 leading-relaxed">{selectedPerson.notes}</p>
                          </div>
                        </section>
                      )}

                      {/* Key Info */}
                      <section className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Record Info</h3>
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex justify-between">
                            <span className="text-xs text-slate-400 font-mono">ID</span>
                            <span className="text-xs text-slate-500 font-mono">{selectedPerson.id.slice(0, 24)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-slate-400">Added</span>
                            <span className="text-xs text-slate-600">{formatDate(selectedPerson.created_at)}</span>
                          </div>
                        </div>
                      </section>

                      <div className="h-8"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </main>

      {/* Removed duplicate detail panel logic - it's now handled inside the activeView === 'companies' block above */}

    </Layout>
  );
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-sm text-slate-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={user ? <Navigate to="/workspace" replace /> : <LoginPage />}
      />
      <Route
        path="/workspace"
        element={
          <ProtectedRoute>
            <WorkspaceApp />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
