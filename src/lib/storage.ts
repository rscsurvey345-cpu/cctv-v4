import { StationRecord, GoogleSyncConfig } from '../types';
import { getCurrentThaiDate, STATIONS, TIME_SLOTS } from '../constants/stations';

const STORAGE_KEY = 'sugar_mill_records_2569_70';
const SYNC_CONFIG_KEY = 'sugar_mill_sync_config';

// Sample base64 SVG placeholders for Scale (ตาชั่ง) and Crane (เครน)
export const SAMPLE_SCALE_IMG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23e2e8f0"/><rect x="50" y="260" width="500" height="30" rx="6" fill="%23475569"/><rect x="120" y="290" width="40" height="70" fill="%23334155"/><rect x="440" y="290" width="40" height="70" fill="%23334155"/><rect x="180" y="140" width="240" height="120" rx="8" fill="%230f172a"/><text x="300" y="200" fill="%2322c55e" font-size="28" font-family="sans-serif" font-weight="bold" text-anchor="middle">38,450 KG</text><text x="300" y="235" fill="%2394a3b8" font-size="14" font-family="sans-serif" text-anchor="middle">สถานีตาชั่งดิจิทัล โรงงานน้ำตาลราชสีมา</text><circle cx="80" cy="80" r="30" fill="%2310b981"/><path d="M70 80 L77 87 L92 72" stroke="white" stroke-width="4" fill="none" stroke-linecap="round"/><text x="120" y="85" fill="%230f172a" font-size="18" font-family="sans-serif" font-weight="bold">ระบบตาชั่งพร้อมใช้งาน (ปกติ)</text></svg>';

export const SAMPLE_CRANE_IMG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23ecfdf5"/><line x1="120" y1="360" x2="180" y2="80" stroke="%23059669" stroke-width="12" stroke-linecap="round"/><line x1="180" y1="80" x2="480" y2="120" stroke="%23059669" stroke-width="10" stroke-linecap="round"/><line x1="180" y1="80" x2="80" y2="160" stroke="%23047857" stroke-width="8"/><line x1="380" y1="108" x2="380" y2="240" stroke="%23334155" stroke-width="4" stroke-dasharray="4,4"/><rect x="340" y="240" width="80" height="50" rx="4" fill="%23b45309"/><text x="380" y="270" fill="white" font-size="14" font-weight="bold" font-family="sans-serif" text-anchor="middle">มัดอ้อยสด</text><rect x="60" y="340" width="480" height="40" fill="%23334155" rx="6"/><text x="300" y="45" fill="%23065f46" font-size="20" font-weight="bold" font-family="sans-serif" text-anchor="middle">เครนขนถ่ายอ้อย ประจำจุดปฏิบัติการ</text></svg>';

export function getInitialRecords(): StationRecord[] {
  const { dateStr, thaiFormatted, thaiYear } = getCurrentThaiDate();

  return [
    {
      id: 'rec-1',
      stationName: 'เครนขามสะแกแสง1',
      dateStr,
      thaiDateFormatted: thaiFormatted,
      buddhistYear: thaiYear,
      timeSlot: '08:00 - 09:00  น.',
      statuses: ['ปกติ'],
      scaleImageUrl: SAMPLE_SCALE_IMG,
      scaleImageName: 'ตาชั่ง_ขามสะแกแสง1_0800.jpg',
      craneImageUrl: SAMPLE_CRANE_IMG,
      craneImageName: 'เครน_ขามสะแกแสง1_0800.jpg',
      note: 'รถบรรทุกอ้อยทยอยเข้าต่อเนื่อง ตาชั่งและเครนพร้อมทำงาน 100%',
      recordedBy: 'สุรชัย (นายสถานี)',
      createdAt: Date.now() - 3600000 * 4,
      updatedAt: Date.now() - 3600000 * 4,
      syncedToGoogleSheet: true,
    },
    {
      id: 'rec-2',
      stationName: 'เครนคูเมือง',
      dateStr,
      thaiDateFormatted: thaiFormatted,
      buddhistYear: thaiYear,
      timeSlot: '09:00 - 10:00  น.',
      statuses: ['หยุดรอรถ', 'หยุดรออ้อย'],
      scaleImageUrl: SAMPLE_SCALE_IMG,
      scaleImageName: 'ตาชั่ง_คูเมือง_0900.jpg',
      craneImageUrl: SAMPLE_CRANE_IMG,
      craneImageName: 'เครน_คูเมือง_0900.jpg',
      note: 'รถตัดอ้อยในแปลงกำลังลำเลียงออกมา คาดเข้าลานช่วง 10:30 น.',
      recordedBy: 'สมศักดิ์ ขนถ่าย',
      createdAt: Date.now() - 3600000 * 3,
      updatedAt: Date.now() - 3600000 * 3,
      syncedToGoogleSheet: false,
    },
    {
      id: 'rec-3',
      stationName: 'เครนบ้านเขว้า1',
      dateStr,
      thaiDateFormatted: thaiFormatted,
      buddhistYear: thaiYear,
      timeSlot: '10:00 - 11:00  น.',
      statuses: ['ปกติ'],
      scaleImageUrl: SAMPLE_SCALE_IMG,
      scaleImageName: 'ตาชั่ง_บ้านเขว้า1_1000.jpg',
      craneImageUrl: SAMPLE_CRANE_IMG,
      craneImageName: 'เครน_บ้านเขว้า1_1000.jpg',
      note: 'คิวรถเรียบร้อย การจราจรคล่องตัว',
      recordedBy: 'อนุรักษ์ ลานอ้อย',
      createdAt: Date.now() - 3600000 * 2,
      updatedAt: Date.now() - 3600000 * 2,
      syncedToGoogleSheet: true,
    },
    {
      id: 'rec-4',
      stationName: 'เครนหนองบัวระเหว',
      dateStr,
      thaiDateFormatted: thaiFormatted,
      buddhistYear: thaiYear,
      timeSlot: '11:00 - 12:00  น.',
      statuses: ['หยุดรอรถ'],
      scaleImageUrl: SAMPLE_SCALE_IMG,
      scaleImageName: 'ตาชั่ง_หนองบัวระเหว_1100.jpg',
      craneImageUrl: SAMPLE_CRANE_IMG,
      craneImageName: 'เครน_หนองบัวระเหว_1100.jpg',
      note: 'มีอ้อยกองสะสมรอรถบรรทุกใหญ่จากโรงงานมารับช่วงต่อ',
      recordedBy: 'วิชัย เจ้าหน้าที่เครน',
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 3600000,
      syncedToGoogleSheet: false,
    },
    {
      id: 'rec-5',
      stationName: 'เครนห้วยต้อน',
      dateStr,
      thaiDateFormatted: thaiFormatted,
      buddhistYear: thaiYear,
      timeSlot: '12:00 - 13:00  น.',
      statuses: ['ปิดเครน'],
      scaleImageUrl: SAMPLE_SCALE_IMG,
      scaleImageName: 'ตาชั่ง_ห้วยต้อน_1200.jpg',
      craneImageUrl: SAMPLE_CRANE_IMG,
      craneImageName: 'เครน_ห้วยต้อน_1200.jpg',
      note: 'พักรอบเที่ยงและอัดจาระบีสลิงเครนประจำวัน',
      recordedBy: 'ประดิษฐ์ ช่างเทคนิค',
      createdAt: Date.now() - 1800000,
      updatedAt: Date.now() - 1800000,
      syncedToGoogleSheet: true,
    },
  ];
}

export function loadRecords(): StationRecord[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load records from localStorage', e);
  }
  const initial = getInitialRecords();
  saveRecords(initial);
  return initial;
}

export function saveRecords(records: StationRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save records to localStorage', e);
  }
}

export const DEFAULT_SCRIPT_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbxZm2IDpZvXFdEnFvExW1v3c3lPO8ieG6blsQxHDQkURJXdafI8aKI5b6BuCRcn2jGAuA/exec';

export function loadSyncConfig(): GoogleSyncConfig {
  try {
    const saved = localStorage.getItem(SYNC_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure the permanent webhook URL is set if empty or missing
      if (!parsed.scriptWebhookUrl || typeof parsed.scriptWebhookUrl !== 'string' || !parsed.scriptWebhookUrl.trim()) {
        parsed.scriptWebhookUrl = DEFAULT_SCRIPT_WEBHOOK_URL;
        saveSyncConfig(parsed);
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to load sync config', e);
  }
  const initialConfig: GoogleSyncConfig = {
    autoSync: true,
    scriptWebhookUrl: DEFAULT_SCRIPT_WEBHOOK_URL,
    spreadsheetName: 'รายงานสถานการณ์สถานีขนถ่ายอ้อย_2569-70',
    driveFolderName: 'สถานีขนถ่ายอ้อย_โรงงานน้ำตาลราชสีมา_2569-70',
  };
  saveSyncConfig(initialConfig);
  return initialConfig;
}

export function saveSyncConfig(config: GoogleSyncConfig): void {
  try {
    const safeConfig: GoogleSyncConfig = {
      ...config,
      scriptWebhookUrl: (config.scriptWebhookUrl && config.scriptWebhookUrl.trim())
        ? config.scriptWebhookUrl.trim()
        : DEFAULT_SCRIPT_WEBHOOK_URL,
    };
    localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(safeConfig));
  } catch (e) {
    console.error('Failed to save sync config', e);
  }
}

export function resetSyncConfigToPermanentDefault(): GoogleSyncConfig {
  const defaultConfig: GoogleSyncConfig = {
    autoSync: true,
    scriptWebhookUrl: DEFAULT_SCRIPT_WEBHOOK_URL,
    spreadsheetName: 'รายงานสถานการณ์สถานีขนถ่ายอ้อย_2569-70',
    driveFolderName: 'สถานีขนถ่ายอ้อย_โรงงานน้ำตาลราชสีมา_2569-70',
  };
  saveSyncConfig(defaultConfig);
  return defaultConfig;
}
