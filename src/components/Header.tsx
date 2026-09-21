import React from 'react';
import { ViewTab } from '../types';
import { User } from 'firebase/auth';
import { googleSignIn, googleSignOut } from '../lib/firebase';
import {
  ClipboardEdit,
  TableProperties,
  BarChart3,
  Code2,
  FileSpreadsheet,
  HardDrive,
  LogOut,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface HeaderProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  user: User | null;
  isLoggingIn: boolean;
  totalRecords: number;
  syncStatus: {
    sheetConnected: boolean;
    driveConnected: boolean;
    lastSynced?: string;
  };
  onRefreshFromGoogle?: () => void;
  isRefreshing?: boolean;
  lastRefreshed?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  user,
  isLoggingIn,
  totalRecords,
  syncStatus,
  onRefreshFromGoogle,
  isRefreshing = false,
  lastRefreshed = '',
}) => {
  const handleAuthAction = async () => {
    if (user) {
      if (window.confirm('คุณต้องการออกจากระบบ Google หรือไม่?')) {
        await googleSignOut();
      }
    } else {
      try {
        await googleSignIn();
      } catch (err: any) {
        console.error('Sign in error:', err);
      }
    }
  };

  return (
    <header className="bg-white border-b border-emerald-100 shadow-xs sticky top-0 z-30">
      {/* Top Utility Bar */}
      <div className="bg-emerald-800 text-emerald-50 px-4 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-emerald-700/80 px-2 py-0.5 rounded-full font-medium">
              <Sparkles className="w-3 h-3 text-emerald-300" />
              ปีการผลิต 2569/70
            </span>
            <span className="hidden sm:inline text-emerald-200">|</span>
            <span className="hidden sm:inline">โรงงานน้ำตาลราชสีมา (43 สถานีขนถ่ายอ้อย)</span>
          </div>

          <div className="flex items-center gap-2">
            {onRefreshFromGoogle && (
              <button
                onClick={onRefreshFromGoogle}
                disabled={isRefreshing}
                title="ดึงข้อมูลล่าสุดจาก Google Sheets เพื่อให้อุปกรณ์ทุกเครื่องแสดงข้อมูลตรงกัน"
                className="flex items-center gap-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-emerald-100 hover:text-white px-2.5 py-0.5 rounded-full transition-colors font-medium border border-emerald-600/60 cursor-pointer text-xs"
              >
                <RefreshCw className={`w-3 h-3 text-emerald-300 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูล (Cloud)'}</span>
                {lastRefreshed && (
                  <span className="hidden md:inline text-[10px] text-emerald-300 ml-0.5">
                    ({lastRefreshed})
                  </span>
                )}
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-2 bg-emerald-900/60 px-2.5 py-0.5 rounded-full border border-emerald-700/50">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="truncate max-w-[150px]">{user.displayName || user.email}</span>
                <button
                  onClick={handleAuthAction}
                  title="ออกจากระบบ"
                  className="hover:text-rose-300 ml-1 p-0.5 transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAuthAction}
                disabled={isLoggingIn}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-0.5 rounded-full transition-colors font-medium shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{isLoggingIn ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อ Google Sheets & Drive'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Header Brand & Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-200/50 shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  สถานการณ์สถานีขนถ่ายอ้อย
                </h1>
                <span className="hidden sm:inline-block text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-md border border-emerald-200">
                  43 สถานี
                </span>
              </div>
              <p className="text-xs text-slate-500">
                โรงงานน้ำตาลราชสีมา • บันทึกสถานะ ตาชั่ง และเครน ประจำรอบเวลา
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              id="tab-record"
              onClick={() => onTabChange('record')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                currentTab === 'record'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              <ClipboardEdit className="w-4 h-4" />
              <span>บันทึกข้อมูล</span>
            </button>

            <button
              id="tab-table"
              onClick={() => onTabChange('table')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                currentTab === 'table'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              <TableProperties className="w-4 h-4" />
              <span>ตารางข้อมูล</span>
              <span
                className={`text-xs px-1.5 py-0.2 rounded-full font-semibold ${
                  currentTab === 'table'
                    ? 'bg-emerald-700 text-emerald-100'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {totalRecords}
              </span>
            </button>

            <button
              id="tab-dashboard"
              onClick={() => onTabChange('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                currentTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>แดชบอร์ดสรุป</span>
            </button>

            <button
              id="tab-appsscript"
              onClick={() => onTabChange('appsscript')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                currentTab === 'appsscript'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Google Apps Script</span>
              {syncStatus.sheetConnected && (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>ถาวร</span>
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
