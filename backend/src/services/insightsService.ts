import Anthropic from '@anthropic-ai/sdk';

import { env } from '../config/env.js';

const CLAUDE_MODEL = 'claude-sonnet-4-5';
const INSIGHTS_MAX_TOKENS = 1024;

const anthropic = new Anthropic({
  apiKey: env.CLAUDE_API_KEY,
});

interface OpportunityInput {
  query: string;
  companies: Array<{
    name: string;
    reason: string;
  }>;
}

export async function generateGlobalOpportunities({
  query,
  companies,
}: OpportunityInput): Promise<string> {
  const list = companies
    .map((company) => `- ${company.name}: ${company.reason}`)
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

