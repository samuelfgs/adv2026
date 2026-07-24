import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import type { IscritoRecord } from '@/pages/api/mercadopago/webhook/types';

const INVALID_IDS = ['10', '7', '8'];
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
  const { id, name, email, telefone, metadata, qtt, kids } = inscrito;
  if (INVALID_IDS.includes(`${id}`)) return [];

  let metaObj = metadata;
  if (typeof metaObj === 'string') {
    try {
      metaObj = JSON.parse(metaObj);
    } catch {
      metaObj = undefined;
    }
  }

  const payerName = metaObj?.payer?.nome || name || '';
  const payerEmail = metaObj?.payer?.email || email || '';
  const payerPhone = metaObj?.payer?.telefone || telefone || '';
  const totalPrice = metaObj?.totalPrice ?? (qtt * 25);

  return [[
    id,
    payerName,
    payerEmail,
    payerPhone,
    qtt,
    kids,
    totalPrice || 0,
  ]];
}

export async function appendRegistrationToSheet(inscrito: IscritoRecord): Promise<void> {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON || !process.env.SPREADSHEET_ID) {
    console.warn('[GOOGLE_SHEETS] Skipping append: GOOGLE_SERVICE_ACCOUNT_JSON or SPREADSHEET_ID env var missing');
    return;
  }
  try {
    const rows = formatRegistrationForSheet(inscrito);
    if (rows.length === 0) return;
    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID!,
      range: 'Participantes!A:G',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'OVERWRITE',
      requestBody: { values: rows },
    });
    console.log(`[GOOGLE_SHEETS] Successfully appended ID ${inscrito.id} to sheet`);
  } catch (error) {
    console.error('Error appending to Google Sheet:', error);
  }
}

export async function clearSheetData(): Promise<void> {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON || !process.env.SPREADSHEET_ID) throw new Error('Google Sheets not configured');
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  
  // Clear everything in range A:G of Participantes sheet
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: 'Participantes!A:G',
  });

  // Write headers to row 1
  const headers = [['ID', 'Nome', 'Email', 'Telefone', 'Adultos', 'Criancas', 'Valor Pago']];
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Participantes!A1:G1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: headers },
  });
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
    range: 'Participantes!A:G',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'OVERWRITE',
    requestBody: { values: allRows },
  });
  return allRows.length;
}
