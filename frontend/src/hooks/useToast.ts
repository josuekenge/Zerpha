import { useState, useCallback, useRef } from 'react';

interface Toast {
    message: string;
    type: 'success' | 'error';
}

/**
 * Custom hook for managing toast notifications
 */
export function useToast() {
    const [toast, setToast] = useState<Toast | null>(null);
    const toastTimeout = useRef<number | null>(null);

    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        // Clear any existing timeout
        if (toastTimeout.current) {
            clearTimeout(toastTimeout.current);
        }

        setToast({ message, type });

        // Auto-dismiss after 3 seconds
        toastTimeout.current = window.setTimeout(() => {
            setToast(null);
        }, 3000);
    }, []);

    const hideToast = useCallback(() => {
        if (toastTimeout.current) {
            clearTimeout(toastTimeout.current);
        }
        setToast(null);
    }, []);

    return {
        toast,
        showToast,
        hideToast,
    };
}
