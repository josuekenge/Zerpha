/**
 * In-memory cache for company extractions to avoid redundant Claude calls.
 * Cache entries expire after TTL_MS milliseconds.
 */

import { logger } from '../logger.js';
import type { ExtractedCompany } from '../types/company.js';

const TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CacheEntry {
  data: ExtractedCompany;
  timestamp: number;
}

const extractionCache = new Map<string, CacheEntry>();

/**
 * Normalize a domain from a URL for cache key purposes.
 */
export function normalizeDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }
}

/**
 * Get a cached extraction result if it exists and is fresh.
 */
export function getCachedExtraction(website: string): ExtractedCompany | null {
  const key = normalizeDomain(website);
  const entry = extractionCache.get(key);
  
  if (!entry) {
    return null;
  }
  
  const age = Date.now() - entry.timestamp;
  if (age > TTL_MS) {
    extractionCache.delete(key);
    logger.debug({ domain: key }, '[cache] extraction expired');
    return null;
  }
  
  logger.info({ domain: key, ageMs: age }, '[cache] extraction cache hit');
  return entry.data;
}

/**
 * Store an extraction result in cache.
 */
export function setCachedExtraction(website: string, data: ExtractedCompany): void {
  const key = normalizeDomain(website);
  extractionCache.set(key, {
    data,
    timestamp: Date.now(),
  });
  logger.debug({ domain: key }, '[cache] stored extraction');
}

/**
 * Clear expired entries from cache (call periodically if needed).
 */
export function pruneCache(): number {
  const now = Date.now();
  let pruned = 0;
  
  for (const [key, entry] of extractionCache.entries()) {
    if (now - entry.timestamp > TTL_MS) {
      extractionCache.delete(key);
      pruned++;
    }
  }
  
  if (pruned > 0) {
    logger.debug({ pruned }, '[cache] pruned expired entries');
  }
  
  return pruned;
}

/**
 * Get cache statistics.
 */
export function getCacheStats(): { size: number; ttlMs: number } {
  return {
    size: extractionCache.size,
    ttlMs: TTL_MS,
  };
}

