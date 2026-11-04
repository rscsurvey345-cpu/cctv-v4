import { StationRecord, FallenCaneRecord, GoogleSyncConfig } from '../types';
import { getCurrentThaiDate, STATIONS, TIME_SLOTS } from '../constants/stations';

const STORAGE_KEY = 'sugar_mill_records_2569_70';
const FALLEN_CANE_STORAGE_KEY = 'sugar_mill_fallen_cane_2569_70';
const SYNC_CONFIG_KEY = 'sugar_mill_sync_config';

// Sample base64 SVG placeholders for Scale (ตาชั่ง), Crane (เครน), and Fallen Sugarcane (อ้อยตกหล่น)
export const SAMPLE_SCALE_IMG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23e2e8f0"/><rect x="50" y="260" width="500" height="30" rx="6" fill="%23475569"/><rect x="120" y="290" width="40" height="70" fill="%23334155"/><rect x="440" y="290" width="40" height="70" fill="%23334155"/><rect x="180" y="140" width="240" height="120" rx="8" fill="%230f172a"/><text x="300" y="200" fill="%2322c55e" font-size="28" font-family="sans-serif" font-weight="bold" text-anchor="middle">38,450 KG</text><text x="300" y="235" fill="%2394a3b8" font-size="14" font-family="sans-serif" text-anchor="middle">สถานีตาชั่งดิจิทัล โรงงานน้ำตาลราชสีมา</text><circle cx="80" cy="80" r="30" fill="%2310b981"/><path d="M70 80 L77 87 L92 72" stroke="white" stroke-width="4" fill="none" stroke-linecap="round"/><text x="120" y="85" fill="%230f172a" font-size="18" font-family="sans-serif" font-weight="bold">ระบบตาชั่งพร้อมใช้งาน (ปกติ)</text></svg>';

export const SAMPLE_CRANE_IMG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23ecfdf5"/><line x1="120" y1="360" x2="180" y2="80" stroke="%23059669" stroke-width="12" stroke-linecap="round"/><line x1="180" y1="80" x2="480" y2="120" stroke="%23059669" stroke-width="10" stroke-linecap="round"/><line x1="180" y1="80" x2="80" y2="160" stroke="%23047857" stroke-width="8"/><line x1="380" y1="108" x2="380" y2="240" stroke="%23334155" stroke-width="4" stroke-dasharray="4,4"/><rect x="340" y="240" width="80" height="50" rx="4" fill="%23b45309"/><text x="380" y="270" fill="white" font-size="14" font-weight="bold" font-family="sans-serif" text-anchor="middle">มัดอ้อยสด</text><rect x="60" y="340" width="480" height="40" fill="%23334155" rx="6"/><text x="300" y="45" fill="%23065f46" font-size="20" font-weight="bold" font-family="sans-serif" text-anchor="middle">เครนขนถ่ายอ้อย ประจำจุดปฏิบัติการ</text></svg>';

export const SAMPLE_FALLEN_CANE_IMG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="500" height="400" viewBox="0 0 500 400"><rect width="500" height="400" fill="%23fef3c7"/><rect x="0" y="260" width="500" height="140" fill="%23d97706" opacity="0.35"/><path d="M0 260 Q 250 240 500 260 L500 400 L0 400 Z" fill="%23b45309" opacity="0.25"/><line x1="80" y1="290" x2="380" y2="340" stroke="%2378350f" stroke-width="16" stroke-linecap="round"/><line x1="110" y1="330" x2="420" y2="300" stroke="%2392400e" stroke-width="14" stroke-linecap="round"/><line x1="140" y1="280" x2="350" y2="360" stroke="%23b45309" stroke-width="12" stroke-linecap="round"/><line x1="200" y1="300" x2="200" y2="315" stroke="%23451a03" stroke-width="3"/><line x1="280" y1="315" x2="280" y2="330" stroke="%23451a03" stroke-width="3"/><rect x="20" y="20" width="220" height="40" rx="8" fill="%23dc2626"/><text x="130" y="45" fill="white" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="middle">⚠️ รายงานอ้อยตกหล่น</text><text x="250" y="120" fill="%2378350f" font-size="22" font-family="sans-serif" font-weight="bold" text-anchor="middle">จุดทางเข้าลานขนถ่ายอ้อย</text><text x="250" y="150" fill="%2392400e" font-size="14" font-family="sans-serif" text-anchor="middle">เก็บกู้อ้อยตกหล่นเพื่อความปลอดภัยในการสัญจร</text></svg>';

export const TARGET_SPREADSHEET_ID = '1sWtO4fwScHbvDmu0PrGhFn3__k4QIBjlvDe70Rdokjw';

export function getInitialRecords(): StationRecord[] {
  return [];
}

export function loadRecords(): StationRecord[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Strip out any previous sample/dummy mock records
        const realRecords = parsed.filter(
          (r: StationRecord) =>
            !r.id.startsWith('rec-1') &&
            !r.id.startsWith('rec-2') &&
            !r.id.startsWith('rec-3') &&
            !r.id.startsWith('rec-4') &&
            !r.id.startsWith('rec-5') &&
            r.scaleImageUrl !== SAMPLE_SCALE_IMG &&
            r.craneImageUrl !== SAMPLE_CRANE_IMG
        );
        return realRecords;
      }
    }
  } catch (e) {
    console.warn('Failed to load records from localStorage', e);
  }
  return [];
}

export function saveRecords(records: StationRecord[]): void {
  try {
    // Only save real records
    const cleanRecords = records.filter(
      (r) =>
        !r.id.startsWith('rec-1') &&
        !r.id.startsWith('rec-2') &&
        !r.id.startsWith('rec-3') &&
        !r.id.startsWith('rec-4') &&
        !r.id.startsWith('rec-5') &&
        r.scaleImageUrl !== SAMPLE_SCALE_IMG &&
        r.craneImageUrl !== SAMPLE_CRANE_IMG
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanRecords));
  } catch (e) {
    console.error('Failed to save records to localStorage', e);
  }
}

export function getInitialFallenCaneRecords(): FallenCaneRecord[] {
  return [];
}

export function loadFallenCaneRecords(): FallenCaneRecord[] {
  try {
    const saved = localStorage.getItem(FALLEN_CANE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Strip out any previous mock sample fallen cane records
        const realFallen = parsed.filter(
          (r: FallenCaneRecord) =>
            !r.id.startsWith('fallen-1') &&
            !r.id.startsWith('fallen-2') &&
            r.imageUrl !== SAMPLE_FALLEN_CANE_IMG
        );
        return realFallen;
      }
    }
  } catch (e) {
    console.warn('Failed to load fallen cane records from localStorage', e);
  }
  return [];
}

export function saveFallenCaneRecords(records: FallenCaneRecord[]): void {
  try {
    const cleanFallen = records.filter(
      (r) =>
        !r.id.startsWith('fallen-1') &&
        !r.id.startsWith('fallen-2') &&
        r.imageUrl !== SAMPLE_FALLEN_CANE_IMG
    );
    localStorage.setItem(FALLEN_CANE_STORAGE_KEY, JSON.stringify(cleanFallen));
  } catch (e) {
    console.error('Failed to save fallen cane records to localStorage', e);
  }
}

export const DEFAULT_SCRIPT_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbxL9Lrb9MnoEMVXy6YjOW0Uf-CB2UuXt-lz4rUIXF-e-hHu9Dy60NP3oCTK6jmYvw__5A/exec';

export function loadSyncConfig(): GoogleSyncConfig {
  try {
    const saved = localStorage.getItem(SYNC_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure the permanent webhook URL and target spreadsheet are set (and migrate from old urls if needed)
      if (
        !parsed.scriptWebhookUrl ||
        typeof parsed.scriptWebhookUrl !== 'string' ||
        !parsed.scriptWebhookUrl.trim() ||
        parsed.scriptWebhookUrl.includes('AKfycbxZm2IDpZvX') ||
        parsed.scriptWebhookUrl.includes('AKfycbziEQRUmWsvMM6Ee')
      ) {
        parsed.scriptWebhookUrl = DEFAULT_SCRIPT_WEBHOOK_URL;
      }
      parsed.spreadsheetId = TARGET_SPREADSHEET_ID;
      saveSyncConfig(parsed);
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to load sync config', e);
  }
  const initialConfig: GoogleSyncConfig = {
    autoSync: true,
    spreadsheetId: TARGET_SPREADSHEET_ID,
    scriptWebhookUrl: DEFAULT_SCRIPT_WEBHOOK_URL,
    spreadsheetName: 'รายงานสถานการณ์สถานีขนถ่ายอ้อย โรงงานน้ำตาลราชสีมา 2569/70',
    driveFolderName: 'สถานีขนถ่ายอ้อย_โรงงานน้ำตาลราชสีมา_2569-70',
  };
  saveSyncConfig(initialConfig);
  return initialConfig;
}

export function saveSyncConfig(config: GoogleSyncConfig): void {
  try {
    const safeConfig: GoogleSyncConfig = {
      ...config,
      spreadsheetId: TARGET_SPREADSHEET_ID,
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
    spreadsheetId: TARGET_SPREADSHEET_ID,
    scriptWebhookUrl: DEFAULT_SCRIPT_WEBHOOK_URL,
    spreadsheetName: 'รายงานสถานการณ์สถานีขนถ่ายอ้อย โรงงานน้ำตาลราชสีมา 2569/70',
    driveFolderName: 'สถานีขนถ่ายอ้อย_โรงงานน้ำตาลราชสีมา_2569-70',
  };
  saveSyncConfig(defaultConfig);
  return defaultConfig;
}
