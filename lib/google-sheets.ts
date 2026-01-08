import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import type { IscritoRecord } from '@/pages/api/mercadopago/webhook/types';

// List of invalid registration IDs to skip when inserting to sheets
const INVALID_IDS = [
  '10',
];

// Cached auth client to avoid re-initializing on each request
let authClient: JWT | null = null;

/**
 * Initializes and returns a cached JWT auth client for Google Sheets API
 * Uses service account credentials from environment variable
 */
function getAuthClient(): JWT {
  if (authClient) {
    return authClient;
  }

  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credentialsJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON environment variable not configured');
  }

  let credentials;
  try {
    credentials = JSON.parse(credentialsJson);
  } catch (error) {
    throw new Error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON: Invalid JSON');
  }

  authClient = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return authClient;
}

/**
 * Returns an authenticated Google Sheets API client
 */
function getSheetsClient() {
  const auth = getAuthClient();
  return google.sheets({ version: 'v4', auth });
}

/**
 * Formats registration data into rows for Google Sheets
 * Creates one row per participant with all their details
 * @param inscrito - Registration record from database
 * @returns Array of row arrays (one per participant)
 */
function formatRegistrationForSheet(inscrito: IscritoRecord): string[][] {
  const { id, metadata } = inscrito;

  // Check if ID is in the invalid list
  if (INVALID_IDS.includes(`${id}`)) {
    console.warn(`Registration ${id} is in invalid list, skipping`);
    return [];
  }

  // Defensive check: ensure metadata and people exist
  if (!metadata || !metadata.people || !Array.isArray(metadata.people)) {
    console.warn(`Registration ${id} has invalid metadata structure, skipping`);
    return [];
  }

  const { people } = metadata;

  // Helper function to translate modality to Portuguese
  const translateModality = (modality: string): string => {
    if (modality === 'run') return 'Corrida';
    if (modality === 'walk') return 'Caminhada';
    return modality; // fallback to original value
  };

  return people.map((person) => [
    id, // ID (Registration ID)
    person.nome, // Name (Participant Name)
    person.cpf, // CPF
    person.gender, // Gender
    person.shirtSize, // Shirt Size
    translateModality(person.modalidade), // Modality (Corrida/Caminhada)
    (person as any).price || metadata.price || 0, // Price Paid (as number)
    (person as any).isElderly || false, // Is Elderly (boolean for checkbox)
  ]);
}

/**
 * Fetches existing CPFs for a given registration ID to detect duplicates
 * @param registrationId - The registration ID to check
 * @returns Set of CPFs that already exist in the sheet for this registration
 */
async function getExistingCpfsForRegistration(registrationId: string): Promise<Set<string>> {
  try {
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    if (!spreadsheetId) {
      console.warn('SPREADSHEET_ID not configured, skipping duplicate check');
      return new Set();
    }

    // Fetch columns A-C (ID, Name, CPF)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A:C',
    });

    const rows = response.data.values || [];
    const existingCpfs = new Set<string>();

    // Skip header row (index 0) and find matching registration IDs
    rows.slice(1).forEach((row) => {
      if (row[0] === registrationId && row[2]) {
        existingCpfs.add(row[2]); // Column C = CPF
      }
    });

    return existingCpfs;
  } catch (error) {
    console.error('Error checking for existing registrations:', error);
    // Return empty set on error to allow append (fail-open)
    return new Set();
  }
}

/**
 * Main function to append registration data to Google Sheet
 * - Checks for duplicates before appending
 * - Appends one row per participant
 * - Non-blocking: logs errors but doesn't throw
 *
 * @param inscrito - Registration record from database
 */
export async function appendRegistrationToSheet(inscrito: IscritoRecord): Promise<void> {
  // Check if credentials are configured
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    console.warn('Google Sheets integration not configured (missing GOOGLE_SERVICE_ACCOUNT_JSON)');
    return;
  }

  if (!process.env.SPREADSHEET_ID) {
    console.warn('Google Sheets integration not configured (missing SPREADSHEET_ID)');
    return;
  }

  try {
    // Check for duplicates
    const existingCpfs = await getExistingCpfsForRegistration(inscrito.id);

    // Format all participants as rows
    const allRows = formatRegistrationForSheet(inscrito);

    // Filter out participants that already exist
    const newRows = allRows.filter((row) => {
      const cpf = row[2]; // CPF is at index 2 (column C)
      return !existingCpfs.has(cpf);
    });

    if (newRows.length === 0) {
      console.log(`All participants already exist in sheet, skipping: ${inscrito.id}`);
      return;
    }

    // Append new rows to the sheet
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID!;

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'A:H', // Columns A through H
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: newRows,
      },
    });

    console.log(`✓ Added ${newRows.length} participant(s) to Google Sheet for registration ${inscrito.id}`);
  } catch (error) {
    console.error('Error appending to Google Sheet:', error);
    // Don't throw - this is a non-blocking operation
  }
}

/**
 * Clears all data rows from the sheet (keeps header row)
 * @throws Error if clearing fails
 */
export async function clearSheetData(): Promise<void> {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON environment variable not configured');
  }

  if (!process.env.SPREADSHEET_ID) {
    throw new Error('SPREADSHEET_ID environment variable not configured');
  }

  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  // First, get the sheet to find out how many rows exist
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'A:H',
  });

  const rows = response.data.values || [];

  // If there are more than 1 row (header + data), clear data rows
  if (rows.length > 1) {
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `A2:H${rows.length}`, // Clear from row 2 to the last row
    });
    console.log(`✓ Cleared ${rows.length - 1} data rows from sheet`);
  } else {
    console.log('Sheet is already empty (only headers present)');
  }
}

/**
 * Populates the sheet with all registration data in bulk
 * @param inscritos - Array of registration records
 * @returns Number of participants added
 */
export async function bulkPopulateSheet(inscritos: IscritoRecord[]): Promise<number> {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON environment variable not configured');
  }

  if (!process.env.SPREADSHEET_ID) {
    throw new Error('SPREADSHEET_ID environment variable not configured');
  }

  // Format all registrations into rows
  const allRows: string[][] = [];
  let skippedCount = 0;

  for (const inscrito of inscritos) {
    const rows = formatRegistrationForSheet(inscrito);
    if (rows.length === 0) {
      skippedCount++;
    } else {
      allRows.push(...rows);
    }
  }

  if (skippedCount > 0) {
    console.warn(`⚠ Skipped ${skippedCount} registrations with invalid metadata`);
  }

  if (allRows.length === 0) {
    console.log('No valid data to populate');
    return 0;
  }

  // Bulk append all rows at once
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'A:H',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: allRows,
    },
  });

  console.log(`✓ Populated sheet with ${allRows.length} participants from ${inscritos.length - skippedCount} valid registrations`);
  return allRows.length;
}
