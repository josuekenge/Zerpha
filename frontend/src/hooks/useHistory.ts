import { useState, useCallback, useEffect, useMemo } from 'react';
import { fetchSearchHistory, fetchSearchDetails } from '../api/client';
import { SearchHistoryItem, CompanyWithPeople } from '../types';

/**
 * Custom hook for managing search history state
 */
export function useHistory() {
    const [historyItems, setHistoryItems] = useState<SearchHistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
    const [historyCompanies, setHistoryCompanies] = useState<CompanyWithPeople[]>([]);
    const [historyDetailsLoading, setHistoryDetailsLoading] = useState(false);
    const [selectedHistoryCompanyId, setSelectedHistoryCompanyId] = useState<string | null>(null);
    const [historySearchQuery, setHistorySearchQuery] = useState('');

    // Load search history
    const loadSearchHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const items = await fetchSearchHistory();
            setHistoryItems(items);
        } catch (error) {
            console.error('Failed to load search history:', error);
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadSearchHistory();
    }, [loadSearchHistory]);

    // Handle clicking on a history row
    const handleHistoryRowClick = useCallback(async (searchId: string) => {
        setSelectedHistoryId(searchId);
        setSelectedHistoryCompanyId(null);
        setHistoryCompanies([]);
        setHistoryDetailsLoading(true);

        try {
            const response = await fetchSearchDetails(searchId);
            const companies = response.companies || [];
            setHistoryCompanies(companies);
            if (companies.length > 0) {
                setSelectedHistoryCompanyId(companies[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch search details:', error);
        } finally {
            setHistoryDetailsLoading(false);
        }
    }, []);

    // Filter history companies by search query
    const filteredHistoryCompanies = useMemo(() => {
        if (!historySearchQuery.trim()) return historyCompanies;
        const q = historySearchQuery.trim().toLowerCase();
        return historyCompanies.filter((c) => {
            return (
                c.name?.toLowerCase().includes(q) ||
                c.summary?.toLowerCase().includes(q)
            );
        });
    }, [historyCompanies, historySearchQuery]);

    // Selected history company
    const selectedHistoryCompany = useMemo(() => {
        return historyCompanies.find((c) => c.id === selectedHistoryCompanyId) ?? null;
    }, [historyCompanies, selectedHistoryCompanyId]);

    const resetHistoryView = useCallback(() => {
        setSelectedHistoryId(null);
        setSelectedHistoryCompanyId(null);
        setHistoryCompanies([]);
        setHistorySearchQuery('');
        loadSearchHistory();
    }, [loadSearchHistory]);

    return {
        historyItems,
        historyLoading,
        selectedHistoryId,
        setSelectedHistoryId,
        historyCompanies,
        setHistoryCompanies,
        historyDetailsLoading,
        selectedHistoryCompanyId,
        setSelectedHistoryCompanyId,
        historySearchQuery,
        setHistorySearchQuery,
        filteredHistoryCompanies,
        selectedHistoryCompany,
        loadSearchHistory,
        handleHistoryRowClick,
        resetHistoryView,
    };
}
