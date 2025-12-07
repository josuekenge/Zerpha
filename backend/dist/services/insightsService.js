import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env.js';
// Use Haiku for faster insights generation
const CLAUDE_MODEL = 'claude-3-haiku-20240307';
// Reduced - insights are just 3-4 sentences
const INSIGHTS_MAX_TOKENS = 400;
const anthropic = new Anthropic({
    apiKey: env.CLAUDE_API_KEY,
});
export async function generateGlobalOpportunities({ query, companies, }) {
    const list = companies
        .map((company) => `- ${company.name}: ${company.description}`)
        .join('\n');
    const prompt = `Market query: ${query}

Companies considered:
${list || '- None'}

Write a concise paragraph (3-4 sentences) describing the top market opportunities for this niche, referencing the nature of these companies. Focus on trends, buyer pain points, and acquisition opportunities.`;
    const message = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: INSIGHTS_MAX_TOKENS,
        temperature: 0.4,
        system: 'You are Zerpha, an expert market analyst for vertical SaaS categories.',
        messages: [
            {
                role: 'user',
                content: prompt,
            },
        ],
    });
    const text = message.content
        .map((block) => (block.type === 'text' ? block.text.trim() : ''))
        .filter(Boolean)
        .join('\n\n')
        .trim();
    return text || 'No opportunities identified.';
}
