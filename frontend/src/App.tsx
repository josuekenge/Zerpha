// Last updated: 2025-12-12 - Dark mode refinements and workspace cleanup
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Trash2,
  ChevronDown,
  Building2,
  X,
  TrendingUp,
  Kanban,
  Settings,
  LogOut,
} from 'lucide-react';

import { Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CompanyDetailPanel } from './components/CompanyDetailPanel';
import { CompanyAvatar } from './components/CompanyAvatar';
import { FitScoreBar } from './components/FitScoreBar';

import { InfographicModal } from './components/InfographicModal';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AiLoader } from './components/ui/ai-loader';
import { ChatWidget } from './components/ChatWidget';
import { InsightsPage } from './components/InsightsPage';
import { PipelinePage } from './components/PipelinePage';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { MarketSearchPanel } from './components/ui/market-search-panel';
import { LeadsDataTable } from './components/ui/leads-data-table';
import { SettingsPage } from './pages/settings/SettingsPage';
import { useAuth, signOut } from './lib/auth';
import {
  exportInfographic,
  fetchSavedCompanies,
  saveCompany,
  searchCompanies,
  unsaveCompany,
} from './api/client';
import { Company, InfographicPage, SavedCompany } from './types';
import { cn, matchesIndustry } from './lib/utils';
import { INDUSTRIES, LOCATIONS, WorkspaceView, FitFilter, DEFAULT_CATEGORY } from './lib/constants';
import { useWorkspace } from './lib/workspace';
import { WorkspaceSwitcher } from './components/WorkspaceSwitcher';
import { useTheme } from './lib/theme';



export function WorkspaceApp() {
  const { workspace } = useWorkspace();
  useTheme(); // ensure dark theme is applied
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Initialize activeView from URL parameter, default to 'search'
  const initialView = (searchParams.get('view') as WorkspaceView) || 'search';
  const [activeView, setActiveView] = useState<WorkspaceView>(initialView);



  // Sync activeView changes to URL
  useEffect(() => {
    navigate(`/workspace?view=${activeView}`, { replace: true });
  }, [activeView, navigate]);

  // Search state
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchCompaniesList, setSearchCompaniesList] = useState<Company[]>([]);
  const [selectedSearchCompanyId, setSelectedSearchCompanyId] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchIndustryFilter, setSearchIndustryFilter] = useState<string>('all');
  const [searchFitFilter, setSearchFitFilter] = useState<FitFilter>('all');

  // Workspace state
  const [workspaceCompanies, setWorkspaceCompanies] = useState<SavedCompany[]>([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceCategory, setWorkspaceCategory] = useState<string>('all');
  const [workspaceFitFilter, setWorkspaceFitFilter] = useState<FitFilter>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [shortlistSearchQuery, setShortlistSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Infographic modal
  const [isInfographicOpen, setIsInfographicOpen] = useState(false);
  const [infographicLoading, setInfographicLoading] = useState(false);
  const [infographicData, setInfographicData] = useState<InfographicPage | null>(null);
  const [infographicError, setInfographicError] = useState<string | null>(null);
  const [infographicTargetId] = useState<string | null>(null);

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



  // Load workspace companies - now client-side filtering for fit score
  const loadWorkspaceCompanies = useCallback(
    async () => {
      // Always load all companies and filter client-side by industry
      setWorkspaceLoading(true);
      try {
        const result = await fetchSavedCompanies({}); // No backend filtering
        setWorkspaceCompanies(result);


      } catch (error) {
        console.error(error);
        showToast('Failed to load saved companies', 'error');
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

  // NOTE: Workspace change handling is done after loadSearchHistory is defined (see below)


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

  const filteredWorkspaceCompanies = useMemo(() => {
    if (workspaceCompanies.length === 0) {
      return [];
    }

    return workspaceCompanies.filter((company) => {
      // Apply Category Filter (by primary industry)
      if (workspaceCategory !== 'all') {
        if (!matchesIndustry(company.primary_industry, workspaceCategory)) {
          return false;
        }
      }

      // Apply Industry Filter (from dropdown) - same pattern as Fit Score
      if (!matchesIndustry(company.primary_industry, industryFilter)) {
        return false;
      }

      // Apply Location Filter
      if (locationFilter.trim()) {
        const location = locationFilter.toLowerCase();
        const headquarters = (company.headquarters || '').toLowerCase();
        const rawJson = JSON.stringify(company.raw_json || {}).toLowerCase();

        if (!headquarters.includes(location) && !rawJson.includes(location)) {
          return false;
        }
      }

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

      return true;
    });
  }, [workspaceCompanies, workspaceCategory, workspaceFitFilter, industryFilter, locationFilter, shortlistSearchQuery]);

  // CRITICAL: Reload all data when workspace changes
  // This ensures switching workspaces shows correct data for active workspace
  useEffect(() => {
    if (workspace?.id) {
      console.log('[Workspace Switch] Active workspace:', workspace.id, workspace.name);
      loadWorkspaceCompanies();
      setSearchCompaniesList([]);
      setSelectedSearchCompanyId(null);
      setHasSearched(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id]); // Only trigger on workspace ID change


  // Filter search results by fit score and industry (both filters combined with AND)
  const filteredSearchCompanies = useMemo(() => {
    return searchCompaniesList.filter((company) => {
      // Apply Fit Score Filter
      if (searchFitFilter !== 'all') {
        const score = company.acquisition_fit_score;
        if (!Number.isFinite(score)) return false;

        const numericScore = Number(score);
        if (searchFitFilter === 'high' && numericScore < 8) return false;
        if (searchFitFilter === 'medium' && (numericScore < 5 || numericScore >= 8)) return false;
        if (searchFitFilter === 'low' && numericScore >= 5) return false;
      }

      // Apply Industry Filter (same pattern as Fit Score)
      if (!matchesIndustry(company.primary_industry, searchIndustryFilter)) {
        return false;
      }

      return true;
    });
  }, [searchCompaniesList, searchFitFilter, searchIndustryFilter]);

  // Get the selected search company from filtered results
  const selectedSearchCompany = filteredSearchCompanies.find((c) => c.id === selectedSearchCompanyId)
    ?? searchCompaniesList.find((c) => c.id === selectedSearchCompanyId);

  const handleClearSearchData = () => {
    setQuery('');
    setSearchCompaniesList([]);
    setSelectedSearchCompanyId(null);
    setHasSearched(false);
    setSearchError(null);
    setSearchIndustryFilter('all');
    setSearchFitFilter('all');
    setSelectedWorkspaceCompanyId(null);
  };

  // Reset functions for each section - called when clicking on already active section
  const resetSearchView = useCallback(() => {
    setQuery('');
    setSearchCompaniesList([]);
    setSelectedSearchCompanyId(null);
    setHasSearched(false);
    setSearchError(null);
    setSearchIndustryFilter('all');
    setSearchFitFilter('all');
  }, []);

  const resetCompaniesView = useCallback(() => {
    setSelectedWorkspaceCompanyId(null);
    setWorkspaceFitFilter('all');
    setIndustryFilter('all');
    setLocationFilter('');
    setShortlistSearchQuery('');
    setWorkspaceCategory('all');
    loadWorkspaceCompanies();
  }, [loadWorkspaceCompanies]);

  // Navigation handler - resets if already on that view, otherwise switches
  const handleNavigation = useCallback((view: WorkspaceView) => {
    if (activeView === view) {
      switch (view) {
        case 'search':
          resetSearchView();
          break;
        case 'companies':
          resetCompaniesView();
          break;
      }
    } else {
      setActiveView(view);
    }
  }, [activeView, resetSearchView, resetCompaniesView]);

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

  // Storage key for pending search query (must match LandingPage.tsx)
  const PENDING_SEARCH_KEY = 'pendingSearchQuery';

  // Handle URL search params and pending search from sessionStorage (after OAuth redirect)
  useEffect(() => {
    // Priority 1: URL query parameter
    const urlQuery = searchParams.get('q');
    if (urlQuery && !hasSearched && !isSearching) {
      void executeSearch(urlQuery);
      return; // Don't check sessionStorage if URL param is present
    }

    // Priority 2: Pending search from sessionStorage (set before OAuth redirect)
    try {
      const pendingQuery = sessionStorage.getItem(PENDING_SEARCH_KEY);
      if (pendingQuery && pendingQuery.trim() && !hasSearched && !isSearching) {
        // Clear the pending query immediately to prevent re-execution
        sessionStorage.removeItem(PENDING_SEARCH_KEY);
        // Execute the saved search
        void executeSearch(pendingQuery.trim());
      }
    } catch {
      // sessionStorage might not be available in some contexts
    }
  }, [searchParams]);

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

  const retryInfographic = () => {
    if (infographicTargetId) {
      void runInfographic(infographicTargetId);
    }
  };

  const updateCompanySavedState = (companyId: string, saved: boolean, category: string | null) => {
    setSearchCompaniesList((list) =>
      list.map((c) =>
        c.id === companyId ? { ...c, is_saved: saved, saved_category: category } : c,
      ),
    );
  };

  const handleSaveCompany = async (companyId: string, category = DEFAULT_CATEGORY) => {
    if (savingMap[companyId]) return;
    setSavingMap((prev) => ({ ...prev, [companyId]: true }));
    try {
      const company = searchCompaniesList.find(c => c.id === companyId);

      // Use company's primary industry if available, otherwise use the provided category
      const industryCategory = company?.primary_industry || category;

      const saved = await saveCompany(companyId, industryCategory);
      updateCompanySavedState(saved.id, true, saved.saved_category ?? industryCategory);
      showToast('Company saved to workspace');
      // Only auto-select if we are already in the workspace view to avoid jumping
      if (activeView === 'companies') {
        await loadWorkspaceCompanies();
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


  const workspaceFitFilters: { label: string; value: FitFilter }[] = [
    { label: 'All Scores', value: 'all' },
    { label: 'High (> 8.0)', value: 'high' },
    { label: 'Medium (> 6.0)', value: 'medium' },
    { label: 'Low (< 6.0)', value: 'low' },
  ];

  // Global Context Generation
  const generateGlobalContext = () => {
    let context = '';

    if (activeView === 'search' && searchCompaniesList.length > 0) {
      const listSummary = searchCompaniesList.slice(0, 30).map((c, i) =>
        `${i + 1}. ${c.name} (${c.primary_industry || 'N/A'}) - Score: ${c.acquisition_fit_score || 'N/A'}\n   Summary: ${(c.summary || '').slice(0, 100)}...`
      ).join('\n');
      context += `User is viewing Search Results for "${query}".\nTop 30 Companies:\n${listSummary}`;
    }

    if (activeView === 'companies' && workspaceCompanies.length > 0) {
      const listSummary = workspaceCompanies.slice(0, 30).map((c, i) =>
        `${i + 1}. ${c.name} (${c.primary_industry || 'N/A'}) - Score: ${c.fitScore || 'N/A'}\n   Summary: ${(c.summary || '').slice(0, 100)}...`
      ).join('\n');
      context += `User is viewing their Saved Workspace.\nSaved Companies:\n${listSummary}`;
    }

    // Include total counts for user awareness
    context += `\n\nTOTAL DATA AVAILABLE:\n- Saved Companies: ${workspaceCompanies.length}`;

    return context || "User is in the main dashboard. No specific list or company is currently active.";
  };

  const chatContext = useMemo(() => generateGlobalContext(), [activeView, searchCompaniesList, workspaceCompanies, query]);

  return (
    <Layout>
      {toast && (
        <div
          className={cn(
            'fixed top-20 right-6 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-card animate-in slide-in-from-right',
            toast.type === 'success'
              ? 'bg-[#0e0e11] border border-green-500/20 text-green-400'
              : 'bg-[#0e0e11] border border-red-500/20 text-red-400',
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

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-60 bg-[#0a0a0a] border-r border-white/[0.06] flex flex-col h-full transition-transform duration-300 lg:translate-x-0 lg:static lg:flex-shrink-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Brand */}
        <div className="h-14 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center cursor-pointer" onClick={() => setActiveView('search')}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" className="w-7 h-7 flex-shrink-0">
              <defs>
                <linearGradient id="sidebar-zg" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="50%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
              <path d="M6 7h20L6 25h20" stroke="url(#sidebar-zg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 -mr-2 text-white/40 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-3 py-4 flex-1 overflow-y-auto space-y-5">

          {/* Workspace Switcher */}
          <div>
            <p className="text-[11px] font-medium text-white/25 mb-2 px-2">Workspace</p>
            <WorkspaceSwitcher onNavigateToSettings={() => navigate('/settings')} />

            {/* Team Members Avatars */}
            {workspace?.members && workspace.members.length > 0 && (
              <div className="mt-3 px-3">
                <div className="flex items-center -space-x-2">
                  {workspace.members.slice(0, 5).map((member, index) => (
                    <div
                      key={member.id}
                      className="w-6 h-6 rounded-full border border-[#0c0c0f] flex items-center justify-center text-[9px] font-medium text-white shadow-sm relative overflow-hidden"
                      style={{
                        zIndex: workspace.members.length - index,
                        backgroundColor: member.color || '#818cf8',
                      }}
                      title={`${member.name} (${member.role})`}
                    >
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        member.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                      )}
                    </div>
                  ))}
                  {workspace.members.length > 5 && (
                    <div
                      className="w-6 h-6 rounded-full border border-[#0c0c0f] bg-white/10 flex items-center justify-center text-[9px] font-medium text-white/50 shadow-sm"
                      title={`+${workspace.members.length - 5} more`}
                    >
                      +{workspace.members.length - 5}
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-white/20 mt-1.5">{workspace.members.length} team member{workspace.members.length !== 1 ? 's' : ''}</p>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={activeView === 'search' ? query : ''}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void executeSearch()}
              className="w-full pl-9 pr-3 h-9 bg-black border border-white/[0.08] rounded-lg text-sm font-ui text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/30 transition-all"
            />
          </div>

          {/* Navigation */}
          <div>
            <p className="text-[11px] font-medium text-white/25 mb-1 px-2">Menu</p>
            <nav className="space-y-px">
              {([
                { view: 'search', icon: Search, label: 'New Search' },
                { view: 'companies', icon: Building2, label: 'Leads' },
                { view: 'insights', icon: TrendingUp, label: 'Insights' },
                { view: 'pipeline', icon: Kanban, label: 'Pipeline' },
              ] as const).map(({ view, icon: Icon, label }) => (
                <button
                  key={view}
                  onClick={() => handleNavigation(view)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 h-10 text-sm font-ui rounded-lg transition-colors duration-150",
                    activeView === view
                      ? "bg-white/[0.08] text-white"
                      : "text-white/45 hover:bg-white/[0.05] hover:text-white/80"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </button>
              ))}
              <button
                onClick={() => navigate('/settings')}
                className="w-full flex items-center gap-3 px-3 h-10 text-sm font-ui rounded-lg text-white/45 hover:bg-white/[0.05] hover:text-white/80 transition-colors duration-150"
              >
                <Settings className="w-4 h-4 flex-shrink-0" />
                Settings
              </button>
            </nav>
          </div>

          {/* Filters (Only visible in Leads view) */}
          {activeView === 'companies' && (
            <div className="space-y-4">
              <p className="text-[11px] font-medium text-white/25 px-2">Filters</p>

              <div className="px-1 space-y-3">
                <div>
                  <span className="text-[11px] font-medium text-white/30 mb-1.5 block px-2">Fit Score</span>
                  <div className="relative">
                    <select
                      value={workspaceFitFilter}
                      onChange={(e) => setWorkspaceFitFilter(e.target.value as FitFilter)}
                      className="w-full appearance-none bg-white/[0.04] border border-white/[0.08] text-sm text-white/70 py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400/30 focus:border-violet-400/30"
                    >
                      {workspaceFitFilters.map((filter) => (
                        <option key={filter.value} value={filter.value}>
                          {filter.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-white/20 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-medium text-white/30 mb-1.5 block px-2">Industry</span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsIndustryDropdownOpen(!isIndustryDropdownOpen)}
                      className="w-full flex items-center justify-between bg-white/[0.04] border border-white/[0.08] text-sm text-white/70 py-2 pl-3 pr-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400/30 cursor-pointer"
                    >
                      <span className="truncate">{industryFilter === 'all' ? 'All Industries' : industryFilter}</span>
                      <ChevronDown className={cn("w-4 h-4 text-white/20 transition-transform", isIndustryDropdownOpen && "rotate-180")} />
                    </button>
                    {isIndustryDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsIndustryDropdownOpen(false)} />
                        <div className="absolute left-0 right-0 top-full mt-1 bg-[#141417] border border-white/[0.08] rounded-lg shadow-xl z-50 max-h-[280px] overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => { setIndustryFilter('all'); setIsIndustryDropdownOpen(false); }}
                            className={cn("w-full text-left px-3 py-2 text-sm hover:bg-white/[0.06] transition-colors text-white/60", industryFilter === 'all' && "bg-violet-400/10 text-violet-400 font-medium")}
                          >
                            All Industries
                          </button>
                          {INDUSTRIES.map((industry) => (
                            <button
                              key={industry}
                              type="button"
                              onClick={() => { setIndustryFilter(industry); setIsIndustryDropdownOpen(false); }}
                              className={cn("w-full text-left px-3 py-2 text-sm hover:bg-white/[0.06] transition-colors text-white/60", industryFilter === industry && "bg-violet-400/10 text-violet-400 font-medium")}
                            >
                              {industry}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-medium text-white/30 mb-1.5 block px-2">Location</span>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="City, State, Province..."
                      value={locationFilter}
                      onChange={(e) => {
                        setLocationFilter(e.target.value);
                        setIsLocationDropdownOpen(e.target.value.length > 0);
                      }}
                      onFocus={() => locationFilter.length > 0 && setIsLocationDropdownOpen(true)}
                      className="w-full bg-white/[0.04] border border-white/[0.08] text-sm text-white/70 py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400/30 focus:border-violet-400/30 placeholder:text-white/20"
                    />
                    {locationFilter && (
                      <button
                        type="button"
                        onClick={() => { setLocationFilter(''); setIsLocationDropdownOpen(false); }}
                        className="absolute right-2 top-2.5 text-white/30 hover:text-white/60"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {isLocationDropdownOpen && locationFilter.length > 0 && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsLocationDropdownOpen(false)} />
                        <div className="absolute left-0 right-0 top-full mt-1 bg-[#141417] border border-white/[0.08] rounded-lg shadow-xl z-50 max-h-[200px] overflow-y-auto">
                          {LOCATIONS.filter(loc => loc.toLowerCase().includes(locationFilter.toLowerCase())).slice(0, 8).map((loc) => (
                            <button
                              key={loc}
                              type="button"
                              onClick={() => { setLocationFilter(loc); setIsLocationDropdownOpen(false); }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-white/[0.06] transition-colors text-white/60"
                            >
                              {loc}
                            </button>
                          ))}
                          {LOCATIONS.filter(loc => loc.toLowerCase().includes(locationFilter.toLowerCase())).length === 0 && (
                            <div className="px-3 py-2 text-sm text-white/25">No matches found</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.06] flex-shrink-0 space-y-1">
          {activeView === 'search' && (hasSearched || query) && (
            <button
              onClick={handleClearSearchData}
              className="w-full flex items-center gap-3 px-3 h-9 text-sm font-ui rounded-lg text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors duration-150"
            >
              <Trash2 className="w-4 h-4 flex-shrink-0" />
              Clear search
            </button>
          )}
          <button
            onClick={async () => {
              try {
                navigate('/', { replace: true });
                await signOut();
              } catch (error) {
                console.error('Failed to sign out', error);
              }
            }}
            className="w-full flex items-center gap-3 px-3 h-9 text-sm font-ui rounded-lg text-white/30 hover:bg-white/[0.05] hover:text-white/60 transition-colors duration-150"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#09090b] overflow-hidden relative">
        {/* Ambient background — violet tones */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Full-screen violet wash */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 70% at 55% 35%, rgba(139,92,246,0.16) 0%, rgba(109,40,217,0.08) 35%, rgba(91,33,182,0.04) 55%, transparent 80%)' }} />
          {/* Hot spot — center */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full blur-[120px]" style={{ background: 'radial-gradient(ellipse, rgba(167,139,250,0.22) 0%, rgba(139,92,246,0.10) 45%, transparent 70%)' }} />
          {/* Accent — top right */}
          <div className="absolute -top-20 -right-20 w-[500px] h-[400px] rounded-full blur-[140px]" style={{ background: 'radial-gradient(ellipse, rgba(167,139,250,0.14) 0%, transparent 65%)' }} />
          {/* Accent — bottom left */}
          <div className="absolute -bottom-20 -left-20 w-[450px] h-[350px] rounded-full blur-[130px]" style={{ background: 'radial-gradient(ellipse, rgba(109,40,217,0.10) 0%, transparent 65%)' }} />
        </div>
        <div className="relative z-10 flex-1 flex flex-col min-h-0">
          {activeView === 'search' && (
            <div className="flex-1 overflow-auto px-4 sm:px-8 py-6 flex flex-col">
              {!hasSearched && !isSearching && searchCompaniesList.length === 0 && (
                <div className="flex-1 flex flex-col">
                  <MarketSearchPanel
                    query={query}
                    setQuery={setQuery}
                    onSearch={executeSearch}
                  />
                </div>
              )}

              {(hasSearched || isSearching || searchCompaniesList.length > 0) && (
                <div className="flex flex-col lg:flex-row h-full gap-4">
                  <div className="flex-1 flex flex-col min-h-0 bg-[#0e0e11] rounded-xl overflow-hidden relative h-[500px] lg:h-auto ring-1 ring-white/[0.08]">
                    {isSearching ? (
                      <div className="absolute inset-0 z-20 bg-[#0e0e11] flex flex-col items-center justify-center">
                        <AiLoader />
                      </div>
                    ) : (
                      <>
                        <div className="bg-white/[0.03] px-4 py-3 border-b border-white/[0.08]">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-semibold text-white/80">
                              Results ({filteredSearchCompanies.length}
                              {filteredSearchCompanies.length !== searchCompaniesList.length &&
                                ` of ${searchCompaniesList.length}`})
                            </span>
                            {searchError && <span className="text-xs text-red-400">{searchError}</span>}
                          </div>
                          {/* Search Filters */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-medium text-white/30">Fit:</span>
                              <select
                                value={searchFitFilter}
                                onChange={(e) => setSearchFitFilter(e.target.value as FitFilter)}
                                className="appearance-none bg-white/[0.05] border border-white/[0.08] text-xs text-white/60 py-1.5 pl-2 pr-6 rounded-md focus:outline-none focus:ring-1 focus:ring-violet-500/30 cursor-pointer"
                              >
                                <option value="all">All Scores</option>
                                <option value="high">High (8+)</option>
                                <option value="medium">Medium (5-7)</option>
                                <option value="low">Low (&lt;5)</option>
                              </select>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-medium text-white/30">Industry:</span>
                              <select
                                value={searchIndustryFilter}
                                onChange={(e) => setSearchIndustryFilter(e.target.value)}
                                className="appearance-none bg-white/[0.05] border border-white/[0.08] text-xs text-white/60 py-1.5 pl-2 pr-6 rounded-md focus:outline-none focus:ring-1 focus:ring-violet-500/30 cursor-pointer"
                              >
                                <option value="all">All Industries</option>
                                {INDUSTRIES.map((industry) => (
                                  <option key={industry} value={industry}>
                                    {industry}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {(searchFitFilter !== 'all' || searchIndustryFilter !== 'all') && (
                              <button
                                onClick={() => {
                                  setSearchFitFilter('all');
                                  setSearchIndustryFilter('all');
                                }}
                                className="text-xs text-violet-400 hover:text-violet-300 font-medium"
                              >
                                Clear filters
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 overflow-auto">
                          {filteredSearchCompanies.length === 0 ? (
                            <div className="p-8 text-center text-white/30 text-sm">
                              {searchCompaniesList.length === 0
                                ? "No results found."
                                : "No companies match the selected filters."}
                            </div>
                          ) : (
                            <table className="w-full text-left border-collapse">
                              <thead className="sticky top-0 bg-white/[0.04] z-10">
                                <tr>
                                  <th className="py-3 px-4 text-[11px] font-semibold text-white/40 uppercase tracking-wider border-b border-white/[0.08] border-r border-r-white/[0.04]">Name</th>
                                  <th className="py-3 px-4 text-[11px] font-semibold text-white/40 uppercase tracking-wider border-b border-white/[0.08] border-r border-r-white/[0.04]">Industry</th>
                                  <th className="py-3 px-4 text-[11px] font-semibold text-white/40 uppercase tracking-wider border-b border-white/[0.08] border-r border-r-white/[0.04] text-right">Fit</th>
                                  <th className="py-3 px-4 text-[11px] font-semibold text-white/40 uppercase tracking-wider border-b border-white/[0.08] text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredSearchCompanies.map(company => (
                                  <tr
                                    key={company.id}
                                    onClick={() => setSelectedSearchCompanyId(company.id)}
                                    className={cn(
                                      "group cursor-pointer hover:bg-violet-500/[0.06] transition-colors border-b border-white/[0.04]",
                                      selectedSearchCompanyId === company.id ? "bg-violet-500/[0.08]" : ""
                                    )}
                                  >
                                    <td className="py-3 px-4 border-r border-white/[0.04]">
                                      <div className="flex items-center gap-3">
                                        <CompanyAvatar name={company.name} faviconUrl={company.favicon_url} website={company.website} size={28} />
                                        <div>
                                          <div className="font-semibold text-white text-sm">{company.name}</div>
                                          <div className="text-[11px] text-white/30">{company.website}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 border-r border-white/[0.04]">
                                      <span className="text-xs text-white/50 font-medium">
                                        {company.primary_industry || 'Unknown'}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 border-r border-white/[0.04]">
                                      <FitScoreBar score={company.acquisition_fit_score} size="sm" />
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSaveCompany(company.id, company.primary_industry ?? DEFAULT_CATEGORY);
                                        }}
                                        disabled={company.is_saved || savingMap[company.id]}
                                        className={cn(
                                          "text-xs font-semibold transition-colors",
                                          company.is_saved
                                            ? "text-emerald-400 cursor-default"
                                            : "text-violet-400 hover:text-violet-300"
                                        )}
                                      >
                                        {savingMap[company.id] ? 'Saving...' : company.is_saved ? 'Saved' : 'Save'}
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Detail View for Search */}
                  {selectedSearchCompany && (
                    <>
                      <aside className="w-full lg:w-[400px] flex-shrink-0 bg-[#0e0e11] rounded-xl overflow-hidden flex flex-col h-[600px] lg:h-auto ring-1 ring-white/[0.08]">
                        <div className="flex-1 overflow-y-auto">
                          <CompanyDetailPanel
                            company={selectedSearchCompany}
                          />
                        </div>
                      </aside>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {
            activeView === 'companies' && (
              <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* Left: Leads Table */}
                <div className="flex flex-col overflow-auto w-full">
                  {/* Search bar */}
                  <div className="px-6 pt-6 pb-3">
                    <div className="relative max-w-md">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/30 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Filter by name, domain, industry..."
                        value={shortlistSearchQuery}
                        onChange={(e) => setShortlistSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-violet-400/30 focus:border-violet-400/30 transition-all text-white"
                      />
                    </div>
                  </div>

                  <div className="px-6 pb-6 flex-1">
                    {workspaceLoading ? (
                      <div className="flex items-center justify-center pt-20">
                        <AiLoader />
                      </div>
                    ) : (
                      <LeadsDataTable
                        companies={filteredWorkspaceCompanies}
                        onCompanyAction={(id, action) => {
                          if (action === 'remove') handleUnsaveCompany(id);
                        }}
                      />
                    )}
                  </div>
                </div>

              </div>
            )
          }

          {
            activeView === 'insights' && (
              <div className="flex-1 overflow-hidden">
                <InsightsPage
                  companies={workspaceCompanies}
                  loading={workspaceLoading}
                  industryFilter={industryFilter}
                  locationFilter={locationFilter}
                  fitFilter={workspaceFitFilter}
                  onCompanyClick={() => setActiveView('companies')}
                />
              </div>
            )
          }

          {
            activeView === 'pipeline' && (
              <div className="flex-1 overflow-hidden">
                <PipelinePage
                  onCompanyClick={(companyId) => {
                    
                    setActiveView('companies');
                  }}
                />
              </div>
            )
          }
        </div>
      </main>

      {/* Removed duplicate detail panel logic - it's now handled inside the activeView === 'companies' block above */}

      {/* Floating Chat Widget - Always available */}
      <ChatWidget mode="floating" context={chatContext} />

    </Layout >
  );
}



function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#09090b]">
        <AiLoader />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/workspace" replace /> : <LandingPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
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
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
