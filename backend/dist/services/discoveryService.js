import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../logger.js';
const CLAUDE_MODEL = 'claude-3-haiku-20240307';
const DISCOVERY_MAX_TOKENS = 4096; // Increased for larger response
const DEFAULT_RESULT_COUNT = 10;
const CANDIDATE_OVERSAMPLE_COUNT = 20; // Request more for filtering headroom
const anthropic = new Anthropic({
    apiKey: env.CLAUDE_API_KEY,
});
// Schema for the new wrapped response format
const discoveryResponseSchema = z.object({
    companies: z.array(z.object({
        name: z.string().min(1),
        website: z.string().nullable(),
        description: z.string().min(1),
        industry: z.string().min(1),
        country: z.string().min(1),
    })).min(1).max(20), // Allow up to 20 for oversample
});
// System prompt with strict rules for real, relevant companies
const systemPrompt = `You are Zerpha, a precision market intelligence engine.
Your task is to extract up to 20 real companies that are directly relevant to the user's search query.

Rules:
1. Return between 10 and 20 companies. Aim for 20 if possible.
2. Companies must exist in real life and operate in the specific market described by the query.
3. Do not invent or guess companies, websites, or descriptions.
4. If you are unsure about a company's existence or relevance, exclude it.
5. Prefer vertical SaaS companies and B2B niche software tools that fit the query.
6. Website must be a plausible real URL. If unsure, set website to null.
7. Descriptions must be factual and concise, max 2 sentences.
8. All companies must match the search intent clearly.
9. Try to include a diverse mix of company sizes and geographies when relevant.

Return ONLY valid JSON with this schema:

{
  "companies": [
    {
      "name": "string",
      "website": "string or null",
      "description": "string",
      "industry": "string",
      "country": "string"
    }
  ]
}

Make sure:
- The JSON is valid and parsable.
- The list contains between 10 and 20 companies.
- No markdown code fences, no prose - just the JSON object.`;
function extractJsonPayload(content) {
    const trimmed = content.trim();
    // Remove markdown code fences if present
    if (trimmed.startsWith('```')) {
        return trimmed.replace(/```json/gi, '').replace(/```/g, '').trim();
    }
    return trimmed;
}
/**
 * Discover companies matching a query.
 * Returns exactly 5 real companies with detailed info.
 */
export async function discoverCompanies(query, options = {}) {
    const temperature = options.temperature ?? 0.3;
    logger.info({ query, temperature }, '[discovery] initiating company discovery');
    const message = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: DISCOVERY_MAX_TOKENS,
        temperature,
        system: systemPrompt,
        messages: [
            {
                role: 'user',
                content: `Find up to 20 real companies for this search query: "${query}"`,
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
        const validated = discoveryResponseSchema.parse(parsed);
        logger.info({
            query,
            companyCount: validated.companies.length,
            companies: validated.companies.map((c) => c.name),
        }, '[discovery] parsed companies');
        return validated.companies;
    }
    catch (error) {
        logger.error({ query, rawJson, err: error }, '[discovery] failed to parse Claude discovery response');
        throw new Error(`Failed to parse Claude discovery response: ${error.message}`);
    }
}
// Export constants for use in other modules
export { DEFAULT_RESULT_COUNT, CANDIDATE_OVERSAMPLE_COUNT };
