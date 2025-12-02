import { randomUUID } from 'node:crypto';

import type { Person } from '../types/people.js';
import type { ScrapedPerson } from '../services/apifyService.js';

function safeString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function splitName(fullName: string | null): [string | null, string | null] {
  if (!fullName) {
    return [null, null];
  }
  const parts = fullName.split(' ').filter(Boolean);
  if (parts.length === 0) {
    return [null, null];
  }
  const first = parts[0] ?? null;
  const last = parts.slice(1).join(' ') || null;
  return [first, last];
}

/**
 * Map Apify results to Person format.
 * Handles both the old email scraper format and the new website-contacts ScrapedPerson format.
 */
export function mapEmailsToPeople(apifyResults: any[]): Person[] {
  if (!Array.isArray(apifyResults)) {
    return [];
  }

  return apifyResults
    .map((entry) => {
      // Handle ScrapedPerson format from website-contacts
      if ('sourcePage' in entry) {
        const scrapedEntry = entry as ScrapedPerson;
        const email = safeString(scrapedEntry.email);
        const phone = safeString(scrapedEntry.phone);
        
        // Skip entries with no email and no phone
        if (!email && !phone) {
          return null;
        }

        const fullName = safeString(scrapedEntry.name);
        const [firstName, lastName] = splitName(fullName);

        const person: Person = {
          id: randomUUID(),
          company_id: '',
          full_name: fullName,
          first_name: firstName,
          last_name: lastName,
          role: 'Unknown',
          seniority: null,
          department: null,
          email,
          phone,
          linkedin_url: null,
          twitter_url: null,
          source: 'apify-website-contacts',
          confidence_score: null,
          created_at: new Date().toISOString(),
          location_city: null,
          location_country: null,
          work_history: null,
          skills: null,
          tags: null,
          notes: scrapedEntry.sourcePage ? `Source: ${scrapedEntry.sourcePage}` : null,
          is_ceo: false,
          is_founder: false,
          is_executive: false,
        };

        return person;
      }

      // Handle old email scraper format
      const fullName =
        safeString(entry.fullName) ??
        safeString(entry.name) ??
        safeString(entry.personName);
      const [firstName, lastName] = splitName(fullName);
      const email = safeString(entry.email);
      if (!email) {
        return null;
      }

      const linkedin_url =
        safeString(entry.linkedinUrl) ?? safeString(entry.linkedin);
      const twitter_url =
        safeString(entry.twitterUrl) ?? safeString(entry.twitter);

      const person: Person = {
        id: randomUUID(),
        company_id: '',
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        role: 'Unknown',
        seniority: safeString(entry.seniority),
        department: safeString(entry.department),
        email,
        phone: safeString(entry.phone),
        linkedin_url,
        twitter_url,
        source: 'apify',
        confidence_score:
          typeof entry.confidence === 'number' ? entry.confidence : null,
        created_at: new Date().toISOString(),
        location_city: safeString(entry.city),
        location_country: safeString(entry.country),
        work_history:
          typeof entry.workHistory === 'object' && entry.workHistory !== null
            ? entry.workHistory
            : null,
        skills:
          typeof entry.skills === 'object' && entry.skills !== null
            ? entry.skills
            : null,
        tags:
          typeof entry.tags === 'object' && entry.tags !== null
            ? entry.tags
            : null,
        notes: safeString(entry.notes),
        is_ceo: Boolean(entry.isCeo),
        is_founder: Boolean(entry.isFounder),
        is_executive: Boolean(entry.isExecutive),
      };

      return person;
    })
    .filter((person): person is Person => Boolean(person));
}

