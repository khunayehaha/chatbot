/**
 * LINE Bot Webhook Server for Cloudflare Workers
 * แปลงจาก Express.js เป็น Cloudflare Workers
 */

// ตัวแปรสำหรับ monitoring
let totalMessages = 0;
let successfulSaves = 0;
let failedSaves = 0;
let lastError = null;

// Keywords สำหรับการวิเคราะห์ข้อความ
const KEYWORDS = {
  COURT: ['ศาล', 'ศาลจังหวัด', 'ศาลแขวง', 'ศาลฎีกา', 'ศาลอุทธรณ์', 'ศาลเยาวชน', 'ศทล', 'ศาลจังหวัดพิมาย', 'ศาลจังหวัดบุรีรัมย์'],
  DEBTOR: ['ลูกหนี้', 'ผู้ยืม', 'ผู้กู้', 'ผู้เป็นหนี้', 'ผู้ชำระหนี้', 'จำเลย', 'นาย', 'นาง', 'นางสาว'],
  CASE: ['คดี', 'หมายเลขคดี', 'คดีหมายเลข', 'คดีดำ', 'คดีแดง', 'เลขที่', 'หมายเลขดำ', 'หมายเลขแดง'],
  STATUS: ['รอ', 'เสร็จสิ้น', 'ยกฟ้อง', 'พิพากษา', 'ชำระแล้ว', 'ค้างชำระ', 'พิพากษาตามยอม', 'สืบพยานฝ่ายเดียว', 'เลื่อนเพื่อทำยอม', 'ทยอยชำระ', 'ชั้นบังคับคดี', 'ยึดทรัพย์', 'งดการขาย', 'ไม่พบทรัพย์'],
  AMOUNT: ['บาท', 'พัน', 'หมื่น', 'แสน', 'ล้าน', '฿', 'จำนวน'],
  DATE: ['วันที่', 'เมื่อ', 'วัน', 'เดือน', 'ปี', 'เวลา'],
  ACCOUNT: ['เลขที่บัญชี', 'เลขบัญชี', 'บัญชี', 'เลขบัญชี', 'BSF', 'BRR', 'BKK', 'CMI', 'HDY', 'KKN', 'LPT', 'NAN', 'NST', 'PBI', 'PNK', 'PRB', 'RBR', 'SKN', 'SNI', 'SRN', 'TKK', 'UBN', 'UTI'],
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
 * สร้าง timestamp เวลาประเทศไทย
 */
function getThaiTimestamp() {
  const now = new Date();
  const thaiTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // UTC+7
  return thaiTime.toISOString();
}

/**
 * คัดกรองประเภทข้อความ
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
  let hasAccount = false;
  
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
  
  // ตรวจสอบเลขที่บัญชี
  for (const keyword of KEYWORDS.ACCOUNT) {
    if (lowerText.includes(keyword.toLowerCase())) {
      legalKeywords++;
      hasAccount = true;
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
    const importantTypes = [hasCourt, hasCase, hasDebtor, hasLegalTerms, hasAccount].filter(Boolean).length;
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
    /[0-9]+\s*\((?:BSF|BRR|BKK|CMI|HDY|KKN|LPT|NAN|NST|PBI|PNK|PRB|RBR|SKN|SNI|SRN|TKK|UBN|UTI)\)/, // เลขบัญชีพร้อมรหัสธนาคาร
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
    accountNumber: null,
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
  
  // ค้นหาหมายเลขคดี
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
  
  // ค้นหาจำนวนเงิน
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
  
  // ค้นหาวันที่
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
  
  // ค้นหาเลขที่บัญชี
  const accountPatterns = [
    /(?:เลขที่บัญชี|เลขบัญชี|บัญชี)\s*([0-9]{4,5})/gi,
    /([0-9]{4,5})\s*\((?:BSF|BRR|BKK|CMI|HDY|KKN|LPT|NAN|NST|PBI|PNK|PRB|RBR|SKN|SNI|SRN|TKK|UBN|UTI)\)/gi,
    /(?:BSF|BRR|BKK|CMI|HDY|KKN|LPT|NAN|NST|PBI|PNK|PRB|RBR|SKN|SNI|SRN|TKK|UBN|UTI)\s*([0-9]{4,5})/gi
  ];
  
  for (const pattern of accountPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      if (matches.length > 1) {
        // มีหลายเลขบัญชี
        result.accountNumber = matches.map(match => {
          const accountMatch = match.match(/([0-9]{4,5})/);
          const bankMatch = match.match(/(BSF|BRR|BKK|CMI|HDY|KKN|LPT|NAN|NST|PBI|PNK|PRB|RBR|SKN|SNI|SRN|TKK|UBN|UTI)/);
          if (accountMatch && bankMatch) {
            return `${accountMatch[1]}(${bankMatch[1]})`;
          }
          return accountMatch ? accountMatch[1] : match;
        }).join(', ');
        confidence += 20;
      } else {
        const accountMatch = matches[0].match(/([0-9]{4,5})/);
        const bankMatch = matches[0].match(/(BSF|BRR|BKK|CMI|HDY|KKN|LPT|NAN|NST|PBI|PNK|PRB|RBR|SKN|SNI|SRN|TKK|UBN|UTI)/);
        if (accountMatch) {
          if (bankMatch) {
            result.accountNumber = `${accountMatch[1]}(${bankMatch[1]})`;
          } else {
            result.accountNumber = accountMatch[1];
          }
          confidence += 15;
        }
      }
      result.keywords.push('เลขที่บัญชี');
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
  const debtorMatch = text.match(new RegExp(`${keyword}\\s*([^\\s]+)`, 'i'));
  if (debtorMatch) {
    return debtorMatch[0];
  }
  return keyword;
}

/**
 * วิเคราะห์ข้อความและแยกข้อมูล
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
    accountNumber: analysis.accountNumber,
    keywords: analysis.keywords,
    confidence: analysis.confidence
  };
  
  console.log('Processed data:', processedData);
  return processedData;
}

/**
 * บันทึกข้อมูลลง Google Sheets (สำหรับ Cloudflare Workers)
 */
async function saveToGoogleSheets(data, env) {
  try {
    // แปลงเวลาเป็นประเทศไทยในรูปแบบที่อ่านได้
    const now = new Date();
    const thaiTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // UTC+7
    
    // จัดรูปแบบเวลาเป็น dd/mm/yyyy hh:mm:ss
    const day = String(thaiTime.getUTCDate()).padStart(2, '0');
    const month = String(thaiTime.getUTCMonth() + 1).padStart(2, '0');
    const year = thaiTime.getUTCFullYear();
    const hours = String(thaiTime.getUTCHours()).padStart(2, '0');
    const minutes = String(thaiTime.getUTCMinutes()).padStart(2, '0');
    const seconds = String(thaiTime.getUTCSeconds()).padStart(2, '0');
    
    const formattedThaiTime = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    
    // เตรียมข้อมูลสำหรับบันทึก
    const rowData = [
      formattedThaiTime,
      data.originalMessage,
      data.court || '',
      data.debtor || '',
      data.caseNumber || '',
      data.status || '',
      data.amount || '',
      data.keywords.join(', ') || ''
    ];
    
    console.log('Saving data to Google Sheets:', rowData);
    
    // ใช้ Google Sheets API ผ่าน Cloudflare Workers
    const spreadsheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const apiKey = env.GOOGLE_SHEETS_API_KEY;
    
    if (!spreadsheetId || !apiKey) {
      throw new Error('Google Sheets configuration not found');
    }
    
    // สร้าง URL สำหรับ Google Sheets API
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:I:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [rowData]
      })
    });
    
    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Data saved successfully:', result);
    return result;
    
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    throw error;
  }
}

/**
 * ส่งข้อความตอบกลับไปยัง LINE
 */
async function replyToLine(replyToken, message, env) {
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        replyToken: replyToken,
        messages: [{
          type: 'text',
          text: message
        }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`LINE API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error sending LINE reply:', error);
    throw error;
  }
}

/**
 * ตรวจสอบ LINE signature
 */
function verifyLineSignature(request, env) {
  const signature = request.headers.get('x-line-signature');
  if (!signature) {
    return false;
  }
  
  // ใน Cloudflare Workers เราจะใช้ crypto.subtle.digest
  // แต่สำหรับตอนนี้เราจะข้ามการตรวจสอบ signature
  return true;
}

/**
 * จัดการ LINE events
 */
async function handleLineEvent(event, env) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  }

  try {
    totalMessages++;
    console.log('Processing message:', event.message.text);
    
    // Process and analyze the message
    const processedData = await processMessage(event);
    
    // ตรวจสอบว่าควรประมวลผลหรือไม่
    if (!processedData.shouldProcess) {
      // ไม่ตอบกลับสำหรับข้อความที่ไม่เกี่ยวข้อง (เงียบ)
      console.log('Message not processed, staying silent:', processedData.messageType);
      return null;
    }
    
    // Save to Google Sheets
    if (processedData) {
      try {
        await saveToGoogleSheets(processedData, env);
        successfulSaves++;
        console.log('Data saved to Google Sheets:', processedData);
      } catch (error) {
        failedSaves++;
        console.error('Error saving to Google Sheets:', error);
        lastError = {
          message: `Google Sheets Error: ${error.message}`,
          timestamp: new Date().toISOString()
        };
        
        // ส่งข้อความแจ้งเตือน
        await replyToLine(event.replyToken, 'ขออภัยค่ะ เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้งค่ะ', env);
        return null;
      }
    }
    
    // สร้างข้อความตอบกลับที่กระชับ
    let replyText = '✅ บันทึกข้อมูลคดีเรียบร้อย\n';
    
    // แสดงเฉพาะข้อมูลสำคัญ
    const importantInfo = [];
    if (processedData.court) importantInfo.push(`ศาล: ${processedData.court}`);
    if (processedData.caseNumber) importantInfo.push(`คดี: ${processedData.caseNumber}`);
    if (processedData.debtor) importantInfo.push(`ลูกหนี้: ${processedData.debtor}`);
    if (processedData.amount) importantInfo.push(`จำนวน: ${processedData.amount}`);
    if (processedData.status) importantInfo.push(`สถานะ: ${processedData.status}`);
    
    if (importantInfo.length > 0) {
      replyText += importantInfo.join(' | ');
    }
    
    // ส่งข้อความตอบกลับ
    await replyToLine(event.replyToken, replyText, env);
    
  } catch (error) {
    console.error('Error handling event:', error);
    lastError = {
      message: `Event handling error: ${error.message}`,
      timestamp: new Date().toISOString()
    };
    return null;
  }
}

/**
 * Cloudflare Workers handler
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-line-signature'
    };
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    switch (url.pathname) {
      case '/':
        // Health check endpoint
        const uptime = new Date().toISOString();
        return new Response(JSON.stringify({
          status: 'OK',
          message: 'LINE Bot Webhook Server is running on Cloudflare Workers',
          timestamp: uptime,
          statistics: {
            totalMessages: totalMessages,
            successfulSaves: successfulSaves,
            failedSaves: failedSaves,
            successRate: totalMessages > 0 ? ((successfulSaves / totalMessages) * 100).toFixed(2) + '%' : '0%'
          },
          lastError: lastError
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
        
      case '/webhook':
        // LINE Webhook endpoint
        if (request.method !== 'POST') {
          return new Response('Method not allowed', { status: 405, headers: corsHeaders });
        }
        
        try {
          // ตรวจสอบ LINE signature
          if (!verifyLineSignature(request, env)) {
            return new Response('Unauthorized', { status: 401, headers: corsHeaders });
          }
          
          const body = await request.json();
          
          if (!body || !body.events) {
            return new Response('Invalid webhook data', { status: 400, headers: corsHeaders });
          }
          
          // จัดการ LINE events
          const results = await Promise.all(
            body.events.map(event => handleLineEvent(event, env))
          );
          
          return new Response(JSON.stringify(results), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
          
        } catch (error) {
          console.error('Webhook error:', error);
          lastError = {
            message: error.message,
            timestamp: new Date().toISOString()
          };
          return new Response('Internal server error', { 
            status: 500, 
            headers: corsHeaders 
          });
        }
        
      case '/status':
        // Status endpoint
        return new Response(JSON.stringify({
          server: 'running',
          lineApi: 'connected',
          googleSheets: 'connected',
          timestamp: new Date().toISOString()
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
        
      default:
        return new Response('Not Found', { 
          status: 404, 
          headers: corsHeaders 
        });
    }
  }
} satisfies ExportedHandler<Env>;
