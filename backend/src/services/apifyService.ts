import { env } from '../config/env.js';
import { logger } from '../logger.js';

const APIFY_BASE_URL = 'https://api.apify.com/v2';
const APIFY_ACTOR_ID = 's-r~free-email-domain-scraper';
// Contact Details Scraper - extracts emails, phones, social links from websites
const APIFY_CONTACTS_ACTOR_ID = 'vdrmota/contact-info-scraper';

interface ApifyRunResponse {
  data?: {
    id?: string;
    defaultDatasetId?: string;
  };
}

export interface ScrapedPerson {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  source_page: string;
  role: string | null;
  company_name: string | null;
}

/**
 * Scrape people/contacts from a website using Apify Contact Details Scraper.
 * Uses run-sync-get-dataset-items for synchronous execution.
 * Returns an array of { first_name, last_name, email, phone, source_page, role, company_name }.
 */
export async function scrapePeople(website: string): Promise<ScrapedPerson[]> {
  const token = env.APIFY_TOKEN;
  
  if (!token) {
    console.warn('[apify] APIFY_TOKEN missing, skipping people scraping');
    return [];
  }

  if (!website || typeof website !== 'string') {
    return [];
  }

  console.info('[people] starting website contacts scraper', { website });

  // Input for vdrmota/contact-info-scraper
  const input = {
    startUrls: [{ url: website }],
    maxDepth: 1,
    sameDomain: true,
    proxyConfiguration: {
      useApifyProxy: true,
    },
  };

  try {
    // Use run-sync-get-dataset-items for synchronous execution
    const apiUrl = `${APIFY_BASE_URL}/acts/${encodeURIComponent(APIFY_CONTACTS_ACTOR_ID)}/run-sync-get-dataset-items?token=${token}`;
    
    console.log('[apify] calling actor:', APIFY_CONTACTS_ACTOR_ID, 'for website:', website);

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[apify] contacts actor failed', { status: res.status, body });
      return [];
    }

    const items = (await res.json()) as any[];
    
    console.log('[apify] raw response items:', JSON.stringify(items, null, 2));

    if (!Array.isArray(items) || items.length === 0) {
      console.log('[apify] no items returned for', website);
      return [];
    }

    const people: ScrapedPerson[] = [];

    for (const item of items) {
      const sourcePage = item.url || item.sourceUrl || website;
      
      // Handle emails array (common format for contact-info-scraper)
      const emails: string[] = Array.isArray(item.emails) ? item.emails : [];
      const phones: string[] = Array.isArray(item.phones) ? item.phones : [];

      // Create person entries for each email
      for (const email of emails) {
        if (typeof email === 'string' && email.includes('@')) {
          people.push({
            first_name: null,
            last_name: null,
            email,
            phone: null,
            source_page: sourcePage,
            role: null,
            company_name: null,
          });
        }
      }

      // Create person entries for phones (or attach to existing email entries)
      for (const phone of phones) {
        if (typeof phone === 'string' && phone.length > 0) {
          // Try to attach phone to an existing email entry without a phone
          const existingWithoutPhone = people.find((p) => p.source_page === sourcePage && !p.phone);
          if (existingWithoutPhone) {
            existingWithoutPhone.phone = phone;
          } else {
            people.push({
              first_name: null,
              last_name: null,
              email: null,
              phone,
              source_page: sourcePage,
              role: null,
              company_name: null,
            });
          }
        }
      }

      // Handle single email/phone fields if present
      if (item.email && typeof item.email === 'string' && !emails.includes(item.email)) {
        people.push({
          first_name: null,
          last_name: null,
          email: item.email,
          phone: item.phone || null,
          source_page: sourcePage,
          role: null,
          company_name: null,
        });
      }
    }

    console.info('[people] scraped people from Apify', { website, count: people.length });

    return people;
  } catch (error) {
    console.error('[apify] contacts scraper failed', { website, error });
    logger.error({ err: error, website }, '[apify] contacts scraper failed');
    return [];
  }
}

export async function runEmailScraper(domains: string[]): Promise<any[]> {
  if (!env.APIFY_TOKEN) {
    logger.warn('[apify] APIFY_TOKEN is missing, skipping email scraping');
    return [];
  }

  if (!Array.isArray(domains) || domains.length === 0) {
    return [];
  }

  const url = `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs?token=${env.APIFY_TOKEN}`;

  try {
    const runResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ domains }),
    });

    if (!runResponse.ok) {
      throw new Error(`Apify run failed with status ${runResponse.status}`);
    }

    const runPayload = (await runResponse.json()) as ApifyRunResponse;
    const datasetId = runPayload?.data?.defaultDatasetId;

    if (!datasetId) {
      logger.warn({ domains }, '[apify] missing dataset id');
      return [];
    }

    const datasetResponse = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?clean=1`,
      {
        headers: { Accept: 'application/json' },
      },
    );

    if (!datasetResponse.ok) {
      throw new Error(
        `Apify dataset fetch failed with status ${datasetResponse.status}`,
      );
    }

    const items = await datasetResponse.json();
    return Array.isArray(items) ? items : [];
  } catch (error) {
    logger.error({ err: error, domains }, '[apify] email scraper failed');
    return [];
  }
}

