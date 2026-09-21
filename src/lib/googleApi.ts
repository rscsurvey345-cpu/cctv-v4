import { StationRecord } from '../types';

interface SheetCreationResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

interface DriveFolderResult {
  folderId: string;
  folderUrl: string;
}

export async function createSugarcaneSheet(
  accessToken: string,
  title = 'รายงานสถานการณ์สถานีขนถ่ายอ้อย_2569-70'
): Promise<SheetCreationResult> {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'ข้อมูลสถานการณ์ขนถ่าย',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: [
                    { userEnteredValue: { stringValue: 'ลำดับ' } },
                    { userEnteredValue: { stringValue: 'วันที่ (พ.ศ.)' } },
                    { userEnteredValue: { stringValue: 'ช่วงเวลา' } },
                    { userEnteredValue: { stringValue: 'ชื่อสถานีขนถ่าย' } },
                    { userEnteredValue: { stringValue: 'สถานการณ์ / สถานะ' } },
                    { userEnteredValue: { stringValue: 'หมายเหตุ' } },
                    { userEnteredValue: { stringValue: 'ลิงก์รูปตาชั่ง' } },
                    { userEnteredValue: { stringValue: 'ลิงก์รูปเครน' } },
                    { userEnteredValue: { stringValue: 'ผู้บันทึก' } },
                    { userEnteredValue: { stringValue: 'เวลาบันทึกระบบ' } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'ไม่สามารถสร้าง Google Sheet ได้');
  }

  const data = await response.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl,
  };
}

export async function appendRecordToSheet(
  accessToken: string,
  spreadsheetId: string,
  record: StationRecord,
  indexNumber: number,
  scaleDriveLink = '',
  craneDriveLink = ''
): Promise<boolean> {
  const range = 'ข้อมูลสถานการณ์ขนถ่าย!A:J';
  const rowValues = [
    indexNumber,
    record.thaiDateFormatted,
    record.timeSlot,
    record.stationName,
    record.statuses.join(', '),
    record.note || '-',
    scaleDriveLink || (record.scaleImageUrl ? 'มีรูปภาพในระบบ' : '-'),
    craneDriveLink || (record.craneImageUrl ? 'มีรูปภาพในระบบ' : '-'),
    record.recordedBy || 'ผู้ปฏิบัติงาน',
    new Date(record.createdAt).toLocaleString('th-TH'),
  ];

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      range
    )}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );

  return response.ok;
}

export async function createDriveFolder(
  accessToken: string,
  folderName = 'สถานีขนถ่ายอ้อย_โรงงานน้ำตาลราชสีมา_2569-70'
): Promise<DriveFolderResult> {
  // Check if exists
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(
      folderName
    )}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,webViewLink)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return {
        folderId: searchData.files[0].id,
        folderUrl: searchData.files[0].webViewLink,
      };
    }
  }

  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!response.ok) {
    throw new Error('ไม่สามารถสร้างโฟลเดอร์ Google Drive ได้');
  }

  const data = await response.json();
  return {
    folderId: data.id,
    folderUrl: `https://drive.google.com/drive/folders/${data.id}`,
  };
}

export async function createDailyDriveFolder(
  accessToken: string,
  parentFolderId: string,
  dailyFolderName: string
): Promise<DriveFolderResult> {
  // Check if subfolder exists under parent
  const query = `name='${encodeURIComponent(
    dailyFolderName
  )}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      `name='${dailyFolderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    )}&fields=files(id,webViewLink)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return {
        folderId: searchData.files[0].id,
        folderUrl: searchData.files[0].webViewLink,
      };
    }
  }

  // Create subfolder under parent
  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: dailyFolderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    }),
  });

  if (!response.ok) {
    throw new Error('ไม่สามารถสร้างโฟลเดอร์รายวันใน Google Drive ได้');
  }

  const data = await response.json();
  return {
    folderId: data.id,
    folderUrl: `https://drive.google.com/drive/folders/${data.id}`,
  };
}

export async function uploadBase64ImageToDrive(
  accessToken: string,
  folderId: string,
  fileName: string,
  base64DataUrl: string
): Promise<{ fileId: string; webViewLink: string }> {
  // Extract mime and base64 parts
  const matches = base64DataUrl.match(/^data:(.+);base64,(.+)$/);
  const mimeType = matches ? matches[1] : 'image/jpeg';
  const base64Data = matches ? matches[2] : base64DataUrl;

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    mimeType,
    parents: folderId ? [folderId] : undefined,
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n` +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    base64Data +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'ไม่สามารถอัพโหลดไฟล์รูปขึ้น Google Drive ได้');
  }

  return response.json();
}
