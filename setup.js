/**
 * Setup Script - ช่วยในการตั้งค่าโปรเจค LINE Bot
 */

const fs = require('fs');
const path = require('path');
const { createNewSpreadsheet, setupSheetHeaders } = require('./services/googleSheetsService');

console.log('🚀 เริ่มต้นตั้งค่า LINE Bot Webhook Server...\n');

// ตรวจสอบไฟล์ .env
function checkEnvFile() {
  console.log('📋 ตรวจสอบไฟล์ .env...');
  
  if (!fs.existsSync('.env')) {
    console.log('❌ ไม่พบไฟล์ .env');
    console.log('📝 กรุณาคัดลอกไฟล์ env.example เป็น .env และกรอกข้อมูล:');
    console.log('   cp env.example .env');
    console.log('');
    return false;
  }
  
  console.log('✅ พบไฟล์ .env');
  return true;
}

// ตรวจสอบ dependencies
function checkDependencies() {
  console.log('📦 ตรวจสอบ dependencies...');
  
  if (!fs.existsSync('package.json')) {
    console.log('❌ ไม่พบไฟล์ package.json');
    return false;
  }
  
  if (!fs.existsSync('node_modules')) {
    console.log('⚠️  ไม่พบ node_modules');
    console.log('📦 กรุณาติดตั้ง dependencies:');
    console.log('   npm install');
    console.log('');
    return false;
  }
  
  console.log('✅ Dependencies พร้อมใช้งาน');
  return true;
}

// สร้าง Google Sheets ใหม่
async function createGoogleSheets() {
  console.log('📊 สร้าง Google Sheets ใหม่...');
  
  try {
    const spreadsheetId = await createNewSpreadsheet('LINE Bot Data');
    console.log('✅ สร้าง Google Sheets สำเร็จ');
    console.log(`📋 Spreadsheet ID: ${spreadsheetId}`);
    console.log(`🔗 URL: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
    console.log('');
    console.log('📝 กรุณาอัปเดต GOOGLE_SHEET_ID ในไฟล์ .env');
    console.log('');
    return spreadsheetId;
  } catch (error) {
    console.log('❌ ไม่สามารถสร้าง Google Sheets ได้');
    console.log('💡 ตรวจสอบ Google Sheets API credentials');
    console.log('');
    return null;
  }
}

// ตั้งค่า headers ของ Google Sheets
async function setupHeaders() {
  console.log('📋 ตั้งค่า headers ของ Google Sheets...');
  
  try {
    await setupSheetHeaders();
    console.log('✅ ตั้งค่า headers สำเร็จ');
    return true;
  } catch (error) {
    console.log('❌ ไม่สามารถตั้งค่า headers ได้');
    console.log('💡 ตรวจสอบ Google Sheets ID และ credentials');
    console.log('');
    return false;
  }
}

// แสดงคำแนะนำการตั้งค่า
function showSetupInstructions() {
  console.log('📚 คำแนะนำการตั้งค่า:');
  console.log('');
  console.log('1️⃣ ตั้งค่า LINE Bot:');
  console.log('   - สร้าง LINE Bot ใน LINE Developers Console');
  console.log('   - รับ Channel Secret และ Channel Access Token');
  console.log('   - ตั้งค่า Webhook URL: https://your-domain.com/webhook');
  console.log('');
  console.log('2️⃣ ตั้งค่า Google Sheets API:');
  console.log('   - สร้าง Google Cloud Project');
  console.log('   - เปิดใช้งาน Google Sheets API');
  console.log('   - สร้าง Service Account และดาวน์โหลด JSON key');
  console.log('   - แชร์ Google Sheets กับ Service Account email');
  console.log('');
  console.log('3️⃣ ตั้งค่า Environment Variables:');
  console.log('   - แก้ไขไฟล์ .env');
  console.log('   - กรอก LINE Bot credentials');
  console.log('   - กรอก Google Sheets credentials');
  console.log('');
  console.log('4️⃣ รัน Server:');
  console.log('   npm run dev');
  console.log('');
}

// ฟังก์ชันหลัก
async function main() {
  console.log('=' * 50);
  console.log('LINE Bot Webhook Server Setup');
  console.log('=' * 50);
  console.log('');
  
  // ตรวจสอบไฟล์
  const envOk = checkEnvFile();
  const depsOk = checkDependencies();
  
  if (!envOk || !depsOk) {
    console.log('❌ การตั้งค่าไม่สมบูรณ์');
    console.log('');
    showSetupInstructions();
    return;
  }
  
  console.log('✅ การตรวจสอบเบื้องต้นเสร็จสิ้น');
  console.log('');
  
  // สร้าง Google Sheets (ถ้าจำเป็น)
  const createSheets = process.argv.includes('--create-sheets');
  if (createSheets) {
    await createGoogleSheets();
  }
  
  // ตั้งค่า headers (ถ้าจำเป็น)
  const setupHeadersFlag = process.argv.includes('--setup-headers');
  if (setupHeadersFlag) {
    await setupHeaders();
  }
  
  console.log('🎉 การตั้งค่าเสร็จสิ้น!');
  console.log('');
  console.log('🚀 รัน server:');
  console.log('   npm run dev');
  console.log('');
  console.log('📝 ตรวจสอบ server:');
  console.log('   http://localhost:3000');
  console.log('');
}

// รัน script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  checkEnvFile,
  checkDependencies,
  createGoogleSheets,
  setupHeaders
};
