import { supabase } from '../config/supabase.js';
import { logger } from '../logger.js';
import type { Person } from '../types/people.js';

/**
 * Insert people records into the database.
 * @param companyId - The company ID to associate with these people
 * @param people - Array of Person objects (without company_id or user_id set)
 * @param userId - The authenticated user's ID for RLS
 */
export async function insertPeople(
  companyId: string,
  people: Person[],
  userId: string,
): Promise<void> {
  if (!Array.isArray(people) || people.length === 0) {
    logger.debug({ companyId, userId }, '[people] no people to insert');
    return;
  }

  const payload = people
    .filter((person) => typeof person.email === 'string' && person.email.length > 0)
    .map((person) => ({
      id: person.id,
      company_id: companyId,
      user_id: userId,
      full_name: person.full_name,
      first_name: person.first_name,
      last_name: person.last_name,
      role: person.role ?? 'Unknown',
      seniority: person.seniority,
      department: person.department,
      email: person.email,
      phone: person.phone,
      linkedin_url: person.linkedin_url,
      twitter_url: person.twitter_url,
      source: person.source ?? 'apify',
      confidence_score: person.confidence_score,
      created_at: person.created_at ?? new Date().toISOString(),
      location_city: person.location_city,
      location_country: person.location_country,
      work_history: person.work_history,
      skills: person.skills,
      tags: person.tags,
      notes: person.notes,
      is_ceo: person.is_ceo ?? false,
      is_founder: person.is_founder ?? false,
      is_executive: person.is_executive ?? false,
    }));

  if (payload.length === 0) {
    logger.debug({ companyId, userId }, '[people] no valid emails to insert');
    return;
  }

  logger.info(
    { companyId, userId, count: payload.length },
    '[people] inserting people records',
  );

  const { error } = await supabase
    .from('people')
    .upsert(payload, { ignoreDuplicates: true, onConflict: 'email' });

  if (error) {
    logger.error(
      { err: error, companyId, userId, count: payload.length },
      '[people] failed to insert people records',
    );
  } else {
    logger.info(
      { companyId, userId, count: payload.length },
      '[people] successfully inserted people records',
    );
  }
}

