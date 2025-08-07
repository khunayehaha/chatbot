# 📊 คู่มือการตรวจสอบและแก้ไขปัญหา LINE Bot

## 🔍 วิธีการตรวจสอบสถานะบอท

### 1. ตรวจสอบผ่าน Web Browser
```
http://localhost:3000/          # Health check
http://localhost:3000/status    # Status monitoring
```

### 2. ตรวจสอบผ่าน Terminal
```bash
# ตรวจสอบ process ที่กำลังทำงาน
ps aux | grep node

# ตรวจสอบ port ที่ใช้งาน
lsof -i :3000

# ตรวจสอบ log
tail -f server.log
```

## ⚠️ ปัญหาที่อาจเกิดขึ้นและวิธีแก้ไข

### 1. บอทหยุดตอบสนอง
**อาการ**: ไม่ตอบข้อความใน LINE

**วิธีแก้ไข**:
```bash
# รีสตาร์ทเซิร์ฟเวอร์
pm2 restart line-bot
# หรือ
node server.js
```

### 2. ไม่สามารถบันทึกข้อมูลได้
**อาการ**: ได้ข้อความ "เกิดข้อผิดพลาดในการบันทึกข้อมูล"

**วิธีแก้ไข**:
- ตรวจสอบ Google Sheets API quota
- ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
- ตรวจสอบ credentials ใน .env

### 3. LINE API Error
**อาการ**: ไม่สามารถส่งข้อความได้

**วิธีแก้ไข**:
- ตรวจสอบ LINE Channel Access Token
- ตรวจสอบ LINE Channel Secret
- ตรวจสอบ Webhook URL

### 4. เซิร์ฟเวอร์ล่ม
**อาการ**: ไม่สามารถเข้าถึง webhook ได้

**วิธีแก้ไข**:
```bash
# รีสตาร์ทเซิร์ฟเวอร์
pm2 restart line-bot

# หรือถ้าใช้ systemd
sudo systemctl restart line-bot
```

## 📈 การตรวจสอบสถิติ

### ข้อมูลที่แสดงใน Health Check:
- **Uptime**: เวลาที่เซิร์ฟเวอร์ทำงานต่อเนื่อง
- **Total Messages**: จำนวนข้อความทั้งหมดที่ได้รับ
- **Successful Saves**: จำนวนการบันทึกสำเร็จ
- **Failed Saves**: จำนวนการบันทึกล้มเหลว
- **Success Rate**: อัตราความสำเร็จ
- **Last Error**: ข้อผิดพลาดล่าสุด

## 🛠️ การตั้งค่า Auto-restart

### ใช้ PM2 (แนะนำ)
```bash
# ติดตั้ง PM2
npm install -g pm2

# เริ่มต้นแอปพลิเคชัน
pm2 start server.js --name "line-bot"

# ตั้งค่าให้รีสตาร์ทอัตโนมัติ
pm2 startup
pm2 save

# ตรวจสอบสถานะ
pm2 status
pm2 logs line-bot
```

### ใช้ systemd (Linux)
```bash
# สร้างไฟล์ service
sudo nano /etc/systemd/system/line-bot.service

# เนื้อหาไฟล์:
[Unit]
Description=LINE Bot Service
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/line-bot-project
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

# เปิดใช้งาน
sudo systemctl enable line-bot
sudo systemctl start line-bot
```

## 🔔 การแจ้งเตือน

### ตั้งค่า Monitoring Service
- **Uptime Robot**: ตรวจสอบ webhook URL ทุก 5 นาที
- **PagerDuty**: แจ้งเตือนเมื่อเซิร์ฟเวอร์ล่ม
- **Slack**: ส่งการแจ้งเตือนไปยัง Slack channel

### ตัวอย่าง Uptime Robot Configuration
```
URL: https://your-domain.com/
Check Interval: 5 minutes
Alert When Down: Yes
```

## 📝 การบันทึก Log

### ตั้งค่า Log Rotation
```bash
# ติดตั้ง logrotate
sudo apt-get install logrotate

# สร้างไฟล์ config
sudo nano /etc/logrotate.d/line-bot

# เนื้อหา:
/path/to/line-bot-project/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 644 your-username your-username
}
```

## 🚨 Emergency Contacts

เมื่อเกิดปัญหาที่แก้ไขไม่ได้:
1. **ตรวจสอบ log files**
2. **รีสตาร์ทเซิร์ฟเวอร์**
3. **ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต**
4. **ตรวจสอบ LINE Developer Console**
5. **ตรวจสอบ Google Sheets API**

## 📊 การตรวจสอบประสิทธิภาพ

### ตรวจสอบ Memory Usage
```bash
# ตรวจสอบการใช้ memory
pm2 monit

# หรือ
htop
```

### ตรวจสอบ CPU Usage
```bash
# ตรวจสอบการใช้ CPU
top

# หรือ
htop
```

## 🔧 การอัพเดทระบบ

### อัพเดทโค้ด
```bash
# Pull โค้ดใหม่
git pull origin main

# รีสตาร์ทเซิร์ฟเวอร์
pm2 restart line-bot
```

### อัพเดท Dependencies
```bash
# อัพเดท packages
npm update

# รีสตาร์ทเซิร์ฟเวอร์
pm2 restart line-bot
```
