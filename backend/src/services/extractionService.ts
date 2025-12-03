import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

import { env } from '../config/env.js';
import {
  allowedIndustries,
  type ExtractedCompany,
  type Industry,
} from '../types/company.js';
import { logger } from '../logger.js';

// Use Haiku for faster extraction - it's sufficient for structured JSON output
const CLAUDE_MODEL = 'claude-3-haiku-20240307';
// Reduced from 4096 - typical extraction responses are ~1500-2000 tokens
const EXTRACTION_MAX_TOKENS = 2500;

const anthropic = new Anthropic({
  apiKey: env.CLAUDE_API_KEY,
});

const industryEnum = z.enum(allowedIndustries);

const stringArrayField = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  return [];
}, z.array(z.string()));

const optionalStringField = (fallback: string) =>
  z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() : undefined),
    z.string().min(1).catch(fallback),
  );

export const companyExtractionSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  website: z.string().url('website must be a valid URL'),
  summary: optionalStringField('Unknown'),
  product_offering: optionalStringField('Unknown'),
  customer_segment: optionalStringField('Unknown'),
  tech_stack: stringArrayField,
  estimated_headcount: optionalStringField('Unknown'),
  hq_location: optionalStringField('Unknown'),
  pricing_model: optionalStringField('Unknown'),
  strengths: stringArrayField,
  risks: stringArrayField,
  opportunities: stringArrayField,
  acquisition_fit_score: z.number().min(0).max(10),
  acquisition_fit_reason: optionalStringField('No rationale provided'),
  top_competitors: stringArrayField,
  primary_industry: industryEnum,
  secondary_industry: industryEnum.nullable(),
});

// Concise system prompt to reduce input tokens
const systemPrompt = `You are Zerpha, an M&A analyst. Output ONLY valid JSON matching the schema. No markdown, no prose.`;

const allowedIndustryList = allowedIndustries.map((industry) => `- "${industry}"`).join('\n');

function buildExtractionPrompt(companyName: string, website: string, content: string): string {
  return `Analyze the following scraped content for a SaaS company. Produce a single JSON object that strictly matches the schema below. Do not include explanations or markdown, just valid JSON.

Required schema:
{
  "name": string,
  "website": string,
  "summary": string (2-4 sentence executive summary for M&A analysts),
  "product_offering": string,
  "customer_segment": string,
  "tech_stack": string[],
  "estimated_headcount": string,
  "hq_location": string,
  "pricing_model": string,
  "strengths": string[],
  "risks": string[],
  "opportunities": string[],
  "acquisition_fit_score": number (0-10, one decimal max),
  "acquisition_fit_reason": string,
  "top_competitors": string[],
  "primary_industry": string from allowed list,
  "secondary_industry": string from allowed list or null
}

Allowed industries:
${allowedIndustryList}

Scoring guidance:
- 0-3 = poor fit or unclear model.
- 4-6 = moderate fit with potential but not top-tier.
- 7-8 = strong strategic target with clear differentiation.
- 9-10 = exceptional fit with rare upside.

Always justify the acquisition_fit_score with 3-6 sentences covering positives and risks. Use "Unknown" when data is missing. Never invent customers or metrics you cannot infer from the text. tech_stack, strengths, risks, opportunities, and top_competitors must be arrays of strings (deduplicate and keep concise).

Company: ${companyName}
Website: ${website}

Scraped content:
"""${content}"""`;
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

