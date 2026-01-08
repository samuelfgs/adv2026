import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { clearSheetData, bulkPopulateSheet } from '@/lib/google-sheets';
import type { IscritoRecord } from './mercadopago/webhook/types';

interface PopulateSheetResponse {
  success: boolean;
  message: string;
  stats?: {
    totalRegistrations: number;
    validRegistrations: number;
    skippedRegistrations: number;
    participantsAdded: number;
  };
  error?: string;
  warnings?: string[];
}

/**
 * API endpoint to populate Google Sheet with all registration data
 * POST /api/populate-sheet
 *
 * Required body:
 * - password: Admin password (from NEXT_PUBLIC_ADMIN_PASSWORD env var)
 *
 * This endpoint will:
 * 1. Authenticate admin password
 * 2. Clear all existing data from the sheet (keeps headers)
 * 3. Fetch all registrations where email_sent = true
 * 4. Populate the sheet with all data
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PopulateSheetResponse>
) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST.',
    });
  }

  // Authenticate with admin password
  const { password } = req.body;
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error('NEXT_PUBLIC_ADMIN_PASSWORD environment variable not configured');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error',
      error: 'Admin password not configured',
    });
  }

  if (!password || password !== adminPassword) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Invalid admin password.',
    });
  }

  try {
    console.log('Starting sheet population process...');

    // Step 1: Clear existing data from sheet
    console.log('Clearing existing sheet data...');
    await clearSheetData();

    // Step 2: Fetch all registrations where email was sent
    console.log('Fetching all registrations from database...');
    const { data: inscritos, error: dbError } = await supabase
      .from('inscritos')
      .select('*')
      .eq('email_sent', true)
      .order('created_at', { ascending: true });

    if (dbError) {
      console.error('Error fetching registrations from database:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch registrations from database',
        error: dbError.message,
      });
    }

    if (!inscritos || inscritos.length === 0) {
      console.log('No registrations found with email_sent = true');
      return res.status(200).json({
        success: true,
        message: 'No registrations to populate',
        stats: {
          totalRegistrations: 0,
          validRegistrations: 0,
          skippedRegistrations: 0,
          participantsAdded: 0,
        },
      });
    }

    console.log(`Found ${inscritos.length} registrations to process`);

    // Count how many have valid metadata before processing
    const validCount = inscritos.filter((i: any) =>
      i.metadata && i.metadata.people && Array.isArray(i.metadata.people)
    ).length;
    const skippedCount = inscritos.length - validCount;

    // Step 3: Populate sheet with all data
    console.log('Populating sheet with registration data...');
    const participantsAdded = await bulkPopulateSheet(inscritos as IscritoRecord[]);

    const warnings: string[] = [];
    if (skippedCount > 0) {
      warnings.push(`${skippedCount} registration(s) skipped due to invalid or missing metadata`);
    }

    console.log('Sheet population completed successfully');
    return res.status(200).json({
      success: true,
      message: 'Sheet populated successfully',
      stats: {
        totalRegistrations: inscritos.length,
        validRegistrations: validCount,
        skippedRegistrations: skippedCount,
        participantsAdded,
      },
      ...(warnings.length > 0 && { warnings }),
    });
  } catch (error: any) {
    console.error('Error populating sheet:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to populate sheet',
      error: error.message || 'Unknown error',
    });
  }
}
