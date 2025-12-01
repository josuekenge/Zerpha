import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { z } from 'zod';

import { env } from '../config/env.js';
import { logger } from '../logger.js';

const ai = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});

const INFOGRAPHIC_MAX_ATTEMPTS = 3;
const INFOGRAPHIC_BASE_BACKOFF_MS = 400;

const slideDefinitionSchema = z.object({
  deck_title: z.string().min(1),
  slides: z
    .array(
      z.object({
        title: z.string().min(1),
        bullets: z.array(z.string().min(1)).min(1),
      }),
    )
    .min(1),
});

export type SlideDeckDefinition = z.infer<typeof slideDefinitionSchema>;
export type SlideDefinition = SlideDeckDefinition['slides'][number];

export type SlideWithOptionalImage = SlideDefinition & {
  imageUrl?: string;
};

export type GeneratedSlideImage = {
  buffer: Buffer;
  mimeType: string;
};

export type InfographicPage = {
  title: string;
  subtitle: string;
  key_metrics: { label: string; value: string }[];
  bullets: string[];
};

export const infographicSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  key_metrics: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      }),
    )
    .default([]),
  bullets: z.array(z.string()).min(3).max(10),
});

function sanitizeText(raw?: string | (() => string)): string {
  if (!raw) return '';
  if (typeof raw === 'function') {
    try {
      return sanitizeText(raw());
    } catch {
      return '';
    }
  }
  return raw.replace(/```json/gi, '').replace(/```/g, '').trim();
}

function cleanGeminiJson(raw: string): string {
  let text = raw.trim();

  if (text.startsWith('```json')) {
    text = text.slice(7).trimStart();
    if (text.endsWith('```')) {
      text = text.slice(0, -3);
    }
  } else if (text.startsWith('```')) {
    text = text.slice(3).trimStart();
    if (text.endsWith('```')) {
      text = text.slice(0, -3);
    }
  }

  const firstBrace = text.indexOf('{');
  if (firstBrace >= 0) {
    text = text.slice(firstBrace);
  }

  const lastBrace = text.lastIndexOf('}');
  if (lastBrace >= 0) {
    text = text.slice(0, lastBrace + 1);
  }

  return text;
}

function parseSlideDefinition(text: string): SlideDeckDefinition {
  const cleaned = cleanGeminiJson(text);
  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    const preview = cleaned.slice(0, 200);
    logger.warn({ err: error, preview }, 'Failed to parse Gemini slide JSON');
    throw error;
  }

  try {
    return slideDefinitionSchema.parse(parsed);
  } catch (error) {
    logger.warn({ err: error }, 'Gemini slide JSON failed validation');
    throw error;
  }
}

async function callGemini(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    },
  });

  return sanitizeText(response.text);
}

type GeminiApiError = Error & { code?: number | string; status?: string };

function isProviderUnavailableError(error: unknown): error is GeminiApiError {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const candidate = error as GeminiApiError;
  return candidate.code === 503 || candidate.status === 'UNAVAILABLE';
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGeminiInfographicWithRetry(prompt: string): Promise<string> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= INFOGRAPHIC_MAX_ATTEMPTS; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      return sanitizeText(response.text);
    } catch (error) {
      lastError = error;

      if (isProviderUnavailableError(error)) {
        logger.warn(
          { attempt, err: error },
          'Gemini infographic provider unavailable; retrying',
        );

        if (attempt === INFOGRAPHIC_MAX_ATTEMPTS) {
          logger.error(
            { err: error },
            'Gemini infographic provider unavailable after retries',
          );
          throw new Error('INFOPGRAPHIC_PROVIDER_UNAVAILABLE');
        }

        const backoff = INFOGRAPHIC_BASE_BACKOFF_MS * attempt;
        await delay(backoff);
        continue;
      }

      throw error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error('Gemini infographic call failed');
}

function buildSlideDeckPrompt(companyJson: unknown, attempt: number): string {
  const typeDefinition = `type SlideDeckDefinition = {
  deck_title: string;
  slides: { title: string; bullets: string[] }[];
}`;

  const strictInstructions = `You are a slide deck generator.
Given the provided company JSON, output a slide deck definition that matches exactly this TypeScript type:
${typeDefinition}
Requirements:
- Output valid JSON only.
- No explanations, no prose, no markdown fences, no backticks.
- The JSON root must be the SlideDeckDefinition object.
- Each slide must contain 3 to 6 concise bullets written for M&A analysts.`;

  const attemptMessages = [
    '',
    'Your previous answer was not valid JSON. This time, respond with JSON only and nothing else.',
    'Final attempt: respond with JSON only. Any text outside the JSON object is unacceptable.',
  ];

  const attemptIndex = Math.min(attempt, attemptMessages.length) - 1;
  const attemptInstruction = attemptMessages[attemptIndex] ?? '';

  const companyJsonBlock = JSON.stringify(companyJson, null, 2);

  return `${strictInstructions}
${attemptInstruction ? `${attemptInstruction}\n` : ''}Company JSON:
${companyJsonBlock}`;
}

export async function generateGeminiSlidesFromCompanyJson(
  companyJson: unknown,
): Promise<SlideDeckDefinition> {
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const prompt = buildSlideDeckPrompt(companyJson, attempt);

    try {
      const responseText = await callGemini(prompt);
      return parseSlideDefinition(responseText);
    } catch (error) {
      lastError = error;
      const isRetryable = error instanceof SyntaxError || error instanceof z.ZodError;
      if (!isRetryable) {
        throw error;
      }

      logger.warn(
        { attempt, err: error },
        'Gemini produced invalid slide deck JSON; retrying',
      );

      if (attempt === maxAttempts) {
        break;
      }
    }
  }

  logger.warn(
    { attempts: maxAttempts, err: lastError },
    'Gemini failed to produce valid slide deck JSON after retries',
  );
  throw new Error('Gemini failed to produce valid slide deck JSON');
}

function buildInfographicPrompt(companyJson: unknown): string {
  const typeDef = `type InfographicPage = {
  title: string;
  subtitle: string;
  key_metrics: { label: string; value: string }[];
  bullets: string[];
};`;

  return `
You are generating a one page M&A target infographic.

Given the following company JSON, output a single InfographicPage object that matches this TypeScript type exactly.

Requirements:
- Output valid JSON only, no prose, no markdown, no backticks.
- Root must be the InfographicPage object.
- title is the company name plus a short descriptor.
- subtitle is one concise sentence about why this company is interesting.
- key_metrics should include 3 to 6 important metrics for an M&A analyst.
- bullets should contain 4 to 8 concise bullets with the main insights.

Company JSON:
${JSON.stringify(companyJson, null, 2)}
`.trim();
}

export async function generateGeminiInfographicFromCompanyJson(
  companyJson: unknown,
): Promise<InfographicPage> {
  const prompt = buildInfographicPrompt(companyJson);
  const raw = await callGeminiInfographicWithRetry(prompt);
  const cleaned = cleanGeminiJson(raw);

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    const preview = cleaned.slice(0, 200);
    logger.warn({ err: error, preview }, 'Failed to parse Gemini infographic JSON');
    throw new Error('Gemini failed to produce infographic JSON');
  }

  try {
    return infographicSchema.parse(parsed);
  } catch (error) {
    logger.warn({ err: error }, 'Gemini infographic JSON failed validation');
    throw new Error('Gemini failed to produce infographic JSON');
  }
}

export async function generateImageForSlide(
  slide: SlideDefinition,
  companyName: string,
): Promise<GeneratedSlideImage | null> {
  const summary = slide.bullets.slice(0, 3).join('; ');
  const prompt = `Create a clean modern illustration for a B2B SaaS investor slide deck.
Company: ${companyName}.
Slide title: "${slide.title}".
This slide is about: ${summary}.
Use a minimal business style, isometric or flat vector, with blue accents.
No text in the image, no logos, no faces, no sensitive content.`;

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
      },
    });

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!imageBytes) {
      logger.warn({ slideTitle: slide.title }, 'Gemini image generation returned no data');
      return null;
    }

    return {
      buffer: Buffer.from(imageBytes, 'base64'),
      mimeType: 'image/png',
    };
  } catch (error) {
    logger.warn({ err: error, slideTitle: slide.title }, 'Gemini image generation failed');
    return null;
  }
}

