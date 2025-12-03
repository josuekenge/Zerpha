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
                ? `CONTEXT:\n${context}\n\nINSTRUCTIONS:\n- The user has provided a list of companies, specific company context, or ATTACHED FILES above.\n- Use this data to answer their questions.\n- If images are attached, analyze them to answer the user's request.\n- If documents are attached, use their content as primary source.`
                : `The user is currently in the general workspace or search view.`}

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
