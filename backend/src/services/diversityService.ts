/**
 * Diversity Service
 * 
 * Handles deduplication and diversity for search results.
 * Ensures repeated searches return different companies within the same niche.
 */

import { supabase } from '../config/supabase.js';
import { logger } from '../logger.js';
import { normalizeDomain } from './cacheService.js';
import type { DiscoveredCompany } from './discoveryService.js';

/**
 * Derive a stable niche key from a search query.
 * Used to track which companies have been shown per niche.
 */
export function deriveNicheKey(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, '_')    // Replace spaces with underscores
    .slice(0, 100);          // Limit length
}

/**
 * Normalize a company name for comparison.
 * Useful when domain is missing or null.
 */
export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')    // Collapse whitespace
    .replace(/\b(inc|llc|ltd|corp|corporation|company|co)\b/gi, '') // Remove common suffixes
    .trim();
}

/**
 * Get domains that have been shown to a WORKSPACE for a specific niche.
 * Now workspace-scoped for true multi-tenant data isolation.
 */
export async function getSeenDomains(
  workspaceId: string,
  nicheKey: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('niche_history')
    .select('company_domain')
    .eq('workspace_id', workspaceId)  // WORKSPACE scoped, not user scoped
    .eq('niche_key', nicheKey);

  if (error) {
    logger.warn({ err: error, workspaceId, nicheKey }, '[diversity] failed to fetch seen domains');
    return new Set();
  }

  const domains = new Set((data ?? []).map((row) => row.company_domain));
  logger.debug({ workspaceId, nicheKey, seenCount: domains.size }, '[diversity] fetched seen domains');
  return domains;
}

/**
 * Get domains of companies the WORKSPACE has already saved.
 * Now workspace-scoped for true multi-tenant data isolation.
 */
export async function getSavedCompanyDomains(workspaceId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('companies')
    .select('website')
    .eq('workspace_id', workspaceId)  // WORKSPACE scoped, not user scoped
    .eq('is_saved', true);

  if (error) {
    logger.warn({ err: error, workspaceId }, '[diversity] failed to fetch saved company domains');
    return new Set();
  }

  const domains = new Set<string>();
  for (const row of data ?? []) {
    if (row.website) {
      domains.add(normalizeDomain(row.website));
    }
  }

  logger.debug({ workspaceId, savedCount: domains.size }, '[diversity] fetched saved company domains');
  return domains;
}

/**
 * Record that companies were shown to a WORKSPACE for a niche.
 * Uses upsert to handle duplicates gracefully.
 * Now workspace-scoped for true multi-tenant data isolation.
 */
export async function recordSeenCompanies(
  workspaceId: string,
  nicheKey: string,
  companies: Array<{ website: string }>,
): Promise<void> {
  if (companies.length === 0) return;

  const records = companies.map((company) => ({
    workspace_id: workspaceId,  // WORKSPACE scoped, not user scoped
    niche_key: nicheKey,
    company_domain: normalizeDomain(company.website || ''),
    last_seen_at: new Date().toISOString(),
  }));

  // Use upsert to update last_seen_at if already exists
  const { error } = await supabase
    .from('niche_history')
    .upsert(records, {
      onConflict: 'workspace_id,niche_key,company_domain',
      ignoreDuplicates: false,
    });

  if (error) {
    logger.warn({ err: error, workspaceId, nicheKey }, '[diversity] failed to record seen companies');
  } else {
    logger.debug(
      { workspaceId, nicheKey, recordedCount: records.length },
      '[diversity] recorded seen companies',
    );
  }
}

/**
 * Shuffle an array using Fisher-Yates algorithm.
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Weighted shuffle - items with higher weight stay closer to original position.
 * Adds randomness while preserving relative quality ordering.
 */
function weightedShuffle<T>(items: T[], jitterAmount: number = 0.3): T[] {
  if (items.length <= 1) return [...items];

  // Assign a score to each item based on position + random jitter
  const scored = items.map((item, index) => ({
    item,
    score: index + (Math.random() - 0.5) * items.length * jitterAmount,
  }));

  // Sort by score
  scored.sort((a, b) => a.score - b.score);

  return scored.map((s) => s.item);
}

export interface DiversityResult {
  selected: DiscoveredCompany[];
  stats: {
    totalCandidates: number;
    uniqueCandidates: number;
    unseenCount: number;
    seenCount: number;
    unsavedCount: number;
    savedCount: number;
    selectedUnseen: number;
    selectedSeen: number;
  };
}

/**
 * Select diverse companies from candidates, prioritizing unseen and unsaved ones.
 * 
 * @param candidates - All discovered company candidates
 * @param seenDomains - Set of domains already shown to this user for this niche
 * @param targetCount - Number of companies to return
 * @param addRandomness - Whether to shuffle within quality bands
 * @param savedDomains - Set of domains the user has already saved (optional)
 */
export function selectDiverseCompanies(
  candidates: DiscoveredCompany[],
  seenDomains: Set<string>,
  targetCount: number,
  addRandomness: boolean = true,
  savedDomains: Set<string> = new Set(),
): DiversityResult {
  // Deduplicate candidates by domain AND normalized name
  const domainsSeen = new Set<string>();
  const namesSeen = new Set<string>();
  const uniqueCandidates: DiscoveredCompany[] = [];

  for (const candidate of candidates) {
    const domain = normalizeDomain(candidate.website || '');
    const normalizedName = normalizeCompanyName(candidate.name);

    // Skip if we've seen this domain (when domain exists) or this name
    const hasDomain = domain && domain.length > 0;
    if (hasDomain && domainsSeen.has(domain)) continue;
    if (namesSeen.has(normalizedName)) continue;

    if (hasDomain) domainsSeen.add(domain);
    namesSeen.add(normalizedName);
    uniqueCandidates.push(candidate);
  }

  // Categorize by priority: unseen+unsaved > unseen+saved > seen+unsaved > seen+saved
  const unseenUnsaved: DiscoveredCompany[] = [];
  const unseenSaved: DiscoveredCompany[] = [];
  const seenUnsaved: DiscoveredCompany[] = [];
  const seenSaved: DiscoveredCompany[] = [];

  for (const candidate of uniqueCandidates) {
    const domain = normalizeDomain(candidate.website || '');
    const isSeen = seenDomains.has(domain);
    const isSaved = savedDomains.has(domain);

    if (!isSeen && !isSaved) {
      unseenUnsaved.push(candidate);
    } else if (!isSeen && isSaved) {
      unseenSaved.push(candidate);
    } else if (isSeen && !isSaved) {
      seenUnsaved.push(candidate);
    } else {
      seenSaved.push(candidate);
    }
  }

  // Apply weighted randomness to each category if enabled
  const processCategory = (items: DiscoveredCompany[]) =>
    addRandomness ? weightedShuffle(items, 0.3) : items;

  const processedUnseenUnsaved = processCategory(unseenUnsaved);
  const processedUnseenSaved = processCategory(unseenSaved);
  const processedSeenUnsaved = processCategory(seenUnsaved);
  const processedSeenSaved = processCategory(seenSaved);

  // Build final selection in priority order
  const selected: DiscoveredCompany[] = [];

  // Priority 1: Unseen and unsaved (best - fresh and not yet saved by user)
  for (const company of processedUnseenUnsaved) {
    if (selected.length >= targetCount) break;
    selected.push(company);
  }

  // Priority 2: Seen but unsaved (user saw but didn't save - might still be interested)
  for (const company of processedSeenUnsaved) {
    if (selected.length >= targetCount) break;
    selected.push(company);
  }

  // Priority 3: Unseen but saved (new appearance of something user already has - less useful)
  for (const company of processedUnseenSaved) {
    if (selected.length >= targetCount) break;
    selected.push(company);
  }

  // Priority 4: Seen and saved (fallback only)
  for (const company of processedSeenSaved) {
    if (selected.length >= targetCount) break;
    selected.push(company);
  }

  const stats = {
    totalCandidates: candidates.length,
    uniqueCandidates: uniqueCandidates.length,
    unseenCount: unseenUnsaved.length + unseenSaved.length,
    seenCount: seenUnsaved.length + seenSaved.length,
    unsavedCount: unseenUnsaved.length + seenUnsaved.length,
    savedCount: unseenSaved.length + seenSaved.length,
    selectedUnseen: Math.min(unseenUnsaved.length + unseenSaved.length, targetCount),
    selectedSeen: Math.max(0, selected.length - (unseenUnsaved.length + unseenSaved.length)),
  };

  logger.info(
    {
      stats,
      selectedCompanies: selected.map((c) => c.name),
    },
    '[diversity] selected diverse companies',
  );

  return { selected, stats };
}

