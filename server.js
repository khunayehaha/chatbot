const express = require('express');
const line = require('@line/bot-sdk');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const { processMessage } = require('./services/messageProcessor');
const { saveToGoogleSheets } = require('./services/googleSheetsService');

const app = express();
const PORT = process.env.PORT || 3000;

// LINE Bot Configuration
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

// Debug: Check environment variables
console.log('LINE_CHANNEL_ACCESS_TOKEN:', process.env.LINE_CHANNEL_ACCESS_TOKEN ? 'SET' : 'NOT SET');
console.log('LINE_CHANNEL_SECRET:', process.env.LINE_CHANNEL_SECRET ? 'SET' : 'NOT SET');
console.log('GOOGLE_SHEETS_PRIVATE_KEY:', process.env.GOOGLE_SHEETS_PRIVATE_KEY ? 'SET' : 'NOT SET');
console.log('GOOGLE_SHEETS_CLIENT_EMAIL:', process.env.GOOGLE_SHEETS_CLIENT_EMAIL ? 'SET' : 'NOT SET');
console.log('GOOGLE_SHEETS_SPREADSHEET_ID:', process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? 'SET' : 'NOT SET');

const client = new line.Client(config);

// ตัวแปรสำหรับ monitoring
let serverStartTime = new Date();
let totalMessages = 0;
let successfulSaves = 0;
let failedSaves = 0;
let lastError = null;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
  const uptime = new Date() - serverStartTime;
  const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
  const uptimeMinutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
  
  res.json({ 
    status: 'OK', 
    message: 'LINE Bot Webhook Server is running',
    timestamp: new Date().toISOString(),
    uptime: `${uptimeHours} ชั่วโมง ${uptimeMinutes} นาที`,
    statistics: {
      totalMessages: totalMessages,
      successfulSaves: successfulSaves,
      failedSaves: failedSaves,
      successRate: totalMessages > 0 ? ((successfulSaves / totalMessages) * 100).toFixed(2) + '%' : '0%'
    },
    lastError: lastError
  });
});

// Monitoring endpoint
app.get('/status', (req, res) => {
  res.json({
    server: 'running',
    lineApi: 'connected',
    googleSheets: 'connected',
    timestamp: new Date().toISOString()
  });
});

// LINE Webhook endpoint
app.post('/webhook', (req, res) => {
  console.log('Received webhook:', JSON.stringify(req.body, null, 2));
  
  // Basic validation
  if (!req.body || !req.body.events) {
    console.log('Invalid webhook data');
    return res.status(400).json({ error: 'Invalid webhook data' });
  }
  
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error('Webhook error:', err);
      lastError = {
        message: err.message,
        timestamp: new Date().toISOString()
      };
      res.status(500).json({ error: 'Internal server error' });
    });
});

// Handle LINE events
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  try {
    totalMessages++;
    console.log('Processing message:', event.message.text);
    
    // Process and analyze the message
    const processedData = await processMessage(event);
    
    // ตรวจสอบว่าควรประมวลผลหรือไม่
    if (!processedData.shouldProcess) {
      // ส่งข้อความตอบกลับตามประเภท
      let replyMessage;
      
      switch (processedData.messageType) {
        case 'command':
          replyMessage = {
            type: 'text',
            text: 'สวัสดีค่ะ! ฉันเป็นบอทสำหรับบันทึกข้อมูลการรับชำระหนี้\n\nวิธีการใช้งาน:\n- ส่งข้อความเกี่ยวกับคดี เช่น "คดี 123/2566 ศาลจังหวัดกรุงเทพฯ"\n- ข้อมูลจะถูกบันทึกลงไฟล์อัตโนมัติ'
          };
          break;
        case 'irrelevant':
          replyMessage = {
            type: 'text',
            text: 'ขออภัยค่ะ ฉันเป็นบอทสำหรับบันทึกข้อมูลคดีเท่านั้น\nกรุณาส่งข้อความเกี่ยวกับคดีหรือการชำระหนี้ค่ะ'
          };
          break;
        case 'low_confidence':
          replyMessage = {
            type: 'text',
            text: `ข้อมูลที่ส่งมาไม่ชัดเจนพอ (ความน่าเชื่อถือ: ${processedData.confidence}%)\n\nกรุณาระบุข้อมูลให้ชัดเจนขึ้น เช่น:\n- ชื่อศาล\n- หมายเลขคดี\n- ชื่อลูกหนี้\n- จำนวนเงิน\n- สถานะคดี`
          };
          break;
        default:
          replyMessage = {
            type: 'text',
            text: 'ไม่สามารถประมวลผลข้อความนี้ได้ กรุณาลองใหม่อีกครั้งค่ะ'
          };
      }
      
      try {
        return await client.replyMessage(event.replyToken, replyMessage);
      } catch (error) {
        console.log('Error sending reply message:', error);
        return Promise.resolve(null);
      }
    }
    
    // Save to Google Sheets
    if (processedData) {
      try {
        await saveToGoogleSheets(processedData);
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
        const errorMessage = {
          type: 'text',
          text: 'ขออภัยค่ะ เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้งค่ะ'
        };
        
        try {
          await client.replyMessage(event.replyToken, errorMessage);
        } catch (replyError) {
          console.log('Error sending error message:', replyError);
        }
        
        return Promise.resolve(null);
      }
    }
    
    // สร้างข้อความตอบกลับที่เหมาะสม
    let replyText = 'บันทึกข้อมูลคดีเรียบร้อยแล้วค่ะ\n\n';
    
    if (processedData.court) {
      replyText += `🏛️ ศาล: ${processedData.court}\n`;
    }
    if (processedData.caseNumber) {
      replyText += `📋 หมายเลขคดี: ${processedData.caseNumber}\n`;
    }
    if (processedData.multipleCases && processedData.multipleCases.length > 0) {
      replyText += `📋 หมายเลขคดี: ${processedData.multipleCases.join(', ')}\n`;
    }
    if (processedData.debtor) {
      replyText += `👤 ลูกหนี้: ${processedData.debtor}\n`;
    }
    if (processedData.amount) {
      replyText += `💰 จำนวนเงิน: ${processedData.amount}\n`;
    }
    if (processedData.status) {
      replyText += `📊 สถานะ: ${processedData.status}\n`;
    }
    if (processedData.date) {
      replyText += `📅 วันที่: ${processedData.date}\n`;
    }
    if (processedData.legalTerms && processedData.legalTerms.length > 0) {
      replyText += `⚖️ คำศัพท์ทางกฎหมาย: ${processedData.legalTerms.join(', ')}\n`;
    }
    
    replyText += `\nความน่าเชื่อถือ: ${processedData.confidence}%`;
    
    const replyMessage = {
      type: 'text',
      text: replyText
    };
    
    try {
      return await client.replyMessage(event.replyToken, replyMessage);
    } catch (error) {
      console.log('Error sending reply message:', error);
      return Promise.resolve(null);
    }
    
  } catch (error) {
    console.error('Error handling event:', error);
    lastError = {
      message: `Event handling error: ${error.message}`,
      timestamp: new Date().toISOString()
    };
    return Promise.resolve(null);
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  lastError = {
    message: `Server error: ${err.message}`,
    timestamp: new Date().toISOString()
  };
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LINE Bot Webhook Server is running on port ${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/`);
  console.log(`🔗 Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`📊 Status: http://localhost:${PORT}/status`);
});

module.exports = app;
