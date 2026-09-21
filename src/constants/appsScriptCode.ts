export const APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * Google Apps Script: ระบบรายงานสถานการณ์สถานีขนถ่ายอ้อย โรงงานน้ำตาลราชสีมา
 * ปีการผลิต 2569/70
 * =========================================================================
 * 
 * ความสามารถของสคริปต์นี้:
 * 1. สร้าง Google Sheet อัตโนมัติ: "รายงานสถานการณ์สถานีขนถ่ายอ้อย_2569-70"
 * 2. สร้างโฟลเดอร์หลัก Google Drive อัตโนมัติ: "สถานีขนถ่ายอ้อย_โรงงานน้ำตาลราชสีมา_2569-70"
 * 3. [อัปเดตใหม่] จัดเก็บรูปภาพแยกเป็น "โฟลเดอร์รายวัน (Daily Folder)" อัตโนมัติ เช่น "วันที่ 21 ก.ย. 2569"
 * 4. บันทึกรูปภาพ ตาชั่ง (Scale) และ เครน (Crane) ลงในโฟลเดอร์ประจำวันนั้นๆ
 * 5. นำลิงก์รูปภาพใน Google Drive มาใส่ในช่องของ Google Sheet ให้อัตโนมัติ
 * 6. รองรับคำสั่ง เพิ่มข้อมูล (addRecord), แก้ไข (updateRecord), และลบ (deleteRecord)
 * 
 * วิธีการติดตั้ง / อัปเดตสคริปต์:
 * 1. ไปที่ https://script.google.com
 * 2. เปิดโครงการเดิม หรือกด "โครงการใหม่" (New Project)
 * 3. วางโค้ดนี้ทั้งหมดลงในไฟล์ Code.gs (แทนที่โค้ดเดิมทั้งหมด)
 * 4. กดไอคอน "บันทึก" (Save / รูปแผ่นดิสก์)
 * 5. กดปุ่ม "การทำให้ใช้งานได้" (Deploy) > "การทำให้ใช้งานได้รายการใหม่" (New Deployment)
 *    (หรือแก้ไขรายการเดิมแล้วเลือก "เวอร์ชันใหม่ / New version")
 * 6. เลือกประเภท: "เว็บแอปพลิเคชัน" (Web app)
 * 7. ช่อง "ผู้ที่มีสิทธิ์เข้าถึง" (Who has access): สำคัญมาก! ต้องเลือก "ทุกคน" (Anyone)
 * 8. กด "ทำให้ใช้งานได้" (Deploy) และคัดลอก URL เว็บแอปมาใส่ในระบบ
 */

const SHEET_NAME = "รายงานสถานการณ์สถานีขนถ่ายอ้อย_2569-70";
const TAB_NAME = "ข้อมูลสถานการณ์ขนถ่าย";
const ROOT_DRIVE_FOLDER_NAME = "สถานีขนถ่ายอ้อย_โรงงานน้ำตาลราชสีมา_2569-70";

// ฟังก์ชันสร้างหรือดึง Google Sheet อัตโนมัติ
function getOrCreateSheet() {
  const files = DriveApp.getFilesByName(SHEET_NAME);
  let spreadsheet;
  if (files.hasNext()) {
    spreadsheet = SpreadsheetApp.open(files.next());
  } else {
    spreadsheet = SpreadsheetApp.create(SHEET_NAME);
  }
  
  let sheet = spreadsheet.getSheetByName(TAB_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(TAB_NAME);
    // สร้างหัวตาราง
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
    // ตกแต่งแถวหัวตาราง
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#059669"); // Emerald Dark
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return { spreadsheet, sheet };
}

// ฟังก์ชันสร้างหรือดึงโฟลเดอร์หลัก Google Drive อัตโนมัติ
function getOrCreateRootFolder() {
  const folders = DriveApp.getFoldersByName(ROOT_DRIVE_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  const newFolder = DriveApp.createFolder(ROOT_DRIVE_FOLDER_NAME);
  newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return newFolder;
}

// ฟังก์ชันสร้างหรือดึง "โฟลเดอร์รายวัน (Daily Folder)" ภายใต้โฟลเดอร์หลัก
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

// ฟังก์ชันบันทึกรูป Base64 ลงในโฟลเดอร์ Google Drive ที่กำหนด
function saveImageToDrive(folder, base64Data, filename) {
  if (!base64Data || typeof base64Data !== "string" || !base64Data.startsWith("data:image")) {
    return "";
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
    const { sheet } = getOrCreateSheet();
    const rootFolder = getOrCreateRootFolder();
    
    // 1. เพิ่มข้อมูลใหม่ (Add Record) พร้อมแยกรูปใส่โฟลเดอร์รายวัน
    if (action === "addRecord") {
      const rec = postData.record;
      // หาหรือสร้างโฟลเดอร์รายวัน
      const dailyFolder = getOrCreateDailyFolder(rootFolder, rec.dateStr, rec.thaiDateFormatted);
      
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
        message: "บันทึกข้อมูลและรูปภาพลงโฟลเดอร์รายวันใน Google Drive สำเร็จ",
        dailyFolderName: dailyFolder.getName(),
        dailyFolderUrl: dailyFolder.getUrl(),
        scaleUrl: scaleUrl,
        craneUrl: craneUrl
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 2. แก้ไขข้อมูล (Update Record)
    if (action === "updateRecord") {
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
        const dailyFolder = getOrCreateDailyFolder(rootFolder, rec.dateStr, rec.thaiDateFormatted);
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
    
    // 3. ลบข้อมูล (Delete Record)
    if (action === "deleteRecord") {
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
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "ไม่พบคำสั่งที่ต้องการ"
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

// จัดการคำขอแบบ GET (ทดสอบการเชื่อมต่อและดึงข้อมูล)
function doGet(e) {
  try {
    const { sheet, spreadsheet } = getOrCreateSheet();
    const rootFolder = getOrCreateRootFolder();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = data[i][j];
      }
      rows.push(row);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "ระบบเชื่อมต่อ Google Sheet และ Google Drive สำเร็จ",
      sheetUrl: spreadsheet.getUrl(),
      driveFolderUrl: rootFolder.getUrl(),
      totalRecords: rows.length,
      data: rows
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
