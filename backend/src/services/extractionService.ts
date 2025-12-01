import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

import { env } from '../config/env.js';

const CLAUDE_MODEL = 'claude-sonnet-4-5';
const EXTRACTION_MAX_TOKENS = 4096;

const anthropic = new Anthropic({
  apiKey: env.CLAUDE_API_KEY,
});

export const companyExtractionSchema = z.object({
  name: z.string().min(1),
  website: z.string().url(),
  summary: z.string().optional().default(''),
  product_offering: z.string().min(1).optional().default('N/A'),
  customer_segment: z.string().min(1).optional().default('N/A'),
  tech_stack: z.string().min(1).optional().default('N/A'),
  estimated_headcount: z.string().min(1).optional().default('N/A'),
  hq_location: z.string().min(1).optional().default('N/A'),
  pricing_model: z.string().min(1).optional().default('N/A'),
  strengths: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  opportunities: z.array(z.string()).default([]),
  acquisition_fit_score: z.number().min(0).max(10).optional().default(0),
  acquisition_fit_reason: z.string().min(1).optional().default('Not specified'),
  top_competitors: z.array(z.string()).default([]),
});

export type ExtractedCompany = z.infer<typeof companyExtractionSchema>;

const systemPrompt = `You are Zerpha, an AI analyst specialized in SaaS company intelligence.
Given scraped website content, produce a JSON object describing the company using the required schema.

Rules:
- Respond with JSON only, no prose.
- Provide thoughtful, evidence-based insights.
- The "summary" field must be a concise 2-4 sentence executive summary written for M&A analysts.
- If data is missing, infer cautiously or use "Unknown".
- acquisition_fit_score must be a number between 0 and 10.`;

function buildExtractionPrompt(companyName: string, website: string, content: string): string {
  return `Company: ${companyName}
Website: ${website}

Scraped content:
"""${content}"""

Output JSON matching exactly this schema:
{
  "name": "string",
  "website": "https://example.com",
  "summary": "2-4 sentence executive summary for M&A analysts describing what the company does and why it matters",
  "product_offering": "string",
  "customer_segment": "string",
  "tech_stack": "string",
  "estimated_headcount": "string",
  "hq_location": "string",
  "pricing_model": "string",
  "strengths": ["string"],
  "risks": ["string"],
  "opportunities": ["string"],
  "acquisition_fit_score": 0-10 number,
  "acquisition_fit_reason": "string",
  "top_competitors": ["string"]
}`;
}

async function requestExtraction(prompt: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: EXTRACTION_MAX_TOKENS,
    system: systemPrompt,
    temperature: 0.1,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const textChunks = message.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .filter(Boolean)
    .join('\n');

  if (!textChunks) {
    throw new Error('Claude returned empty extraction response');
  }

  return extractJsonPayload(textChunks);
}

function extractJsonPayload(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/```json/gi, '').replace(/```/g, '').trim();
  }
  return trimmed;
}

async function requestJsonCorrection(invalidJson: string, errorMessage: string): Promise<string> {
  const correctionPrompt = `The previous JSON output could not be parsed.
Parsing error: ${errorMessage}

Original JSON:
"""${invalidJson}"""

Please respond with corrected JSON only, no comments or explanations.`;

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: EXTRACTION_MAX_TOKENS,
    system: 'You fix JSON outputs. Respond with corrected JSON only.',
    temperature: 0,
    messages: [
      {
        role: 'user',
        content: correctionPrompt,
      },
    ],
  });

  const textChunks = message.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .filter(Boolean)
    .join('\n');

  if (!textChunks) {
    throw new Error('Claude returned empty correction response');
  }

  return extractJsonPayload(textChunks);
}

export interface ExtractionInput {
  companyName: string;
  website: string;
  combinedText: string;
}

export async function extractCompanyInsights(
  input: ExtractionInput,
): Promise<ExtractedCompany> {
  const prompt = buildExtractionPrompt(input.companyName, input.website, input.combinedText);
  const rawResponse = await requestExtraction(prompt);

  const parsed = await parseWithRetry(rawResponse, async (errorMessage) => {
    const corrected = await requestJsonCorrection(rawResponse, errorMessage);
    return corrected;
  });

  return companyExtractionSchema.parse(parsed);
}

async function parseWithRetry(
  rawJson: string,
  retryFn: (errorMessage: string) => Promise<string>,
): Promise<unknown> {
  try {
    return JSON.parse(rawJson);
  } catch (error) {
    const message = (error as Error).message;
    const correctedJson = await retryFn(message);
    try {
      return JSON.parse(correctedJson);
    } catch (secondError) {
      throw new Error(
        `Failed to parse Claude extraction response after retry: ${(secondError as Error).message}`,
      );
    }
  }
}

