import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import multer from 'multer';
import AdmZip from 'adm-zip';
import { createRequire } from 'module';
import { env } from '../config/env.js';
import { logger } from '../logger.js';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

export const chatRouter = Router();

const anthropic = new Anthropic({
    apiKey: env.CLAUDE_API_KEY,
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});

const chatSchema = z.object({
    messages: z.string().transform((str) => {
        try {
            return JSON.parse(str);
        } catch {
            return [];
        }
    }),
    context: z.string().optional(),
});

chatRouter.post('/chat', upload.array('files'), async (req, res) => {
    try {
        const { messages: rawMessages, context: initialContext } = chatSchema.parse(req.body);
        let context = initialContext || '';
        const files = (req.files as Express.Multer.File[]) || [];

        // Process files
        const imageBlocks: Anthropic.ImageBlockParam[] = [];

        for (const file of files) {
            if (file.mimetype.startsWith('image/')) {
                // Handle images (png, jpeg, gif, webp)
                const base64Image = file.buffer.toString('base64');
                let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';

                if (file.mimetype === 'image/png') mediaType = 'image/png';
                else if (file.mimetype === 'image/gif') mediaType = 'image/gif';
                else if (file.mimetype === 'image/webp') mediaType = 'image/webp';

                imageBlocks.push({
                    type: 'image',
                    source: {
                        type: 'base64',
                        media_type: mediaType,
                        data: base64Image,
                    },
                });
            } else if (file.mimetype === 'application/pdf') {
                // Handle PDF
                try {
                    const data = await (pdf as any)(file.buffer);
                    context += `\n\n[Attached PDF: ${file.originalname}]\n${data.text.slice(0, 20000)}`; // Limit text length
                } catch (e) {
                    logger.error({ err: e }, `Failed to parse PDF ${file.originalname}`);
                    context += `\n\n[Attached PDF: ${file.originalname}] (Could not extract text)`;
                }
            } else if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed') {
                // Handle ZIP
                try {
                    const zip = new AdmZip(file.buffer);
                    const zipEntries = zip.getEntries();
                    context += `\n\n[Attached ZIP: ${file.originalname}]`;

                    for (const entry of zipEntries) {
                        if (!entry.isDirectory && !entry.entryName.match(/\.(jpg|jpeg|png|gif|webp|exe|dll)$/i)) {
                            const text = entry.getData().toString('utf8');
                            context += `\n--- File: ${entry.entryName} ---\n${text.slice(0, 5000)}`;
                        }
                    }
                } catch (e) {
                    logger.error({ err: e }, `Failed to parse ZIP ${file.originalname}`);
                    context += `\n\n[Attached ZIP: ${file.originalname}] (Could not extract contents)`;
                }
            } else {
                // Handle text files
                try {
                    const text = file.buffer.toString('utf8');
                    context += `\n\n[Attached File: ${file.originalname}]\n${text.slice(0, 10000)}`;
                } catch (e) {
                    context += `\n\n[Attached File: ${file.originalname}] (Could not read text)`;
                }
            }
        }

        // Construct messages for Anthropic
        const apiMessages: Anthropic.MessageParam[] = rawMessages.map((m: any) => ({
            role: m.role,
            content: m.content,
        }));

        // If there are images, attach them to the last user message
        if (imageBlocks.length > 0) {
            const lastMessage = apiMessages[apiMessages.length - 1];
            if (lastMessage && lastMessage.role === 'user') {
                if (typeof lastMessage.content === 'string') {
                    lastMessage.content = [
                        ...imageBlocks,
                        { type: 'text', text: lastMessage.content }
                    ];
                } else if (Array.isArray(lastMessage.content)) {
                    lastMessage.content = [...imageBlocks, ...lastMessage.content];
                }
            }
        }

        const systemPrompt = `You are Zerpha AI, an intelligent assistant for the Zerpha market analysis platform. 
    You help users navigate the dashboard, explain metrics like 'Acquisition Fit Score', and provide insights on companies.

    ${context
                ? `CONTEXT AND FILES:\n${context}\n\nIMPORTANT:\n- The user has provided files, documents, images, or data above.\n- You HAVE ACCESS to these files and their content.\n- Use this information to answer the user's questions.\n- For images: Analyze them carefully and describe what you see.\n- For PDFs/documents: Use the extracted text to answer questions.\n- NEVER say you cannot see or access the files - you have them in the context above.`
                : `The user is currently in the general workspace or search view.`}

    SAAS VALUATION KNOWLEDGE BASE:
    When evaluating acquisition fit or advising on whether a company is a good acquisition target, use these industry benchmarks:

    KEY SAAS METRICS FOR VALUATION:
    1. CHURN RATE (Critical):
       - SMB-focused SaaS: 2.5-5% monthly (30-60% annual) is acceptable
       - Mid-market ($10k-$250k ACV): 1-2% monthly (12-24% annual)
       - Enterprise ($250k+ ACV): ~1% monthly (~12% annual)
       - Lower churn = higher valuation multiple

    2. LTV/CAC RATIO (Customer Economics):
       - Healthy ratio: 3:1 or higher
       - Excellent: 4:1 or above
       - Warning sign: Below 3:1 suggests inefficient growth
       - CAC payback period should be <12 months ideally

    3. GROSS MARGINS:
       - Target: 70-80%+ for SaaS
       - 70-80% gross margin → 5.9x revenue multiple
       - 80%+ gross margin → 6.9x revenue multiple

    4. RULE OF 40:
       - Add: Revenue Growth Rate (%) + Profit Margin (%)
       - Healthy SaaS: Should exceed 40
       - Example: 30% growth + 15% margin = 45 (Good)

    5. MRR/ARR GROWTH:
       - Strong growth: 20%+ YoY for mature companies
       - High-growth: 50%+ YoY for earlier stage
       - Consistent momentum is more valuable than spikes

    6. CUSTOMER CONCENTRATION RISK:
       - No single customer should represent >10-15% of revenue
       - High concentration significantly reduces valuation

    VALUATION MULTIPLES (2024):
    - Small SaaS (<$1M ARR): 2-4x ARR
    - Mid-market ($1M-$10M ARR): 4-8x ARR
    - Growth SaaS ($10M+ ARR): 6-12x ARR
    - Top-tier metrics can command 15x+ ARR

    ACQUISITION FIT ANALYSIS FRAMEWORK:
    When asked "Is this a good acquisition?" or "Should we acquire this company?", evaluate:
    
    ✓ STRENGTHS TO LOOK FOR:
    - Churn <3% monthly, strong retention
    - LTV/CAC ratio >3:1
    - Gross margins >75%
    - Rule of 40 score >40
    - Diversified customer base
    - Proven growth trajectory
    - Strong product-market fit

    ✗ RED FLAGS:
    - High churn (>5% monthly for SMB)
    - Poor unit economics (LTV/CAC <2:1)
    - Customer concentration
    - Declining growth rate
    - Low gross margins (<65%)
    - High CAC payback (>18 months)

    When analyzing a company, compare its metrics to these benchmarks and provide actionable insights on acquisition attractiveness.

    DATA EXTRACTION CAPABILITIES:
    If the user asks to "add this company", "save this person", or "extract data" from the provided text/files, you MUST output a JSON block at the end of your response.
    
    Format for adding a company:
    \`\`\`json
    {
      "action": "create_company",
      "data": {
        "name": "Company Name",
        "domain": "example.com",
        "description": "Brief summary...",
        "headquarters": "City, Country",
        "linkedin_url": "https://linkedin.com/company/..."
      }
    }
    \`\`\`

    Format for adding a person:
    \`\`\`json
    {
      "action": "create_person",
      "data": {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "role": "CEO",
        "linkedin_url": "https://linkedin.com/in/..."
      }
    }
    \`\`\`

    Only output this JSON if the user explicitly asks to save/add data. Otherwise, just answer normally.
    
    Keep your responses concise, professional, and helpful.`;

        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1024,
            system: systemPrompt,
            messages: apiMessages,
        });

        const content = response.content[0].type === 'text' ? response.content[0].text : '';

        res.json({ content });
    } catch (error) {
        logger.error({ err: error }, 'Chat API Error:');
        res.status(500).json({ error: 'Failed to process chat request' });
    }
});
