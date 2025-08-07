/**
 * Message Processor - วิเคราะห์และแยกข้อความจาก LINE
 */

// Keywords สำหรับการวิเคราะห์ข้อความ
const KEYWORDS = {
  COURT: ['ศาล', 'ศาลจังหวัด', 'ศาลแขวง', 'ศาลฎีกา', 'ศาลอุทธรณ์', 'ศาลเยาวชน'],
  DEBTOR: ['ลูกหนี้', 'ผู้ยืม', 'ผู้กู้', 'ผู้เป็นหนี้', 'ผู้ชำระหนี้'],
  CASE: ['คดี', 'หมายเลขคดี', 'คดีหมายเลข', 'คดีดำ', 'คดีแดง'],
  STATUS: ['รอ', 'เสร็จสิ้น', 'ยกฟ้อง', 'พิพากษา', 'ชำระแล้ว', 'ค้างชำระ'],
  AMOUNT: ['บาท', 'พัน', 'หมื่น', 'แสน', 'ล้าน', '฿'],
  DATE: ['วันที่', 'เมื่อ', 'วัน', 'เดือน', 'ปี']
};

/**
 * วิเคราะห์ข้อความและแยกข้อมูล
 * @param {Object} event - LINE event object
 * @returns {Object} ข้อมูลที่วิเคราะห์แล้ว
 */
async function processMessage(event) {
  const message = event.message.text;
  const userId = event.source.userId;
  const groupId = event.source.groupId;
  const timestamp = new Date().toISOString();
  
  console.log(`Processing message from user ${userId}: ${message}`);
  
  // วิเคราะห์ข้อความ
  const analysis = analyzeText(message);
  
  // สร้างข้อมูลสำหรับบันทึก
  const processedData = {
    timestamp: timestamp,
    userId: userId,
    groupId: groupId,
    originalMessage: message,
    court: analysis.court,
    debtor: analysis.debtor,
    caseNumber: analysis.caseNumber,
    status: analysis.status,
    amount: analysis.amount,
    date: analysis.date,
    keywords: analysis.keywords,
    confidence: analysis.confidence
  };
  
  console.log('Processed data:', processedData);
  return processedData;
}

/**
 * วิเคราะห์ข้อความและแยกข้อมูล
 * @param {string} text - ข้อความที่ต้องการวิเคราะห์
 * @returns {Object} ผลการวิเคราะห์
 */
function analyzeText(text) {
  const lowerText = text.toLowerCase();
  const result = {
    court: null,
    debtor: null,
    caseNumber: null,
    status: null,
    amount: null,
    date: null,
    keywords: [],
    confidence: 0
  };
  
  let confidence = 0;
  
  // ค้นหาคำศัพท์ที่เกี่ยวข้องกับศาล
  for (const keyword of KEYWORDS.COURT) {
    if (lowerText.includes(keyword.toLowerCase())) {
      result.court = extractCourtInfo(text, keyword);
      result.keywords.push(keyword);
      confidence += 20;
      break;
    }
  }
  
  // ค้นหาคำศัพท์ที่เกี่ยวข้องกับลูกหนี้
  for (const keyword of KEYWORDS.DEBTOR) {
    if (lowerText.includes(keyword.toLowerCase())) {
      result.debtor = extractDebtorInfo(text, keyword);
      result.keywords.push(keyword);
      confidence += 15;
      break;
    }
  }
  
  // ค้นหาหมายเลขคดี
  const caseMatch = text.match(/(?:คดี|หมายเลข)\s*(?:หมายเลข)?\s*([0-9\/\-]+)/i);
  if (caseMatch) {
    result.caseNumber = caseMatch[1];
    result.keywords.push('คดี');
    confidence += 25;
  }
  
  // ค้นหาสถานะ
  for (const keyword of KEYWORDS.STATUS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      result.status = keyword;
      result.keywords.push(keyword);
      confidence += 15;
      break;
    }
  }
  
  // ค้นหาจำนวนเงิน
  const amountMatch = text.match(/([0-9,]+)\s*(?:บาท|฿|พัน|หมื่น|แสน|ล้าน)/i);
  if (amountMatch) {
    result.amount = extractAmount(text);
    confidence += 20;
  }
  
  // ค้นหาวันที่
  const dateMatch = text.match(/(?:วันที่|เมื่อ|วัน)\s*([0-9\/\-]+)/i);
  if (dateMatch) {
    result.date = dateMatch[1];
    confidence += 10;
  }
  
  result.confidence = Math.min(confidence, 100);
  return result;
}

/**
 * แยกข้อมูลศาล
 */
function extractCourtInfo(text, keyword) {
  // ค้นหาชื่อศาลที่อยู่ใกล้กับ keyword
  const courtPatterns = [
    /ศาลจังหวัด\s*([^\s]+)/i,
    /ศาลแขวง\s*([^\s]+)/i,
    /ศาล\s*([^\s]+)/i
  ];
  
  for (const pattern of courtPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return keyword;
}

/**
 * แยกข้อมูลลูกหนี้
 */
function extractDebtorInfo(text, keyword) {
  // ค้นหาชื่อลูกหนี้ที่อยู่ใกล้กับ keyword
  const debtorMatch = text.match(new RegExp(`${keyword}\\s*([^\\s]+)`, 'i'));
  if (debtorMatch) {
    return debtorMatch[0];
  }
  return keyword;
}

/**
 * แยกจำนวนเงิน
 */
function extractAmount(text) {
  const amountMatch = text.match(/([0-9,]+)\s*(?:บาท|฿|พัน|หมื่น|แสน|ล้าน)/i);
  if (amountMatch) {
    return amountMatch[0];
  }
  return null;
}

module.exports = {
  processMessage,
  analyzeText
};
