# LINE Bot Webhook Server for Cloudflare Workers

ระบบบอทคัดกรองคำสำคัญในข้อความสำหรับ LINE Bot ที่ทำงานบน Cloudflare Workers

## ✨ ฟีเจอร์

- 🔍 **วิเคราะห์ข้อความอัจฉริยะ** - ระบุคำสำคัญเกี่ยวกับคดี การชำระหนี้
- 🔇 **โหมดเงียบ** - ไม่ตอบกลับข้อความทั่วไป
- 📊 **บันทึกข้อมูลอัตโนมัติ** - บันทึกลง Google Sheets
- ⚡ **ความเร็วสูง** - ทำงานบน Cloudflare Workers
- 💰 **ประหยัด** - ใช้แผนฟรีของ Cloudflare

## 🚀 การติดตั้ง

### 1. ติดตั้ง Dependencies

```bash
cd cf-worker
npm install
```

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` หรือใช้ Cloudflare Secrets:

```bash
# ตั้งค่า Secrets
wrangler secret put LINE_CHANNEL_SECRET
wrangler secret put LINE_CHANNEL_ACCESS_TOKEN
wrangler secret put GOOGLE_SHEETS_API_KEY
wrangler secret put GOOGLE_SHEETS_SPREADSHEET_ID
```

### 3. รันในโหมด Development

```bash
npm run dev
```

### 4. Deploy ไปยัง Cloudflare Workers

```bash
npm run deploy
```

## 📋 Environment Variables

| Variable | Description |
|----------|-------------|
| `LINE_CHANNEL_SECRET` | LINE Channel Secret |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Channel Access Token |
| `GOOGLE_SHEETS_API_KEY` | Google Sheets API Key |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | Google Sheets Spreadsheet ID |

## 🔧 การตั้งค่า LINE Bot

1. สร้าง LINE Bot ใน [LINE Developers Console](https://developers.line.biz/)
2. ตั้งค่า Webhook URL: `https://your-worker.your-subdomain.workers.dev/webhook`
3. เปิดใช้งาน Webhook

## 📊 Endpoints

- `GET /` - Health check
- `POST /webhook` - LINE Webhook endpoint
- `GET /status` - Status monitoring

## 🧪 การทดสอบ

```bash
# ทดสอบในโหมด development
npm run dev

# ทดสอบการ deploy
npm run deploy
```

## 📝 การใช้งาน

### ข้อความที่บอทจะตอบกลับ:
- "คดี 123/2566 ศาลจังหวัดกรุงเทพฯ"
- "รายงานการยึดทรัพย์ ลว 29.7.2568"
- "ชำระหนี้แล้ว หมายเลขคดี 456/2567"

### ข้อความที่บอทจะเงียบ:
- "สวัสดีค่ะ"
- "อากาศร้อนมาก"
- "กินข้าวกันไหม"

## 🔍 การตรวจสอบ

```bash
# ตรวจสอบสถานะ
curl https://your-worker.your-subdomain.workers.dev/

# ตรวจสอบ status
curl https://your-worker.your-subdomain.workers.dev/status
```

## 📈 การ Monitor

- จำนวนข้อความทั้งหมด
- จำนวนการบันทึกสำเร็จ
- จำนวนการบันทึกล้มเหลว
- อัตราความสำเร็จ

## 🛠️ การแก้ไขปัญหา

### ปัญหาที่พบบ่อย:

1. **LINE Webhook ไม่ทำงาน**
   - ตรวจสอบ LINE Channel Secret และ Access Token
   - ตรวจสอบ Webhook URL

2. **Google Sheets ไม่บันทึก**
   - ตรวจสอบ Google Sheets API Key
   - ตรวจสอบ Spreadsheet ID

3. **Deploy ไม่สำเร็จ**
   - ตรวจสอบ wrangler login
   - ตรวจสอบ project name ใน wrangler.jsonc

## 📚 เอกสารเพิ่มเติม

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [LINE Bot API Documentation](https://developers.line.biz/en/docs/messaging-api/)
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)

## 🤝 การสนับสนุน

หากมีปัญหาหรือคำถาม กรุณาสร้าง Issue ใน GitHub repository
