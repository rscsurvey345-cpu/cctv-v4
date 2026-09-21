import { StatusType } from '../types';

export const STATIONS: string[] = [
  'เครนขามสะแกแสง1',
  'เครนขามสะแกแสง2',
  'เครนคูเมือง',
  'เครนซับใหญ่',
  'เครนวังโพธิ์(บ้านเหลื่อม1)',
  'เครนดอนทอง(บ้านเหลื่อม2)',
  'เครนดอนหัน',
  'เครนทำนบ 2',
  'เครนทำนบพัฒนา',
  'เครนนาเสียว',
  'เครนเนินสง่า',
  'เครนบ้านเขว้า1',
  'เครนบ้านเขว้า2',
  'เครนบ้านเขว้า3',
  'เครนบ้านค่าย 1',
  'เครนบ้านค่าย 2',
  'เครนบ้านเดื่อ',
  'เครนบ้านปรางค์',
  'เครนภูแลนคา',
  'เครนรกฟ้า',
  'เครนวังชมภู',
  'เครนสระสี่เหลี่ยม 1',
  'เครนสระสี่เหลี่ยม2',
  'เครนหนองโคบาล',
  'เครนหนองบัวแดง',
  'เครนหนองบัวระเหว',
  'เครนหนองบัวระเหว2',
  'เครนหนองบัวลาย',
  'เครนหนองพลวง',
  'เครนหนองแวง',
  'เครนหนองหอย',
  'เครนหนองหัวฟาน',
  'เครนห้วยต้อน',
  'เครนห้วยไร่',
  'เครนหินกอง',
  'เครนท่าหินโงม',
  'เครนเนินสง่า 2',
  'เครนโนนตาลเสี้ยน',
  'เครนบ้านเขว้า 4',
  'เครนภูแลนคา 2',
  'เครนสงแดง',
  'เครนหนองม่วงช่างพิมพ์',
  'เครนจัตุรัส',
];

export const TIME_SLOTS: string[] = [
  '08:00 - 09:00  น.',
  '09:00 - 10:00  น.',
  '10:00 - 11:00  น.',
  '11:00 - 12:00  น.',
  '12:00 - 13:00  น.',
  '13:00 - 14:00  น.',
  '14:00 - 15:00  น.',
  '15:00 - 16:00  น.',
  '16:00 - 17:00  น.',
  '17:00 - 18:00  น.',
  '18:00 - 19:00  น.',
  '19:00 - 20:00  น.',
];

export interface StatusMeta {
  value: StatusType;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  chartColor: string;
  description: string;
}

export const STATUS_LIST: StatusMeta[] = [
  {
    value: 'ปกติ',
    label: 'ปกติ',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-300',
    dotColor: 'bg-emerald-500',
    chartColor: '#10b981',
    description: 'เครนและสถานีขนถ่ายทำงานปกติ ไม่มีปัญหาติดขัด',
  },
  {
    value: 'หยุดรอรถ',
    label: 'หยุดรอรถ',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-300',
    dotColor: 'bg-amber-500',
    chartColor: '#f59e0b',
    description: 'ไม่มีรถบรรทุกเข้ามาขนถ่ายอ้อย',
  },
  {
    value: 'หยุดรออ้อย',
    label: 'หยุดรออ้อย',
    badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
    badgeText: 'text-orange-700',
    badgeBorder: 'border-orange-300',
    dotColor: 'bg-orange-500',
    chartColor: '#f97316',
    description: 'ไม่มีอ้อยเข้าสู่ลานหรือรถตัดอ้อยยังไม่มาส่ง',
  },
  {
    value: 'หยุดไม่ทราบสาเหตุ',
    label: 'หยุดไม่ทราบสาเหตุ',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-300',
    dotColor: 'bg-rose-500',
    chartColor: '#ef4444',
    description: 'หยุดทำงานขัดข้อง กำลังตรวจสอบสาเหตุ',
  },
  {
    value: 'offline',
    label: 'offline',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-300',
    dotColor: 'bg-slate-400',
    chartColor: '#64748b',
    description: 'ระบบหรือการสื่อสารสัญญาณขาดการติดต่อ',
  },
  {
    value: 'ปิดเครน',
    label: 'ปิดเครน',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-300',
    dotColor: 'bg-purple-500',
    chartColor: '#8b5cf6',
    description: 'ปิดการใช้งานตามรอบเวลาหรือปิดซ่อมบำรุง',
  },
];

export const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

export const THAI_SHORT_MONTHS = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

export function toThaiDateFormatted(dateStr: string): string {
  if (!dateStr) return '';
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const thaiYear = year + 543;
  return `${day} ${THAI_SHORT_MONTHS[month] || ''} ${thaiYear}`;
}

export function toFullThaiDate(dateStr: string): string {
  if (!dateStr) return '';
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const thaiYear = year + 543;
  return `วันทีี่ ${day} ${THAI_MONTHS[month] || ''} พ.ศ. ${thaiYear}`;
}

export function getCurrentThaiDate(): { dateStr: string; thaiFormatted: string; thaiYear: number } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  return {
    dateStr,
    thaiFormatted: toThaiDateFormatted(dateStr),
    thaiYear: year + 543,
  };
}
