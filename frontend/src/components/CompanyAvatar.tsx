import { useState } from 'react';

interface CompanyAvatarProps {
    name: string;
    faviconUrl?: string | null;
    size?: number;
    className?: string;
}

/**
 * CompanyAvatar - Displays a company's favicon or a letter fallback
 * 
 * Uses the company's favicon_url if available. Falls back to a circular
 * avatar with the first letter of the company name if the favicon fails
 * to load or is not provided.
 */
export function CompanyAvatar({
    name,
    faviconUrl,
    size = 24,
    className = '',
}: CompanyAvatarProps) {
    const [hasError, setHasError] = useState(false);

    // Get the first letter of the company name for fallback
    const initial = name.charAt(0).toUpperCase() || '?';

    // Generate a consistent background color based on the company name
    const getBackgroundColor = (name: string): string => {
        const colors = [
            'bg-indigo-100 text-indigo-600',
            'bg-purple-100 text-purple-600',
            'bg-blue-100 text-blue-600',
            'bg-emerald-100 text-emerald-600',
            'bg-amber-100 text-amber-600',
            'bg-rose-100 text-rose-600',
            'bg-cyan-100 text-cyan-600',
            'bg-teal-100 text-teal-600',
        ];
        // Simple hash based on name to get consistent color
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const showFallback = !faviconUrl || hasError;

    // Common styles for both image and fallback
    const containerStyle = {
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
    };

    if (showFallback) {
        // Calculate font size based on avatar size (roughly 45% of size)
        const fontSize = Math.max(10, Math.round(size * 0.45));

        return (
            <div
                className={`rounded-full flex items-center justify-center font-semibold ${getBackgroundColor(name)} ${className}`}
                style={{ ...containerStyle, fontSize }}
                title={name}
            >
                {initial}
            </div>
        );
    }

    return (
        <img
            src={faviconUrl}
            alt={name}
            className={`rounded-full object-cover bg-slate-100 ${className}`}
            style={containerStyle}
            onError={() => setHasError(true)}
            loading="lazy"
        />
    );
}
