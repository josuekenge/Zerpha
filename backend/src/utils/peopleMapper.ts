import { randomUUID } from 'node:crypto';

import type { Person } from '../types/people.js';

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

export function mapEmailsToPeople(apifyEmails: any[]): Person[] {
  if (!Array.isArray(apifyEmails)) {
    return [];
  }

  return apifyEmails
    .map((entry) => {
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

