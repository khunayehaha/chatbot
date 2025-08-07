/**
 * ทดสอบระบบเวลาไทยใหม่
 */

// ทดสอบการสร้างเวลาไทย
function testThaiTime() {
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
  
  console.log('=== ทดสอบระบบเวลาไทย ===');
  console.log('เวลาปัจจุบัน (UTC):', now.toISOString());
  console.log('เวลาไทย (UTC+7):', thaiTime.toISOString());
  console.log('รูปแบบเวลาไทย:', formattedThaiTime);
  console.log('รูปแบบเดิม:', now.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }));
  
  return formattedThaiTime;
}

// ทดสอบข้อมูลจำลอง
function testMockData() {
  const mockData = {
    originalMessage: 'รายงานการยึดทรัพย์ ลว 29.7.2568 คดีหมายเลขแดง ผบ 13/2567 ศาลจังหวัดบุรีรัมย์',
    court: 'ศาลจังหวัดบุรีรัมย์',
    debtor: 'นายกระเดื่อง บำรุงแคว้น',
    caseNumber: '13/2567',
    status: 'ยึดทรัพย์',
    amount: '500,000 บาท',
    keywords: ['ยึดทรัพย์', 'คดีแดง', 'ศาลจังหวัด']
  };
  
  console.log('\n=== ทดสอบข้อมูลจำลอง ===');
  console.log('ข้อมูลที่จะบันทึก:', mockData);
  
  return mockData;
}

// รันการทดสอบ
if (require.main === module) {
  const thaiTime = testThaiTime();
  const mockData = testMockData();
  
  console.log('\n=== ผลลัพธ์ ===');
  console.log('เวลาไทยที่จะบันทึก:', thaiTime);
  console.log('ข้อมูลที่จะบันทึก:', [
    thaiTime,
    mockData.originalMessage,
    mockData.court,
    mockData.debtor,
    mockData.caseNumber,
    mockData.status,
    mockData.amount,
    mockData.keywords.join(', ')
  ]);
}

module.exports = {
  testThaiTime,
  testMockData
};
