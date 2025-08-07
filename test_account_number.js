/**
 * ทดสอบการวิเคราะห์เลขที่บัญชี
 */

const { classifyMessage, analyzeText } = require('./services/messageProcessor');

// ตัวอย่างข้อความที่มีเลขที่บัญชี
const testMessages = [
  "รับชำระหนี้ 98 จากนายทองยวน คงเจริญ เลขบัญชี 781522(BSF) จำนวน 1,000 บาท ประเภท ติดตาม ครับ",
  "ลูกหนี้ นายสมชาย ใจดี เลขที่บัญชี 123456(BRR) ชำระแล้ว 5,000 บาท",
  "คดีนายดำ ใจดี เลขบัญชี 789012(BKK) จำนวน 2,500 บาท ศาลจังหวัดกรุงเทพฯ",
  "รับชำระหนี้จากนายแดง ใจดี เลขที่บัญชี 456789(CMI) จำนวน 3,000 บาท",
  "ลูกหนี้ นางสาวสมหญิง ใจดี เลขบัญชี 987654(HDY) ชำระแล้ว 1,500 บาท",
  "คดีหมายเลขดำที่ ผบ.123/2567 เลขที่บัญชี 111222(KKN) จำนวน 4,000 บาท",
  "รับชำระหนี้สถานะงาน 00 ชั้นบังคับคดี เลขบัญชี 333444(LPT) จำนวน 6,000 บาท"
];

console.log('🏦 ทดสอบการวิเคราะห์เลขที่บัญชี\n');

testMessages.forEach((message, index) => {
  console.log(`\n--- ข้อความที่ ${index + 1} ---`);
  console.log(`ข้อความ: "${message}"`);
  
  const messageType = classifyMessage(message);
  console.log(`ประเภท: ${messageType}`);
  
  if (messageType === 'legal_case') {
    const analysis = analyzeText(message);
    console.log(`ความน่าเชื่อถือ: ${analysis.confidence}%`);
    console.log(`คำสำคัญ: ${analysis.keywords.join(', ')}`);
    
    if (analysis.court) console.log(`🏛️ ศาล: ${analysis.court}`);
    if (analysis.caseNumber) console.log(`📋 หมายเลขคดี: ${analysis.caseNumber}`);
    if (analysis.multipleCases && analysis.multipleCases.length > 0) {
      console.log(`📋 หมายเลขคดีหลายรายการ: ${analysis.multipleCases.join(', ')}`);
    }
    if (analysis.debtor) console.log(`👤 ลูกหนี้: ${analysis.debtor}`);
    if (analysis.accountNumber) console.log(`🏦 เลขที่บัญชี: ${analysis.accountNumber}`);
    if (analysis.amount) console.log(`💰 จำนวนเงิน: ${analysis.amount}`);
    if (analysis.status) console.log(`📊 สถานะ: ${analysis.status}`);
    if (analysis.date) console.log(`📅 วันที่: ${analysis.date}`);
    if (analysis.legalTerms && analysis.legalTerms.length > 0) {
      console.log(`⚖️ คำศัพท์ทางกฎหมาย: ${analysis.legalTerms.join(', ')}`);
    }
  }
  
  console.log('---');
});

console.log('\n✅ การทดสอบเสร็จสิ้น');
