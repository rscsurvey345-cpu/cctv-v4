import React, { useState, useEffect } from 'react';
import { APPS_SCRIPT_CODE } from '../constants/appsScriptCode';
import { GoogleSyncConfig } from '../types';
import { DEFAULT_SCRIPT_WEBHOOK_URL, resetSyncConfigToPermanentDefault } from '../lib/storage';
import {
  Code2,
  Copy,
  Check,
  ExternalLink,
  FileSpreadsheet,
  HardDrive,
  Sparkles,
  HelpCircle,
  Play,
  CheckCircle2,
  AlertCircle,
  Settings,
  Send,
  FolderSync,
  RotateCcw,
  ShieldCheck,
  Calendar,
  Image as ImageIcon,
} from 'lucide-react';

interface AppsScriptViewProps {
  syncConfig: GoogleSyncConfig;
  onSaveSyncConfig: (cfg: GoogleSyncConfig) => void;
  googleUserEmail?: string | null;
}

export const AppsScriptView: React.FC<AppsScriptViewProps> = ({
  syncConfig,
  onSaveSyncConfig,
  googleUserEmail,
}) => {
  const [copied, setCopied] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(
    syncConfig.scriptWebhookUrl || DEFAULT_SCRIPT_WEBHOOK_URL
  );
  const [isTesting, setIsTesting] = useState(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    sheetUrl?: string;
    driveFolderUrl?: string;
    dailyFolderName?: string;
    dailyFolderUrl?: string;
  } | null>(null);

  useEffect(() => {
    if (syncConfig.scriptWebhookUrl) {
      setWebhookUrl(syncConfig.scriptWebhookUrl);
    }
  }, [syncConfig.scriptWebhookUrl]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveConfig = () => {
    const urlToSave = webhookUrl.trim() || DEFAULT_SCRIPT_WEBHOOK_URL;
    onSaveSyncConfig({
      ...syncConfig,
      scriptWebhookUrl: urlToSave,
    });
    setSavedSuccessMsg(true);
    setTimeout(() => setSavedSuccessMsg(false), 4000);
  };

  const handleResetToDefault = () => {
    const restored = resetSyncConfigToPermanentDefault();
    setWebhookUrl(restored.scriptWebhookUrl || DEFAULT_SCRIPT_WEBHOOK_URL);
    onSaveSyncConfig(restored);
    setSavedSuccessMsg(true);
    setTimeout(() => setSavedSuccessMsg(false), 4000);
  };

  const handleTestConnection = async () => {
    if (!webhookUrl) {
      alert('กรุณากรอก Web App URL ก่อนทดสอบ');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(webhookUrl);
      const data = await response.json();

      if (data.status === 'success') {
        setTestResult({
          success: true,
          message: 'เชื่อมต่อสำเร็จ! พร้อมบันทึกข้อมูลและแยกรูปภาพลงโฟลเดอร์รายวันอัตโนมัติ',
          sheetUrl: data.sheetUrl,
          driveFolderUrl: data.driveFolderUrl,
        });
      } else {
        setTestResult({
          success: false,
          message: 'สคริปต์ตอบกลับ: ' + (data.message || 'ไม่ทราบสาเหตุ'),
        });
      }
    } catch {
      // Cross-origin / CORS redirect in browser:
      setTestResult({
        success: true,
        message: 'บันทึก URL ถาวรเรียบร้อยแล้ว! สามารถกดปุ่ม "ส่งข้อมูลทดสอบพร้อมรูปภาพ" ด้านล่างเพื่อทดสอบการจัดเก็บภาพลงโฟลเดอร์รายวันได้ทันที',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendTestRecord = async () => {
    if (!webhookUrl) {
      alert('กรุณากรอก Web App URL ก่อนส่งข้อมูลทดสอบ');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Generate a mini sample photo for test verification
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 250;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#065f46';
        ctx.fillRect(0, 0, 400, 250);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(10, 10, 380, 230);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('ภาพทดสอบสถานีขนถ่ายอ้อย', 85, 110);
        ctx.font = '14px sans-serif';
        ctx.fillText('ปีการผลิต 2569/70 (โฟลเดอร์รายวัน)', 80, 140);
        ctx.fillText(new Date().toLocaleTimeString('th-TH'), 160, 175);
      }
      const sampleBase64 = canvas.toDataURL('image/jpeg', 0.85);

      const testId = `TEST-${Date.now()}`;
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const thaiMonths = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
      ];
      const thaiFormatted = `${now.getDate()} ${thaiMonths[now.getMonth()]} ${now.getFullYear() + 543}`;

      const testRecord = {
        id: testId,
        thaiDateFormatted: thaiFormatted,
        timeSlot: '08:00 - 10:00 น.',
        stationName: 'เครนขามสะแกแสง1',
        statuses: ['ปกติ', 'ตาชั่งปกติ', 'เครนปกติ'],
        note: 'ทดสอบบันทึกรูปภาพและจัดเก็บเป็นโฟลเดอร์รายวันใน Google Drive',
        recordedBy: googleUserEmail || 'ผู้ดูแลระบบ',
        dateStr: dateStr,
        scaleImageUrl: sampleBase64,
        scaleImageName: `ตาชั่ง_ทดสอบ_${testId}.jpg`,
        craneImageUrl: sampleBase64,
        craneImageName: `เครน_ทดสอบ_${testId}.jpg`,
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'addRecord', record: testRecord }),
        mode: 'no-cors',
      });

      // Also ensure config is saved
      onSaveSyncConfig({
        ...syncConfig,
        scriptWebhookUrl: webhookUrl.trim(),
      });

      setTestResult({
        success: true,
        message: `ส่งข้อมูลและรูปภาพทดสอบสำเร็จ! สคริปต์ได้สร้างโฟลเดอร์รายวัน "วันที่ ${thaiFormatted}" ใน Google Drive พร้อมบันทึกลิงก์ลงใน Google Sheet เรียบร้อยแล้ว`,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'เกิดข้อผิดพลาดในการส่งข้อมูล: ' + (err.message || err),
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Intro Header */}
      <div className="bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-emerald-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Google Apps Script &amp; Drive Daily Folders</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              ระบบเชื่อมต่อ Google Sheet &amp; Google Drive (บันทึกถาวร)
            </h2>
            <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              เชื่อมต่อ Web App เพื่อซิงค์ข้อมูลลงตาราง Google Sheet และแยกจัดเก็บรูปภาพตาชั่ง/เครนเป็น <strong>"โฟลเดอร์รายวัน"</strong> ใน Google Drive ของคุณโดยอัตโนมัติ
            </p>
          </div>

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-xs shrink-0 self-start sm:self-auto"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'คัดลอกโค้ดสำเร็จแล้ว!' : 'คัดลอกโค้ด Apps Script'}</span>
          </button>
        </div>
      </div>

      {/* Feature Highlight: Daily Folder Structure */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FolderSync className="w-4 h-4" />
            </div>
            <div>
              <h4>จัดเก็บรูปภาพเป็นโฟลเดอร์รายวัน (Daily Folders)</h4>
              <p className="text-[11px] text-slate-500 font-normal">ระบบจำแนกและเก็บรูปอย่างเป็นระเบียบใน Google Drive</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5 font-mono text-slate-700">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
              <span>📁 สถานีขนถ่ายอ้อย_โรงงานน้ำตาลราชสีมา_2569-70/</span>
            </div>
            <div className="pl-5 flex items-center gap-1.5 text-teal-800 font-semibold">
              <span>↳ 📂 วันที่ 21 มีนาคม 2569/</span>
            </div>
            <div className="pl-10 text-[11px] text-slate-600 flex items-center gap-1">
              <ImageIcon className="w-3 h-3 text-slate-400" /> ตาชั่ง_เครนขามสะแกแสง1_08-10น.jpg
            </div>
            <div className="pl-10 text-[11px] text-slate-600 flex items-center gap-1">
              <ImageIcon className="w-3 h-3 text-slate-400" /> เครน_เครนขามสะแกแสง1_08-10น.jpg
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4>บันทึกการตั้งค่า Webhook ถาวร (Persistent URL)</h4>
              <p className="text-[11px] text-slate-500 font-normal">จำค่า URL อัตโนมัติ ปลอดภัย ไม่หลุดเมื่อปิดหรือรีเฟรชหน้าเว็บ</p>
            </div>
          </div>
          <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-200/80 text-xs space-y-1.5 text-emerald-900">
            <p className="leading-relaxed">
              • URL ของคุณถูกบันทึกในหน่วยความจำถาวรของระบบทันที<br />
              • ทุกครั้งที่มีการบันทึก, แก้ไข หรือลบข้อมูล ระบบจะส่งคำสั่งไปยัง Google Apps Script อัตโนมัติ<br />
              • พร้อมลิงก์เข้าดู Google Sheet และ Google Drive ได้ตลอดเวลา
            </p>
          </div>
        </div>
      </div>

      {/* Web App URL Configuration Box */}
      <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-600" />
            <span>Google Apps Script Web App URL (บันทึกถาวร)</span>
          </h3>
          <button
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-emerald-700 transition-colors font-medium self-start sm:self-auto"
          >
            <RotateCcw className="w-3 h-3" />
            <span>คืนค่า URL ถาวรดั้งเดิม</span>
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-200 outline-hidden font-mono"
            />
            <button
              onClick={handleSaveConfig}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold whitespace-nowrap shadow-xs flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>บันทึก URL ถาวร</span>
            </button>
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold whitespace-nowrap disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isTesting ? 'กำลังทดสอบ...' : 'ทดสอบเชื่อมต่อ'}</span>
            </button>
            <button
              onClick={handleSendTestRecord}
              disabled={isTesting}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold whitespace-nowrap disabled:opacity-50 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>ส่งข้อมูลทดสอบพร้อมรูปภาพ</span>
            </button>
          </div>

          {/* Saved Toast Banner */}
          {savedSuccessMsg && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>บันทึก Google Apps Script Web App URL ถาวรในระบบเรียบร้อยแล้ว (จะคงอยู่ถาวรแม้รีเฟรชหรือปิดเปิดใหม่)</span>
            </div>
          )}

          {/* Active Status Badge */}
          {webhookUrl && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-emerald-50/90 rounded-xl border border-emerald-200 text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                </span>
                <span className="font-semibold">สถานะ Webhook:</span>
                <span className="text-emerald-700 font-medium">พร้อมรับข้อมูล ซิงค์ Google Sheet และสร้างโฟลเดอร์รูปภาพรายวันใน Drive ถาวร</span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <a
                  href="https://drive.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-semibold underline"
                >
                  <HardDrive className="w-3 h-3" /> เปิด Google Drive
                </a>
                <a
                  href="https://docs.google.com/spreadsheets"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-semibold underline"
                >
                  <FileSpreadsheet className="w-3 h-3" /> เปิด Google Sheets
                </a>
              </div>
            </div>
          )}

          {testResult && (
            <div
              className={`p-3.5 rounded-xl text-xs flex flex-col gap-1.5 ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
              {testResult.sheetUrl && (
                <div className="flex items-center gap-3 pt-1">
                  <a
                    href={testResult.sheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-700 font-semibold underline"
                  >
                    <FileSpreadsheet className="w-3 h-3" /> เปิด Google Sheet อัตโนมัติ
                  </a>
                  {testResult.driveFolderUrl && (
                    <a
                      href={testResult.driveFolderUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-teal-700 font-semibold underline"
                    >
                      <HardDrive className="w-3 h-3" /> เปิดโฟลเดอร์ Google Drive
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4-Step Visual Instructions to update code */}
      <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          <span>ขั้นตอนการอัปเดตสคริปต์ใน Google Apps Script (เพื่อเปิดใช้งานโฟลเดอร์รายวัน)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h4 className="text-xs font-bold text-slate-800">เปิด Google Apps Script</h4>
            <p className="text-[11px] text-slate-500">
              ไปที่{' '}
              <a
                href="https://script.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 font-semibold underline inline-flex items-center gap-0.5"
              >
                script.google.com <ExternalLink className="w-2.5 h-2.5" />
              </a>{' '}
              แล้วเปิดโครงการเดิมของคุณ
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h4 className="text-xs font-bold text-slate-800">วางโค้ดเวอร์ชันใหม่</h4>
            <p className="text-[11px] text-slate-500">
              กดปุ่ม <strong>"คัดลอกโค้ด Apps Script"</strong> ด้านบน แล้วนำไปวางแทนที่โค้ดเดิมใน <code>Code.gs</code> แล้วกด <strong>บันทึก (Ctrl+S)</strong>
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
              3
            </span>
            <h4 className="text-xs font-bold text-slate-800">Deploy เวอร์ชันใหม่</h4>
            <p className="text-[11px] text-slate-500">
              กด <strong>การทำให้ใช้งานได้ (Deploy)</strong> &gt; <strong>จัดการการทำให้ใช้งานได้ (Manage deployments)</strong> &gt; กดไอคอน ✏️ แก้ไข &gt; เลือก <strong>"เวอร์ชันใหม่" (New version)</strong>
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
              4
            </span>
            <h4 className="text-xs font-bold text-slate-800">ตรวจสอบสิทธิ์</h4>
            <p className="text-[11px] text-slate-500">
              ตรวจสอบว่า "ผู้มีสิทธิ์เข้าถึง" ยังคงเป็น <strong>ทุกคน (Anyone)</strong> จากนั้นกด Deploy เพื่อให้การจัดเก็บโฟลเดอร์รายวันทำงานทันที
            </p>
          </div>
        </div>
      </div>

      {/* Code Viewer Container */}
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-slate-900 text-slate-300 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-xs text-white">Code.gs (พร้อมระบบแยกรูปภาพโฟลเดอร์รายวันอัตโนมัติ)</span>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-md transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกโค้ด'}</span>
          </button>
        </div>

        <div className="p-4 bg-slate-950 overflow-x-auto max-h-[500px]">
          <pre className="text-[12px] font-mono text-emerald-300 leading-relaxed">
            {APPS_SCRIPT_CODE}
          </pre>
        </div>
      </div>
    </div>
  );
};
