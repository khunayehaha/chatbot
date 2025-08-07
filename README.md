# LINE Bot Webhook Server

LINE Bot Webhook Server สำหรับรับข้อความจาก LINE Group Chat และจัดเก็บข้อมูลลง Google Sheets พร้อมการวิเคราะห์และแยกข้อมูล

## คุณสมบัติ

- ✅ รับข้อความจาก LINE Group Chat
- ✅ วิเคราะห์และแยกข้อมูล (ศาล, ลูกหนี้, คดี, สถานะ, จำนวนเงิน, วันที่)
- ✅ บันทึกข้อมูลลง Google Sheets
- ✅ ตอบกลับข้อความอัตโนมัติ
- ✅ ระบบวิเคราะห์ความน่าเชื่อถือของข้อมูล

## การติดตั้ง

### 1. ติดตั้ง Dependencies

```bash
npm install
```

### 2. ตั้งค่า Environment Variables

คัดลอกไฟล์ `env.example` เป็น `.env` และกรอกข้อมูล:

```bash
cp env.example .env
```

แก้ไขไฟล์ `.env`:

```env
# LINE Bot Configuration
LINE_CHANNEL_SECRET=your_line_channel_secret_here
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token_here

# Google Sheets Configuration
GOOGLE_SHEETS_PROJECT_ID=your_project_id_here
GOOGLE_SHEETS_PRIVATE_KEY_ID=your_private_key_id_here
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_CLIENT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
GOOGLE_SHEETS_CLIENT_ID=your_client_id_here
GOOGLE_SHEETS_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your_service_account_email%40project.iam.gserviceaccount.com

# Google Sheets ID
GOOGLE_SHEET_ID=your_google_sheet_id_here

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. ตั้งค่า LINE Bot

1. สร้าง LINE Bot ใน [LINE Developers Console](https://developers.line.biz/)
2. รับ Channel Secret และ Channel Access Token
3. ตั้งค่า Webhook URL: `https://your-domain.com/webhook`

### 4. ตั้งค่า Google Sheets API

1. สร้าง Google Cloud Project
2. เปิดใช้งาน Google Sheets API
3. สร้าง Service Account และดาวน์โหลด JSON key file
4. แชร์ Google Sheets กับ Service Account email

### 5. รัน Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## การใช้งาน

### 1. ข้อความที่ระบบสามารถวิเคราะห์ได้

```
ศาลจังหวัดกรุงเทพมหานคร คดีหมายเลข 123/2566 ลูกหนี้ นายสมชาย จำนวน 50,000 บาท สถานะ รอพิจารณา
```

### 2. ข้อมูลที่ถูกบันทึก

- **Timestamp**: เวลาที่ได้รับข้อความ
- **User ID**: ID ของผู้ส่งข้อความ
- **Group ID**: ID ของกลุ่ม (ถ้ามี)
- **Original Message**: ข้อความต้นฉบับ
- **Court**: ข้อมูลศาล
- **Debtor**: ข้อมูลลูกหนี้
- **Case Number**: หมายเลขคดี
- **Status**: สถานะคดี
- **Amount**: จำนวนเงิน
- **Date**: วันที่
- **Keywords**: คำสำคัญที่พบ
- **Confidence**: ความน่าเชื่อถือของข้อมูล (0-100)

## โครงสร้างโปรเจค

```
line-bot-project/
├── server.js                 # Main server file
├── package.json             # Dependencies
├── env.example             # Environment variables template
├── README.md              # Documentation
└── services/
    ├── messageProcessor.js  # Message analysis service
    └── googleSheetsService.js # Google Sheets integration
```

## API Endpoints

- `GET /` - Health check
- `POST /webhook` - LINE Webhook endpoint

## การพัฒนา

### เพิ่ม Keywords ใหม่

แก้ไขไฟล์ `services/messageProcessor.js`:

```javascript
const KEYWORDS = {
  COURT: ['ศาล', 'ศาลจังหวัด', 'ศาลแขวง', 'ศาลฎีกา', 'ศาลอุทธรณ์', 'ศาลเยาวชน'],
  DEBTOR: ['ลูกหนี้', 'ผู้ยืม', 'ผู้กู้', 'ผู้เป็นหนี้', 'ผู้ชำระหนี้'],
  // เพิ่ม keywords ใหม่ที่นี่
};
```

### เพิ่มฟิลด์ใหม่

แก้ไขไฟล์ `services/googleSheetsService.js` ในฟังก์ชัน `saveToGoogleSheets`:

```javascript
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
  data.confidence || 0,
  // เพิ่มฟิลด์ใหม่ที่นี่
];
```

## การแก้ไขปัญหา

### 1. LINE Webhook ไม่ทำงาน
- ตรวจสอบ Channel Secret และ Channel Access Token
- ตรวจสอบ Webhook URL
- ตรวจสอบ SSL certificate (ต้องใช้ HTTPS)

### 2. Google Sheets ไม่บันทึกข้อมูล
- ตรวจสอบ Service Account credentials
- ตรวจสอบ Google Sheets ID
- ตรวจสอบสิทธิ์การเข้าถึง Google Sheets

### 3. Server ไม่รัน
- ตรวจสอบ PORT ไม่ถูกใช้งาน
- ตรวจสอบ Dependencies ติดตั้งครบ
- ตรวจสอบ Environment Variables

## License

ISC
