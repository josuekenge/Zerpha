/**
 * Application constants and type definitions
 */

// View types
export type WorkspaceView = 'search' | 'companies' | 'insights' | 'pipeline' | 'people' | 'history';
export type FitFilter = 'all' | 'high' | 'medium' | 'low';

// Default values
export const DEFAULT_CATEGORY = 'General';

// Industry options for filtering
export const INDUSTRIES = [
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
] as const;

// Common locations for autocomplete
export const LOCATIONS = [
    // US Cities
    "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ",
    "San Francisco, CA", "Seattle, WA", "Denver, CO", "Boston, MA", "Austin, TX",
    "San Diego, CA", "Dallas, TX", "Miami, FL", "Atlanta, GA", "Portland, OR",
    // US States
    "California", "Texas", "New York", "Florida", "Illinois", "Pennsylvania",
    "Ohio", "Georgia", "North Carolina", "Michigan", "Washington", "Colorado",
    // Canadian Cities/Provinces
    "Toronto, ON", "Vancouver, BC", "Montreal, QC", "Calgary, AB", "Ottawa, ON",
    "Ontario", "British Columbia", "Quebec", "Alberta",
    // Countries
    "United States", "Canada", "United Kingdom", "Germany", "France", "Australia",
    "India", "Israel", "Singapore", "Netherlands", "Sweden", "Ireland", "Switzerland"
] as const;

// View metadata
export const VIEW_META: Record<WorkspaceView, { title: string; subtitle: string }> = {
    search: { title: 'Market Discovery', subtitle: 'New Search' },
    companies: { title: 'Shortlist', subtitle: 'Saved Companies' },
    insights: { title: 'Insights', subtitle: 'Market Intelligence' },
    pipeline: { title: 'Pipeline', subtitle: 'Deal Flow' },
    people: { title: 'Contacts', subtitle: 'Decision Makers' },
    history: { title: 'Past Searches', subtitle: 'History' },
};
