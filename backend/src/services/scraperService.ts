const FETCH_TIMEOUT_MS = 10_000;
const USER_AGENT =
  'Mozilla/5.0 (compatible; ZerphaBot/1.0; +https://zerpha.app/market-intel)';

type PageType = 'home' | 'product' | 'pricing';

export interface ScrapedPage {
  type: PageType;
  url: string;
  html: string;
  text: string;
}

export interface ScrapeResult {
  pages: ScrapedPage[];
  errors: string[];
}

const productKeywords = ['product', 'solution', 'platform', 'features'];
const pricingKeywords = ['pricing', 'price', 'plans', 'plan', 'how-it-works'];

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface LinkCandidate {
  href: string;
  text: string;
}

function extractLinks(html: string, baseUrl: string): LinkCandidate[] {
  const candidates: LinkCandidate[] = [];
  const anchorRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gis;
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(html)) !== null) {
    const href = match[1];
    const text = stripHtml(match[2]);

    if (!href || href.startsWith('#') || href.startsWith('javascript')) continue;

    try {
      const absoluteUrl = new URL(href, baseUrl).toString();
      candidates.push({ href: absoluteUrl, text: text.toLowerCase() });
    } catch {
      // Ignore invalid URLs
    }
  }

  return candidates;
}

function findLinkByKeywords(links: LinkCandidate[], keywords: string[]): string | null {
  for (const keyword of keywords) {
    const match = links.find(
      (link) => link.href.toLowerCase().includes(keyword) || link.text.includes(keyword),
    );
    if (match) {
      return match.href;
    }
  }

  return null;
}

export async function scrapeCompanySite(baseUrl: string): Promise<ScrapeResult> {
  const pages: ScrapedPage[] = [];
  const errors: string[] = [];

  try {
    const homepageHtml = await fetchHtml(baseUrl);
    pages.push({
      type: 'home',
      url: baseUrl,
      html: homepageHtml,
      text: stripHtml(homepageHtml),
    });

    const links = extractLinks(homepageHtml, baseUrl);

    const productUrl = findLinkByKeywords(links, productKeywords);
    if (productUrl) {
      try {
        const productHtml = await fetchHtml(productUrl);
        pages.push({
          type: 'product',
          url: productUrl,
          html: productHtml,
          text: stripHtml(productHtml),
        });
      } catch (error) {
        errors.push(`Product page failed (${productUrl}): ${(error as Error).message}`);
      }
    }

    const pricingUrl = findLinkByKeywords(links, pricingKeywords);
    if (pricingUrl) {
      try {
        const pricingHtml = await fetchHtml(pricingUrl);
        pages.push({
          type: 'pricing',
          url: pricingUrl,
          html: pricingHtml,
          text: stripHtml(pricingHtml),
        });
      } catch (error) {
        errors.push(`Pricing page failed (${pricingUrl}): ${(error as Error).message}`);
      }
    }
  } catch (error) {
    errors.push(`Homepage fetch failed (${baseUrl}): ${(error as Error).message}`);
  }

  return { pages, errors };
}

