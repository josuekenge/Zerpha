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
import { motion } from 'framer-motion';

import { Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CompanyDetailPanel } from './components/CompanyDetailPanel';

import { InfographicModal } from './components/InfographicModal';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingStats } from './components/LoadingStats';
import { ChatWidget } from './components/ChatWidget';
import { useAuth, signOut } from './lib/auth';
import {
  exportInfographic,
  fetchSavedCompanies,
  fetchSearchHistory,
  fetchSearchDetails,
  saveCompany,
  searchCompanies,
  unsaveCompany,
} from './api/client';
import { Company, CompanyWithPeople, InfographicPage, Person, SavedCompany, SearchHistoryItem } from './types';
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

const INDUSTRIES = [
  "AI",
  "Logistics",
  "Healthcare",
  "Retail",
  "Real Estate",
  "Transportation",
  "HR Tech",
  "Cybersecurity",
  "EdTech",
  "Marketing",
  "Sales",
  "Productivity",
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Initialize activeView from URL parameter, default to 'search'
  const initialView = (searchParams.get('view') as WorkspaceView) || 'search';
  const [activeView, setActiveView] = useState<WorkspaceView>(initialView);

  const displayName = user?.email ? `Hi ${user.email.split('@')[0]}` : 'Zerpha Intelligence';
  const displayInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'Z';

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

  // Workspace state
  const [workspaceCompanies, setWorkspaceCompanies] = useState<SavedCompany[]>([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceCategory, setWorkspaceCategory] = useState<string>('all');
  const [workspaceFitFilter, setWorkspaceFitFilter] = useState<FitFilter>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [selectedWorkspaceCompanyId, setSelectedWorkspaceCompanyId] = useState<string | null>(
    null,
  );
  const [shortlistSearchQuery, setShortlistSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // History state
  const [historyItems, setHistoryItems] = useState<SearchHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [historyCompanies, setHistoryCompanies] = useState<CompanyWithPeople[]>([]);
  const [historyDetailsLoading, setHistoryDetailsLoading] = useState(false);
  const [selectedHistoryCompanyId, setSelectedHistoryCompanyId] = useState<string | null>(null);
  const [historySearchQuery, setHistorySearchQuery] = useState('');

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



  // Load workspace companies - now client-side filtering for fit score
  const loadWorkspaceCompanies = useCallback(
    async (options?: { category?: string; autoSelectId?: string }) => {
      // Always load all companies and filter client-side by industry
      setWorkspaceLoading(true);
      try {
        const result = await fetchSavedCompanies({}); // No backend filtering
        setWorkspaceCompanies(result);

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

  // ... (rest of file)


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
      // Apply Category Filter (by primary industry)
      if (workspaceCategory !== 'all') {
        const companyIndustry = company.primary_industry?.trim();
        if (!companyIndustry || companyIndustry.toLowerCase() !== workspaceCategory.toLowerCase()) {
          return false;
        }
      }

      // Apply Industry Filter (from dropdown)
      if (industryFilter && industryFilter !== 'all') {
        const companyIndustry = company.primary_industry?.toLowerCase() || '';
        const filterIndustry = industryFilter.toLowerCase();
        if (!companyIndustry.includes(filterIndustry) && companyIndustry !== filterIndustry) {
          return false;
        }
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

  // History computed values
  const filteredHistoryCompanies = useMemo(() => {
    if (!historySearchQuery.trim()) return historyCompanies;
    const q = historySearchQuery.toLowerCase();
    return historyCompanies.filter((c) => {
      const name = c.name?.toLowerCase() ?? '';
      const website = c.website?.toLowerCase() ?? '';
      const industry = c.primary_industry?.toLowerCase() ?? '';
      return name.includes(q) || website.includes(q) || industry.includes(q);
    });
  }, [historyCompanies, historySearchQuery]);

  const selectedHistoryCompany = historyCompanies.find((c) => c.id === selectedHistoryCompanyId);
  const selectedHistoryCompanyAsCompany: Company | null = selectedHistoryCompany ? {
    id: selectedHistoryCompany.id,
    name: selectedHistoryCompany.name,
    website: selectedHistoryCompany.website,
    vertical_query: selectedHistoryCompany.vertical_query,
    acquisition_fit_score: selectedHistoryCompany.acquisition_fit_score,
    summary: selectedHistoryCompany.summary,
    raw_json: selectedHistoryCompany.raw_json,
    is_saved: selectedHistoryCompany.is_saved,
    saved_category: selectedHistoryCompany.saved_category,
    created_at: selectedHistoryCompany.created_at,
    primary_industry: selectedHistoryCompany.primary_industry,
    secondary_industry: selectedHistoryCompany.secondary_industry,
  } : null;

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

  // Handle URL search params
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && !hasSearched && !isSearching) {
      void executeSearch(q);
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
    setSearchCompaniesList((list) =>
      list.map((c) =>
        c.id === companyId ? { ...c, is_saved: saved, saved_category: category } : c,
      ),
    );
    setHistoryCompanies((list) =>
      list.map((c) =>
        c.id === companyId ? { ...c, is_saved: saved, saved_category: category } : c,
      ),
    );
  };

  const handleSaveCompany = async (companyId: string, category = DEFAULT_CATEGORY) => {
    if (savingMap[companyId]) return;
    setSavingMap((prev) => ({ ...prev, [companyId]: true }));
    try {
      // Find the company in search results or history to get its industry
      const company = searchCompaniesList.find(c => c.id === companyId) ||
        historyCompanies.find(c => c.id === companyId);

      // Use company's primary industry if available, otherwise use the provided category
      const industryCategory = company?.primary_industry || category;

      const saved = await saveCompany(companyId, industryCategory);
      updateCompanySavedState(saved.id, true, saved.saved_category ?? industryCategory);
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
    setSelectedHistoryCompanyId(null);
    setHistoryCompanies([]);
    setHistoryDetailsLoading(true);
    try {
      const response = await fetchSearchDetails(item.id);
      setHistoryCompanies(response.companies);
      // Auto-select first company if available
      if (response.companies.length > 0) {
        setSelectedHistoryCompanyId(response.companies[0].id);
      }
    } catch (error) {
      console.error('Failed to load search details:', error);
    } finally {
      setHistoryDetailsLoading(false);
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

    if (activeView === 'history' && historyItems.length > 0) {
      const historySummary = historyItems.slice(0, 10).map((h, i) =>
        `${i + 1}. Search: "${h.query}" (${new Date(h.created_at).toLocaleDateString()})`
      ).join('\n');
      context += `\n\nSearch History (last 10):\n${historySummary}`;

      if (selectedHistoryCompanyAsCompany) {
        context += `\n\nCurrently viewing: ${selectedHistoryCompanyAsCompany.name}\nDetails: ${JSON.stringify(selectedHistoryCompanyAsCompany)}`;
      }
    }

    // Add people data
    if (activeView === 'people' && allPeople.length > 0) {
      const peopleSummary = allPeople.slice(0, 30).map((p, i) =>
        `${i + 1}. ${p.full_name || 'Unknown'} - ${p.role || 'N/A'} at ${p.company_name || 'N/A'}\n   Email: ${p.email || 'N/A'}`
      ).join('\n');
      context += `User is viewing their People/Contacts.\nTop 30 People:\n${peopleSummary}`;
    }

    // Include total counts for user awareness
    context += `\n\nTOTAL DATA AVAILABLE:\n- Saved Companies: ${workspaceCompanies.length}\n- People/Contacts: ${allPeople.length}\n- Search History: ${historyItems.length} searches`;

    return context || "User is in the main dashboard. No specific list or company is currently active.";
  };

  const chatContext = useMemo(() => generateGlobalContext(), [activeView, searchCompaniesList, workspaceCompanies, query, selectedHistoryCompanyAsCompany]);

  return (
    <Layout>
      {/* Only show floating chat if no company is selected in main views */
        !selectedSearchCompanyId && !selectedWorkspaceCompanyId && !selectedHistoryCompanyId && (
          <ChatWidget context={chatContext} />
        )}
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
      <aside className="w-72 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col h-full transition-all duration-300 relative z-20">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3 text-slate-900">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 p-1.5">
              <img src="/zerpha.svg" alt="Zerpha" className="w-full h-full" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-sm leading-none">Zerpha</span>
              <span className="text-slate-500 text-[10px] font-medium leading-none mt-1">Intelligence</span>
            </div>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-8">

          {/* Workspace */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 block px-3">Workspace</label>
            <button className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200 group">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-xs font-bold border border-indigo-100 group-hover:border-indigo-200 transition-colors">{displayInitial}</div>
                <span className="group-hover:text-indigo-900 transition-colors">{displayName}</span>
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
            </button>
          </div>

          {/* Search */}
          {activeView === 'search' && (
            <div className="relative group px-1">
              <Search className="absolute left-4 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="Search vertical..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void executeSearch()}
                className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
              />
            </div>
          )}

          {/* Navigation */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block px-3">Menu</label>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveView('search')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                  activeView === 'search'
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Search className={cn("w-4 h-4", activeView === 'search' ? "text-white" : "text-slate-400 group-hover:text-slate-600")} />
                New Search
              </button>

              <button
                onClick={() => setActiveView('companies')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                  activeView === 'companies'
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Building2 className={cn("w-4 h-4", activeView === 'companies' ? "text-white" : "text-slate-400 group-hover:text-slate-600")} />
                Companies
                {activeView === 'companies' && <span className="ml-auto text-[10px] font-bold bg-white/20 text-white px-1.5 py-0.5 rounded">NOW</span>}
              </button>

              <button
                onClick={() => setActiveView('people')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                  activeView === 'people'
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Users className={cn("w-4 h-4", activeView === 'people' ? "text-white" : "text-slate-400 group-hover:text-slate-600")} />
                People
              </button>

              <button
                onClick={() => setActiveView('history')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                  activeView === 'history'
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <History className={cn("w-4 h-4", activeView === 'history' ? "text-white" : "text-slate-400 group-hover:text-slate-600")} />
                Search history
              </button>
            </nav>
          </div>

          {/* View Toggle (Only visible in Companies view) */}
          {activeView === 'companies' && (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block px-3">View</label>
              <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200 mb-4 mx-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded transition-all",
                    viewMode === 'table'
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Table2 className="w-3.5 h-3.5" /> Table
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded transition-all",
                    viewMode === 'cards'
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <LayoutGrid className="w-3.5 h-3.5" /> Cards
                </button>
              </div>
            </div>
          )}

          {/* Filters (Only visible in Companies view) */}
          {activeView === 'companies' && (
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">Filters</label>

              <div className="px-1 space-y-3">
                <div>
                  <span className="text-xs font-medium text-slate-500 mb-1.5 block px-2">Fit Score</span>
                  <div className="relative">
                    <select
                      value={workspaceFitFilter}
                      onChange={(e) => setWorkspaceFitFilter(e.target.value as FitFilter)}
                      className="w-full appearance-none bg-white border border-slate-200 text-sm text-slate-700 py-2 pl-3 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
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
                  <span className="text-xs font-medium text-slate-500 mb-1.5 block px-2">Industry</span>
                  <div className="relative z-50">
                    <select
                      value={industryFilter}
                      onChange={(e) => setIndustryFilter(e.target.value)}
                      className="w-full appearance-none bg-white border border-slate-200 text-sm text-slate-700 py-2 pl-3 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
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

                <div>
                  <span className="text-xs font-medium text-slate-500 mb-1.5 block px-2">Location</span>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="City, State, Province..."
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-sm text-slate-700 py-2 pl-3 pr-3 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex-shrink-0 bg-white">
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
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50 overflow-hidden">
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
              onClick={async () => {
                try {
                  navigate('/', { replace: true });
                  await signOut();
                } catch (error) {
                  console.error('Failed to sign out', error);
                }
              }}
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
                <div className="h-full flex flex-col items-center justify-center max-w-3xl mx-auto relative">
                  <div className="h-full flex flex-col items-center justify-center relative overflow-hidden bg-slate-50/50">
                    {/* Dot Pattern Background */}
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.5 }}></div>

                    {/* Content */}
                    <div className="relative z-10 w-full max-w-3xl px-6 text-center">

                      {/* Badge */}
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 mb-8 shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></div>
                        <span className="text-xs font-semibold text-indigo-600">AI Engine Updated v2.4</span>
                      </div>

                      {/* Headings */}
                      <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">What market are you scouting today?</h2>
                      <p className="text-slate-500 text-lg mb-12">Search for verticals, competitors, or specific technologies.</p>

                      {/* Search Bar */}
                      <div className="relative group max-w-2xl mx-auto mb-8">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-100 via-purple-100 to-indigo-100 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
                        <div className="relative bg-white rounded-2xl shadow-xl shadow-slate-200/50 ring-1 ring-slate-200 flex items-center p-2 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20">
                          <Search className="w-5 h-5 text-slate-400 ml-4" />
                          <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
                            placeholder="e.g. B2B SaaS for Construction in Europe..."
                            className="flex-1 px-4 py-3 bg-transparent border-none text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                            autoFocus
                          />
                          <div className="pr-2">
                            <button
                              onClick={() => executeSearch()}
                              className="p-2 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"
                            >
                              <Zap className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Suggestions */}
                      <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
                        <span className="font-medium text-slate-400">Try:</span>
                        <button onClick={() => handleQuickFilter('Fintech API')} className="hover:text-indigo-600 transition-colors hover:underline decoration-indigo-200 underline-offset-4">Fintech API</button>
                        <span className="text-slate-300">•</span>
                        <button onClick={() => handleQuickFilter('Green Energy')} className="hover:text-indigo-600 transition-colors hover:underline decoration-indigo-200 underline-offset-4">Green Energy</button>
                        <span className="text-slate-300">•</span>
                        <button onClick={() => handleQuickFilter('EdTech Mobile')} className="hover:text-indigo-600 transition-colors hover:underline decoration-indigo-200 underline-offset-4">EdTech Mobile</button>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {(hasSearched || isSearching || searchCompaniesList.length > 0) && (
                <div className="flex h-full gap-6">
                  <div className="flex-1 flex flex-col min-h-0 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative">
                    {isSearching ? (
                      <div className="absolute inset-0 z-20 bg-white flex flex-col items-center justify-center">
                        <LoadingStats />
                      </div>
                    ) : (
                      <>
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-700">Results ({searchCompaniesList.length})</span>
                          {searchError && <span className="text-xs text-red-600">{searchError}</span>}
                        </div>
                        <div className="flex-1 overflow-auto bg-white">
                          {searchCompaniesList.length === 0 ? (
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
                                          handleSaveCompany(company.id, company.primary_industry ?? DEFAULT_CATEGORY);
                                        }}
                                        disabled={company.is_saved || savingMap[company.id]}
                                        className={cn(
                                          "text-xs font-medium transition-colors",
                                          company.is_saved
                                            ? "text-green-600 cursor-default"
                                            : "text-indigo-600 hover:text-indigo-800"
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
                      <aside className="w-[400px] flex-shrink-0 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm flex flex-col">
                        <div className="flex-1 overflow-y-auto">
                          <CompanyDetailPanel
                            company={selectedSearchCompany}
                          />
                        </div>
                      </aside>
                      {/* Embedded Chat for Search */}
                      <aside className="w-[350px] flex-shrink-0 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm flex flex-col">
                        <ChatWidget mode="embedded" context={chatContext} />
                      </aside>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {activeView === 'companies' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Header */}
              <div className="px-8 pt-6 pb-4">
                {/* Top Row: All Companies Tab and View Toggle */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 border-b border-slate-200">
                    <button
                      onClick={() => setWorkspaceCategory('all')}
                      className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                        "text-indigo-600 border-indigo-600"
                      )}
                    >
                      All Companies
                    </button>
                  </div>

                  {/* View Toggle - Top Right */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">View</span>
                    <div className="inline-flex bg-slate-100 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('table')}
                        className={cn(
                          "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                          viewMode === 'table'
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        )}
                      >
                        <Table2 className="w-3.5 h-3.5" />
                        Table
                      </button>
                      <button
                        onClick={() => setViewMode('cards')}
                        className={cn(
                          "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                          viewMode === 'cards'
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        )}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        Cards
                      </button>
                    </div>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Filter by name, domain..."
                    value={shortlistSearchQuery}
                    onChange={(e) => setShortlistSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-md text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
                  />
                </div>
              </div>

              {/* Table Container */}
              <div className="flex-1 overflow-hidden px-8 py-4">
                <div className="flex h-full overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200">
                  <div className={cn(
                    "border-r border-slate-200 bg-white overflow-y-auto flex flex-col transition-all duration-300",
                    selectedWorkspaceCompanyId ? "w-[30%]" : "w-full border-r-0"
                  )}>
                    {workspaceLoading ? (
                      <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 text-indigo-600 animate-spin" /></div>
                    ) : filteredWorkspaceCompanies.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-sm bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                        {workspaceCompanies.length > 0 ? "No companies match the selected filters." : "No saved companies yet."}
                      </div>
                    ) : viewMode === 'cards' ? (
                      /* Card View */
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
                        {filteredWorkspaceCompanies.map(company => (
                          <motion.div
                            key={company.id}
                            whileHover={{ y: -4 }}
                            onClick={() => {
                              if (selectedWorkspaceCompanyId === company.id) {
                                setSelectedWorkspaceCompanyId(null);
                              } else {
                                setSelectedWorkspaceCompanyId(company.id);
                              }
                            }}
                            className={cn(
                              "group relative bg-white rounded-xl border-2 p-5 cursor-pointer transition-all duration-200",
                              selectedWorkspaceCompanyId === company.id
                                ? "border-indigo-600 shadow-lg shadow-indigo-600/20 bg-gradient-to-br from-indigo-50 to-violet-50"
                                : "border-slate-200 hover:border-indigo-300 hover:shadow-md"
                            )}
                          >
                            {/* Selected Indicator */}
                            {selectedWorkspaceCompanyId === company.id && (
                              <div className="absolute top-3 right-3 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}

                            {/* Company Name */}
                            <h3 className="font-semibold text-slate-900 mb-2 pr-8 truncate text-base">
                              {company.name}
                            </h3>

                            {/* Domain */}
                            <a
                              href={normalizeWebsite(company.domain)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-indigo-600 hover:text-indigo-800 mb-3 block truncate"
                            >
                              {company.domain}
                            </a>

                            {/* Summary */}
                            {company.summary && (
                              <p className="text-xs text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                                {company.summary}
                              </p>
                            )}

                            {/* Metadata Row */}
                            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                              {/* Fit Score */}
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">Score:</span>
                                <span className={cn(
                                  "inline-flex items-center px-2 py-1 rounded text-xs font-medium",
                                  (company.fitScore ?? 0) >= 8 ? "bg-green-100 text-green-800" :
                                    (company.fitScore ?? 0) >= 5 ? "bg-yellow-100 text-yellow-800" :
                                      (company.fitScore ?? 0) > 0 ? "bg-red-100 text-red-800" : "text-slate-400"
                                )}>
                                  {company.fitScore ?? '—'}
                                </span>
                              </div>

                              {/* Delete Button */}
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
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      /* Table View */
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
                    <>
                      <div className="w-[40%] bg-white overflow-y-auto border-l border-slate-200 shadow-xl shadow-slate-200/50 z-20 h-full animate-in slide-in-from-right duration-300">
                        <CompanyDetailPanel company={workspaceSelectionDetail} />
                      </div>
                      {/* Embedded Chat for Workspace */}
                      <div className="flex-1 min-w-[300px] bg-white border-l border-slate-200 z-10 h-full">
                        <ChatWidget mode="embedded" context={chatContext} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeView === 'history' && (
            <div className="flex-1 flex min-h-0 px-8 py-6">
              <div className="flex-1 flex h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Left Panel: Search History List */}
                <div className="w-64 border-r border-slate-200 bg-slate-50 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-700">Past Searches</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {historyLoading ? (
                      <div className="p-4 flex justify-center">
                        <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                      </div>
                    ) : historyItems.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">No search history yet.</div>
                    ) : (
                      <div className="divide-y divide-slate-200">
                        {historyItems.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleHistoryRowClick(item)}
                            className={cn(
                              "w-full text-left p-3 hover:bg-white transition-colors",
                              selectedHistoryId === item.id ? "bg-white border-l-2 border-indigo-600" : ""
                            )}
                          >
                            <p className="text-sm font-medium text-slate-900 truncate">{item.query}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-500">{formatDate(item.created_at)}</span>
                              <span className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                                {item.company_count}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Middle Panel: Companies for Selected Search */}
                <div className={cn(
                  "flex flex-col overflow-hidden transition-all duration-300 border-r border-slate-200",
                  selectedHistoryCompanyId ? "w-[30%]" : "flex-1"
                )}>
                  {!selectedHistoryId ? (
                    <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                      Select a search from the left to view companies
                    </div>
                  ) : historyDetailsLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="p-4 border-b border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-slate-700">
                            Companies ({filteredHistoryCompanies.length})
                          </h3>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Filter companies..."
                            value={historySearchQuery}
                            onChange={(e) => setHistorySearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-md text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        {filteredHistoryCompanies.length === 0 ? (
                          <div className="p-4 text-center text-sm text-slate-500">
                            {historyCompanies.length > 0 ? "No companies match your filter." : "No companies found for this search."}
                          </div>
                        ) : (
                          <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-white z-10">
                              <tr>
                                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Company</th>
                                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">Fit</th>
                                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-center">People</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {filteredHistoryCompanies.map((company) => (
                                <tr
                                  key={company.id}
                                  onClick={() => setSelectedHistoryCompanyId(company.id)}
                                  className={cn(
                                    "cursor-pointer hover:bg-slate-50 transition-colors",
                                    selectedHistoryCompanyId === company.id ? "bg-indigo-50" : ""
                                  )}
                                >
                                  <td className="py-3 px-4">
                                    <div className="font-medium text-slate-900">{company.name}</div>
                                    <div className="text-xs text-slate-500 truncate max-w-[200px]">{company.website}</div>
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
                                  <td className="py-3 px-4 text-center">
                                    <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                                      <Users className="w-3.5 h-3.5" />
                                      {company.people?.length ?? 0}
                                    </span>
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

                {/* Right Panel: Company Detail + People */}
                {selectedHistoryCompanyId && selectedHistoryCompany && (
                  <>
                    <div className="w-[40%] bg-white overflow-y-auto animate-in slide-in-from-right duration-300 border-r border-slate-200">
                      {/* Company Details */}
                      <div className="border-b border-slate-200">
                        <CompanyDetailPanel company={selectedHistoryCompanyAsCompany!} />
                      </div>

                      {/* People Section */}
                      <div className="p-6">
                        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-400" />
                          Contacts ({selectedHistoryCompany.people?.length ?? 0})
                        </h3>

                        {(!selectedHistoryCompany.people || selectedHistoryCompany.people.length === 0) ? (
                          <div className="text-sm text-slate-500 bg-slate-50 rounded-lg p-4 border border-slate-100 border-dashed">
                            No contacts found for this company yet.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {selectedHistoryCompany.people.map((person) => {
                              const displayName = person.full_name
                                || (person.first_name && person.last_name ? `${person.first_name} ${person.last_name}` : null)
                                || person.first_name
                                || person.last_name
                                || 'Unknown';
                              const isHighlighted = person.is_ceo || person.is_founder || person.is_executive;

                              return (
                                <div
                                  key={person.id}
                                  className={cn(
                                    "p-4 rounded-lg border transition-colors",
                                    isHighlighted ? "bg-amber-50/50 border-amber-200" : "bg-white border-slate-200"
                                  )}
                                >
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className={cn(
                                          "font-medium text-slate-900",
                                          isHighlighted && "font-bold"
                                        )}>
                                          {displayName}
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
                                      <p className="text-sm text-slate-600 mt-0.5">{person.role || 'Unknown Role'}</p>
                                    </div>
                                    {person.source && (
                                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded capitalize">
                                        {person.source}
                                      </span>
                                    )}
                                  </div>

                                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                                    {person.email && (
                                      <a
                                        href={`mailto:${person.email}`}
                                        className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800"
                                      >
                                        <Mail className="w-4 h-4" />
                                        <span className="truncate max-w-[200px]">{person.email}</span>
                                      </a>
                                    )}
                                    {person.phone && (
                                      <span className="flex items-center gap-1.5 text-slate-600">
                                        <Phone className="w-4 h-4" />
                                        {person.phone}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Embedded Chat for History */}
                    <div className="flex-1 min-w-[300px] bg-white z-10 h-full">
                      <ChatWidget mode="embedded" context={chatContext} />
                    </div>
                  </>
                )}
              </div>
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
                    "bg-white overflow-y-auto flex flex-col transition-all duration-300 border border-slate-200 rounded-xl shadow-sm",
                    selectedPersonId ? "w-[30%] border-r-0 rounded-r-none" : "w-full"
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
                            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Company</th>
                            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Email</th>
                            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Name</th>
                            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 hidden md:table-cell">Role</th>
                            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 hidden sm:table-cell">Source</th>
                            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Actions</th>
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
                                <td className="py-3 px-4 text-slate-600">
                                  {person.company_name || '—'}
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
                                <td className="py-3 px-4 hidden sm:table-cell">
                                  <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded capitalize">
                                    {person.source || 'unknown'}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (confirm(`Delete ${person.full_name || 'this person'}?`)) {
                                        try {
                                          const { deletePerson } = await import('./api/people');
                                          await deletePerson(person.id);
                                          setAllPeople(prev => prev.filter(p => p.id !== person.id));
                                          if (selectedPersonId === person.id) {
                                            setSelectedPersonId(null);
                                          }
                                        } catch (error) {
                                          console.error('Failed to delete person:', error);
                                          alert('Failed to delete person');
                                        }
                                      }
                                    }}
                                    className="text-slate-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded"
                                    title="Delete person"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
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
                    <>
                      <div className="w-[40%] bg-white overflow-y-auto border border-slate-200 rounded-r-none shadow-xl shadow-slate-200/50 z-20 h-full animate-in slide-in-from-right duration-300">
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
                      {/* Embedded Chat for People */}
                      <div className="flex-1 min-w-[300px] bg-white border border-slate-200 border-l-0 rounded-r-lg z-10 h-full">
                        <ChatWidget mode="embedded" context={chatContext} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Removed duplicate detail panel logic - it's now handled inside the activeView === 'companies' block above */}

    </Layout >
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
