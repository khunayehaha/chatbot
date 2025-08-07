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

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'LINE Bot Webhook Server is running',
    timestamp: new Date().toISOString()
  });
});

// LINE Webhook endpoint
app.post('/webhook', line.middleware(config), (req, res) => {
  console.log('Received webhook:', JSON.stringify(req.body, null, 2));
  
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error('Webhook error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
});

// Handle LINE events
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  try {
    console.log('Processing message:', event.message.text);
    
    // Process and analyze the message
    const processedData = await processMessage(event);
    
    // Save to Google Sheets
    if (processedData) {
      await saveToGoogleSheets(processedData);
      console.log('Data saved to Google Sheets:', processedData);
    }
    
    // Reply to user (optional)
    const replyMessage = {
      type: 'text',
      text: 'ได้รับข้อความของคุณแล้วครับ จะทำการบันทึกข้อมูลลงระบบ'
    };
    
    return client.replyMessage(event.replyToken, replyMessage);
    
  } catch (error) {
    console.error('Error handling event:', error);
    return Promise.resolve(null);
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LINE Bot Webhook Server is running on port ${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/`);
  console.log(`🔗 Webhook URL: http://localhost:${PORT}/webhook`);
});

module.exports = app;
