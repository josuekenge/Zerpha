// Last updated: 2025-12-12 - Dark mode refinements and workspace cleanup
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Loader2,
  Check,
  Download,
  Trash2,
  ChevronDown,
  Building2,
  History,
  Table2,
  LayoutGrid,
  Users,
  Mail,
  Phone,
  Linkedin,
  MapPin,
  ExternalLink,
  Menu,
  X,
  TrendingUp,
  Kanban,
  Settings,
} from 'lucide-react';
import { motion } from 'framer-motion';

import { Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CompanyDetailPanel } from './components/CompanyDetailPanel';
import { CompanyAvatar } from './components/CompanyAvatar';
import { FitScoreBar } from './components/FitScoreBar';

import { InfographicModal } from './components/InfographicModal';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingStats } from './components/LoadingStats';
import { ChatWidget } from './components/ChatWidget';
import { InsightsPage } from './components/InsightsPage';
import { PipelinePage } from './components/PipelinePage';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { MarketSearchPanel } from './components/ui/market-search-panel';
import { SettingsPage } from './pages/settings/SettingsPage';
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
import { cn, formatDate, normalizeWebsite, matchesIndustry, savedCompanyToCompany } from './lib/utils';
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
  const [selectedWorkspaceCompanyId, setSelectedWorkspaceCompanyId] = useState<string | null>(
    null,
  );
  const [shortlistSearchQuery, setShortlistSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // CRITICAL: Reload all data when workspace changes
  // This ensures switching workspaces shows correct data for active workspace
  useEffect(() => {
    if (workspace?.id) {
      console.log('[Workspace Switch] Active workspace:', workspace.id, workspace.name);
      // Reload companies for this workspace
      loadWorkspaceCompanies();
      // Reload search history for this workspace
      loadSearchHistory();
      // Clear local state to avoid stale data from previous workspace
      setSearchCompaniesList([]);
      setSelectedSearchCompanyId(null);
      setHasSearched(false);
      setHistoryCompanies([]);
      setSelectedHistoryId(null);
      setSelectedHistoryCompanyId(null);
      // People will reload when the user switches to People view due to existing useEffect
      setAllPeople([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id]); // Only trigger on workspace ID change

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

  // Reload people when view changes to people OR when workspace changes
  useEffect(() => {
    if (activeView === 'people') {
      loadAllPeople();
    }
  }, [activeView, loadAllPeople, workspace?.id]);

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

  // Generate custom email mailto link based on person and company data
  const generateEmailLink = useCallback((person: Person) => {
    // Try to find company data from workspace companies or search results
    const companyFromWorkspace = workspaceCompanies.find(
      c => c.name?.toLowerCase() === person.company_name?.toLowerCase()
    );
    const companyFromSearch = searchCompaniesList.find(
      c => c.name?.toLowerCase() === person.company_name?.toLowerCase()
    );

    const companyName = person.company_name || 'your company';
    const firstName = person.first_name || person.full_name?.split(' ')[0] || '';
    const fitScore = companyFromWorkspace?.fitScore ?? companyFromSearch?.acquisition_fit_score;
    const summary = companyFromWorkspace?.summary ?? companyFromSearch?.summary;

    // Multiple random seeds for true variety
    const r1 = Math.random();
    const r2 = Math.random();
    const r3 = Math.random();
    const r4 = Math.random();
    const r5 = Math.random();
    const r6 = Math.random();

    // Varied subject lines
    const subjects = [
      `Quick question about ${companyName}`,
      `${companyName} caught my eye`,
      `Loved what I saw at ${companyName}`,
      `Coffee chat? Re: ${companyName}`,
      `Thinking about ${companyName}`,
      `Had to reach out - ${companyName}`,
      `Curious about ${companyName}`,
      `${companyName} - quick hello`,
    ];
    const subject = subjects[Math.floor(r1 * subjects.length)];

    // Varied greetings
    const greetings = firstName
      ? [`Hey ${firstName}!`, `Hi ${firstName},`, `${firstName} —`, `Hey there ${firstName},`, `Hi there ${firstName}!`, `${firstName}, hi!`]
      : [`Hey there!`, `Hi!`, `Hello!`, `Hey,`, `Hi there,`, `Hope you're well!`];
    const greeting = greetings[Math.floor(r2 * greetings.length)];

    // Varied openers based on what data we have
    const openers: string[] = [];

    if (summary) {
      const shortSum = summary.slice(0, 100);
      openers.push(
        `I came across ${companyName} and honestly, I'm impressed. ${shortSum}... sounds like you're building something really cool.`,
        `So I was doing some research and stumbled upon ${companyName}. ${shortSum}... — that's exactly the kind of thing that gets me excited.`,
        `Been looking into interesting companies in your space and ${companyName} stood out. Love what you're doing.`,
        `Found ${companyName} while exploring the market and had to reach out. ${shortSum}... really caught my attention.`,
        `Your work at ${companyName} popped up on my radar. ${shortSum}... I dig it.`,
        `Came across ${companyName} recently and thought — these folks are onto something. ${shortSum}...`,
      );
    } else {
      openers.push(
        `I came across ${companyName} and really liked what I saw.`,
        `Been researching companies in your space and ${companyName} caught my attention.`,
        `Just discovered ${companyName} and wanted to reach out.`,
        `Found ${companyName} while exploring the market — looks like you're doing some interesting stuff.`,
        `Your company popped up on my radar and I had to say hi.`,
        `Stumbled upon ${companyName} and thought I'd reach out directly.`,
      );
    }
    const opener = openers[Math.floor(r3 * openers.length)];

    // Interest level based on fit score - always positive, never negative
    let interestPhrase = '';
    if (fitScore !== null && fitScore !== undefined) {
      if (fitScore >= 8) {
        // High interest - very excited
        const highInterest = [
          `I'm genuinely excited about what you're building here.`,
          `This is exactly the kind of company I've been looking for.`,
          `Really think there's something special here.`,
          `I've looked at a lot of companies lately, and ${companyName} stands out.`,
          `Not gonna lie — I'm pretty excited about this one.`,
        ];
        interestPhrase = highInterest[Math.floor(r4 * highInterest.length)] + '\n\n';
      } else if (fitScore >= 5) {
        // Medium interest - curious, sees potential
        const mediumInterest = [
          `I see a lot of potential here and would love to learn more.`,
          `There's something interesting brewing at ${companyName} — curious to dig deeper.`,
          `I think there could be a cool opportunity to explore together.`,
          `Would love to understand more about where you're taking this.`,
          `Feels like there's potential here worth exploring.`,
        ];
        interestPhrase = mediumInterest[Math.floor(r4 * mediumInterest.length)] + '\n\n';
      } else {
        // Lower score - still positive, focused on potential and learning
        const exploratoryInterest = [
          `I'd love to learn more about your journey and where you see things going.`,
          `Curious to hear your story and what's next for ${companyName}.`,
          `Would be great to connect and hear more about your vision.`,
          `Always interested in meeting founders doing interesting things in this space.`,
          `Would love to chat and see if there's any way we could help each other out.`,
        ];
        interestPhrase = exploratoryInterest[Math.floor(r4 * exploratoryInterest.length)] + '\n\n';
      }
    } else {
      // No score - general interest
      const generalInterest = [
        `Would love to learn more about what you're working on.`,
        `Curious to hear more about your story.`,
        `Think it'd be cool to connect and chat.`,
      ];
      interestPhrase = generalInterest[Math.floor(r4 * generalInterest.length)] + '\n\n';
    }

    // Varied asks
    const asks = [
      `Would love to grab a quick call if you're open to it — no pressure at all.`,
      `Any chance you'd be up for a 15-min chat sometime?`,
      `Would you be down for a quick conversation? Totally casual.`,
      `I know you're probably slammed, but if you ever have 15 minutes, I'd love to connect.`,
      `Let me know if you'd be open to hopping on a call — even just 10 minutes.`,
      `No rush, but would be great to chat if you're interested.`,
      `If you're ever free for a quick call, I'd love that.`,
    ];
    const ask = asks[Math.floor(r5 * asks.length)];

    // Varied sign-offs
    const signOffs = [
      `Cheers,\nJosue`,
      `Talk soon?\nJosue`,
      `Best,\nJosue`,
      `Looking forward to it!\nJosue`,
      `Hope to hear from you!\nJosue`,
      `Thanks!\nJosue`,
      `Take care,\nJosue`,
    ];
    const signOff = signOffs[Math.floor(r6 * signOffs.length)];

    // Build the email
    const body = `${greeting}\n\n${opener}\n\n${interestPhrase}${ask}\n\n${signOff}\n\n---\nContact: ${person.email}${person.phone ? ` | ${person.phone}` : ''}`;

    return `mailto:josuekenge4@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [workspaceCompanies, searchCompaniesList]);

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
    setSearchIndustryFilter('all');
    setSearchFitFilter('all');
    // Also clear selected items in other views to ensure a truly fresh feel
    setSelectedWorkspaceCompanyId(null);
    setSelectedHistoryId(null);
    setHistoryCompanies([]);
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

  const resetPeopleView = useCallback(() => {
    setSelectedPersonId(null);
    setPeopleSearchQuery('');
    loadAllPeople();
  }, [loadAllPeople]);

  const resetHistoryView = useCallback(() => {
    setSelectedHistoryId(null);
    setSelectedHistoryCompanyId(null);
    setHistoryCompanies([]);
    setHistorySearchQuery('');
    loadSearchHistory();
  }, [loadSearchHistory]);

  // Navigation handler - resets if already on that view, otherwise switches
  const handleNavigation = useCallback((view: WorkspaceView) => {
    if (activeView === view) {
      // Already on this view - reset it
      switch (view) {
        case 'search':
          resetSearchView();
          break;
        case 'companies':
          resetCompaniesView();
          break;
        case 'people':
          resetPeopleView();
          break;
        case 'history':
          resetHistoryView();
          break;
      }
    } else {
      // Switch to new view
      setActiveView(view);
    }
  }, [activeView, resetSearchView, resetCompaniesView, resetPeopleView, resetHistoryView]);

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
        <div className="h-14 flex items-center justify-between px-4 border-b border-white/[0.06] flex-shrink-0">
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
                { view: 'companies', icon: Building2, label: 'Companies' },
                { view: 'people', icon: Users, label: 'People' },
                { view: 'insights', icon: TrendingUp, label: 'Insights' },
                { view: 'pipeline', icon: Kanban, label: 'Pipeline' },
                { view: 'history', icon: History, label: 'Search History' },
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

          {/* View Toggle (Only visible in Companies view) */}
          {activeView === 'companies' && (
            <div>
              <p className="text-[11px] font-medium text-white/25 mb-2 px-2">View</p>
              <div className="flex p-1 bg-white/[0.03] rounded-lg border border-white/[0.06] mb-4 mx-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded transition-all",
                    viewMode === 'table'
                      ? "bg-white/[0.08] text-white"
                      : "text-white/30 hover:text-white/50"
                  )}
                >
                  <Table2 className="w-3.5 h-3.5" /> Table
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded transition-all",
                    viewMode === 'cards'
                      ? "bg-white/[0.08] text-white"
                      : "text-white/30 hover:text-white/50"
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
              <p className="text-[11px] font-medium text-white/25 px-2">Filters</p>

              <div className="px-1 space-y-3">
                <div>
                  <span className="text-[11px] font-medium text-white/30 mb-1.5 block px-2">Fit Score</span>
                  <div className="relative">
                    <select
                      value={workspaceFitFilter}
                      onChange={(e) => setWorkspaceFitFilter(e.target.value as FitFilter)}
                      className="w-full appearance-none bg-white/[0.04] border border-white/[0.08] text-sm text-white/70 py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400/30 focus:border-indigo-400/30"
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
                      className="w-full flex items-center justify-between bg-white/[0.04] border border-white/[0.08] text-sm text-white/70 py-2 pl-3 pr-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400/30 cursor-pointer"
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
                            className={cn("w-full text-left px-3 py-2 text-sm hover:bg-white/[0.06] transition-colors text-white/60", industryFilter === 'all' && "bg-indigo-400/10 text-indigo-400 font-medium")}
                          >
                            All Industries
                          </button>
                          {INDUSTRIES.map((industry) => (
                            <button
                              key={industry}
                              type="button"
                              onClick={() => { setIndustryFilter(industry); setIsIndustryDropdownOpen(false); }}
                              className={cn("w-full text-left px-3 py-2 text-sm hover:bg-white/[0.06] transition-colors text-white/60", industryFilter === industry && "bg-indigo-400/10 text-indigo-400 font-medium")}
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
                      className="w-full bg-white/[0.04] border border-white/[0.08] text-sm text-white/70 py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400/30 focus:border-indigo-400/30 placeholder:text-white/20"
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
        <div className="p-4 border-t border-white/[0.06] flex-shrink-0">
          <p className="text-[11px] text-white/15 leading-relaxed px-2">
            {activeView === 'companies'
              ? "Select a row to view detailed insights."
              : activeView === 'search'
                ? "Enter a query to start scouting."
                : "Select a past search to review results."}
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#09090b] overflow-hidden relative">
        {/* Ambient background — indigo tones */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Full-screen indigo wash */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 70% at 55% 35%, rgba(129,140,248,0.16) 0%, rgba(99,102,241,0.08) 35%, rgba(79,70,229,0.04) 55%, transparent 80%)' }} />
          {/* Hot spot — center */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full blur-[120px]" style={{ background: 'radial-gradient(ellipse, rgba(129,140,248,0.22) 0%, rgba(99,102,241,0.10) 45%, transparent 70%)' }} />
          {/* Accent — top right */}
          <div className="absolute -top-20 -right-20 w-[500px] h-[400px] rounded-full blur-[140px]" style={{ background: 'radial-gradient(ellipse, rgba(129,140,248,0.14) 0%, transparent 65%)' }} />
          {/* Accent — bottom left */}
          <div className="absolute -bottom-20 -left-20 w-[450px] h-[350px] rounded-full blur-[130px]" style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.10) 0%, transparent 65%)' }} />
        </div>
        <header className="relative z-10 h-14 flex items-center justify-between px-4 sm:px-8 border-b border-white/[0.06] flex-shrink-0 bg-[#09090b]/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-white/40 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="text-[11px] text-white/30 mb-0.5 font-medium">{viewMeta.subtitle}</div>
              <h1 className="text-base font-semibold text-white tracking-tight">{viewMeta.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeView === 'search' && (hasSearched || query) && (
              <button
                onClick={handleClearSearchData}
                className="px-3 py-1.5 text-[13px] font-medium text-white/50 bg-white/[0.04] border border-white/[0.08] rounded-lg hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            )}
            {activeView === 'companies' && (
              <button
                onClick={() => openInfographicModal(selectedWorkspaceCompanyId)}
                disabled={!selectedWorkspaceCompanyId}
                className="px-3 py-1.5 text-[13px] font-medium text-white bg-white/[0.06] border border-white/[0.08] rounded-lg hover:bg-white/[0.1] transition-all flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5" /> Export
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
              className="px-3 py-1.5 text-[13px] font-medium text-white/50 bg-white/[0.04] border border-white/[0.08] rounded-lg hover:bg-white/[0.08] hover:text-white/70 transition-all"
            >
              Logout
            </button>
          </div>
        </header>
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
                        <LoadingStats />
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
                                className="appearance-none bg-white/[0.05] border border-white/[0.08] text-xs text-white/60 py-1.5 pl-2 pr-6 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500/30 cursor-pointer"
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
                                className="appearance-none bg-white/[0.05] border border-white/[0.08] text-xs text-white/60 py-1.5 pl-2 pr-6 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500/30 cursor-pointer"
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
                                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
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
                                      "group cursor-pointer hover:bg-indigo-500/[0.06] transition-colors border-b border-white/[0.04]",
                                      selectedSearchCompanyId === company.id ? "bg-indigo-500/[0.08]" : ""
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
                                            : "text-indigo-400 hover:text-indigo-300"
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
                      {/* Embedded Chat for Search */}
                      <aside className="w-full lg:w-[350px] flex-shrink-0 bg-[#0e0e11] rounded-xl overflow-hidden flex flex-col h-[500px] lg:h-auto ring-1 ring-white/[0.08]">
                        <ChatWidget mode="embedded" context={chatContext} />
                      </aside>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {
            activeView === 'companies' && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Header */}
                <div className="px-4 sm:px-8 pt-6 pb-4">
                  {/* Top Row: All Companies Tab and View Toggle */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 border-b border-white/[0.06]">
                      <button
                        onClick={() => setWorkspaceCategory('all')}
                        className={cn(
                          "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                          "text-indigo-400 border-indigo-400"
                        )}
                      >
                        All Companies
                      </button>
                    </div>

                    {/* View Toggle - Top Right */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/25 font-semibold uppercase tracking-widest">View</span>
                      <div className="inline-flex bg-white/[0.03] border border-white/[0.06] rounded-lg p-1">
                        <button
                          onClick={() => setViewMode('table')}
                          className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                            viewMode === 'table'
                              ? "bg-white/[0.08] text-white"
                              : "text-white/30 hover:text-white/50"
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
                              ? "bg-white/[0.08] text-white"
                              : "text-white/30 hover:text-white/50"
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
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/30 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Filter by name, domain..."
                      value={shortlistSearchQuery}
                      onChange={(e) => setShortlistSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-sm placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-indigo-400/30 focus:border-indigo-400/30 shadow-black/20 transition-all text-white"
                    />
                  </div>
                </div>

                {/* Table Container */}
                <div className="flex-1 overflow-hidden px-4 sm:px-8 py-4">
                  <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-[#0e0e11] rounded-xl shadow-black/20 border border-white/[0.06]">
                    <div className={cn(
                      "border-r border-white/[0.06] bg-[#0e0e11] overflow-y-auto flex flex-col transition-all duration-300",
                      selectedWorkspaceCompanyId ? "w-full lg:w-[30%] h-1/3 lg:h-full border-b lg:border-b-0" : "w-full border-r-0"
                    )}>
                      {workspaceLoading ? (
                        <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 text-indigo-600 animate-spin" /></div>
                      ) : filteredWorkspaceCompanies.length === 0 ? (
                        <div className="p-8 text-center text-white/40 text-sm bg-white/[0.03] rounded-lg border border-white/[0.06] border-dashed">
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
                                "group relative bg-[#0e0e11] rounded-xl border-2 p-5 cursor-pointer transition-all duration-200",
                                selectedWorkspaceCompanyId === company.id
                                  ? "border-indigo-400 shadow-lg shadow-black/20 bg-indigo-500/[0.08]"
                                  : "border-white/[0.06] hover:border-indigo-400/30 hover:shadow-md hover:shadow-black/20"
                              )}
                            >
                              {/* Selected Indicator */}
                              {selectedWorkspaceCompanyId === company.id && (
                                <div className="absolute top-3 right-3 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                                  <Check className="w-4 h-4 text-white" />
                                </div>
                              )}

                              {/* Company Name */}
                              <div className="flex items-center gap-2 mb-2 pr-8">
                                <CompanyAvatar name={company.name} faviconUrl={company.favicon_url} website={company.domain} size={28} />
                                <h3 className="font-semibold text-white truncate text-base">
                                  {company.name}
                                </h3>
                              </div>

                              {/* Domain */}
                              <a
                                href={normalizeWebsite(company.domain)}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs text-indigo-400 hover:text-indigo-300 mb-3 block truncate"
                              >
                                {company.domain}
                              </a>

                              {/* Summary */}
                              {company.summary && (
                                <p className="text-xs text-white/60 mb-4 line-clamp-3 leading-relaxed">
                                  {company.summary}
                                </p>
                              )}

                              {/* Metadata Row */}
                              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                                {/* Fit Score */}
                                <div className="flex-1">
                                  <FitScoreBar score={company.fitScore} size="sm" />
                                </div>

                                {/* Delete Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnsaveCompany(company.id);
                                  }}
                                  className="p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-red-900/30 transition-colors"
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
                          <thead className="sticky top-0 bg-white/[0.04] z-10">
                            <tr>
                              <th className="py-3 pr-4 pl-4 text-[11px] font-semibold text-white/40 uppercase tracking-wider border-b border-white/[0.08] border-r border-r-white/[0.04] w-8">
                                <div className="w-4 h-4 rounded border border-white/[0.15] bg-white/[0.05]"></div>
                              </th>
                              <th className="py-3 px-4 text-[11px] font-semibold text-white/40 uppercase tracking-wider border-b border-white/[0.08] border-r border-r-white/[0.04] w-1/3">Name</th>
                              <th className="py-3 px-4 text-[11px] font-semibold text-white/40 uppercase tracking-wider border-b border-white/[0.08] border-r border-r-white/[0.04] w-1/3 hidden sm:table-cell">Domain</th>
                              <th className="py-3 px-4 text-[11px] font-semibold text-white/40 uppercase tracking-wider border-b border-white/[0.08] border-r border-r-white/[0.04] text-right hidden md:table-cell">Fit Score</th>
                              <th className="py-3 px-4 text-[11px] font-semibold text-white/40 uppercase tracking-wider border-b border-white/[0.08] text-right w-10"></th>
                            </tr>
                          </thead>
                          <tbody className="text-sm">
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
                                  "group hover:bg-indigo-500/[0.06] transition-colors cursor-pointer border-b border-white/[0.04]",
                                  selectedWorkspaceCompanyId === company.id ? "bg-indigo-500/[0.08]" : ""
                                )}
                              >
                                <td className={cn(
                                  "py-3 pr-4 pl-4 border-l-2 border-r border-r-white/[0.04]",
                                  selectedWorkspaceCompanyId === company.id ? "border-l-indigo-400" : "border-l-transparent"
                                )}>
                                  <div className={cn(
                                    "w-4 h-4 rounded border flex items-center justify-center",
                                    selectedWorkspaceCompanyId === company.id ? "border-indigo-400 bg-indigo-500 text-white" : "border-white/[0.15] bg-white/[0.05]"
                                  )}>
                                    {selectedWorkspaceCompanyId === company.id && <Check className="w-3 h-3" />}
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-semibold text-white border-r border-white/[0.04]">
                                  <div className="flex items-center gap-3">
                                    <CompanyAvatar name={company.name} faviconUrl={company.favicon_url} website={company.domain} size={24} />
                                    <div className="truncate max-w-[160px]">{company.name}</div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 hidden sm:table-cell border-r border-white/[0.04]">
                                  <a
                                    href={normalizeWebsite(company.domain)}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 w-fit truncate max-w-[150px] font-medium"
                                  >
                                    {company.domain}
                                  </a>
                                </td>
                                <td className="py-3 px-4 hidden md:table-cell text-right border-r border-white/[0.04]">
                                  <div className="flex justify-end">
                                    <FitScoreBar score={company.fitScore} size="sm" />
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUnsaveCompany(company.id);
                                    }}
                                    className="p-1.5 rounded-md text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
                        <div className="w-[40%] bg-[#0e0e11] overflow-y-auto border-l border-white/[0.06] z-20 h-full animate-in slide-in-from-right duration-300">
                          <CompanyDetailPanel company={workspaceSelectionDetail} />
                        </div>
                        {/* Embedded Chat for Workspace */}
                        <div className="flex-1 min-w-[300px] bg-[#0e0e11] border-l border-white/[0.06] z-10 h-full">
                          <ChatWidget mode="embedded" context={chatContext} />
                        </div>
                      </>
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
                  industryFilter={industryFilter}
                  locationFilter={locationFilter}
                  fitFilter={workspaceFitFilter}
                  onCompanyClick={(companyId) => {
                    setSelectedWorkspaceCompanyId(companyId);
                    setActiveView('companies');
                  }}
                />
              </div>
            )
          }

          {
            activeView === 'pipeline' && (
              <div className="flex-1 overflow-hidden">
                <PipelinePage
                  onCompanyClick={(companyId) => {
                    setSelectedWorkspaceCompanyId(companyId);
                    setActiveView('companies');
                  }}
                />
              </div>
            )
          }

          {
            activeView === 'history' && (
              <div className="flex-1 flex min-h-0 px-8 py-6">
                <div className="flex-1 flex h-full bg-[#0e0e11] rounded-xl shadow-black/20 border border-white/[0.06] overflow-hidden">
                  {/* Left Panel: Search History List */}
                  <div className="w-64 border-r border-white/[0.06] bg-white/[0.03] flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-white/[0.06]">
                      <h3 className="text-sm font-semibold text-white">Past Searches</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {historyLoading ? (
                        <div className="p-4 flex justify-center">
                          <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                        </div>
                      ) : historyItems.length === 0 ? (
                        <div className="p-4 text-center text-sm text-white/40">No search history yet.</div>
                      ) : (
                        <div className="divide-y divide-white/[0.06]">
                          {historyItems.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleHistoryRowClick(item)}
                              className={cn(
                                "w-full text-left p-3 hover:bg-white/[0.06] transition-colors",
                                selectedHistoryId === item.id ? "bg-indigo-500/[0.08] border-l-2 border-indigo-400" : ""
                              )}
                            >
                              <p className="text-sm font-medium text-white truncate">{item.query}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-white/40">{formatDate(item.created_at)}</span>
                                <span className="text-xs bg-white/[0.06] text-white/60 px-1.5 py-0.5 rounded">
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
                    "flex flex-col overflow-hidden transition-all duration-300 border-r border-white/[0.06]",
                    selectedHistoryCompanyId ? "w-[30%]" : "flex-1"
                  )}>
                    {!selectedHistoryId ? (
                      <div className="flex-1 flex items-center justify-center text-white/40 text-sm">
                        Select a search from the left to view companies
                      </div>
                    ) : historyDetailsLoading ? (
                      <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                      </div>
                    ) : (
                      <>
                        <div className="p-4 border-b border-white/[0.06] space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-white">
                              Companies ({filteredHistoryCompanies.length})
                            </h3>
                          </div>
                          <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/30 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="Filter companies..."
                              value={historySearchQuery}
                              onChange={(e) => setHistorySearchQuery(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-sm placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-indigo-400/30 text-white"
                            />
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                          {filteredHistoryCompanies.length === 0 ? (
                            <div className="p-4 text-center text-sm text-white/40">
                              {historyCompanies.length > 0 ? "No companies match your filter." : "No companies found for this search."}
                            </div>
                          ) : (
                            <table className="w-full text-left border-collapse">
                              <thead className="sticky top-0 bg-white/[0.04] z-10">
                                <tr>
                                  <th className="py-3 px-4 text-[11px] font-semibold text-white/40 uppercase tracking-wider border-b border-white/[0.08] border-r border-r-white/[0.04]">Company</th>
                                  <th className="py-3 px-4 text-[11px] font-semibold text-white/40 uppercase tracking-wider border-b border-white/[0.08] border-r border-r-white/[0.04] text-right">Fit</th>
                                  <th className="py-3 px-4 text-[11px] font-semibold text-white/40 uppercase tracking-wider border-b border-white/[0.08] text-center">People</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredHistoryCompanies.map((company) => (
                                  <tr
                                    key={company.id}
                                    onClick={() => setSelectedHistoryCompanyId(company.id)}
                                    className={cn(
                                      "cursor-pointer hover:bg-indigo-500/[0.06] transition-colors border-b border-white/[0.04]",
                                      selectedHistoryCompanyId === company.id ? "bg-indigo-500/[0.08]" : ""
                                    )}
                                  >
                                    <td className="py-3 px-4 border-r border-white/[0.04]">
                                      <div className="flex items-center gap-3">
                                        <CompanyAvatar name={company.name} faviconUrl={company.favicon_url} website={company.website} size={28} />
                                        <div>
                                          <div className="font-semibold text-white">{company.name}</div>
                                          <div className="text-[11px] text-white/30 truncate max-w-[200px]">{company.website}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 border-r border-white/[0.04]">
                                      <FitScoreBar score={company.acquisition_fit_score} size="sm" />
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <span className="inline-flex items-center gap-1 text-xs text-white/40 font-medium">
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
                      <div className="w-[40%] bg-[#0e0e11] overflow-y-auto animate-in slide-in-from-right duration-300 border-r border-white/[0.06]">
                        {/* Company Details */}
                        <div className="border-b border-white/[0.06]">
                          <CompanyDetailPanel company={selectedHistoryCompanyAsCompany!} />
                        </div>

                        {/* People Section */}
                        <div className="p-6">
                          <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                            <Users className="w-4 h-4 text-white/30" />
                            Contacts ({selectedHistoryCompany.people?.length ?? 0})
                          </h3>

                          {(!selectedHistoryCompany.people || selectedHistoryCompany.people.length === 0) ? (
                            <div className="text-sm text-white/40 bg-white/[0.03] rounded-lg p-4 border border-white/[0.06] border-dashed">
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
                                      isHighlighted ? "bg-amber-900/20 border-amber-800" : "bg-white/[0.03] border-white/[0.06]"
                                    )}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className={cn(
                                            "font-medium text-white",
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
                                        <p className="text-sm text-white/60 mt-0.5">{person.role || 'Unknown Role'}</p>
                                      </div>
                                      {person.source && (
                                        <span className="text-xs text-white/40 bg-white/[0.06] px-2 py-0.5 rounded capitalize">
                                          {person.source}
                                        </span>
                                      )}
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-4 text-sm">
                                      {person.email && (() => {
                                        const companyName = selectedHistoryCompany.name || 'your company';
                                        const firstName = person.first_name || person.full_name?.split(' ')[0] || '';
                                        const fitScore = selectedHistoryCompany.acquisition_fit_score;
                                        const summary = selectedHistoryCompany.summary;

                                        // Multiple random seeds for true variety
                                        const r1 = Math.random();
                                        const r2 = Math.random();
                                        const r3 = Math.random();
                                        const r4 = Math.random();
                                        const r5 = Math.random();
                                        const r6 = Math.random();

                                        const subjects = [
                                          `Quick question about ${companyName}`,
                                          `${companyName} caught my eye`,
                                          `Loved what I saw at ${companyName}`,
                                          `Coffee chat? Re: ${companyName}`,
                                          `Had to reach out - ${companyName}`,
                                          `Curious about ${companyName}`,
                                        ];
                                        const subject = subjects[Math.floor(r1 * subjects.length)];

                                        const greetings = firstName
                                          ? [`Hey ${firstName}!`, `Hi ${firstName},`, `${firstName} —`, `Hey there ${firstName},`]
                                          : [`Hey there!`, `Hi!`, `Hello!`, `Hope you're well!`];
                                        const greeting = greetings[Math.floor(r2 * greetings.length)];

                                        const openers: string[] = [];
                                        if (summary) {
                                          const shortSum = summary.slice(0, 100);
                                          openers.push(
                                            `I came across ${companyName} and honestly, I'm impressed. ${shortSum}... sounds like you're building something really cool.`,
                                            `So I was doing some research and stumbled upon ${companyName}. ${shortSum}... — that's exactly the kind of thing that gets me excited.`,
                                            `Found ${companyName} while exploring the market and had to reach out. ${shortSum}... really caught my attention.`,
                                            `Your work at ${companyName} popped up on my radar. ${shortSum}... I dig it.`,
                                          );
                                        } else {
                                          openers.push(
                                            `I came across ${companyName} and really liked what I saw.`,
                                            `Been researching companies in your space and ${companyName} caught my attention.`,
                                            `Found ${companyName} while exploring the market — looks like you're doing some interesting stuff.`,
                                            `Stumbled upon ${companyName} and thought I'd reach out directly.`,
                                          );
                                        }
                                        const opener = openers[Math.floor(r3 * openers.length)];

                                        // Interest level - always positive
                                        let interestPhrase = '';
                                        if (fitScore !== null && fitScore !== undefined) {
                                          if (fitScore >= 8) {
                                            const high = [
                                              `I'm genuinely excited about what you're building here.`,
                                              `This is exactly the kind of company I've been looking for.`,
                                              `Not gonna lie — I'm pretty excited about this one.`,
                                            ];
                                            interestPhrase = high[Math.floor(r4 * high.length)] + '\n\n';
                                          } else if (fitScore >= 5) {
                                            const med = [
                                              `I see a lot of potential here and would love to learn more.`,
                                              `There's something interesting brewing here — curious to dig deeper.`,
                                              `Feels like there's potential here worth exploring.`,
                                            ];
                                            interestPhrase = med[Math.floor(r4 * med.length)] + '\n\n';
                                          } else {
                                            const low = [
                                              `I'd love to learn more about your journey and where you see things going.`,
                                              `Curious to hear your story and what's next for ${companyName}.`,
                                              `Always interested in meeting founders doing interesting things in this space.`,
                                            ];
                                            interestPhrase = low[Math.floor(r4 * low.length)] + '\n\n';
                                          }
                                        }

                                        const asks = [
                                          `Would love to grab a quick call if you're open to it — no pressure at all.`,
                                          `Any chance you'd be up for a 15-min chat sometime?`,
                                          `Would you be down for a quick conversation? Totally casual.`,
                                          `Let me know if you'd be open to hopping on a call.`,
                                        ];
                                        const ask = asks[Math.floor(r5 * asks.length)];

                                        const signOffs = [`Cheers,\nJosue`, `Talk soon?\nJosue`, `Best,\nJosue`, `Hope to hear from you!\nJosue`];
                                        const signOff = signOffs[Math.floor(r6 * signOffs.length)];

                                        const body = `${greeting}\n\n${opener}\n\n${interestPhrase}${ask}\n\n${signOff}\n\n---\nContact: ${person.email}${person.phone ? ` | ${person.phone}` : ''}`;

                                        return (
                                          <a
                                            href={`mailto:josuekenge4@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
                                            className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300"
                                          >
                                            <Mail className="w-4 h-4" />
                                            <span className="truncate max-w-[200px]">{person.email}</span>
                                          </a>
                                        );
                                      })()}
                                      {person.phone && (
                                        <span className="flex items-center gap-1.5 text-white/60">
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
                      <div className="flex-1 min-w-[300px] bg-[#0e0e11] z-10 h-full border-l border-white/[0.06]">
                        <ChatWidget mode="embedded" context={chatContext} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          }

          {/* People View */}
          {
            activeView === 'people' && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Search Bar */}
                <div className="px-8 pt-6 pb-4">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/30 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search by name, email, role, or company..."
                      value={peopleSearchQuery}
                      onChange={(e) => setPeopleSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-sm placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-indigo-400/30 focus:border-indigo-400/30 shadow-black/20 transition-all text-white"
                    />
                  </div>
                </div>

                {/* People Table */}
                <div className="flex-1 overflow-hidden px-8 py-4">
                  <div className="flex h-full overflow-hidden">
                    {/* People List */}
                    <div className={cn(
                      "bg-[#0e0e11] overflow-y-auto flex flex-col transition-all duration-300 border border-white/[0.06] rounded-xl shadow-black/20",
                      selectedPersonId ? "w-[30%] border-r-0 rounded-r-none" : "w-full"
                    )}>
                      {peopleLoading ? (
                        <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 text-indigo-600 animate-spin" /></div>
                      ) : filteredPeople.length === 0 ? (
                        <div className="p-8 text-center text-white/40 text-sm bg-white/[0.03] rounded-lg border border-white/[0.06] border-dashed m-4">
                          {allPeople.length > 0 ? "No people match your search." : "No contacts found yet. Run a search to discover companies and their decision makers."}
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead className="sticky top-0 bg-white/[0.04] z-10">
                            <tr>
                              <th className="py-3 px-4 text-[11px] font-semibold text-white/40 uppercase tracking-wider border-b border-white/[0.08]">Company</th>
                              <th className="py-3 px-4 text-[11px] font-semibold text-white/40 uppercase tracking-wider border-b border-white/[0.08]">Email</th>
                              <th className="py-3 px-4 text-[11px] font-semibold text-white/40 uppercase tracking-wider border-b border-white/[0.08]">Name</th>
                              <th className="py-3 px-4 text-[11px] font-semibold text-white/40 uppercase tracking-wider border-b border-white/[0.08] hidden md:table-cell">Role</th>
                              <th className="py-3 px-4 text-[11px] font-semibold text-white/40 uppercase tracking-wider border-b border-white/[0.08] hidden sm:table-cell">Source</th>
                              <th className="py-3 px-4 text-[11px] font-semibold text-white/40 uppercase tracking-wider border-b border-white/[0.08]">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm divide-y divide-white/[0.04]">
                            {filteredPeople.map((person) => {
                              const isHighlighted = person.is_ceo || person.is_founder || person.is_executive;
                              return (
                                <tr
                                  key={person.id}
                                  onClick={() => setSelectedPersonId(selectedPersonId === person.id ? null : person.id)}
                                  className={cn(
                                    "group hover:bg-indigo-500/[0.06] transition-colors cursor-pointer",
                                    selectedPersonId === person.id ? "bg-indigo-500/[0.08]" : "",
                                    isHighlighted ? "bg-amber-900/20" : ""
                                  )}
                                >
                                  <td className="py-3 px-4 text-white/60">
                                    <div className="flex items-center gap-2">
                                      <CompanyAvatar name={person.company_name || '?'} website={person.company_website} size={20} />
                                      <span className="truncate max-w-[150px]">{person.company_name || '—'}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    {person.email ? (
                                      <a
                                        href={generateEmailLink(person)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                      >
                                        <Mail className="w-3.5 h-3.5" />
                                        <span className="truncate max-w-[180px]">{person.email}</span>
                                      </a>
                                    ) : (
                                      <span className="text-white/20">—</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <span className={cn(
                                        "font-medium text-white",
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
                                  <td className="py-3 px-4 text-white/60 hidden md:table-cell">
                                    {person.role || '—'}
                                  </td>
                                  <td className="py-3 px-4 hidden sm:table-cell">
                                    <span className="px-2 py-0.5 text-xs font-medium bg-white/[0.06] text-white/60 rounded capitalize">
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
                                      className="text-white/30 hover:text-red-400 transition-colors p-1 hover:bg-red-900/30 rounded"
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
                        <div className="w-[40%] bg-[#0e0e11] overflow-y-auto border border-white/[0.06] rounded-r-none shadow-xl shadow-black/20 z-20 h-full animate-in slide-in-from-right duration-300">
                          {/* Header */}
                          <div className="sticky top-0 bg-[#0e0e11]/90 backdrop-blur-md border-b border-white/[0.06] px-6 py-5 z-20">
                            <div className="flex items-start justify-between">
                              <div>
                                <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
                                  {selectedPerson.full_name || 'Unknown Contact'}
                                  {selectedPerson.is_ceo && (
                                    <span className="px-2 py-0.5 text-xs font-semibold uppercase bg-amber-100 text-amber-700 rounded">CEO</span>
                                  )}
                                  {selectedPerson.is_founder && (
                                    <span className="px-2 py-0.5 text-xs font-semibold uppercase bg-purple-100 text-purple-700 rounded">Founder</span>
                                  )}
                                </h2>
                                <p className="text-sm text-white/60 mt-0.5">{selectedPerson.role || 'Unknown Role'}</p>
                              </div>
                            </div>
                          </div>

                          <div className="p-6 space-y-6">
                            {/* Contact Info */}
                            <section className="border border-white/[0.06] rounded-lg overflow-hidden">
                              <div className="bg-white/[0.03] px-4 py-2 border-b border-white/[0.06]">
                                <h3 className="text-sm font-semibold text-white">Contact Information</h3>
                              </div>
                              <div className="divide-y divide-white/[0.04]">
                                {selectedPerson.email && (
                                  <div className="p-4 flex items-center gap-3">
                                    <Mail className="w-4 h-4 text-white/30" />
                                    <a href={`mailto:${selectedPerson.email}`} className="text-sm text-indigo-400 hover:text-indigo-300">
                                      {selectedPerson.email}
                                    </a>
                                  </div>
                                )}
                                {selectedPerson.phone && (
                                  <div className="p-4 flex items-center gap-3">
                                    <Phone className="w-4 h-4 text-white/30" />
                                    <a href={`tel:${selectedPerson.phone}`} className="text-sm text-white/60">
                                      {selectedPerson.phone}
                                    </a>
                                  </div>
                                )}
                                {selectedPerson.linkedin_url && (
                                  <div className="p-4 flex items-center gap-3">
                                    <Linkedin className="w-4 h-4 text-white/30" />
                                    <a href={selectedPerson.linkedin_url} target="_blank" rel="noreferrer" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                      LinkedIn Profile <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                )}
                                {(selectedPerson.location_city || selectedPerson.location_country) && (
                                  <div className="p-4 flex items-center gap-3">
                                    <MapPin className="w-4 h-4 text-white/30" />
                                    <span className="text-sm text-white/60">
                                      {[selectedPerson.location_city, selectedPerson.location_country].filter(Boolean).join(', ')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </section>

                            {/* Company Info */}
                            {selectedPerson.company_name && (
                              <section className="border border-white/[0.06] rounded-lg overflow-hidden">
                                <div className="bg-white/[0.03] px-4 py-2 border-b border-white/[0.06]">
                                  <h3 className="text-sm font-semibold text-white">Company</h3>
                                </div>
                                <div className="p-4">
                                  <div className="flex items-center gap-3">
                                    <CompanyAvatar name={selectedPerson.company_name || '?'} website={selectedPerson.company_website} size={32} />
                                    <div>
                                      <p className="text-sm font-medium text-white">{selectedPerson.company_name}</p>
                                      {selectedPerson.company_website && (
                                        <a
                                          href={normalizeWebsite(selectedPerson.company_website)}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
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
                            <section className="border border-white/[0.06] rounded-lg overflow-hidden">
                              <div className="bg-white/[0.03] px-4 py-2 border-b border-white/[0.06]">
                                <h3 className="text-sm font-semibold text-white">Professional Details</h3>
                              </div>
                              <div className="divide-y divide-white/[0.04]">
                                {selectedPerson.department && (
                                  <div className="p-4 grid grid-cols-3 gap-4">
                                    <div className="text-sm font-medium text-white/40">Department</div>
                                    <div className="col-span-2 text-sm text-white/60">{selectedPerson.department}</div>
                                  </div>
                                )}
                                {selectedPerson.seniority && (
                                  <div className="p-4 grid grid-cols-3 gap-4">
                                    <div className="text-sm font-medium text-white/40">Seniority</div>
                                    <div className="col-span-2 text-sm text-white/60">{selectedPerson.seniority}</div>
                                  </div>
                                )}
                                <div className="p-4 grid grid-cols-3 gap-4">
                                  <div className="text-sm font-medium text-white/40">Source</div>
                                  <div className="col-span-2">
                                    <span className="px-2 py-0.5 text-xs font-medium bg-white/[0.06] text-white/60 rounded capitalize">
                                      {selectedPerson.source || 'unknown'}
                                    </span>
                                  </div>
                                </div>
                                {selectedPerson.confidence_score !== null && (
                                  <div className="p-4 grid grid-cols-3 gap-4">
                                    <div className="text-sm font-medium text-white/40">Confidence</div>
                                    <div className="col-span-2 text-sm text-white/60">{selectedPerson.confidence_score}%</div>
                                  </div>
                                )}
                              </div>
                            </section>

                            {/* Notes */}
                            {selectedPerson.notes && (
                              <section className="border border-white/[0.06] rounded-lg overflow-hidden">
                                <div className="bg-white/[0.03] px-4 py-2 border-b border-white/[0.06]">
                                  <h3 className="text-sm font-semibold text-white">Notes</h3>
                                </div>
                                <div className="p-4">
                                  <p className="text-sm text-white/60 leading-relaxed">{selectedPerson.notes}</p>
                                </div>
                              </section>
                            )}

                            {/* Key Info */}
                            <section className="bg-white/[0.03] rounded-lg p-4 border border-white/[0.06]">
                              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Record Info</h3>
                              <div className="grid grid-cols-1 gap-2">
                                <div className="flex justify-between">
                                  <span className="text-xs text-white/20 font-mono">ID</span>
                                  <span className="text-xs text-white/40 font-mono">{selectedPerson.id.slice(0, 24)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-white/20">Added</span>
                                  <span className="text-xs text-white/60">{formatDate(selectedPerson.created_at)}</span>
                                </div>
                              </div>
                            </section>

                            <div className="h-8"></div>
                          </div>
                        </div>
                        {/* Embedded Chat for People */}
                        <div className="flex-1 min-w-[300px] bg-[#0e0e11] border border-white/[0.06] border-l-0 rounded-r-lg z-10 h-full">
                          <ChatWidget mode="embedded" context={chatContext} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          }
        </div >
      </main >

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
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-4" />
          <p className="text-sm text-white/60">Loading your workspace...</p>
        </div>
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
