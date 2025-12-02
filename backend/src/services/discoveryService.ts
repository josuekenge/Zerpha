import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

import { env } from '../config/env.js';
import { logger } from '../logger.js';

const CLAUDE_MODEL = 'claude-sonnet-4-5';
const DISCOVERY_MAX_TOKENS = 1024;
const MAX_COMPANIES = 5;

const anthropic = new Anthropic({
  apiKey: env.CLAUDE_API_KEY,
});

const discoverySchema = z
  .array(
    z.object({
      name: z.string().min(1),
      website: z.string().url(),
      reason: z.string().min(1),
    }),
  )
  .max(MAX_COMPANIES);

export type DiscoveredCompany = z.infer<typeof discoverySchema>[number];

const systemPrompt = `You are Zerpha, an AI assistant that researches SaaS companies.
Task: Given a market or niche query, return up to ${MAX_COMPANIES} relevant SaaS companies, preferring vertical SaaS. 
If the niche lacks clear vertical SaaS options, include the best horizontal/general SaaS companies for that niche instead.

Rules:
- Respond with a compact JSON array only. No prose.
- Each object must contain: name, website, reason.
- reason should briefly explain why the company fits the niche or why it was selected.
- Prefer companies with readily discoverable websites that can be scraped.
- Avoid duplicates.`;

function extractJsonPayload(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/```json/gi, '').replace(/```/g, '').trim();
  }

  return trimmed;
}

export async function discoverCompanies(query: string): Promise<DiscoveredCompany[]> {
  logger.info({ query }, '[discovery] initiating company discovery');

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: DISCOVERY_MAX_TOKENS,
    temperature: 0,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Return ONLY a JSON array (no prose, no markdown) of 1-${MAX_COMPANIES} SaaS companies that match this market query: "${query}". Each object must contain "name", "website", and "reason".`,
      },
    ],
  });

  const textChunks = message.content
    .map((block) => {
      if (block.type === 'text') {
        return block.text;
      }
      if ('text' in block) {
        return (block as { text?: string }).text ?? '';
      }
      return '';
    })
    .filter(Boolean)
    .join('\n');

  if (!textChunks) {
    const errorMessage = 'Claude returned an empty response for discovery';
    logger.error({ query }, `[discovery] ${errorMessage}`);
    throw new Error(errorMessage);
  }

  const rawJson = extractJsonPayload(textChunks);
  logger.debug({ query, rawJson }, '[discovery] raw response payload');

  try {
    const parsed = JSON.parse(rawJson);
    const companies = discoverySchema.parse(parsed).slice(0, MAX_COMPANIES);
    logger.info(
      {
        query,
        companyCount: companies.length,
        companies: companies.map((company) => company.name),
      },
      '[discovery] parsed companies',
    );
    return companies;
  } catch (error) {
    logger.error(
      { query, rawJson, err: error },
      '[discovery] failed to parse Claude discovery response',
    );
    throw new Error(`Failed to parse Claude discovery response: ${(error as Error).message}`);
  }
}

