import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import type { IscritoRecord } from '@/pages/api/mercadopago/webhook/types';

const INVALID_IDS = ['10'];
let authClient: JWT | null = null;

function getAuthClient(): JWT {
  if (authClient) return authClient;
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credentialsJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not configured');
  let credentials;
  try {
    credentials = JSON.parse(credentialsJson);
  } catch (error) {
    throw new Error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON');
  }
  authClient = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return authClient;
}

function getSheetsClient() {
  const auth = getAuthClient();
  return google.sheets({ version: 'v4', auth });
}

function formatRegistrationForSheet(inscrito: IscritoRecord): any[][] {
  const { id, metadata, qtt, kids } = inscrito;
  if (INVALID_IDS.includes(`${id}`)) return [];
  if (!metadata || !metadata.payer) return [];

  const { payer, totalPrice } = metadata;
  const displayQuantity = kids > 0 ? `${qtt} (+ ${kids} crianças)` : qtt;

  return [[
    id,
    payer.nome,
    payer.cpf,
    payer.email,
    payer.telefone,
    displayQuantity,
    totalPrice || 0,
  ]];
}

export async function appendRegistrationToSheet(inscrito: IscritoRecord): Promise<void> {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON || !process.env.SPREADSHEET_ID) return;
  try {
    const rows = formatRegistrationForSheet(inscrito);
    if (rows.length === 0) return;
    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID!,
      range: 'A:G',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: rows },
    });
  } catch (error) {
    console.error('Error appending to Google Sheet:', error);
  }
}

export async function clearSheetData(): Promise<void> {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON || !process.env.SPREADSHEET_ID) throw new Error('Google Sheets not configured');
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'A:G' });
  const rows = response.data.values || [];
  if (rows.length > 1) {
    await sheets.spreadsheets.values.clear({ spreadsheetId, range: `A2:G${rows.length}` });
  }
}

export async function bulkPopulateSheet(inscritos: IscritoRecord[]): Promise<number> {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON || !process.env.SPREADSHEET_ID) throw new Error('Google Sheets not configured');
  const allRows: any[][] = [];
  for (const inscrito of inscritos) {
    allRows.push(...formatRegistrationForSheet(inscrito));
  }
  if (allRows.length === 0) return 0;
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: 'A:G',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: allRows },
  });
  return allRows.length;
}
