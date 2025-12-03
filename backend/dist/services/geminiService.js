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
        .array(z.object({
        title: z.string().min(1),
        bullets: z.array(z.string().min(1)).min(3).max(6),
    }))
        .min(1),
});
export const infographicSchema = z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1),
    key_metrics: z
        .array(z.object({
        label: z.string().min(1),
        value: z.string().min(1),
    }))
        .min(3)
        .max(6),
    bullets: z.array(z.string().min(1)).min(4).max(8),
});
function sanitizeText(raw) {
    if (!raw)
        return '';
    if (typeof raw === 'function') {
        try {
            return sanitizeText(raw());
        }
        catch {
            return '';
        }
    }
    return raw.replace(/```json/gi, '').replace(/```/g, '').trim();
}
function cleanGeminiJson(raw) {
    let text = raw.trim();
    if (text.startsWith('```json')) {
        text = text.slice(7).trimStart();
        if (text.endsWith('```')) {
            text = text.slice(0, -3);
        }
    }
    else if (text.startsWith('```')) {
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
function parseSlideDefinition(text) {
    const cleaned = cleanGeminiJson(text);
    let parsed;
    try {
        parsed = JSON.parse(cleaned);
    }
    catch (error) {
        const preview = cleaned.slice(0, 200);
        logger.warn({ err: error, preview }, 'Failed to parse Gemini slide JSON');
        throw error;
    }
    try {
        return slideDefinitionSchema.parse(parsed);
    }
    catch (error) {
        logger.warn({ err: error }, 'Gemini slide JSON failed validation');
        throw error;
    }
}
function sanitizeCompanyJson(input, maxLength = 800) {
    if (Array.isArray(input)) {
        return input
            .map((item) => sanitizeCompanyJson(item, maxLength))
            .filter((item) => item !== null && item !== undefined);
    }
    if (input && typeof input === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(input)) {
            const sanitizedValue = sanitizeCompanyJson(value, maxLength);
            if (sanitizedValue !== null && sanitizedValue !== undefined && sanitizedValue !== '') {
                result[key] = sanitizedValue;
            }
        }
        return result;
    }
    if (typeof input === 'string') {
        const trimmed = input.trim();
        if (!trimmed) {
            return null;
        }
        return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength)}…` : trimmed;
    }
    if (typeof input === 'number' || typeof input === 'boolean') {
        return input;
    }
    return null;
}
async function callGemini(prompt) {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
    });
    return sanitizeText(response.text);
}
function isProviderUnavailableError(error) {
    if (!error || typeof error !== 'object') {
        return false;
    }
    const candidate = error;
    return candidate.code === 503 || candidate.status === 'UNAVAILABLE';
}
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function callGeminiInfographicWithRetry(prompt) {
    let lastError;
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
        }
        catch (error) {
            lastError = error;
            if (isProviderUnavailableError(error)) {
                logger.warn({ attempt, err: error }, 'Gemini infographic provider unavailable; retrying');
                if (attempt === INFOGRAPHIC_MAX_ATTEMPTS) {
                    logger.error({ err: error }, 'Gemini infographic provider unavailable after retries');
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
function buildSlideDeckPrompt(companyJson, attempt) {
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
const INFOGRAPHIC_PROMPT = `
You are an M&A presentation assistant. You must output ONE valid JSON object that matches this schema exactly:
{
  "title": string,
  "subtitle": string,
  "key_metrics": [
    { "label": string, "value": string },
    ...
  ],
  "bullets": [
    string,
    ...
  ]
}
Rules:
- Output JSON only. No prose, no markdown, no code fences, no comments.
- "key_metrics" must contain 3-6 entries, each with concise values suitable for a slide.
- "bullets" must contain 4-8 concise insights for M&A readers.
- Every string must be trimmed, no newlines.
- The top-level object must match the schema exactly.
- Do not include null or undefined values.

Example:
{
  "title": "Acme Health | AI Claims Optimization",
  "subtitle": "AI-driven claims automation for regional payers",
  "key_metrics": [
    { "label": "ARR", "value": "$42M" },
    { "label": "Customers", "value": "85 payers" },
    { "label": "Net Retention", "value": "128%" }
  ],
  "bullets": [
    "Specializes in automating mid-market payer claims workflows",
    "20% average reduction in administrative cost per claim",
    "Strong expansion motion across existing payers",
    "Product roadmap adds generative AI for appeals automation"
  ]
}
`;
function buildInfographicPrompt(companyJson) {
    return `${INFOGRAPHIC_PROMPT}
Company JSON:
${JSON.stringify(companyJson, null, 2)}`;
}
export async function generateGeminiSlidesFromCompanyJson(companyJson) {
    const sanitized = sanitizeCompanyJson(companyJson);
    const maxAttempts = 3;
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const prompt = buildSlideDeckPrompt(sanitized, attempt);
        try {
            const responseText = await callGemini(prompt);
            logger.debug({ attempt, responsePreview: responseText.slice(0, 200) }, '[gemini] slide raw');
            return parseSlideDefinition(responseText);
        }
        catch (error) {
            lastError = error;
            const isRetryable = error instanceof SyntaxError || error instanceof z.ZodError;
            if (!isRetryable) {
                throw error;
            }
            logger.warn({ attempt, err: error }, 'Gemini produced invalid slide deck JSON; retrying');
            if (attempt === maxAttempts) {
                break;
            }
        }
    }
    logger.warn({ attempts: maxAttempts, err: lastError }, 'Gemini failed to produce valid slide deck JSON after retries');
    throw new Error('Gemini failed to produce valid slide deck JSON');
}
export async function generateGeminiInfographicFromCompanyJson(companyJson) {
    const sanitized = sanitizeCompanyJson(companyJson);
    const prompt = buildInfographicPrompt(sanitized);
    const raw = await callGeminiInfographicWithRetry(prompt);
    logger.debug({ responsePreview: raw.slice(0, 200) }, '[gemini] infographic raw response');
    const cleaned = cleanGeminiJson(raw);
    let parsed;
    try {
        parsed = JSON.parse(cleaned);
    }
    catch (error) {
        const preview = cleaned.slice(0, 200);
        logger.warn({ err: error, preview }, 'Failed to parse Gemini infographic JSON');
        throw new Error('Gemini failed to produce infographic JSON');
    }
    try {
        const validated = infographicSchema.parse(parsed);
        logger.debug({ infographic: validated }, '[gemini] infographic parsed');
        return validated;
    }
    catch (error) {
        logger.warn({ err: error }, 'Gemini infographic JSON failed validation');
        throw new Error('Gemini failed to produce infographic JSON');
    }
}
export async function generateImageForSlide(slide, companyName) {
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
    }
    catch (error) {
        logger.warn({ err: error, slideTitle: slide.title }, 'Gemini image generation failed');
        return null;
    }
}
