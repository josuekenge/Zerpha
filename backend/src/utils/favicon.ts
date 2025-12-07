/**
 * Favicon URL utility
 * Generates favicon URLs from website domains using Google's favicon service.
 */

/**
 * Build a favicon URL from a website domain.
 * Uses Google's favicon service for reliable, cached favicons at 64px size.
 *
 * @param website - The website URL or domain (e.g., "example.com" or "https://example.com")
 * @returns The favicon URL, or null if the website is invalid
 */
export function buildFaviconUrlFromWebsite(website?: string | null): string | null {
    if (!website) return null;

    try {
        // Normalize the URL - add https:// if missing
        const normalizedUrl = website.startsWith('http') ? website : `https://${website}`;
        const url = new URL(normalizedUrl);
        const hostname = url.hostname;

        if (!hostname) return null;

        // Use Google's favicon service for reliable, cached favicons
        // sz=64 provides a good quality icon for display
        return `https://www.google.com/s2/favicons?sz=64&domain_url=${hostname}`;
    } catch {
        // Invalid URL - return null
        return null;
    }
}
