import { supabase } from '../config/supabase.js';
import { companyExtractionSchema } from './extractionService.js';
import {
  generateGeminiInfographicFromCompanyJson,
  type InfographicPage,
} from './geminiService.js';
import { logger } from '../logger.js';

export interface InfographicReportResult {
  companyId: string;
  infographic: InfographicPage;
}

export async function generateInfographicForCompany(
  companyId: string,
): Promise<InfographicReportResult> {
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

  const status = (company as { status?: string | null }).status ?? null;
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

