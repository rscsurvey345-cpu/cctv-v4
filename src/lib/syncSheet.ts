import { StationRecord, StatusType, FallenCaneRecord } from '../types';
import { THAI_SHORT_MONTHS } from '../constants/stations';
import {
  DEFAULT_SCRIPT_WEBHOOK_URL,
  TARGET_SPREADSHEET_ID,
  getDeletedRecordIds,
  getDeletedFallenCaneIds,
} from './storage';

/**
 * Extracts Google Drive file ID from various link styles
 */
export function extractGoogleDriveFileId(url?: string): string | null {
  if (!url) return null;
  const str = String(url).trim();
  if (!str || str === '-' || str.startsWith('data:image')) return null;

  const dMatch = str.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch && dMatch[1]) return dMatch[1];

  const idMatch = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return idMatch[1];

  if (/^[a-zA-Z0-9_-]{25,}$/.test(str)) return str;

  return null;
}

/**
 * Extracts direct embeddable CDN URL for Google Drive files
 * Uses lh3.googleusercontent.com which works in iFrames and cross-origin without 302 redirects or CORS/cookie blocks
 */
export function getDriveThumbnailUrl(url?: string, size: number = 800): string {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed || trimmed === '-') return '';
  if (trimmed.startsWith('data:image')) return trimmed;

  const fileId = extractGoogleDriveFileId(trimmed);
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}=w${size}`;
  }
  return trimmed;
}

/**
 * Secondary fallback URL if CDN is temporarily unavailable
 */
export function getDriveFallbackUrl(url?: string): string {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed || trimmed === '-' || trimmed.startsWith('data:image')) return trimmed;

  const fileId = extractGoogleDriveFileId(trimmed);
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
  }
  return trimmed;
}

/**
 * Formats date from Google Sheet row
 */
export function formatSheetDate(raw: any): { thaiFormatted: string; dateStr: string; buddhistYear: number } {
  if (!raw) {
    const today = new Date();
    const thaiYear = today.getFullYear() + 543;
    const m = today.getMonth();
    const d = today.getDate();
    return {
      thaiFormatted: `${d} ${THAI_SHORT_MONTHS[m]} ${thaiYear}`,
      dateStr: today.toISOString().split('T')[0],
      buddhistYear: thaiYear,
    };
  }

  const rawStr = String(raw).trim();

  // If ISO string like 2569-09-20T17:00:00.000Z or standard ISO
  if (rawStr.includes('T') && rawStr.includes('Z')) {
    const utc = new Date(rawStr).getTime();
    if (!isNaN(utc)) {
      // Add 7 hours for Thailand Time
      const thaiTime = new Date(utc + 7 * 3600 * 1000);
      const rawYear = thaiTime.getUTCFullYear();
      const m = thaiTime.getUTCMonth();
      const d = thaiTime.getUTCDate();
      const ceYear = rawYear > 2400 ? rawYear - 543 : rawYear;
      const beYear = rawYear > 2400 ? rawYear : rawYear + 543;
      const dateStr = `${ceYear}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const thaiFormatted = `${d} ${THAI_SHORT_MONTHS[m]} ${beYear}`;
      return { thaiFormatted, dateStr, buddhistYear: beYear };
    }
  }

  // If already Thai formatted string
  let detectedYear = 2569;
  if (rawStr.includes('2570')) detectedYear = 2570;
  else if (rawStr.includes('2569')) detectedYear = 2569;

  return {
    thaiFormatted: rawStr,
    dateStr: new Date().toISOString().split('T')[0],
    buddhistYear: detectedYear,
  };
}

/**
 * Parses a single Google Sheet row into a StationRecord
 */
export function parseSheetRowToRecord(row: Record<string, any>, index: number): StationRecord {
  const id = row['รหัสบันทึก (ID)'] || `REC-SHEET-${index}`;
  const stationName = row['ชื่อสถานีขนถ่าย'] || 'ไม่ระบุสถานี';
  const timeSlot = row['ช่วงเวลา'] || '08:00 - 10:00 น.';
  
  // Statuses
  const rawStatus = row['สถานการณ์ / สถานะ'] || '';
  const statuses: StatusType[] = rawStatus
    ? (rawStatus.split(',').map((s: string) => s.trim()).filter(Boolean) as StatusType[])
    : ['ปกติ'];

  const note = (!row['หมายเหตุ'] || row['หมายเหตุ'] === '-') ? '' : String(row['หมายเหตุ']);
  const recordedBy = row['ผู้บันทึก'] || 'ผู้บันทึก';

  // Images
  const scaleDriveUrl = (!row['ลิงก์รูปตาชั่ง (Google Drive)'] || row['ลิงก์รูปตาชั่ง (Google Drive)'] === '-')
    ? ''
    : String(row['ลิงก์รูปตาชั่ง (Google Drive)']);
  const craneDriveUrl = (!row['ลิงก์รูปเครน (Google Drive)'] || row['ลิงก์รูปเครน (Google Drive)'] === '-')
    ? ''
    : String(row['ลิงก์รูปเครน (Google Drive)']);

  const { thaiFormatted, dateStr, buddhistYear } = formatSheetDate(row['วันที่ (พ.ศ.)']);

  let createdAt = Date.now();
  if (row['เวลาที่บันทึกลงระบบ']) {
    const parsed = Date.parse(row['เวลาที่บันทึกลงระบบ']);
    if (!isNaN(parsed)) {
      createdAt = parsed;
    }
  }

  return {
    id,
    dateStr,
    thaiDateFormatted: thaiFormatted,
    buddhistYear,
    timeSlot,
    stationName,
    statuses: statuses.length > 0 ? statuses : ['ปกติ'],
    note,
    recordedBy,
    scaleImageUrl: scaleDriveUrl,
    craneImageUrl: craneDriveUrl,
    scaleImageName: scaleDriveUrl ? `ตาชั่ง_${stationName}` : undefined,
    craneImageName: craneDriveUrl ? `เครน_${stationName}` : undefined,
    scaleDriveId: scaleDriveUrl,
    craneDriveId: craneDriveUrl,
    syncedToGoogleSheet: true,
    createdAt,
    updatedAt: createdAt,
  };
}

/**
 * Parses a single Google Sheet row into a FallenCaneRecord
 */
export function parseFallenCaneSheetRowToRecord(
  row: Record<string, any>,
  index: number
): FallenCaneRecord {
  const id = row['รหัสบันทึก (ID)'] || `FALLEN-SHEET-${index}`;
  const stationName = row['ชื่อสถานีขนถ่าย'] || 'ไม่ระบุสถานี';
  const { thaiFormatted, dateStr, buddhistYear } = formatSheetDate(row['วันที่ (พ.ศ.)']);
  const note = (!row['หมายเหตุ'] || row['หมายเหตุ'] === '-')
    ? (row['บริเวณหรือจุดที่พบอ้อยตกหล่น'] ? String(row['บริเวณหรือจุดที่พบอ้อยตกหล่น']) : '')
    : String(row['หมายเหตุ']);
  const recordedBy = row['ผู้บันทึก'] || 'ผู้บันทึก';
  const imageUrl = (!row['ลิงก์รูปอ้อยตกหล่น (Google Drive)'] || row['ลิงก์รูปอ้อยตกหล่น (Google Drive)'] === '-')
    ? ''
    : String(row['ลิงก์รูปอ้อยตกหล่น (Google Drive)']);

  let createdAt = Date.now();
  if (row['เวลาที่บันทึกลงระบบ']) {
    const parsed = Date.parse(row['เวลาที่บันทึกลงระบบ']);
    if (!isNaN(parsed)) {
      createdAt = parsed;
    }
  }

  return {
    id,
    stationName,
    dateStr,
    thaiDateFormatted: thaiFormatted,
    buddhistYear,
    imageUrl,
    imageName: imageUrl ? `อ้อยตกหล่น_${stationName}` : undefined,
    driveUrl: imageUrl,
    note,
    recordedBy,
    createdAt,
    updatedAt: createdAt,
    syncedToGoogleSheet: true,
  };
}

export interface FetchSheetResult {
  success: boolean;
  records: StationRecord[];
  total: number;
  fallenCaneRecords: FallenCaneRecord[];
  totalFallenCane: number;
  message?: string;
  sheetUrl?: string;
  driveFolderUrl?: string;
  spreadsheetId?: string;
}

/**
 * Fetches all records live from Google Apps Script Web App
 */
export async function fetchRecordsFromGoogleSheet(
  webhookUrl?: string
): Promise<FetchSheetResult> {
  const targetUrl = (webhookUrl && webhookUrl.trim()) ? webhookUrl.trim() : DEFAULT_SCRIPT_WEBHOOK_URL;
  if (!targetUrl) {
    return {
      success: false,
      records: [],
      total: 0,
      fallenCaneRecords: [],
      totalFallenCane: 0,
      message: 'ไม่มี Webhook URL',
    };
  }

  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return {
        success: false,
        records: [],
        total: 0,
        fallenCaneRecords: [],
        totalFallenCane: 0,
        message: `HTTP Error: ${res.status}`,
      };
    }

    const json = await res.json();
    if (json.status === 'success') {
      const deletedIds = getDeletedRecordIds();
      const parsedRecords: StationRecord[] = Array.isArray(json.data)
        ? json.data
            .map((row: any, i: number) => parseSheetRowToRecord(row, i))
            .filter((r: StationRecord) => !deletedIds.has(r.id))
            .reverse()
        : [];

      const deletedFallenIds = getDeletedFallenCaneIds();
      const parsedFallenCane: FallenCaneRecord[] = Array.isArray(json.fallenCaneData)
        ? json.fallenCaneData
            .map((row: any, i: number) => parseFallenCaneSheetRowToRecord(row, i))
            .filter((r: FallenCaneRecord) => !deletedFallenIds.has(r.id))
            .reverse()
        : [];

      return {
        success: true,
        records: parsedRecords,
        total: parsedRecords.length,
        fallenCaneRecords: parsedFallenCane,
        totalFallenCane: parsedFallenCane.length,
        message: 'ดึงข้อมูลสำเร็จ',
        sheetUrl: json.sheetUrl || `https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit`,
        driveFolderUrl: json.driveFolderUrl,
        spreadsheetId: json.spreadsheetId || TARGET_SPREADSHEET_ID,
      };
    } else {
      return {
        success: false,
        records: [],
        total: 0,
        fallenCaneRecords: [],
        totalFallenCane: 0,
        message: json.message || 'โครงสร้างข้อมูลไม่ถูกต้อง',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      records: [],
      total: 0,
      fallenCaneRecords: [],
      totalFallenCane: 0,
      message: err.message || 'ไม่สามารถติดต่อ Google Apps Script ได้',
    };
  }
}

/**
 * Merges local records and cloud records seamlessly
 * Preserves local images if cloud has not yet populated them
 */
export function mergeLocalAndCloudRecords(
  localRecords: StationRecord[],
  cloudRecords: StationRecord[]
): StationRecord[] {
  const deletedIds = getDeletedRecordIds();
  const cleanLocal = localRecords.filter((r) => !deletedIds.has(r.id));
  const cleanCloud = cloudRecords.filter((r) => !deletedIds.has(r.id));

  if (cleanCloud.length === 0) return cleanLocal;

  const localMap = new Map<string, StationRecord>();
  cleanLocal.forEach((r) => localMap.set(r.id, r));

  const cloudMap = new Map<string, StationRecord>();
  // Enrich cloud records with local image data if cloud hasn't populated them yet
  const enrichedCloud = cleanCloud.map((cloudRec) => {
    const localMatch = localMap.get(cloudRec.id);
    if (!localMatch) return cloudRec;
    return {
      ...cloudRec,
      scaleImageUrl: cloudRec.scaleImageUrl || localMatch.scaleImageUrl,
      craneImageUrl: cloudRec.craneImageUrl || localMatch.craneImageUrl,
      scaleImageName: cloudRec.scaleImageName || localMatch.scaleImageName,
      craneImageName: cloudRec.craneImageName || localMatch.craneImageName,
    };
  });

  enrichedCloud.forEach((r) => cloudMap.set(r.id, r));

  // Find any local records that have not been synced yet
  const unsyncedLocal = cleanLocal.filter((r) => !r.syncedToGoogleSheet && !cloudMap.has(r.id));

  // Combine unsynced local records at top, then enriched cloud records
  return [...unsyncedLocal, ...enrichedCloud];
}

/**
 * Merges local fallen cane records and cloud records seamlessly
 * Preserves local images if cloud has not yet populated them
 */
export function mergeLocalAndCloudFallenCaneRecords(
  localRecords: FallenCaneRecord[],
  cloudRecords: FallenCaneRecord[]
): FallenCaneRecord[] {
  const deletedFallenIds = getDeletedFallenCaneIds();
  const cleanLocal = localRecords.filter((r) => !deletedFallenIds.has(r.id));
  const cleanCloud = cloudRecords.filter((r) => !deletedFallenIds.has(r.id));

  if (cleanCloud.length === 0) return cleanLocal;

  const localMap = new Map<string, FallenCaneRecord>();
  cleanLocal.forEach((r) => localMap.set(r.id, r));

  const cloudMap = new Map<string, FallenCaneRecord>();
  const enrichedCloud = cleanCloud.map((cloudRec) => {
    const localMatch = localMap.get(cloudRec.id);
    if (!localMatch) return cloudRec;
    return {
      ...cloudRec,
      imageUrl: cloudRec.imageUrl || localMatch.imageUrl,
      imageName: cloudRec.imageName || localMatch.imageName,
    };
  });

  enrichedCloud.forEach((r) => cloudMap.set(r.id, r));

  const unsyncedLocal = cleanLocal.filter((r) => !r.syncedToGoogleSheet && !cloudMap.has(r.id));
  return [...unsyncedLocal, ...enrichedCloud];
}
