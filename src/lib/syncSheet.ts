import { StationRecord, StatusType } from '../types';
import { THAI_SHORT_MONTHS } from '../constants/stations';
import { DEFAULT_SCRIPT_WEBHOOK_URL } from './storage';

/**
 * Extracts direct thumbnail URL for Google Drive view links
 */
export function getDriveThumbnailUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('data:image')) return url;
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
  }
  return url;
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
 * Fetches all records live from Google Apps Script Web App
 */
export async function fetchRecordsFromGoogleSheet(
  webhookUrl?: string
): Promise<{ success: boolean; records: StationRecord[]; total: number; message?: string }> {
  const targetUrl = (webhookUrl && webhookUrl.trim()) ? webhookUrl.trim() : DEFAULT_SCRIPT_WEBHOOK_URL;
  if (!targetUrl) {
    return { success: false, records: [], total: 0, message: 'ไม่มี Webhook URL' };
  }

  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return { success: false, records: [], total: 0, message: `HTTP Error: ${res.status}` };
    }

    const json = await res.json();
    if (json.status === 'success' && Array.isArray(json.data)) {
      const parsedRecords: StationRecord[] = json.data
        .map((row: any, i: number) => parseSheetRowToRecord(row, i))
        .reverse(); // Newest first

      return {
        success: true,
        records: parsedRecords,
        total: parsedRecords.length,
        message: 'ดึงข้อมูลสำเร็จ',
      };
    } else {
      return {
        success: false,
        records: [],
        total: 0,
        message: json.message || 'โครงสร้างข้อมูลไม่ถูกต้อง',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      records: [],
      total: 0,
      message: err.message || 'ไม่สามารถติดต่อ Google Apps Script ได้',
    };
  }
}

/**
 * Merges local records and cloud records seamlessly
 */
export function mergeLocalAndCloudRecords(
  localRecords: StationRecord[],
  cloudRecords: StationRecord[]
): StationRecord[] {
  if (cloudRecords.length === 0) return localRecords;

  // Cloud records map
  const cloudMap = new Map<string, StationRecord>();
  cloudRecords.forEach((r) => cloudMap.set(r.id, r));

  // Find any local records that have not been synced yet
  const unsyncedLocal = localRecords.filter((r) => !r.syncedToGoogleSheet && !cloudMap.has(r.id));

  // Combine unsynced local records at top, then cloud records
  return [...unsyncedLocal, ...cloudRecords];
}
