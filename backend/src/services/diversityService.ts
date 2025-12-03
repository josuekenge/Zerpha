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
 * Get domains that have been shown to a user for a specific niche.
 */
export async function getSeenDomains(
  userId: string,
  nicheKey: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('niche_history')
    .select('company_domain')
    .eq('user_id', userId)
    .eq('niche_key', nicheKey);

  if (error) {
    logger.warn({ err: error, userId, nicheKey }, '[diversity] failed to fetch seen domains');
    return new Set();
  }

  const domains = new Set((data ?? []).map((row) => row.company_domain));
  logger.debug({ userId, nicheKey, seenCount: domains.size }, '[diversity] fetched seen domains');
  return domains;
}

/**
 * Record that companies were shown to a user for a niche.
 * Uses upsert to handle duplicates gracefully.
 */
export async function recordSeenCompanies(
  userId: string,
  nicheKey: string,
  companies: Array<{ website: string }>,
): Promise<void> {
  if (companies.length === 0) return;

  const records = companies.map((company) => ({
    user_id: userId,
    niche_key: nicheKey,
    company_domain: normalizeDomain(company.website),
    last_seen_at: new Date().toISOString(),
  }));

  // Use upsert to update last_seen_at if already exists
  const { error } = await supabase
    .from('niche_history')
    .upsert(records, {
      onConflict: 'user_id,niche_key,company_domain',
      ignoreDuplicates: false,
    });

  if (error) {
    logger.warn({ err: error, userId, nicheKey }, '[diversity] failed to record seen companies');
  } else {
    logger.debug(
      { userId, nicheKey, recordedCount: records.length },
      '[diversity] recorded seen companies',
    );
  }
}

/**
 * Apply a small random jitter to scores for variety.
 * Keeps relative ordering mostly intact but allows some shuffling.
 */
function applyScoreJitter(score: number): number {
  // Add random jitter of ±0.5 points
  const jitter = (Math.random() - 0.5) * 1.0;
  return score + jitter;
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

export interface DiversityResult {
  selected: DiscoveredCompany[];
  stats: {
    totalCandidates: number;
    unseenCount: number;
    seenCount: number;
    selectedUnseen: number;
    selectedSeen: number;
  };
}

/**
 * Select diverse companies from candidates, prioritizing unseen ones.
 * 
 * @param candidates - All discovered company candidates
 * @param seenDomains - Set of domains already shown to this user for this niche
 * @param targetCount - Number of companies to return
 * @param addRandomness - Whether to shuffle within quality bands
 */
export function selectDiverseCompanies(
  candidates: DiscoveredCompany[],
  seenDomains: Set<string>,
  targetCount: number,
  addRandomness: boolean = true,
): DiversityResult {
  // Deduplicate candidates by domain
  const domainsSeen = new Set<string>();
  const uniqueCandidates: DiscoveredCompany[] = [];
  
  for (const candidate of candidates) {
    const domain = normalizeDomain(candidate.website);
    if (!domainsSeen.has(domain)) {
      domainsSeen.add(domain);
      uniqueCandidates.push(candidate);
    }
  }

  // Split into unseen and seen
  const unseen: DiscoveredCompany[] = [];
  const seen: DiscoveredCompany[] = [];

  for (const candidate of uniqueCandidates) {
    const domain = normalizeDomain(candidate.website);
    if (seenDomains.has(domain)) {
      seen.push(candidate);
    } else {
      unseen.push(candidate);
    }
  }

  // Apply randomness if enabled
  const processedUnseen = addRandomness ? shuffleArray(unseen) : unseen;
  const processedSeen = addRandomness ? shuffleArray(seen) : seen;

  // Build final selection: unseen first, then seen as fallback
  const selected: DiscoveredCompany[] = [];
  
  // Take from unseen first
  for (const company of processedUnseen) {
    if (selected.length >= targetCount) break;
    selected.push(company);
  }

  // Backfill from seen if needed
  for (const company of processedSeen) {
    if (selected.length >= targetCount) break;
    selected.push(company);
  }

  const stats = {
    totalCandidates: candidates.length,
    unseenCount: unseen.length,
    seenCount: seen.length,
    selectedUnseen: Math.min(unseen.length, targetCount),
    selectedSeen: Math.max(0, selected.length - Math.min(unseen.length, targetCount)),
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

