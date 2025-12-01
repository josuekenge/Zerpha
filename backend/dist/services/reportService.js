import { supabase } from '../config/supabase.js';
import { companyExtractionSchema } from './extractionService.js';
import { generateGeminiInfographicFromCompanyJson, } from './geminiService.js';
import { logger } from '../logger.js';
export async function generateInfographicForCompany(companyId) {
    logger.info({ companyId }, 'Starting infographic generation');
    const { data: company, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
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
    const infographic = await generateGeminiInfographicFromCompanyJson(companyData);
    logger.info({ companyId }, 'Infographic generation completed');
    return {
        companyId,
        infographic,
    };
}
