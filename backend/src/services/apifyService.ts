import { env } from '../config/env.js';
import { logger } from '../logger.js';

const APIFY_ACTOR_ID = 's-r~free-email-domain-scraper';

interface ApifyRunResponse {
  data?: {
    id?: string;
    defaultDatasetId?: string;
  };
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

