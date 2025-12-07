import { useState } from 'react';

interface CompanyAvatarProps {
    name: string;
    faviconUrl?: string | null;
    /** Website URL or domain (e.g., "https://example.com" or "example.com") - used to generate favicon if faviconUrl is missing */
    website?: string | null;
    size?: number;
    className?: string;
}

/**
 * Build a favicon URL from a website domain using Google's favicon service.
 * This is used as a fallback when favicon_url is not provided by the backend.
 */
function buildFaviconUrl(website: string): string | null {
    try {
        const normalizedUrl = website.startsWith('http') ? website : `https://${website}`;
        const url = new URL(normalizedUrl);
        const hostname = url.hostname;
        if (!hostname) return null;
        return `https://www.google.com/s2/favicons?sz=64&domain_url=${hostname}`;
    } catch {
        return null;
    }
}

/**
 * CompanyAvatar - Displays a company's favicon or a letter fallback
 * 
 * Uses the company's favicon_url if available. If not available but website is provided,
 * generates a favicon URL using Google's favicon service. Falls back to a circular
 * avatar with the first letter of the company name if all else fails.
 */
export function CompanyAvatar({
    name,
    faviconUrl,
    website,
    size = 24,
    className = '',
}: CompanyAvatarProps) {
    const [hasError, setHasError] = useState(false);

    // Get the first letter of the company name for fallback
    const initial = name.charAt(0).toUpperCase() || '?';

    // Determine the actual favicon URL to use:
    // 1. Use provided faviconUrl if available
    // 2. Generate from website if available
    // 3. Fall back to null (will show letter avatar)
    const effectiveFaviconUrl = faviconUrl || (website ? buildFaviconUrl(website) : null);

    const showFallback = !effectiveFaviconUrl || hasError;

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
                className={`rounded-full flex items-center justify-center font-semibold bg-indigo-100 text-indigo-600 ${className}`}
                style={{ ...containerStyle, fontSize }}
                title={name}
            >
                {initial}
            </div>
        );
    }

    return (
        <img
            src={effectiveFaviconUrl}
            alt={name}
            className={`rounded-full object-cover bg-slate-100 ${className}`}
            style={containerStyle}
            onError={() => setHasError(true)}
            loading="lazy"
        />
    );
}
