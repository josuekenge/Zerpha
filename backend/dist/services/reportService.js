import { supabase } from '../config/supabase.js';
import { companyExtractionSchema } from './extractionService.js';
import { generateGeminiInfographicFromCompanyJson, } from './geminiService.js';
import { logger } from '../logger.js';
export async function generateInfographicForCompany(companyId, userId) {
    logger.info({ companyId }, 'Starting infographic generation');
    const { data: company, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .eq('user_id', userId)
        .maybeSingle();
    if (error) {
        logger.error({ err: error, companyId }, 'Failed to load company for infographic');
        throw new Error('Failed to load company for infographic');
    }
    if (!company) {
        logger.warn({ companyId }, 'Company not found for infographic');
        throw new Error('Company not found for infographic');
    }
    const status = company.status ?? null;
    if (status && status !== 'success') {
        throw new Error('Company data is not ready for infographic generation');
    }
    const companyData = companyExtractionSchema.parse(company.raw_json);
    let infographic = null;
    let lastError;
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            infographic = await generateGeminiInfographicFromCompanyJson(companyData);
            logger.info({ companyId }, 'Infographic generation completed');
            break;
        }
        catch (error) {
            lastError = error;
            logger.warn({ companyId, attempt, err: error }, 'Infographic generation attempt failed');
            if (attempt === maxAttempts) {
                throw error instanceof Error ? error : new Error('Failed to generate infographic');
            }
        }
    }
    if (!infographic) {
        logger.error({ companyId, err: lastError }, 'Infographic generation failed after retries');
        throw lastError instanceof Error ? lastError : new Error('Failed to generate infographic');
    }
    return {
        companyId,
        infographic,
    };
}
