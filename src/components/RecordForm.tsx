import React, { useState, useRef } from 'react';
import {
  STATIONS,
  TIME_SLOTS,
  STATUS_LIST,
  StatusMeta,
  THAI_MONTHS,
  getCurrentThaiDate,
  toThaiDateFormatted,
} from '../constants/stations';
import { StationRecord, StatusType } from '../types';
import {
  Scale,
  Construction,
  Upload,
  Camera,
  Trash2,
  Download,
  Eye,
  Check,
  Calendar,
  Clock,
  MapPin,
  FileCheck,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { PhotoModal } from './PhotoModal';
import { compressImageFile } from '../lib/imageUtils';

interface RecordFormProps {
  onSaveRecord: (record: Omit<StationRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  isSyncing: boolean;
  userEmail?: string | null;
}

export const RecordForm: React.FC<RecordFormProps> = ({
  onSaveRecord,
  isSyncing,
  userEmail,
}) => {
  const initialDate = getCurrentThaiDate();

  // Form states
  const [selectedStation, setSelectedStation] = useState<string>(STATIONS[0]);
  const [stationSearch, setStationSearch] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(initialDate.dateStr);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(TIME_SLOTS[0]);
  const [selectedStatuses, setSelectedStatuses] = useState<StatusType[]>(['ปกติ']);
  const [note, setNote] = useState<string>('');
  const [recordedBy, setRecordedBy] = useState<string>(userEmail ? userEmail.split('@')[0] : 'เจ้าหน้าที่ขนถ่าย');

  // Photo states
  const [scaleImage, setScaleImage] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [craneImage, setCraneImage] = useState<{
    url: string;
    name: string;
  } | null>(null);

  // Photo Modal state
  const [activePhotoModal, setActivePhotoModal] = useState<{
    type: 'scale' | 'crane';
    title: string;
    url?: string;
  } | null>(null);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const scaleInputRef = useRef<HTMLInputElement>(null);
  const craneInputRef = useRef<HTMLInputElement>(null);

  // Filter stations by search term
  const filteredStations = STATIONS.filter((st) =>
    st.toLowerCase().includes(stationSearch.toLowerCase())
  );

  // Status toggle handler (multiple select allowed)
  const toggleStatus = (statusVal: StatusType) => {
    setSelectedStatuses((prev) => {
      // If clicking 'ปกติ' and it's not selected, clear other problem statuses or keep toggle
      if (statusVal === 'ปกติ') {
        if (prev.includes('ปกติ')) {
          return prev.filter((s) => s !== 'ปกติ');
        } else {
          return ['ปกติ'];
        }
      } else {
        // If clicking a non-normal status, remove 'ปกติ' if present
        const withoutNormal = prev.filter((s) => s !== 'ปกติ');
        if (withoutNormal.includes(statusVal)) {
          const res = withoutNormal.filter((s) => s !== statusVal);
          return res.length === 0 ? ['ปกติ'] : res;
        } else {
          return [...withoutNormal, statusVal];
        }
      }
    });
  };

  // Compress and convert uploaded file to web-ready JPEG base64
  const handleFileUpload = async (
    file: File,
    type: 'scale' | 'crane'
  ) => {
    if (!file) return;
    const { url, name } = await compressImageFile(file, 1600, 1600, 0.82);
    if (type === 'scale') {
      setScaleImage({ url, name });
    } else {
      setCraneImage({ url, name });
    }
  };

  // Thai Buddhist Year representation
  const [yearStr, monthStr, dayStr] = selectedDate.split('-');
  const thaiYear = parseInt(yearStr, 10) + 543;
  const monthIdx = parseInt(monthStr, 10) - 1;
  const formattedThaiDate = toThaiDateFormatted(selectedDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStatuses.length === 0) {
      alert('กรุณาเลือกสถานะอย่างน้อย 1 รายการ');
      return;
    }

    try {
      await onSaveRecord({
        stationName: selectedStation,
        dateStr: selectedDate,
        thaiDateFormatted: formattedThaiDate,
        buddhistYear: thaiYear,
        timeSlot: selectedTimeSlot,
        statuses: selectedStatuses,
        scaleImageUrl: scaleImage?.url,
        scaleImageName: scaleImage?.name,
        craneImageUrl: craneImage?.url,
        craneImageName: craneImage?.name,
        note: note.trim(),
        recordedBy: recordedBy.trim() || 'ผู้บันทึก',
      });

      setSaveSuccessMsg(`บันทึกข้อมูล ${selectedStation} (${selectedTimeSlot}) สำเร็จเรียบร้อย`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);

      // Reset image and note for next entry, advance time slot
      setScaleImage(null);
      setCraneImage(null);
      setNote('');

      // Auto increment slot to next if possible
      const currentIdx = TIME_SLOTS.indexOf(selectedTimeSlot);
      if (currentIdx >= 0 && currentIdx < TIME_SLOTS.length - 1) {
        setSelectedTimeSlot(TIME_SLOTS[currentIdx + 1]);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + (err.message || err));
    }
  };

  const handleReset = () => {
    if (window.confirm('คุณต้องการล้างข้อมูลในฟอร์มนี้ใช่หรือไม่?')) {
      setSelectedStatuses(['ปกติ']);
      setScaleImage(null);
      setCraneImage(null);
      setNote('');
    }
  };

  const downloadImageDirectly = (url: string, prefix: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prefix}_${selectedStation}_${selectedTimeSlot.replace(/[\s\:]/g, '_')}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner with season and prompt styling */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-medium mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>ปีการผลิต 2569/70 • โรงงานน้ำตาลราชสีมา</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              บันทึกสถานการณ์สถานีขนถ่ายอ้อย
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-2xl">
              รายงานความพร้อมของสถานีขนถ่าย สถานะการรับอ้อย พร้อมแนบรูปถ่ายตาชั่งและเครนประจำรอบเวลา
            </p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-xl p-3 text-right backdrop-blur-xs shrink-0">
            <div className="text-xs text-emerald-100">วันที่ตามปฏิทินไทย</div>
            <div className="text-base font-bold">{formattedThaiDate}</div>
            <div className="text-xs text-emerald-200 mt-0.5">รอบเวลา: {selectedTimeSlot}</div>
          </div>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium text-sm">{saveSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-600 hover:text-emerald-800 text-xs"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Main Record Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xs border border-emerald-100 p-6 sm:p-8 space-y-8">
        {/* Section 1: Selection - Station, Date (Thai BE), Time Slot */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-800 flex items-center gap-2 border-b border-emerald-100 pb-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            1. เลือกสถานี วันที่ และช่วงเวลา
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Station Dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="station-select" className="block text-xs font-semibold text-slate-700">
                สถานีขนถ่าย (ทั้งหมด 43 สถานี) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="station-select"
                  value={selectedStation}
                  onChange={(e) => setSelectedStation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-medium focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition-all"
                >
                  {STATIONS.map((st, idx) => (
                    <option key={st} value={st}>
                      {idx + 1}. {st}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-slate-400">
                เลือกจากสถานีขนถ่ายอ้อยเครนทั้ง 43 จุด
              </p>
            </div>

            {/* Thai Buddhist Era Date Selection */}
            <div className="space-y-1.5">
              <label htmlFor="date-input" className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>วันที่บันทึก (พ.ศ. แบบไทย) <span className="text-rose-500">*</span></span>
                <span className="text-[11px] font-normal text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md">
                  พ.ศ. {thaiYear}
                </span>
              </label>
              <div className="relative flex items-center">
                <input
                  id="date-input"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {formattedThaiDate} (พ.ศ. {thaiYear})
              </p>
            </div>

            {/* Time Slot Selection */}
            <div className="space-y-1.5">
              <label htmlFor="timeslot-select" className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>ช่วงเวลาบันทึก <span className="text-rose-500">*</span></span>
                <span className="text-[11px] font-normal text-slate-500">12 ช่วงเวลา</span>
              </label>
              <div className="relative">
                <select
                  id="timeslot-select"
                  value={selectedTimeSlot}
                  onChange={(e) => setSelectedTimeSlot(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-medium focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition-all"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-slate-400">
                ครอบคลุมเวลาทำงาน 08:00 - 20:00 น.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Multiple Checkbox Statuses */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              2. สถานการณ์ / สถานะของสถานี (ติ๊กเลือกได้มากกว่า 1 อย่าง) <span className="text-rose-500">*</span>
            </h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              เช่น หยุดรอรถ + หยุดรออ้อย
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {STATUS_LIST.map((statusItem) => {
              const isChecked = selectedStatuses.includes(statusItem.value);
              return (
                <button
                  type="button"
                  key={statusItem.value}
                  id={`status-check-${statusItem.value}`}
                  onClick={() => toggleStatus(statusItem.value)}
                  className={`flex flex-col items-start p-3.5 rounded-xl border-2 text-left transition-all relative ${
                    isChecked
                      ? 'bg-emerald-50/70 border-emerald-500 shadow-xs'
                      : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${statusItem.dotColor}`} />
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isChecked
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${isChecked ? 'text-emerald-950' : 'text-slate-800'}`}>
                    {statusItem.label}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                    {statusItem.description}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>สถานะที่เลือก:</strong>{' '}
              {selectedStatuses.length > 0 ? (
                selectedStatuses.map((s) => (
                  <span
                    key={s}
                    className="inline-block bg-white border border-emerald-300 text-emerald-800 px-2 py-0.5 rounded-md mx-1 font-medium"
                  >
                    ✓ {s}
                  </span>
                ))
              ) : (
                <span className="text-rose-500">ยังไม่ได้เลือกสถานะ</span>
              )}
            </span>
          </div>
        </div>

        {/* Section 3: Photo Uploads (ตาชั่ง & เครน) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-600" />
              3. อัพโหลดรูปภาพ 2 รูป (ตาชั่ง และ เครน)
            </h3>
            <span className="text-xs text-slate-500">
              บันทึกภาพลง Google Drive อัตโนมัติ
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. รูปตาชั่ง */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <Scale className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">รูปภาพ 1: ตาชั่ง</span>
                </div>
                {scaleImage && (
                  <span className="text-[11px] text-emerald-700 font-medium bg-emerald-100 px-2 py-0.5 rounded-full">
                    พร้อมอัพโหลด
                  </span>
                )}
              </div>

              {scaleImage ? (
                <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-black max-h-[220px] flex items-center justify-center">
                  <img
                    src={scaleImage.url}
                    alt="รูปตาชั่ง"
                    className="max-h-[220px] w-full object-contain"
                  />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                    <button
                      type="button"
                      onClick={() =>
                        setActivePhotoModal({
                          type: 'scale',
                          title: 'รูปตาชั่ง',
                          url: scaleImage.url,
                        })
                      }
                      title="ดูภาพขยาย"
                      className="p-2 rounded-lg bg-white/90 hover:bg-white text-slate-800 transition-colors shadow-xs"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadImageDirectly(scaleImage.url, 'ตาชั่ง')}
                      title="ดาวน์โหลดรูป"
                      className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scaleInputRef.current?.click()}
                      title="เปลี่ยนรูปภาพ"
                      className="p-2 rounded-lg bg-white/90 hover:bg-white text-slate-800 transition-colors shadow-xs"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setScaleImage(null)}
                      title="ลบรูปภาพ"
                      className="p-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => scaleInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-white group"
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">
                    คลิกเพื่อถ่ายรูป หรือ เลือกรูปตาชั่ง
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    รองรับไฟล์ JPG, PNG (ถ่ายภาพหน้าจอแสดงค่าน้ำหนัก)
                  </p>
                </div>
              )}

              <input
                ref={scaleInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0], 'scale');
                  }
                }}
                className="hidden"
              />

              {scaleImage && (
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="truncate max-w-[200px]">{scaleImage.name}</span>
                  <button
                    type="button"
                    onClick={() => setScaleImage(null)}
                    className="text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> ลบรูป
                  </button>
                </div>
              )}
            </div>

            {/* 2. รูปเครน */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700">
                    <Construction className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">รูปภาพ 2: เครน</span>
                </div>
                {craneImage && (
                  <span className="text-[11px] text-teal-700 font-medium bg-teal-100 px-2 py-0.5 rounded-full">
                    พร้อมอัพโหลด
                  </span>
                )}
              </div>

              {craneImage ? (
                <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-black max-h-[220px] flex items-center justify-center">
                  <img
                    src={craneImage.url}
                    alt="รูปเครน"
                    className="max-h-[220px] w-full object-contain"
                  />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                    <button
                      type="button"
                      onClick={() =>
                        setActivePhotoModal({
                          type: 'crane',
                          title: 'รูปเครน',
                          url: craneImage.url,
                        })
                      }
                      title="ดูภาพขยาย"
                      className="p-2 rounded-lg bg-white/90 hover:bg-white text-slate-800 transition-colors shadow-xs"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadImageDirectly(craneImage.url, 'เครน')}
                      title="ดาวน์โหลดรูป"
                      className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => craneInputRef.current?.click()}
                      title="เปลี่ยนรูปภาพ"
                      className="p-2 rounded-lg bg-white/90 hover:bg-white text-slate-800 transition-colors shadow-xs"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCraneImage(null)}
                      title="ลบรูปภาพ"
                      className="p-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => craneInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-white group"
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">
                    คลิกเพื่อถ่ายรูป หรือ เลือกรูปเครนขนถ่าย
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    รองรับไฟล์ JPG, PNG (ถ่ายภาพบริเวณเครนและจุดคีบอ้อย)
                  </p>
                </div>
              )}

              <input
                ref={craneInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0], 'crane');
                  }
                }}
                className="hidden"
              />

              {craneImage && (
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="truncate max-w-[200px]">{craneImage.name}</span>
                  <button
                    type="button"
                    onClick={() => setCraneImage(null)}
                    className="text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> ลบรูป
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Remarks & Recorder */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 space-y-1.5">
            <label htmlFor="note-textarea" className="block text-xs font-semibold text-slate-700">
              หมายเหตุ / รายละเอียดสถานการณ์เพิ่มเติม
            </label>
            <textarea
              id="note-textarea"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ระบุสาเหตุเพิ่มเติม เช่น รถตัดอ้อยติดหล่ม, รอรถพ่วงจากโรงงาน, สลิงเครนมีเสียงดัง..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="recorder-input" className="block text-xs font-semibold text-slate-700">
              ชื่อผู้บันทึกข้อมูล
            </label>
            <input
              id="recorder-input"
              type="text"
              value={recordedBy}
              onChange={(e) => setRecordedBy(e.target.value)}
              placeholder="เช่น อนุรักษ์ ลานอ้อย"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition-all"
            />
            <p className="text-[11px] text-slate-400">
              เจ้าหน้าที่ผู้รับผิดชอบสถานี
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-sm font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ล้างข้อมูลฟอร์ม</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              id="submit-record-btn"
              disabled={isSyncing}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-sm shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
            >
              <FileCheck className="w-4 h-4" />
              <span>{isSyncing ? 'กำลังบันทึกและซิงค์...' : 'บันทึกข้อมูลรายงาน'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* High-res Image Viewing Modal */}
      {activePhotoModal && (
        <PhotoModal
          isOpen={true}
          onClose={() => setActivePhotoModal(null)}
          title={activePhotoModal.title}
          stationName={selectedStation}
          timeSlot={selectedTimeSlot}
          imageUrl={activePhotoModal.url}
          imageType={activePhotoModal.type}
          onDeletePhoto={() => {
            if (activePhotoModal.type === 'scale') setScaleImage(null);
            else setCraneImage(null);
          }}
          onReplacePhoto={(file) => {
            handleFileUpload(file, activePhotoModal.type);
            setActivePhotoModal(null);
          }}
        />
      )}
    </div>
  );
};
