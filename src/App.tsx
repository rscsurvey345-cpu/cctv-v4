import React, { useState, useEffect, useCallback } from 'react';
import { StationRecord, ViewTab, GoogleSyncConfig } from './types';
import { loadRecords, saveRecords, loadSyncConfig, saveSyncConfig, DEFAULT_SCRIPT_WEBHOOK_URL } from './lib/storage';
import { Header } from './components/Header';
import { RecordForm } from './components/RecordForm';
import { RecordTable } from './components/RecordTable';
import { Dashboard } from './components/Dashboard';
import { AppsScriptView } from './components/AppsScriptView';
import { initAuth, googleSignIn, getAccessToken } from './lib/firebase';
import {
  createSugarcaneSheet,
  createDriveFolder,
  createDailyDriveFolder,
  uploadBase64ImageToDrive,
  appendRecordToSheet,
} from './lib/googleApi';
import { User } from 'firebase/auth';
import { FileSpreadsheet, HardDrive, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('record');
  const [records, setRecords] = useState<StationRecord[]>([]);
  const [syncConfig, setSyncConfig] = useState<GoogleSyncConfig>({ autoSync: true });
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  // Initialize records and sync config
  useEffect(() => {
    const loaded = loadRecords();
    setRecords(loaded);
    const loadedConfig = loadSyncConfig();
    setSyncConfig(loadedConfig);
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const showNotification = (
    message: string,
    type: 'success' | 'info' | 'error' = 'success'
  ) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  // Sync a single record to Google Drive & Google Sheets
  const syncRecordToGoogleServices = async (
    rec: StationRecord,
    token: string,
    currentConfig: GoogleSyncConfig
  ): Promise<Partial<StationRecord>> => {
    let scaleDriveLink = '';
    let craneDriveLink = '';
    let updatedConfig = { ...currentConfig };

    try {
      // 1. Ensure Google Drive Root Folder exists
      let rootFolderId = updatedConfig.driveFolderId;
      if (!rootFolderId) {
        const folderRes = await createDriveFolder(token);
        rootFolderId = folderRes.folderId;
        updatedConfig.driveFolderId = rootFolderId;
        updatedConfig.driveFolderName = 'สถานีขนถ่ายอ้อย_โรงงานน้ำตาลราชสีมา_2569-70';
      }

      // 1.1 Create or get Daily Subfolder under Root Folder
      const dailyFolderName = `วันที่ ${rec.thaiDateFormatted || rec.dateStr}`;
      const dailyFolderRes = await createDailyDriveFolder(token, rootFolderId, dailyFolderName);
      const targetFolderId = dailyFolderRes.folderId;

      // 2. Upload Scale Image into Daily Subfolder if present
      if (rec.scaleImageUrl && targetFolderId && rec.scaleImageUrl.startsWith('data:image')) {
        const fileName =
          rec.scaleImageName ||
          `ตาชั่ง_${rec.stationName}_${rec.timeSlot.replace(/[\s\:]/g, '_')}.jpg`;
        const uploadRes = await uploadBase64ImageToDrive(
          token,
          targetFolderId,
          fileName,
          rec.scaleImageUrl
        );
        scaleDriveLink = uploadRes.webViewLink;
      }

      // 3. Upload Crane Image into Daily Subfolder if present
      if (rec.craneImageUrl && targetFolderId && rec.craneImageUrl.startsWith('data:image')) {
        const fileName =
          rec.craneImageName ||
          `เครน_${rec.stationName}_${rec.timeSlot.replace(/[\s\:]/g, '_')}.jpg`;
        const uploadRes = await uploadBase64ImageToDrive(
          token,
          targetFolderId,
          fileName,
          rec.craneImageUrl
        );
        craneDriveLink = uploadRes.webViewLink;
      }

      // 4. Ensure Google Sheet exists
      let sheetId = updatedConfig.spreadsheetId;
      if (!sheetId) {
        const sheetRes = await createSugarcaneSheet(token);
        sheetId = sheetRes.spreadsheetId;
        updatedConfig.spreadsheetId = sheetId;
        updatedConfig.spreadsheetName = 'รายงานสถานการณ์สถานีขนถ่ายอ้อย_2569-70';
      }

      // 5. Append to Google Sheet
      if (sheetId) {
        await appendRecordToSheet(
          token,
          sheetId,
          rec,
          records.length + 1,
          scaleDriveLink,
          craneDriveLink
        );
      }

      setSyncConfig(updatedConfig);
      saveSyncConfig(updatedConfig);

      return {
        syncedToGoogleSheet: true,
        scaleDriveId: scaleDriveLink,
        craneDriveId: craneDriveLink,
      };
    } catch (err: any) {
      console.warn('Google direct sync notice:', err);
      return { syncedToGoogleSheet: false };
    }
  };

  // Sync to Google Apps Script Webhook (Permanent connection)
  const syncToAppsScriptWebhook = async (action: string, record: any): Promise<boolean> => {
    const targetWebhook = syncConfig.scriptWebhookUrl || DEFAULT_SCRIPT_WEBHOOK_URL;
    if (!targetWebhook) return false;
    try {
      await fetch(targetWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, record }),
        mode: 'no-cors',
      });
      return true;
    } catch (err) {
      console.warn('Apps Script webhook error:', err);
      return false;
    }
  };

  // Save new record handler
  const handleSaveRecord = async (
    newRecordData: Omit<StationRecord, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    setIsSyncing(true);
    try {
      const id = `REC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      let fullRecord: StationRecord = {
        ...newRecordData,
        id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncedToGoogleSheet: false,
      };

      // If signed in with Google, sync directly
      const currentToken = accessToken || (await getAccessToken());
      if (currentToken) {
        const syncUpdates = await syncRecordToGoogleServices(
          fullRecord,
          currentToken,
          syncConfig
        );
        fullRecord = { ...fullRecord, ...syncUpdates };
      }

      // Sync to Google Apps Script Webhook (Always active & permanent)
      const targetWebhook = syncConfig.scriptWebhookUrl || DEFAULT_SCRIPT_WEBHOOK_URL;
      if (targetWebhook) {
        await syncToAppsScriptWebhook('addRecord', fullRecord);
        fullRecord = {
          ...fullRecord,
          syncedToGoogleSheet: true,
        };
      }

      const updatedRecords = [fullRecord, ...records];
      setRecords(updatedRecords);
      saveRecords(updatedRecords);

      showNotification(`บันทึกข้อมูล ${fullRecord.stationName} และจัดเก็บรูปภาพเรียบร้อยแล้ว`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Update existing record handler
  const handleUpdateRecord = (updated: StationRecord) => {
    const newRecords = records.map((r) => (r.id === updated.id ? updated : r));
    setRecords(newRecords);
    saveRecords(newRecords);

    const targetWebhook = syncConfig.scriptWebhookUrl || DEFAULT_SCRIPT_WEBHOOK_URL;
    if (targetWebhook) {
      syncToAppsScriptWebhook('updateRecord', updated);
    }

    showNotification(`อัปเดตข้อมูล ${updated.stationName} สำเร็จ`);
  };

  // Delete record handler
  const handleDeleteRecord = (id: string) => {
    const target = records.find((r) => r.id === id);
    const newRecords = records.filter((r) => r.id !== id);
    setRecords(newRecords);
    saveRecords(newRecords);

    const targetWebhook = syncConfig.scriptWebhookUrl || DEFAULT_SCRIPT_WEBHOOK_URL;
    if (targetWebhook) {
      syncToAppsScriptWebhook('deleteRecord', { id });
    }

    showNotification(
      `ลบข้อมูล ${target ? target.stationName : ''} เรียบร้อยแล้ว`,
      'info'
    );
  };

  // Batch sync all unsynced records to Google
  const handleSyncAllToGoogle = async () => {
    setIsSyncing(true);
    try {
      const targetWebhook = syncConfig.scriptWebhookUrl || DEFAULT_SCRIPT_WEBHOOK_URL;
      // 1. If Apps Script Webhook is configured, sync directly via webhook
      if (targetWebhook) {
        const updatedList = [...records];
        let syncedCount = 0;

        for (let i = 0; i < updatedList.length; i++) {
          if (!updatedList[i].syncedToGoogleSheet) {
            await syncToAppsScriptWebhook('addRecord', updatedList[i]);
            updatedList[i] = {
              ...updatedList[i],
              syncedToGoogleSheet: true,
            };
            syncedCount++;
          }
        }

        setRecords(updatedList);
        saveRecords(updatedList);
        showNotification(
          syncedCount > 0
            ? `ซิงค์ข้อมูล ${syncedCount} รายการไปยัง Google Sheets และ Google Drive เรียบร้อยแล้ว`
            : 'ข้อมูลทั้งหมดซิงค์กับ Google Sheets เรียบร้อยแล้ว'
        );
        return;
      }

      // 2. Direct Google OAuth flow if no webhook configured
      const token = accessToken || (await getAccessToken());
      if (!token) {
        try {
          const result = await googleSignIn();
          if (!result?.accessToken) {
            alert('กรุณาเข้าสู่ระบบ Google หรือตั้งค่า Google Apps Script Webhook');
            return;
          }
        } catch (e: any) {
          alert('เกิดข้อผิดพลาดในการเข้าสู่ระบบ Google');
          return;
        }
      }

      const activeToken = accessToken || (await getAccessToken())!;
      const updatedList = [...records];

      for (let i = 0; i < updatedList.length; i++) {
        if (!updatedList[i].syncedToGoogleSheet) {
          const syncRes = await syncRecordToGoogleServices(
            updatedList[i],
            activeToken,
            syncConfig
          );
          updatedList[i] = { ...updatedList[i], ...syncRes };
        }
      }

      setRecords(updatedList);
      saveRecords(updatedList);
      showNotification('ซิงค์ข้อมูลทั้งหมดลงใน Google Sheets สำเร็จเรียบร้อย');
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการซิงค์: ' + (err.message || err));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveSyncConfig = (cfg: GoogleSyncConfig) => {
    setSyncConfig(cfg);
    saveSyncConfig(cfg);
    showNotification('บันทึกการตั้งค่าการเชื่อมต่อแล้ว');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-200 selection:text-emerald-900">
      {/* App Header & Navigation */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        user={user}
        isLoggingIn={isLoggingIn}
        totalRecords={records.length}
        syncStatus={{
          sheetConnected: !!syncConfig.spreadsheetId || !!syncConfig.scriptWebhookUrl,
          driveConnected: !!syncConfig.driveFolderId || !!syncConfig.scriptWebhookUrl,
        }}
      />

      {/* Global Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-xs font-medium border ${
              notification.type === 'success'
                ? 'bg-emerald-900 text-emerald-50 border-emerald-700'
                : notification.type === 'error'
                ? 'bg-rose-900 text-rose-50 border-rose-700'
                : 'bg-slate-900 text-slate-50 border-slate-700'
            }`}
          >
            {notification.type === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            {notification.type === 'error' && (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Tab Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentTab === 'record' && (
          <RecordForm
            onSaveRecord={handleSaveRecord}
            isSyncing={isSyncing}
            userEmail={user?.email}
          />
        )}

        {currentTab === 'table' && (
          <RecordTable
            records={records}
            onDeleteRecord={handleDeleteRecord}
            onUpdateRecord={handleUpdateRecord}
            onSyncAllToGoogle={handleSyncAllToGoogle}
            isSyncing={isSyncing}
            googleConnected={!!user || !!syncConfig.scriptWebhookUrl}
          />
        )}

        {currentTab === 'dashboard' && <Dashboard records={records} />}

        {currentTab === 'appsscript' && (
          <AppsScriptView
            syncConfig={syncConfig}
            onSaveSyncConfig={handleSaveSyncConfig}
            googleUserEmail={user?.email}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            ระบบรายงานสถานการณ์สถานีขนถ่ายอ้อย • โรงงานน้ำตาลราชสีมา ปีการผลิต 2569/70 (43 สถานี)
          </span>
          <span className="text-emerald-700 font-medium">
            เชื่อมต่อ Google Sheets & Google Drive อัตโนมัติ
          </span>
        </div>
      </footer>
    </div>
  );
}
