export type StatusType =
  | 'ปกติ'
  | 'หยุดรอรถ'
  | 'หยุดรออ้อย'
  | 'หยุดไม่ทราบสาเหตุ'
  | 'offline'
  | 'ปิดเครน';

export interface StationRecord {
  id: string;
  stationName: string;
  dateStr: string; // ISO format 'YYYY-MM-DD'
  thaiDateFormatted: string; // เช่น 21 ก.ย. 2569
  buddhistYear: number; // 2569 or 2570
  timeSlot: string; // เช่น '08:00 - 09:00 น.'
  statuses: StatusType[];
  scaleImageUrl?: string; // base64 or URL
  scaleImageName?: string;
  scaleDriveId?: string;
  craneImageUrl?: string; // base64 or URL
  craneImageName?: string;
  craneDriveId?: string;
  note?: string;
  recordedBy?: string;
  createdAt: number;
  updatedAt: number;
  syncedToGoogleSheet?: boolean;
}

export type ViewTab = 'record' | 'table' | 'dashboard' | 'appsscript' | 'settings';

export type DashboardSummaryPeriod = 'hourly' | 'daily' | 'monthly' | 'all';

export interface GoogleSyncConfig {
  spreadsheetId?: string;
  spreadsheetName?: string;
  driveFolderId?: string;
  driveFolderName?: string;
  scriptWebhookUrl?: string;
  autoSync: boolean;
}
