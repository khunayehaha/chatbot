/**
 * ทดสอบพฤติกรรมเงียบของบอท
 */

const { processMessage } = require('./services/messageProcessor');

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
  },
  {
    text: 'ทำงานหนักมาก',
    expected: 'shouldProcess: false (silent)'
  },
  {
    text: 'ขอบคุณค่ะ',
    expected: 'shouldProcess: false (silent)'
  },
  
  // คำสั่ง (ควรเงียบ)
  {
    text: 'ช่วย',
    expected: 'shouldProcess: false (silent)'
  },
  {
    text: 'help',
    expected: 'shouldProcess: false (silent)'
  },
  {
    text: 'สวัสดีครับ',
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

// ทดสอบข้อความ
async function runSilentModeTest() {
  console.log('=== ทดสอบพฤติกรรมเงียบของบอท ===\n');
  
  for (let i = 0; i < testMessages.length; i++) {
    const test = testMessages[i];
    const mockEvent = createMockEvent(test.text);
    
    try {
      const result = await processMessage(mockEvent);
      
      console.log(`ข้อความ ${i + 1}: "${test.text}"`);
      console.log(`ผลลัพธ์: shouldProcess = ${result.shouldProcess}, messageType = ${result.messageType}`);
      console.log(`คาดหวัง: ${test.expected}`);
      
      if (result.shouldProcess) {
        console.log('✅ จะตอบกลับและบันทึกข้อมูล');
        if (result.court) console.log(`   ศาล: ${result.court}`);
        if (result.caseNumber) console.log(`   คดี: ${result.caseNumber}`);
        if (result.debtor) console.log(`   ลูกหนี้: ${result.debtor}`);
        if (result.amount) console.log(`   จำนวน: ${result.amount}`);
        if (result.status) console.log(`   สถานะ: ${result.status}`);
      } else {
        console.log('🔇 จะเงียบ (ไม่ตอบกลับ)');
      }
      
      console.log('---');
      
    } catch (error) {
      console.log(`ข้อความ ${i + 1}: "${test.text}"`);
      console.log(`❌ เกิดข้อผิดพลาด: ${error.message}`);
      console.log('---');
    }
  }
}

// รันการทดสอบ
if (require.main === module) {
  runSilentModeTest();
}

module.exports = {
  runSilentModeTest
};
