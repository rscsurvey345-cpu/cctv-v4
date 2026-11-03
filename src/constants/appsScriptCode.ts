export const APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * Google Apps Script: ระบบรายงานสถานการณ์สถานีขนถ่ายอ้อย โรงงานน้ำตาลราชสีมา
 * ปีการผลิต 2569/70
 * =========================================================================
 * 
 * Google Sheet ID เป้าหมาย: 1sWtO4fwScHbvDmu0PrGhFn3__k4QIBjlvDe70Rdokjw
 * 
 * ความสามารถของสคริปต์นี้:
 * 1. ผูกกับ Google Sheet: "1sWtO4fwScHbvDmu0PrGhFn3__k4QIBjlvDe70Rdokjw" โดยตรง
 * 2. แยกแท็บอย่างชัดเจน:
 *    - "ข้อมูลสถานการณ์ขนถ่าย" : บันทึกสถานการณ์ประจำชั่วโมงของ 43 สถานี
 *    - "รายงานอ้อยตกหล่น" : บันทึกรายงานอ้อยตกหล่นรายวัน
 * 3. จัดเก็บรูปภาพใน Google Drive ที่เดียวกับ Google Sheet:
 *    - สร้างโฟลเดอร์ "อ้อยตกหล่น2569/70" ในโฟลเดอร์เดียวกับ Google Sheet
 *    - สร้างโฟลเดอร์ย่อยรายวัน "วันที่ ..." ข้างในอัตโนมัติ
 * 4. รองรับคำสั่ง:
 *    - addRecord, updateRecord, deleteRecord (สถานการณ์สถานี)
 *    - addFallenCaneRecord, deleteFallenCaneRecord (รายงานอ้อยตกหล่น)
 * 5. ส่งข้อมูลกลับแบบ JSON รองรับทั้งสถานการณ์และรายงานอ้อยตกหล่น
 * 
 * วิธีการติดตั้ง / อัปเดตสคริปต์:
 * 1. ไปที่ https://script.google.com
 * 2. เปิดโครงการเดิมที่เชื่อมต่อกับชีต 1sWtO4fwScHbvDmu0PrGhFn3__k4QIBjlvDe70Rdokjw
 * 3. วางโค้ดนี้ทั้งหมดลงในไฟล์ Code.gs (แทนที่โค้ดเดิมทั้งหมด)
 * 4. กดไอคอน "บันทึก" (Save)
 * 5. กดปุ่ม "การทำให้ใช้งานได้" (Deploy) > "จัดการการทำให้ใช้งานได้" (Manage deployments)
 * 6. กดไอคอนดินสอ (แก้ไข) > เลือกเวอร์ชัน: "เวอร์ชันใหม่" (New version)
 *    หรือกด "การทำให้ใช้งานได้รายการใหม่" (New deployment)
 * 7. ประเภท: "เว็บแอปพลิเคชัน" (Web app)
 * 8. ผู้ที่มีสิทธิ์เข้าถึง: "ทุกคน" (Anyone)
 * 9. กด "ทำให้ใช้งานได้" (Deploy)
 */

const SPREADSHEET_ID = "1sWtO4fwScHbvDmu0PrGhFn3__k4QIBjlvDe70Rdokjw";
const TAB_NAME = "ข้อมูลสถานการณ์ขนถ่าย";
const FALLEN_CANE_TAB_NAME = "รายงานอ้อยตกหล่น";
const FALLEN_CANE_FOLDER_NAME = "อ้อยตกหล่น2569/70";

// ฟังก์ชันดึง Google Sheet
function getSpreadsheet() {
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (e) {
    Logger.log("openById error: " + e.toString());
    return SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.create("รายงานสถานการณ์สถานีขนถ่ายอ้อย_2569-70");
  }
}

// ฟังก์ชันหาโฟลเดอร์ Google Drive ที่ Google Sheet วางอยู่
function getSheetParentFolder() {
  try {
    const file = DriveApp.getFileById(SPREADSHEET_ID);
    const parents = file.getParents();
    if (parents.hasNext()) {
      return parents.next();
    }
  } catch (e) {
    Logger.log("getParentFolder error: " + e.toString());
  }
  return DriveApp.getRootFolder();
}

// ฟังก์ชันสร้างหรือดึงแท็บ "ข้อมูลสถานการณ์ขนถ่าย"
function getOrCreateSheet(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(TAB_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(TAB_NAME, 0);
    const headers = [
      "รหัสบันทึก (ID)",
      "วันที่ (พ.ศ.)",
      "ช่วงเวลา",
      "ชื่อสถานีขนถ่าย",
      "สถานการณ์ / สถานะ",
      "หมายเหตุ",
      "ลิงก์รูปตาชั่ง (Google Drive)",
      "ลิงก์รูปเครน (Google Drive)",
      "ผู้บันทึก",
      "เวลาที่บันทึกลงระบบ"
    ];
    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#059669"); // Emerald Dark
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return { sheet };
}

// ฟังก์ชันสร้างหรือดึงแท็บ "รายงานอ้อยตกหล่น"
function getOrCreateFallenCaneSheet(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(FALLEN_CANE_TAB_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(FALLEN_CANE_TAB_NAME);
    const headers = [
      "รหัสบันทึก (ID)",
      "วันที่ (พ.ศ.)",
      "ชื่อสถานีขนถ่าย",
      "หมายเหตุ",
      "ลิงก์รูปอ้อยตกหล่น (Google Drive)",
      "ผู้บันทึก",
      "เวลาที่บันทึกลงระบบ"
    ];
    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#b45309"); // Amber Dark
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ฟังก์ชันสร้างหรือดึงโฟลเดอร์ "อ้อยตกหล่น2569/70" ในโฟลเดอร์เดียวกับ Google Sheet
function getOrCreateFallenCaneFolder(parentFolder) {
  const folders = parentFolder.getFoldersByName(FALLEN_CANE_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  const newFolder = parentFolder.createFolder(FALLEN_CANE_FOLDER_NAME);
  newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return newFolder;
}

// ฟังก์ชันสร้างหรือดึง "โฟลเดอร์รายวัน (Daily Folder)"
function getOrCreateDailyFolder(parentFolder, dateStr, thaiDateFormatted) {
  let dailyFolderName = "";
  if (thaiDateFormatted && thaiDateFormatted.toString().trim() !== "") {
    dailyFolderName = "วันที่ " + thaiDateFormatted.toString().trim();
  } else if (dateStr && dateStr.toString().trim() !== "") {
    dailyFolderName = "วันที่ " + dateStr.toString().trim();
  } else {
    dailyFolderName = "วันที่ " + Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
  }

  const subFolders = parentFolder.getFoldersByName(dailyFolderName);
  if (subFolders.hasNext()) {
    return subFolders.next();
  }
  const newDailyFolder = parentFolder.createFolder(dailyFolderName);
  newDailyFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return newDailyFolder;
}

// ฟังก์ชันบันทึกรูป Base64 ลงในโฟลเดอร์ Google Drive
function saveImageToDrive(folder, base64Data, filename) {
  if (!base64Data || typeof base64Data !== "string") {
    return "";
  }
  if (!base64Data.startsWith("data:image")) {
    // Already a URL or empty
    return base64Data.startsWith("http") ? base64Data : "";
  }
  try {
    const parts = base64Data.split(",");
    if (parts.length < 2) return "";
    const contentType = parts[0].split(";")[0].replace("data:", "") || "image/jpeg";
    const decodedBytes = Utilities.base64Decode(parts[1]);
    const blob = Utilities.newBlob(decodedBytes, contentType, filename);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    Logger.log("Save image error: " + err.toString());
    return "";
  }
}

// จัดการคำขอแบบ POST (บันทึก / แก้ไข / ลบ)
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(30000);
  
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action || "addRecord";
    const spreadsheet = getSpreadsheet();
    const parentFolder = getSheetParentFolder();
    
    // 1. เพิ่มข้อมูลสถานการณ์ขนถ่าย (Add Record)
    if (action === "addRecord") {
      const { sheet } = getOrCreateSheet(spreadsheet);
      const rec = postData.record;
      const dailyFolder = getOrCreateDailyFolder(parentFolder, rec.dateStr, rec.thaiDateFormatted);
      
      let scaleUrl = "";
      let craneUrl = "";
      const timeClean = (rec.timeSlot || "").replace(/[\s\:]/g, "_");
      const stationClean = (rec.stationName || "สถานี").replace(/[\s\/]/g, "_");
      const recordId = rec.id || ("REC-" + Date.now());

      if (rec.scaleImageUrl) {
        const scaleName = rec.scaleImageName || ("ตาชั่ง_" + stationClean + "_" + timeClean + "_" + recordId + ".jpg");
        scaleUrl = saveImageToDrive(dailyFolder, rec.scaleImageUrl, scaleName);
      }
      if (rec.craneImageUrl) {
        const craneName = rec.craneImageName || ("เครน_" + stationClean + "_" + timeClean + "_" + recordId + ".jpg");
        craneUrl = saveImageToDrive(dailyFolder, rec.craneImageUrl, craneName);
      }
      
      const newRow = [
        recordId,
        rec.thaiDateFormatted || "",
        rec.timeSlot || "",
        rec.stationName || "",
        Array.isArray(rec.statuses) ? rec.statuses.join(", ") : (rec.statuses || ""),
        rec.note || "-",
        scaleUrl || (rec.scaleImageUrl ? "มีรูปภาพในระบบ" : "-"),
        craneUrl || (rec.craneImageUrl ? "มีรูปภาพในระบบ" : "-"),
        rec.recordedBy || "ผู้บันทึก",
        new Date().toLocaleString("th-TH")
      ];
      sheet.appendRow(newRow);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "บันทึกข้อมูลและรูปภาพลง Google Drive สำเร็จ",
        dailyFolderName: dailyFolder.getName(),
        dailyFolderUrl: dailyFolder.getUrl(),
        scaleUrl: scaleUrl,
        craneUrl: craneUrl
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 2. แก้ไขข้อมูลสถานการณ์ขนถ่าย (Update Record)
    if (action === "updateRecord") {
      const { sheet } = getOrCreateSheet(spreadsheet);
      const rec = postData.record;
      const data = sheet.getDataRange().getValues();
      let foundRow = -1;
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] == rec.id) {
          foundRow = i + 1;
          break;
        }
      }
      
      if (foundRow > 0) {
        let scaleUrl = data[foundRow - 1][6];
        let craneUrl = data[foundRow - 1][7];
        const dailyFolder = getOrCreateDailyFolder(parentFolder, rec.dateStr, rec.thaiDateFormatted);
        const timeClean = (rec.timeSlot || "").replace(/[\s\:]/g, "_");
        const stationClean = (rec.stationName || "สถานี").replace(/[\s\/]/g, "_");

        if (rec.scaleImageUrl && rec.scaleImageUrl.startsWith("data:image")) {
          const scaleName = rec.scaleImageName || ("ตาชั่ง_" + stationClean + "_" + timeClean + "_" + rec.id + ".jpg");
          scaleUrl = saveImageToDrive(dailyFolder, rec.scaleImageUrl, scaleName);
        }
        if (rec.craneImageUrl && rec.craneImageUrl.startsWith("data:image")) {
          const craneName = rec.craneImageName || ("เครน_" + stationClean + "_" + timeClean + "_" + rec.id + ".jpg");
          craneUrl = saveImageToDrive(dailyFolder, rec.craneImageUrl, craneName);
        }
        
        sheet.getRange(foundRow, 2, 1, 9).setValues([[
          rec.thaiDateFormatted || "",
          rec.timeSlot || "",
          rec.stationName || "",
          Array.isArray(rec.statuses) ? rec.statuses.join(", ") : (rec.statuses || ""),
          rec.note || "-",
          scaleUrl || "-",
          craneUrl || "-",
          rec.recordedBy || "ผู้บันทึก",
          new Date().toLocaleString("th-TH") + " (แก้ไข)"
        ]]);
        
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          message: "แก้ไขข้อมูลและบันทึกรูปภาพเรียบร้อยแล้ว",
          dailyFolderName: dailyFolder.getName(),
          dailyFolderUrl: dailyFolder.getUrl(),
          scaleUrl: scaleUrl,
          craneUrl: craneUrl
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // 3. ลบข้อมูลสถานการณ์ขนถ่าย (Delete Record)
    if (action === "deleteRecord") {
      const { sheet } = getOrCreateSheet(spreadsheet);
      const recordId = postData.id;
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] == recordId) {
          sheet.deleteRow(i + 1);
          return ContentService.createTextOutput(JSON.stringify({
            status: "success",
            message: "ลบข้อมูลสำเร็จ"
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    // 4. บันทึกข้อมูลรายงานอ้อยตกหล่น (Add Fallen Cane Record)
    if (action === "addFallenCaneRecord") {
      const fallenSheet = getOrCreateFallenCaneSheet(spreadsheet);
      const fallenRootFolder = getOrCreateFallenCaneFolder(parentFolder);
      const rec = postData.record;
      const dailyFolder = getOrCreateDailyFolder(fallenRootFolder, rec.dateStr, rec.thaiDateFormatted);

      let imageUrl = "";
      const recordId = rec.id || ("FALLEN-" + Date.now());
      const stationClean = (rec.stationName || "สถานี").replace(/[\s\/]/g, "_");

      if (rec.imageUrl && rec.imageUrl.startsWith("data:image")) {
        const imgName = rec.imageName || ("อ้อยตกหล่น_" + stationClean + "_" + recordId + ".jpg");
        imageUrl = saveImageToDrive(dailyFolder, rec.imageUrl, imgName);
      } else if (rec.imageUrl && rec.imageUrl.startsWith("http")) {
        imageUrl = rec.imageUrl;
      }

      const newRow = [
        recordId,
        rec.thaiDateFormatted || "",
        rec.stationName || "",
        rec.note || "-",
        imageUrl || (rec.imageUrl ? "มีรูปภาพในระบบ" : "-"),
        rec.recordedBy || "ผู้บันทึก",
        new Date().toLocaleString("th-TH")
      ];
      fallenSheet.appendRow(newRow);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "บันทึกรายงานอ้อยตกหล่นลง Google Sheet และ Google Drive เรียบร้อย",
        dailyFolderName: dailyFolder.getName(),
        dailyFolderUrl: dailyFolder.getUrl(),
        imageUrl: imageUrl,
        recordId: recordId
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 5. ลบรายงานอ้อยตกหล่น (Delete Fallen Cane Record)
    if (action === "deleteFallenCaneRecord") {
      const fallenSheet = getOrCreateFallenCaneSheet(spreadsheet);
      const recordId = postData.id;
      const data = fallenSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] == recordId) {
          fallenSheet.deleteRow(i + 1);
          return ContentService.createTextOutput(JSON.stringify({
            status: "success",
            message: "ลบรายงานอ้อยตกหล่นสำเร็จ"
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "ไม่พบคำสั่งที่ต้องการ: " + action
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// จัดการคำขอแบบ GET (ดึงข้อมูลสถานการณ์และรายงานอ้อยตกหล่นทั้งหมด)
function doGet(e) {
  try {
    const spreadsheet = getSpreadsheet();
    const { sheet } = getOrCreateSheet(spreadsheet);
    const fallenSheet = getOrCreateFallenCaneSheet(spreadsheet);
    const parentFolder = getSheetParentFolder();
    const fallenRootFolder = getOrCreateFallenCaneFolder(parentFolder);
    
    // 1. Station records
    const data = sheet.getDataRange().getValues();
    const headers = data[0] || [];
    const rows = [];
    for (let i = 1; i < data.length; i++) {
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = data[i][j];
      }
      rows.push(row);
    }

    // 2. Fallen cane records
    const fallenData = fallenSheet.getDataRange().getValues();
    const fallenHeaders = fallenData[0] || [];
    const fallenRows = [];
    for (let i = 1; i < fallenData.length; i++) {
      const row = {};
      for (let j = 0; j < fallenHeaders.length; j++) {
        row[fallenHeaders[j]] = fallenData[i][j];
      }
      fallenRows.push(row);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "ระบบเชื่อมต่อ Google Sheet และ Google Drive สำเร็จ",
      spreadsheetId: SPREADSHEET_ID,
      sheetUrl: spreadsheet.getUrl(),
      driveFolderUrl: parentFolder.getUrl(),
      fallenCaneFolderUrl: fallenRootFolder.getUrl(),
      totalRecords: rows.length,
      data: rows,
      totalFallenCaneRecords: fallenRows.length,
      fallenCaneData: fallenRows
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
