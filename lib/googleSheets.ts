import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export async function getGoogleSheet() {
  const doc = new GoogleSpreadsheet(
    process.env.GOOGLE_SHEET_ID!,
    serviceAccountAuth
  );
  
  await doc.loadInfo();
  return doc;
}

export async function getUserCredentials(email: string) {
  const doc = await getGoogleSheet();
  const sheet = doc.sheetsByTitle['credentials'];
  
  if (!sheet) {
    throw new Error('Sheet "credentials" not found');
  }
  
  const rows = await sheet.getRows();
  const user = rows.find((row) => row.get('email') === email);
  
  if (!user) {
    return null;
  }
  
  return {
    email: user.get('email'),
    password_hash: user.get('password'),
  };
}