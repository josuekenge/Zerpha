/**
 * Backfill script for favicon_url column
 * 
 * This script updates all companies that have a website but no favicon_url.
 * Run with: npx tsx src/scripts/backfillFavicons.ts
 */

import { supabase } from '../config/supabase.js';
import { buildFaviconUrlFromWebsite } from '../utils/favicon.js';

const BATCH_SIZE = 100;

async function backfillFavicons() {
    console.log('🚀 Starting favicon backfill...');

    let offset = 0;
    let totalUpdated = 0;
    let totalProcessed = 0;

    while (true) {
        // Fetch companies with website but no favicon_url
        const { data: companies, error } = await supabase
            .from('companies')
            .select('id, website')
            .is('favicon_url', null)
            .not('website', 'is', null)
            .range(offset, offset + BATCH_SIZE - 1);

        if (error) {
            console.error('❌ Error fetching companies:', error.message);
            break;
        }

        if (!companies || companies.length === 0) {
            console.log('✅ No more companies to process.');
            break;
        }

        console.log(`📦 Processing batch of ${companies.length} companies (offset: ${offset})...`);

        // Update each company
        for (const company of companies) {
            totalProcessed++;
            const faviconUrl = buildFaviconUrlFromWebsite(company.website);

            if (faviconUrl) {
                const { error: updateError } = await supabase
                    .from('companies')
                    .update({ favicon_url: faviconUrl })
                    .eq('id', company.id);

                if (updateError) {
                    console.error(`  ⚠️ Failed to update company ${company.id}:`, updateError.message);
                } else {
                    totalUpdated++;
                }
            }
        }

        offset += BATCH_SIZE;

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('');
    console.log('═══════════════════════════════════════');
    console.log(`✨ Backfill complete!`);
    console.log(`   📊 Total processed: ${totalProcessed}`);
    console.log(`   ✅ Total updated: ${totalUpdated}`);
    console.log('═══════════════════════════════════════');
}

// Run the backfill
backfillFavicons()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
