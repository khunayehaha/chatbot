# คู่มือการ Deploy LINE Bot ไปยัง Cloudflare Workers

## 🚀 ขั้นตอนการ Deploy

### 1. ติดตั้ง Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login เข้า Cloudflare

```bash
wrangler login
```

### 3. ตั้งค่า Secrets

```bash
# LINE Bot Configuration
wrangler secret put LINE_CHANNEL_SECRET
# ใส่ค่า LINE Channel Secret ของคุณ

wrangler secret put LINE_CHANNEL_ACCESS_TOKEN
# ใส่ค่า LINE Channel Access Token ของคุณ

# Google Sheets Configuration
wrangler secret put GOOGLE_SHEETS_API_KEY
# ใส่ค่า Google Sheets API Key ของคุณ

wrangler secret put GOOGLE_SHEETS_SPREADSHEET_ID
# ใส่ค่า Google Sheets Spreadsheet ID ของคุณ
```

### 4. ทดสอบในโหมด Development

```bash
cd cf-worker
npm run dev
```

### 5. Deploy ไปยัง Cloudflare Workers

```bash
npm run deploy
```

## 📋 การตั้งค่า LINE Bot

### 1. สร้าง LINE Bot

1. ไปที่ [LINE Developers Console](https://developers.line.biz/)
2. สร้าง Provider ใหม่
3. สร้าง Channel ใหม่ (Messaging API)
4. ตั้งค่า Channel Name และ Description

### 2. ตั้งค่า Webhook

1. ไปที่ Messaging API settings
2. เปิดใช้งาน "Use webhook"
3. ตั้งค่า Webhook URL: `https://your-worker.your-subdomain.workers.dev/webhook`
4. เปิดใช้งาน "Verify"

### 3. เก็บข้อมูลที่จำเป็น

- **Channel Secret**: อยู่ใน Basic settings
- **Channel Access Token**: อยู่ใน Messaging API settings

## 📊 การตั้งค่า Google Sheets

### 1. สร้าง Google Sheets API

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง Project ใหม่
3. เปิดใช้งาน Google Sheets API
4. สร้าง Service Account
5. ดาวน์โหลด JSON key file

### 2. ตั้งค่า Google Sheets

1. สร้าง Google Sheets ใหม่
2. แชร์ Google Sheets กับ Service Account email
3. เก็บ Spreadsheet ID จาก URL

### 3. เก็บข้อมูลที่จำเป็น

- **API Key**: จาก Google Cloud Console
- **Spreadsheet ID**: จาก Google Sheets URL

## 🔍 การตรวจสอบการทำงาน

### 1. ตรวจสอบ Health Check

```bash
curl https://your-worker.your-subdomain.workers.dev/
```

ควรได้ผลลัพธ์:
```json
{
  "status": "OK",
  "message": "LINE Bot Webhook Server is running on Cloudflare Workers",
  "timestamp": "2025-08-07T22:30:00.000Z",
  "statistics": {
    "totalMessages": 0,
    "successfulSaves": 0,
    "failedSaves": 0,
    "successRate": "0%"
  },
  "lastError": null
}
```

### 2. ตรวจสอบ Status

```bash
curl https://your-worker.your-subdomain.workers.dev/status
```

### 3. ทดสอบ LINE Bot

ส่งข้อความไปยัง LINE Bot:
- "คดี 123/2566 ศาลจังหวัดกรุงเทพฯ" → ควรตอบกลับ
- "สวัสดีค่ะ" → ควรเงียบ

## 🛠️ การแก้ไขปัญหา

### ปัญหา: Deploy ไม่สำเร็จ

```bash
# ตรวจสอบ login
wrangler whoami

# ตรวจสอบ project
wrangler list

# ลอง deploy อีกครั้ง
wrangler deploy
```

### ปัญหา: LINE Webhook ไม่ทำงาน

1. ตรวจสอบ Webhook URL
2. ตรวจสอบ LINE Channel Secret และ Access Token
3. ตรวจสอบ logs ใน Cloudflare Dashboard

### ปัญหา: Google Sheets ไม่บันทึก

1. ตรวจสอบ Google Sheets API Key
2. ตรวจสอบ Spreadsheet ID
3. ตรวจสอบ Service Account permissions

## 📈 การ Monitor

### Cloudflare Dashboard

1. ไปที่ [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. เลือก Workers & Pages
3. เลือก Worker ของคุณ
4. ดู Analytics และ Logs

### การดู Logs

```bash
# ดู logs ใน development
npm run dev

# ดู logs ใน production
wrangler tail
```

## 🔄 การอัพเดท

### 1. อัพเดทโค้ด

```bash
# แก้ไขโค้ดใน src/index.js
# แล้ว deploy ใหม่
npm run deploy
```

### 2. อัพเดท Secrets

```bash
# อัพเดท secret
wrangler secret put SECRET_NAME
```

### 3. อัพเดท Environment Variables

แก้ไข `wrangler.jsonc` แล้ว deploy ใหม่

## 💡 เคล็ดลับ

1. **ใช้ Development Mode** สำหรับทดสอบก่อน deploy
2. **ตรวจสอบ Logs** เมื่อมีปัญหา
3. **ใช้ Health Check** เพื่อตรวจสอบสถานะ
4. **Backup Secrets** ไว้ในที่ปลอดภัย
5. **Monitor Usage** เพื่อไม่ให้เกินขีดจำกัดฟรี

## 📞 การสนับสนุน

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [LINE Bot API Documentation](https://developers.line.biz/en/docs/messaging-api/)
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
