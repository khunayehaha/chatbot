/**
 * ทดสอบ Cloudflare Workers LINE Bot
 */

// ทดสอบข้อความต่างๆ
const testMessages = [
  // ข้อความเกี่ยวกับคดี (ควรตอบกลับ)
  {
    text: 'รายงานการยึดทรัพย์ ลว 29.7.2568 คดีหมายเลขแดง ผบ 13/2567 ศาลจังหวัดบุรีรัมย์',
    expected: 'shouldProcess: true'
  },
  {
    text: 'คดี 123/2566 ศาลจังหวัดกรุงเทพฯ ลูกหนี้ นายสมชาย ใจดี จำนวน 500,000 บาท',
    expected: 'shouldProcess: true'
  },
  {
    text: 'ชำระหนี้แล้ว หมายเลขคดี 456/2567 ศาลแขวงบางแค',
    expected: 'shouldProcess: true'
  },
  
  // ข้อความทั่วไป (ควรเงียบ)
  {
    text: 'สวัสดีค่ะ',
    expected: 'shouldProcess: false (silent)'
  },
  {
    text: 'อากาศร้อนมากเลย',
    expected: 'shouldProcess: false (silent)'
  },
  {
    text: 'กินข้าวกันไหม',
    expected: 'shouldProcess: false (silent)'
  }
];

// สร้าง event object จำลอง
function createMockEvent(text) {
  return {
    message: {
      text: text
    },
    source: {
      userId: 'test_user',
      groupId: 'test_group'
    }
  };
}

// ทดสอบฟังก์ชัน classifyMessage
function testClassifyMessage() {
  console.log('=== ทดสอบ classifyMessage ===\n');
  
  for (let i = 0; i < testMessages.length; i++) {
    const test = testMessages[i];
    const messageType = classifyMessage(test.text);
    
    console.log(`ข้อความ ${i + 1}: "${test.text}"`);
    console.log(`ผลลัพธ์: messageType = ${messageType}`);
    console.log(`คาดหวัง: ${test.expected}`);
    
    if (messageType === 'legal_case') {
      console.log('✅ จะตอบกลับและบันทึกข้อมูล');
    } else {
      console.log('🔇 จะเงียบ (ไม่ตอบกลับ)');
    }
    
    console.log('---');
  }
}

// ทดสอบฟังก์ชัน analyzeText
function testAnalyzeText() {
  console.log('\n=== ทดสอบ analyzeText ===\n');
  
  const testText = 'คดี 123/2566 ศาลจังหวัดกรุงเทพฯ ลูกหนี้ นายสมชาย ใจดี จำนวน 500,000 บาท';
  const analysis = analyzeText(testText);
  
  console.log(`ข้อความ: "${testText}"`);
  console.log('ผลการวิเคราะห์:');
  console.log(`  ศาล: ${analysis.court}`);
  console.log(`  คดี: ${analysis.caseNumber}`);
  console.log(`  ลูกหนี้: ${analysis.debtor}`);
  console.log(`  จำนวน: ${analysis.amount}`);
  console.log(`  สถานะ: ${analysis.status}`);
  console.log(`  ความน่าเชื่อถือ: ${analysis.confidence}%`);
  console.log(`  คำสำคัญ: ${analysis.keywords.join(', ')}`);
}

// ทดสอบฟังก์ชัน getThaiTimestamp
function testThaiTimestamp() {
  console.log('\n=== ทดสอบ getThaiTimestamp ===\n');
  
  const timestamp = getThaiTimestamp();
  console.log(`Timestamp: ${timestamp}`);
  
  // แปลงเป็นเวลาที่อ่านได้
  const date = new Date(timestamp);
  const thaiTime = new Date(date.getTime() + (7 * 60 * 60 * 1000));
  
  const day = String(thaiTime.getUTCDate()).padStart(2, '0');
  const month = String(thaiTime.getUTCMonth() + 1).padStart(2, '0');
  const year = thaiTime.getUTCFullYear();
  const hours = String(thaiTime.getUTCHours()).padStart(2, '0');
  const minutes = String(thaiTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(thaiTime.getUTCSeconds()).padStart(2, '0');
  
  const formattedTime = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  console.log(`เวลาไทย: ${formattedTime}`);
}

// ทดสอบการสร้าง mock environment
function testMockEnvironment() {
  console.log('\n=== ทดสอบ Mock Environment ===\n');
  
  const mockEnv = {
    LINE_CHANNEL_SECRET: 'test_secret',
    LINE_CHANNEL_ACCESS_TOKEN: 'test_token',
    GOOGLE_SHEETS_API_KEY: 'test_api_key',
    GOOGLE_SHEETS_SPREADSHEET_ID: 'test_spreadsheet_id'
  };
  
  console.log('Mock Environment:');
  console.log(`  LINE_CHANNEL_SECRET: ${mockEnv.LINE_CHANNEL_SECRET ? 'SET' : 'NOT SET'}`);
  console.log(`  LINE_CHANNEL_ACCESS_TOKEN: ${mockEnv.LINE_CHANNEL_ACCESS_TOKEN ? 'SET' : 'NOT SET'}`);
  console.log(`  GOOGLE_SHEETS_API_KEY: ${mockEnv.GOOGLE_SHEETS_API_KEY ? 'SET' : 'NOT SET'}`);
  console.log(`  GOOGLE_SHEETS_SPREADSHEET_ID: ${mockEnv.GOOGLE_SHEETS_SPREADSHEET_ID ? 'SET' : 'NOT SET'}`);
}

// รันการทดสอบทั้งหมด
function runAllTests() {
  console.log('🧪 ทดสอบ Cloudflare Workers LINE Bot\n');
  
  testClassifyMessage();
  testAnalyzeText();
  testThaiTimestamp();
  testMockEnvironment();
  
  console.log('\n✅ การทดสอบเสร็จสิ้น');
}

// รันการทดสอบ
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testClassifyMessage,
  testAnalyzeText,
  testThaiTimestamp,
  testMockEnvironment,
  runAllTests
};
