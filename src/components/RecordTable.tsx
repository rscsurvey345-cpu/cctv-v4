import React, { useState } from 'react';
import { StationRecord, StatusType } from '../types';
import {
  STATIONS,
  TIME_SLOTS,
  STATUS_LIST,
  StatusMeta,
  toThaiDateFormatted,
  getCurrentThaiDate,
} from '../constants/stations';
import {
  TableProperties,
  Calendar,
  Clock,
  MapPin,
  Search,
  Filter,
  Eye,
  Download,
  Trash2,
  Edit,
  Camera,
  Scale,
  Construction,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { PhotoModal } from './PhotoModal';
import { EditRecordModal } from './EditRecordModal';
import { getDriveThumbnailUrl } from '../lib/syncSheet';

interface RecordTableProps {
  records: StationRecord[];
  onDeleteRecord: (id: string) => void;
  onUpdateRecord: (updated: StationRecord) => void;
  onSyncAllToGoogle: () => void;
  onRefreshFromGoogle?: () => void;
  isSyncing: boolean;
  isRefreshing?: boolean;
  lastRefreshed?: string;
  googleConnected: boolean;
}

export const RecordTable: React.FC<RecordTableProps> = ({
  records,
  onDeleteRecord,
  onUpdateRecord,
  onSyncAllToGoogle,
  onRefreshFromGoogle,
  isSyncing,
  isRefreshing = false,
  lastRefreshed = '',
  googleConnected,
}) => {
  const today = getCurrentThaiDate();

  // Filters
  const [filterDate, setFilterDate] = useState<string>(today.dateStr);
  const [filterTimeSlot, setFilterTimeSlot] = useState<string>('all');
  const [filterStation, setFilterStation] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [onlyExactDateAndTime, setOnlyExactDateAndTime] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals state
  const [activePhoto, setActivePhoto] = useState<{
    recordId: string;
    type: 'scale' | 'crane';
    title: string;
    url?: string;
    stationName: string;
    timeSlot: string;
  } | null>(null);

  const [editingRecord, setEditingRecord] = useState<StationRecord | null>(null);

  // Filter logic
  const filteredRecords = records.filter((rec) => {
    // If strict toggle is enabled: must match exact date AND exact time slot
    if (onlyExactDateAndTime) {
      if (filterDate && rec.dateStr !== filterDate) return false;
      if (filterTimeSlot !== 'all' && rec.timeSlot !== filterTimeSlot) return false;
    } else {
      if (filterDate && rec.dateStr !== filterDate && filterDate !== 'all') {
        return false;
      }
      if (filterTimeSlot !== 'all' && rec.timeSlot !== filterTimeSlot) {
        return false;
      }
    }

    if (filterStation !== 'all' && rec.stationName !== filterStation) {
      return false;
    }

    if (filterStatus !== 'all') {
      if (!rec.statuses.includes(filterStatus as StatusType)) {
        return false;
      }
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = rec.stationName.toLowerCase().includes(term);
      const matchNote = (rec.note || '').toLowerCase().includes(term);
      const matchUser = (rec.recordedBy || '').toLowerCase().includes(term);
      if (!matchName && !matchNote && !matchUser) return false;
    }

    return true;
  });

  // Handle Photo Replace / Upload from Table
  const handleReplacePhotoInTable = (
    rec: StationRecord,
    type: 'scale' | 'crane',
    file: File
  ) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const updated: StationRecord = {
        ...rec,
        ...(type === 'scale'
          ? { scaleImageUrl: result, scaleImageName: file.name }
          : { craneImageUrl: result, craneImageName: file.name }),
        updatedAt: Date.now(),
      };
      onUpdateRecord(updated);
    };
    reader.readAsDataURL(file);
  };

  // Handle Photo Delete from Table
  const handleDeletePhotoInTable = (rec: StationRecord, type: 'scale' | 'crane') => {
    if (window.confirm(`คุณต้องการลบรูปภาพ${type === 'scale' ? 'ตาชั่ง' : 'เครน'}ของ ${rec.stationName} ใช่หรือไม่?`)) {
      const updated: StationRecord = {
        ...rec,
        ...(type === 'scale'
          ? { scaleImageUrl: undefined, scaleImageName: undefined }
          : { craneImageUrl: undefined, craneImageName: undefined }),
        updatedAt: Date.now(),
      };
      onUpdateRecord(updated);
    }
  };

  // Download single photo
  const handleDownloadPhoto = (
    url: string,
    stationName: string,
    timeSlot: string,
    typeLabel: string
  ) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${typeLabel}_${stationName}_${timeSlot.replace(/[\s\:]/g, '_')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert('ไม่มีข้อมูลที่จะส่งออก');
      return;
    }

    const headers = [
      'ลำดับ',
      'วันที่ (พ.ศ.)',
      'ช่วงเวลา',
      'ชื่อสถานีขนถ่าย',
      'สถานะ',
      'หมายเหตุ',
      'รูปตาชั่ง',
      'รูปเครน',
      'ผู้บันทึก',
      'เวลาบันทึก',
    ];

    const rows = filteredRecords.map((r, idx) => [
      idx + 1,
      `"${r.thaiDateFormatted}"`,
      `"${r.timeSlot}"`,
      `"${r.stationName}"`,
      `"${r.statuses.join(', ')}"`,
      `"${(r.note || '').replace(/"/g, '""')}"`,
      `"${r.scaleImageUrl ? 'มีรูปภาพ' : 'ไม่มี'}"`,
      `"${r.craneImageUrl ? 'มีรูปภาพ' : 'ไม่มี'}"`,
      `"${r.recordedBy || ''}"`,
      `"${new Date(r.createdAt).toLocaleString('th-TH')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายงานสถานการณ์สถานีขนถ่ายอ้อย_${filterDate || 'ทั้งหมด'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Table Filter Card */}
      <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                ตัวกรองข้อมูลสถานการณ์สถานีขนถ่าย
              </h2>
              <p className="text-xs text-slate-500">
                เลือกดูตามวันที่ตามปฏิทินไทย ช่วงเวลา และสถานีที่ต้องการ
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onRefreshFromGoogle && (
              <button
                onClick={onRefreshFromGoogle}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                title="ดึงข้อมูลล่าสุดจาก Google Sheets เพื่อให้อุปกรณ์ทุกเครื่อง (มือถือ/คอม) แสดงข้อมูลตรงกัน"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูลล่าสุด (Sync)'}</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>ส่งออก CSV (Excel)</span>
            </button>

            {googleConnected && (
              <button
                onClick={onSyncAllToGoogle}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{isSyncing ? 'กำลังซิงค์...' : 'ซิงค์เข้า Google Sheet'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              วันที่ตามปฏิทินไทย
            </label>
            <div className="flex gap-1.5">
              <input
                type="date"
                value={filterDate === 'all' ? '' : filterDate}
                onChange={(e) => setFilterDate(e.target.value || 'all')}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-200 outline-hidden"
              />
              {filterDate !== 'all' && (
                <button
                  onClick={() => setFilterDate('all')}
                  className="text-[11px] px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg whitespace-nowrap"
                >
                  ทุกวัน
                </button>
              )}
            </div>
            {filterDate !== 'all' && (
              <span className="text-[11px] text-emerald-700 mt-1 block">
                {toThaiDateFormatted(filterDate)}
              </span>
            )}
          </div>

          {/* 2. Time Slot Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              ช่วงเวลา
            </label>
            <select
              value={filterTimeSlot}
              onChange={(e) => setFilterTimeSlot(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-200 outline-hidden"
            >
              <option value="all">-- ทุกช่วงเวลา (08:00 - 20:00 น.) --</option>
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Station Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              สถานีขนถ่าย
            </label>
            <select
              value={filterStation}
              onChange={(e) => setFilterStation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-200 outline-hidden"
            >
              <option value="all">-- ทั้ง 43 สถานี --</option>
              {STATIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Status Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              สถานะ / สถานการณ์
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-200 outline-hidden"
            >
              <option value="all">-- ทุกสถานะ --</option>
              {STATUS_LIST.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Search & Strict Date/Time Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyExactDateAndTime}
              onChange={(e) => setOnlyExactDateAndTime(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500"
            />
            <span className="text-xs text-slate-700 font-medium">
              โชว์ข้อมูลเฉพาะวันที่และเวลาที่เลือกตามปฏิทินเท่านั้น
            </span>
          </label>

          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาชื่อสถานี, หมายเหตุ, ผู้บันทึก..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Table Results Counter */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          พบข้อมูล <strong>{filteredRecords.length}</strong> รายการ จากทั้งหมด {records.length} รายการ
        </span>
        {onlyExactDateAndTime && (
          <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            โหมดกรองเฉพาะเจาะจง: {filterDate !== 'all' ? toThaiDateFormatted(filterDate) : ''}{' '}
            {filterTimeSlot !== 'all' ? filterTimeSlot : ''}
          </span>
        )}
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-emerald-50/80 text-emerald-900 uppercase font-semibold text-[11px] tracking-wider border-b border-emerald-100">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 min-w-[150px]">สถานีขนถ่าย</th>
                <th className="py-3 px-4 min-w-[140px]">วันที่และช่วงเวลา</th>
                <th className="py-3 px-4 min-w-[160px]">สถานการณ์ / สถานะ</th>
                <th className="py-3 px-4 min-w-[130px] text-center">รูปตาชั่ง</th>
                <th className="py-3 px-4 min-w-[130px] text-center">รูปเครน</th>
                <th className="py-3 px-4 min-w-[150px]">หมายเหตุ / ผู้บันทึก</th>
                <th className="py-3 px-4 w-28 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec, index) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Index */}
                    <td className="py-3 px-4 text-center font-medium text-slate-400">
                      {index + 1}
                    </td>

                    {/* Station Name */}
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{rec.stationName}</span>
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{rec.thaiDateFormatted}</div>
                      <div className="text-[11px] text-emerald-700 font-mono flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {rec.timeSlot}
                      </div>
                    </td>

                    {/* Status Badges */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {rec.statuses.map((st) => {
                          const meta = STATUS_LIST.find((m) => m.value === st);
                          return (
                            <span
                              key={st}
                              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                                meta?.badgeBg || 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${meta?.dotColor || 'bg-slate-400'}`} />
                              {st}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {/* Scale Image (ตาชั่ง) */}
                    <td className="py-3 px-4 text-center">
                      {rec.scaleImageUrl ? (
                        <div className="inline-flex flex-col items-center gap-1">
                          <div
                            onClick={() =>
                              setActivePhoto({
                                recordId: rec.id,
                                type: 'scale',
                                title: `รูปตาชั่ง - ${rec.stationName}`,
                                url: rec.scaleImageUrl,
                                stationName: rec.stationName,
                                timeSlot: rec.timeSlot,
                              })
                            }
                            className="relative group cursor-pointer w-16 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-900 shadow-2xs"
                          >
                            <img
                              src={getDriveThumbnailUrl(rec.scaleImageUrl)}
                              alt="ตาชั่ง"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye className="w-3.5 h-3.5" />
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                handleDownloadPhoto(
                                  rec.scaleImageUrl!,
                                  rec.stationName,
                                  rec.timeSlot,
                                  'ตาชั่ง'
                                )
                              }
                              title="ดาวน์โหลดรูปตาชั่ง"
                              className="p-1 hover:text-emerald-700 text-slate-400 transition-colors"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeletePhotoInTable(rec, 'scale')}
                              title="ลบรูปตาชั่ง"
                              className="p-1 hover:text-rose-700 text-slate-400 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-dashed border-slate-300 hover:border-emerald-500 text-slate-500 hover:text-emerald-700 cursor-pointer text-[10px] transition-colors">
                          <Upload className="w-3 h-3" />
                          <span>เพิ่มรูป</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleReplacePhotoInTable(rec, 'scale', e.target.files[0]);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </td>

                    {/* Crane Image (เครน) */}
                    <td className="py-3 px-4 text-center">
                      {rec.craneImageUrl ? (
                        <div className="inline-flex flex-col items-center gap-1">
                          <div
                            onClick={() =>
                              setActivePhoto({
                                recordId: rec.id,
                                type: 'crane',
                                title: `รูปเครน - ${rec.stationName}`,
                                url: rec.craneImageUrl,
                                stationName: rec.stationName,
                                timeSlot: rec.timeSlot,
                              })
                            }
                            className="relative group cursor-pointer w-16 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-900 shadow-2xs"
                          >
                            <img
                              src={getDriveThumbnailUrl(rec.craneImageUrl)}
                              alt="เครน"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye className="w-3.5 h-3.5" />
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                handleDownloadPhoto(
                                  rec.craneImageUrl!,
                                  rec.stationName,
                                  rec.timeSlot,
                                  'เครน'
                                )
                              }
                              title="ดาวน์โหลดรูปเครน"
                              className="p-1 hover:text-emerald-700 text-slate-400 transition-colors"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeletePhotoInTable(rec, 'crane')}
                              title="ลบรูปเครน"
                              className="p-1 hover:text-rose-700 text-slate-400 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-dashed border-slate-300 hover:border-teal-500 text-slate-500 hover:text-teal-700 cursor-pointer text-[10px] transition-colors">
                          <Upload className="w-3 h-3" />
                          <span>เพิ่มรูป</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleReplacePhotoInTable(rec, 'crane', e.target.files[0]);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </td>

                    {/* Note and Recorder */}
                    <td className="py-3 px-4">
                      <div className="text-slate-700 max-w-[220px] truncate" title={rec.note || ''}>
                        {rec.note || '-'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        โดย: {rec.recordedBy || 'เจ้าหน้าที่'}
                      </div>
                    </td>

                    {/* Actions: Edit & Delete */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setEditingRecord(rec)}
                          title="แก้ไขข้อมูล"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `คุณต้องการลบข้อมูล ${rec.stationName} (${rec.timeSlot}) ใช่หรือไม่?`
                              )
                            ) {
                              onDeleteRecord(rec.id);
                            }
                          }}
                          title="ลบข้อมูล"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <TableProperties className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">ไม่พบข้อมูลที่ตรงตามตัวกรอง</p>
                    <p className="text-xs text-slate-400 mt-1">
                      ลองเปลี่ยนวันที่ ช่วงเวลา หรือล้างตัวกรองเพื่อดูรายการทั้งหมด
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingRecord && (
        <EditRecordModal
          isOpen={true}
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSaveEdit={(updated) => {
            onUpdateRecord(updated);
            setEditingRecord(null);
          }}
        />
      )}

      {/* Photo Viewing Modal */}
      {activePhoto && (
        <PhotoModal
          isOpen={true}
          onClose={() => setActivePhoto(null)}
          title={activePhoto.title}
          stationName={activePhoto.stationName}
          timeSlot={activePhoto.timeSlot}
          imageUrl={activePhoto.url}
          imageType={activePhoto.type}
          onDeletePhoto={() => {
            const target = records.find((r) => r.id === activePhoto.recordId);
            if (target) {
              handleDeletePhotoInTable(target, activePhoto.type);
            }
          }}
          onReplacePhoto={(file) => {
            const target = records.find((r) => r.id === activePhoto.recordId);
            if (target) {
              handleReplacePhotoInTable(target, activePhoto.type, file);
            }
            setActivePhoto(null);
          }}
        />
      )}
    </div>
  );
};
