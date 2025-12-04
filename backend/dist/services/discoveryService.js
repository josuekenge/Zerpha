import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../logger.js';
const CLAUDE_MODEL = 'claude-3-haiku-20240307';
const DISCOVERY_MAX_TOKENS = 2048; // Increased for more candidates
const DEFAULT_RESULT_COUNT = 5;
const MAX_CANDIDATES = 15; // Request more candidates for diversity
const anthropic = new Anthropic({
    apiKey: env.CLAUDE_API_KEY,
});
const discoverySchema = z
    .array(z.object({
    name: z.string().min(1),
    website: z.string().url(),
    reason: z.string().min(1),
}))
    .max(MAX_CANDIDATES);
// System prompt requests more candidates for diversity
const systemPrompt = `You are Zerpha, an AI assistant that researches SaaS companies.
Task: Given a market or niche query, return up to ${MAX_CANDIDATES} relevant SaaS companies, preferring vertical SaaS. 
Include a diverse range of companies - from market leaders to emerging players.
If the niche lacks clear vertical SaaS options, include the best horizontal/general SaaS companies for that niche instead.

Rules:
- Respond with a compact JSON array only. No prose.
- Each object must contain: name, website, reason.
- reason should briefly explain why the company fits the niche or why it was selected.
- Prefer companies with readily discoverable websites that can be scraped.
- Include both well-known and lesser-known companies for variety.
- Avoid duplicates.`;
function extractJsonPayload(content) {
    const trimmed = content.trim();
    if (trimmed.startsWith('```')) {
        return trimmed.replace(/```json/gi, '').replace(/```/g, '').trim();
    }
    return trimmed;
}
/**
 * Discover companies matching a query.
 * Returns more candidates than needed for diversity filtering.
 */
export async function discoverCompanies(query, options = {}) {
    const maxCandidates = options.maxCandidates ?? MAX_CANDIDATES;
    // Use non-zero temperature for variety in results
    const temperature = options.temperature ?? 0.3;
    logger.info({ query, maxCandidates, temperature }, '[discovery] initiating company discovery');
    const message = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: DISCOVERY_MAX_TOKENS,
        temperature,
        system: systemPrompt,
        messages: [
            {
                role: 'user',
                content: `Return ONLY a JSON array (no prose, no markdown) of ${maxCandidates} diverse SaaS companies that match this market query: "${query}". Include a mix of market leaders and emerging players. Each object must contain "name", "website", and "reason".`,
            },
        ],
    });
    const textChunks = message.content
        .map((block) => {
        if (block.type === 'text') {
            return block.text;
        }
        if ('text' in block) {
            return block.text ?? '';
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
        const companies = discoverySchema.parse(parsed).slice(0, maxCandidates);
        logger.info({
            query,
            companyCount: companies.length,
            companies: companies.map((company) => company.name),
        }, '[discovery] parsed companies');
        return companies;
    }
    catch (error) {
        logger.error({ query, rawJson, err: error }, '[discovery] failed to parse Claude discovery response');
        throw new Error(`Failed to parse Claude discovery response: ${error.message}`);
    }
}
// Export constants for use in other modules
export { DEFAULT_RESULT_COUNT, MAX_CANDIDATES };
