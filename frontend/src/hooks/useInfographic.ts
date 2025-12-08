import { useState, useCallback } from 'react';
import { exportInfographic } from '../api/client';
import { InfographicReportResult } from '../types';

/**
 * Custom hook for managing infographic modal state
 */
export function useInfographic() {
    const [isInfographicOpen, setIsInfographicOpen] = useState(false);
    const [infographicLoading, setInfographicLoading] = useState(false);
    const [infographicData, setInfographicData] = useState<InfographicReportResult | null>(null);
    const [infographicError, setInfographicError] = useState<string | null>(null);
    const [infographicTargetId, setInfographicTargetId] = useState<string | null>(null);

    const fetchInfographic = useCallback(async (companyId: string) => {
        setInfographicLoading(true);
        setInfographicError(null);
        setInfographicData(null);

        try {
            const result = await exportInfographic(companyId);
            setInfographicData(result);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to generate infographic';
            setInfographicError(message);
        } finally {
            setInfographicLoading(false);
        }
    }, []);

    const openInfographicModal = useCallback((companyId: string) => {
        setInfographicTargetId(companyId);
        setIsInfographicOpen(true);
        fetchInfographic(companyId);
    }, [fetchInfographic]);

    const retryInfographic = useCallback(() => {
        if (infographicTargetId) {
            fetchInfographic(infographicTargetId);
        }
    }, [infographicTargetId, fetchInfographic]);

    const closeInfographicModal = useCallback(() => {
        setIsInfographicOpen(false);
        setInfographicData(null);
        setInfographicError(null);
        setInfographicTargetId(null);
    }, []);

    return {
        isInfographicOpen,
        setIsInfographicOpen,
        infographicLoading,
        infographicData,
        infographicError,
        infographicTargetId,
        openInfographicModal,
        retryInfographic,
        closeInfographicModal,
    };
}
