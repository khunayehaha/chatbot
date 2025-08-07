/**
 * Google Sheets Service - บันทึกข้อมูลลง Google Sheets
 */

const { google } = require('googleapis');

// Google Sheets API configuration
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

/**
 * สร้าง Google Sheets client
 */
function createGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: 'service_account',
      project_id: process.env.GOOGLE_SHEETS_PROJECT_ID,
      private_key_id: process.env.GOOGLE_SHEETS_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_SHEETS_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.GOOGLE_SHEETS_CLIENT_X509_CERT_URL
    },
    scopes: SCOPES
  });

  return google.sheets({ version: 'v4', auth });
}

/**
 * บันทึกข้อมูลลง Google Sheets
 * @param {Object} data - ข้อมูลที่ต้องการบันทึก
 */
async function saveToGoogleSheets(data) {
  try {
    const sheets = createGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    
    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID ไม่ได้ถูกตั้งค่า');
    }
    
    // เตรียมข้อมูลสำหรับบันทึก
    const rowData = [
      data.timestamp,
      data.userId || '',
      data.groupId || '',
      data.originalMessage,
      data.court || '',
      data.debtor || '',
      data.caseNumber || '',
      data.status || '',
      data.amount || '',
      data.date || '',
      data.keywords.join(', ') || '',
      data.confidence || 0
    ];
    
    console.log('Saving data to Google Sheets:', rowData);
    
    // บันทึกข้อมูลลง Google Sheets
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: 'Sheet1!A:L', // 12 columns
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [rowData]
      }
    });
    
    console.log('Data saved successfully:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    throw error;
  }
}

/**
 * สร้าง Google Sheets ใหม่ (ถ้าจำเป็น)
 */
async function createNewSpreadsheet(title = 'LINE Bot Data') {
  try {
    const sheets = createGoogleSheetsClient();
    
    const resource = {
      properties: {
        title: title
      },
      sheets: [
        {
          properties: {
            title: 'Sheet1',
            gridProperties: {
              rowCount: 1000,
              columnCount: 12
            }
          }
        }
      ]
    };
    
    const response = await sheets.spreadsheets.create({
      resource: resource
    });
    
    console.log('Created new spreadsheet:', response.data.spreadsheetId);
    return response.data.spreadsheetId;
    
  } catch (error) {
    console.error('Error creating spreadsheet:', error);
    throw error;
  }
}

/**
 * ตั้งค่า header ของ Google Sheets
 */
async function setupSheetHeaders() {
  try {
    const sheets = createGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    
    const headers = [
      'Timestamp',
      'User ID',
      'Group ID',
      'Original Message',
      'Court',
      'Debtor',
      'Case Number',
      'Status',
      'Amount',
      'Date',
      'Keywords',
      'Confidence'
    ];
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'Sheet1!A1:L1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [headers]
      }
    });
    
    console.log('Sheet headers set up successfully');
    
  } catch (error) {
    console.error('Error setting up headers:', error);
    throw error;
  }
}

/**
 * อ่านข้อมูลจาก Google Sheets
 */
async function readFromGoogleSheets(range = 'Sheet1!A:L') {
  try {
    const sheets = createGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range
    });
    
    return response.data.values;
    
  } catch (error) {
    console.error('Error reading from Google Sheets:', error);
    throw error;
  }
}

module.exports = {
  saveToGoogleSheets,
  createNewSpreadsheet,
  setupSheetHeaders,
  readFromGoogleSheets
};
