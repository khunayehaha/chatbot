/**
 * Message Processor - วิเคราะห์และแยกข้อความจาก LINE
 */

// Keywords สำหรับการวิเคราะห์ข้อความ
const KEYWORDS = {
  COURT: ['ศาล', 'ศาลจังหวัด', 'ศาลแขวง', 'ศาลฎีกา', 'ศาลอุทธรณ์', 'ศาลเยาวชน', 'ศทล', 'ศาลจังหวัดพิมาย', 'ศาลจังหวัดบุรีรัมย์'],
  DEBTOR: ['ลูกหนี้', 'ผู้ยืม', 'ผู้กู้', 'ผู้เป็นหนี้', 'ผู้ชำระหนี้', 'จำเลย', 'นาย', 'นาง', 'นางสาว'],
  CASE: ['คดี', 'หมายเลขคดี', 'คดีหมายเลข', 'คดีดำ', 'คดีแดง', 'เลขที่', 'หมายเลขดำ', 'หมายเลขแดง'],
  STATUS: ['รอ', 'เสร็จสิ้น', 'ยกฟ้อง', 'พิพากษา', 'ชำระแล้ว', 'ค้างชำระ', 'พิพากษาตามยอม', 'สืบพยานฝ่ายเดียว', 'เลื่อนเพื่อทำยอม', 'ทยอยชำระ', 'ชั้นบังคับคดี', 'ยึดทรัพย์', 'งดการขาย', 'ไม่พบทรัพย์'],
  AMOUNT: ['บาท', 'พัน', 'หมื่น', 'แสน', 'ล้าน', '฿', 'จำนวน'],
  DATE: ['วันที่', 'เมื่อ', 'วัน', 'เดือน', 'ปี', 'เวลา'],
  LEGAL_TERMS: ['รายงานคดี', 'รับชำระหนี้', 'ชั้นบังคับคดี', 'ผู้รับผิดชอบคดี', 'หมายบังคับคดี', 'ความแพ่ง', 'สถานะงาน', 'เลขที่บัญชี', 'ปิดบัญชี', 'เจรจา', 'จ่ายชำระ']
};

// คำสั่งและคำที่ไม่เกี่ยวข้อง
const COMMANDS = ['ช่วย', 'ช่วยเหลือ', 'คำสั่ง', 'command', 'help', 'สวัสดี', 'hello', 'hi', 'สวัสดีค่ะ', 'สวัสดีครับ'];
const IRRELEVANT = [
  'สวัสดี', 'ขอบคุณ', 'ขอบใจ', 'ดีใจ', 'เศร้า', 'โกรธ', 'รัก', 'เกลียด',
  'อากาศ', 'ฝน', 'ร้อน', 'เย็น', 'อาหาร', 'กิน', 'ดื่ม', 'นอน', 'เดิน',
  'รถ', 'รถยนต์', 'มอเตอร์ไซค์', 'เดินทาง', 'เที่ยว', 'พักผ่อน', 'ทำงาน',
  'เรียน', 'หนังสือ', 'เพลง', 'ดนตรี', 'ภาพยนตร์', 'ทีวี', 'โทรทัศน์',
  'มือถือ', 'คอมพิวเตอร์', 'อินเทอร์เน็ต', 'โซเชียล', 'เฟซบุ๊ก', 'ไลน์',
  'เกม', 'กีฬา', 'ฟุตบอล', 'บาสเกตบอล', 'เทนนิส', 'ว่ายน้ำ', 'วิ่ง',
  'สุขภาพ', 'ยา', 'หมอ', 'โรงพยาบาล', 'ป่วย', 'ไข้', 'ปวด', 'เจ็บ',
  'ครอบครัว', 'พ่อ', 'แม่', 'ลูก', 'พี่', 'น้อง', 'ปู่', 'ย่า', 'ตา', 'ยาย',
  'เพื่อน', 'แฟน', 'แฟนเก่า', 'แฟนใหม่', 'แต่งงาน', 'หย่า', 'แต่งงาน',
  'เงิน', 'ธนาคาร', 'บัตรเครดิต', 'กู้', 'ฝาก', 'ถอน', 'โอน', 'จ่าย',
  'ซื้อ', 'ขาย', 'ร้านค้า', 'ห้าง', 'ตลาด', 'ซูเปอร์มาร์เก็ต', 'ร้านอาหาร',
  'บ้าน', 'คอนโด', 'อพาร์ตเมนต์', 'เช่า', 'ซื้อบ้าน', 'ขายบ้าน', 'ตกแต่ง',
  'เสื้อผ้า', 'รองเท้า', 'กระเป๋า', 'เครื่องสำอาง', 'ครีม', 'ลิปสติก',
  'เครื่องดื่ม', 'กาแฟ', 'ชา', 'น้ำ', 'น้ำอัดลม', 'เบียร์', 'ไวน์',
  'ขนม', 'เค้ก', 'ไอศกรีม', 'ช็อกโกแลต', 'ลูกอม', 'หมากฝรั่ง'
];

/**
 * วิเคราะห์ข้อความและแยกข้อมูล
 * @param {Object} event - LINE event object
 * @returns {Object} ข้อมูลที่วิเคราะห์แล้ว
 */
async function processMessage(event) {
  const message = event.message.text;
  const userId = event.source.userId;
  const groupId = event.source.groupId;
  
  // สร้าง timestamp เวลาประเทศไทย
  const thaiTimestamp = getThaiTimestamp();
  
  console.log(`Processing message from user ${userId}: ${message}`);
  
  // คัดกรองประเภทข้อความ
  const messageType = classifyMessage(message);
  console.log('Message type:', messageType);
  
  // ถ้าเป็นข้อความที่ไม่เกี่ยวข้อง ให้ข้ามการประมวลผล
  if (messageType === 'irrelevant' || messageType === 'command') {
    return {
      timestamp: thaiTimestamp,
      userId: userId,
      groupId: groupId,
      originalMessage: message,
      messageType: messageType,
      shouldProcess: false,
      reason: messageType === 'irrelevant' ? 'ข้อความไม่เกี่ยวข้องกับคดี' : 'เป็นคำสั่งหรือการทักทาย'
    };
  }
  
  // วิเคราะห์ข้อความ
  const analysis = analyzeText(message);
  
  // ตรวจสอบความน่าเชื่อถือ
  if (analysis.confidence < 30) {
    return {
      timestamp: thaiTimestamp,
      userId: userId,
      groupId: groupId,
      originalMessage: message,
      messageType: 'low_confidence',
      shouldProcess: false,
      reason: 'ข้อมูลไม่เพียงพอหรือไม่ชัดเจน',
      confidence: analysis.confidence
    };
  }
  
  // สร้างข้อมูลสำหรับบันทึก
  const processedData = {
    timestamp: thaiTimestamp,
    userId: userId,
    groupId: groupId,
    originalMessage: message,
    messageType: messageType,
    shouldProcess: true,
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
 * สร้าง timestamp เวลาประเทศไทย
 * @returns {string} timestamp ในรูปแบบ ISO string เวลาประเทศไทย
 */
function getThaiTimestamp() {
  const now = new Date();
  const thaiTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // UTC+7
  return thaiTime.toISOString();
}

/**
 * คัดกรองประเภทข้อความ
 * @param {string} text - ข้อความที่ต้องการคัดกรอง
 * @returns {string} ประเภทข้อความ
 */
function classifyMessage(text) {
  const lowerText = text.toLowerCase();
  const trimmedText = text.trim();
  
  // ตรวจสอบความยาวข้อความ
  if (trimmedText.length < 3) {
    return 'irrelevant';
  }
  
  // ตรวจสอบคำสั่ง
  for (const command of COMMANDS) {
    if (lowerText.includes(command.toLowerCase())) {
      return 'command';
    }
  }
  
  // ตรวจสอบคำสำคัญที่เกี่ยวข้องกับคดีก่อน
  let legalKeywords = 0;
  let hasCourt = false;
  let hasCase = false;
  let hasDebtor = false;
  let hasLegalTerms = false;
  
  for (const keyword of KEYWORDS.COURT) {
    if (lowerText.includes(keyword.toLowerCase())) {
      legalKeywords++;
      hasCourt = true;
    }
  }
  
  for (const keyword of KEYWORDS.CASE) {
    if (lowerText.includes(keyword.toLowerCase())) {
      legalKeywords++;
      hasCase = true;
    }
  }
  
  for (const keyword of KEYWORDS.DEBTOR) {
    if (lowerText.includes(keyword.toLowerCase())) {
      legalKeywords++;
      hasDebtor = true;
    }
  }
  
  // ตรวจสอบคำศัพท์ทางกฎหมาย
  for (const keyword of KEYWORDS.LEGAL_TERMS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      legalKeywords++;
      hasLegalTerms = true;
    }
  }
  
  // ตรวจสอบคำสำคัญอื่นๆ
  for (const category of [KEYWORDS.STATUS, KEYWORDS.AMOUNT, KEYWORDS.DATE]) {
    for (const keyword of category) {
      if (lowerText.includes(keyword.toLowerCase())) {
        legalKeywords++;
      }
    }
  }
  
  // ถ้ามีคำสำคัญอย่างน้อย 1 คำ และมีข้อมูลสำคัญอย่างน้อย 1 ประเภท
  if (legalKeywords > 0) {
    const importantTypes = [hasCourt, hasCase, hasDebtor, hasLegalTerms].filter(Boolean).length;
    if (importantTypes >= 1) {
      return 'legal_case';
    } else if (legalKeywords >= 2) {
      return 'legal_case';
    }
  }
  
  // ตรวจสอบรูปแบบข้อความ
  if (isLegalCasePattern(text)) {
    return 'legal_case';
  }
  
  // ตรวจสอบข้อความที่ไม่เกี่ยวข้อง (หลังจากตรวจสอบคำสำคัญแล้ว)
  for (const irrelevant of IRRELEVANT) {
    if (lowerText.includes(irrelevant.toLowerCase())) {
      return 'irrelevant';
    }
  }
  
  return 'irrelevant';
}

/**
 * ตรวจสอบรูปแบบข้อความที่เกี่ยวข้องกับคดี
 * @param {string} text - ข้อความที่ต้องการตรวจสอบ
 * @returns {boolean} เป็นรูปแบบคดีหรือไม่
 */
function isLegalCasePattern(text) {
  const patterns = [
    /[0-9]+\/[0-9]+/, // หมายเลขคดี
    /[0-9]+[ก-ฮ]+[0-9]+/, // หมายเลขคดีแบบไทย
    /ศาล.*[0-9]/, // ศาล + ตัวเลข
    /คดี.*[0-9]/, // คดี + ตัวเลข
    /[0-9,]+.*บาท/, // จำนวนเงิน
    /ลูกหนี้.*[ก-ฮ]/, // ลูกหนี้ + ชื่อ
    /ชำระ.*[0-9]/, // ชำระ + จำนวน
    /พิพากษา.*[0-9]/, // พิพากษา + จำนวน
    /(?:ผบ|ผบ\.)\s*[0-9\/\-]+/, // รูปแบบผบ.
    /(?:คดีดำ|คดีแดง)\s*ที่\s*[0-9\/\-]+/, // คดีดำ/แดง
    /(?:หมายเลขดำ|หมายเลขแดง)\s*[0-9\/\-]+/, // หมายเลขดำ/แดง
    /(?:รายงานคดี|รับชำระหนี้|ชั้นบังคับคดี)/, // คำศัพท์ทางกฎหมาย
    /(?:จำเลย|นาย|นาง|นางสาว)\s*[ก-ฮ]+\s*[ก-ฮ]+/, // ชื่อจำเลย
    /(?:เลขที่บัญชี|บัญชี)\s*[0-9]+/, // เลขที่บัญชี
    /(?:สถานะงาน|ผู้รับผิดชอบคดี)/, // สถานะงาน
    /(?:ยึดทรัพย์|งดการขาย|ไม่พบทรัพย์)/, // สถานะทรัพย์
    /(?:พิพากษาตามยอม|สืบพยานฝ่ายเดียว|เลื่อนเพื่อทำยอม)/ // สถานะคดี
  ];
  
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      return true;
    }
  }
  
  return false;
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
    confidence: 0,
    legalTerms: [],
    multipleCases: []
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
  
  // ค้นหาหมายเลขคดี (ปรับปรุงให้รองรับรูปแบบใหม่)
  const casePatterns = [
    /(?:คดี|หมายเลขคดี|หมายเลขดำ|หมายเลขแดง)\s*(?:หมายเลข)?\s*([0-9\/\-]+)/gi,
    /(?:คดีดำ|คดีแดง)\s*ที่\s*([0-9\/\-]+)/gi,
    /(?:ผบ|ผบ\.)\s*([0-9\/\-]+)/gi,
    /(?:เลขที่|หมายเลข)\s*([0-9\/\-]+)/gi
  ];
  
  for (const pattern of casePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      if (matches.length > 1) {
        // มีหลายคดี
        result.multipleCases = matches.map(match => {
          const caseMatch = match.match(/([0-9\/\-]+)/);
          return caseMatch ? caseMatch[1] : match;
        });
        confidence += 30;
      } else {
        const caseMatch = matches[0].match(/([0-9\/\-]+)/);
        if (caseMatch) {
          result.caseNumber = caseMatch[1];
          confidence += 25;
        }
      }
      result.keywords.push('คดี');
      break;
    }
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
  
  // ค้นหาจำนวนเงิน (ปรับปรุงให้รองรับรูปแบบใหม่)
  const amountPatterns = [
    /([0-9,]+)\s*(?:บาท|฿|พัน|หมื่น|แสน|ล้าน)/gi,
    /จำนวน\s*([0-9,]+)\s*(?:บาท|฿)/gi,
    /ชำระ\s*([0-9,]+)\s*(?:บาท|฿)/gi
  ];
  
  for (const pattern of amountPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      if (matches.length > 1) {
        // มีหลายจำนวนเงิน
        result.amount = matches.map(match => {
          const amountMatch = match.match(/([0-9,]+)/);
          return amountMatch ? amountMatch[1] + ' บาท' : match;
        }).join(', ');
        confidence += 25;
      } else {
        const amountMatch = matches[0].match(/([0-9,]+)/);
        if (amountMatch) {
          result.amount = amountMatch[1] + ' บาท';
          confidence += 20;
        }
      }
      break;
    }
  }
  
  // ค้นหาวันที่ (ปรับปรุงให้รองรับรูปแบบใหม่)
  const datePatterns = [
    /(?:วันที่|เมื่อ|วัน)\s*([0-9\/\-]+)/gi,
    /เวลา\s*([0-9:]+)/gi,
    /([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/gi
  ];
  
  for (const pattern of datePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      result.date = matches.join(', ');
      confidence += 10;
      break;
    }
  }
  
  // ค้นหาคำศัพท์ทางกฎหมาย
  for (const keyword of KEYWORDS.LEGAL_TERMS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      result.legalTerms.push(keyword);
      confidence += 10;
    }
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
  analyzeText,
  classifyMessage,
  isLegalCasePattern,
  getThaiTimestamp
};
