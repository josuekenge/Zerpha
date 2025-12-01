import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { env } from '../config/env.js';
const CLAUDE_MODEL = 'claude-sonnet-4-5';
const DISCOVERY_MAX_TOKENS = 1024;
const MAX_COMPANIES = 5;
const anthropic = new Anthropic({
    apiKey: env.CLAUDE_API_KEY,
});
const discoverySchema = z
    .array(z.object({
    name: z.string().min(1),
    website: z.string().url(),
    reason: z.string().min(1),
}))
    .max(MAX_COMPANIES);
const systemPrompt = `You are Zerpha, an AI assistant that researches SaaS companies.
Task: Given a market or niche query, return up to ${MAX_COMPANIES} relevant SaaS companies, preferring vertical SaaS. 
If the niche lacks clear vertical SaaS options, include the best horizontal/general SaaS companies for that niche instead.

Rules:
- Respond with a compact JSON array only. No prose.
- Each object must contain: name, website, reason.
- reason should briefly explain why the company fits the niche or why it was selected.
- Prefer companies with readily discoverable websites that can be scraped.
- Avoid duplicates.`;
function extractJsonPayload(content) {
    const trimmed = content.trim();
    if (trimmed.startsWith('```')) {
        return trimmed.replace(/```json/gi, '').replace(/```/g, '').trim();
    }
    return trimmed;
}
export async function discoverCompanies(query) {
    const message = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: DISCOVERY_MAX_TOKENS,
        temperature: 0,
        system: systemPrompt,
        messages: [
            {
                role: 'user',
                content: `User market query: "${query}"

Return JSON like:
[
  {
    "name": "Example Vertical SaaS",
    "website": "https://example.com",
    "reason": "Vertical SaaS for home healthcare scheduling"
  }
]`,
            },
        ],
    });
    const textChunks = message.content
        .map((block) => (block.type === 'text' ? block.text : ''))
        .filter(Boolean)
        .join('\n');
    if (!textChunks) {
        throw new Error('Claude returned an empty response for discovery');
    }
    const rawJson = extractJsonPayload(textChunks);
    try {
        const parsed = JSON.parse(rawJson);
        const companies = discoverySchema.parse(parsed);
        return companies.slice(0, MAX_COMPANIES);
    }
    catch (error) {
        throw new Error(`Failed to parse Claude discovery response: ${error.message}`);
    }
}
