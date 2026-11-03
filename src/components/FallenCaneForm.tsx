import React, { useState, useRef } from 'react';
import {
  STATIONS,
  getCurrentThaiDate,
  toThaiDateFormatted,
} from '../constants/stations';
import { FallenCaneRecord } from '../types';
import {
  Camera,
  Upload,
  Trash2,
  Eye,
  Calendar,
  MapPin,
  FileCheck,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  FolderTree,
  CheckCircle2,
} from 'lucide-react';
import { PhotoModal } from './PhotoModal';
import { compressImageFile } from '../lib/imageUtils';
import { getDriveThumbnailUrl } from '../lib/syncSheet';

interface FallenCaneFormProps {
  onSaveFallenCane: (record: Omit<FallenCaneRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onDeleteFallenCane?: (id: string) => void;
  fallenCaneRecords?: FallenCaneRecord[];
  isSyncing: boolean;
  userEmail?: string | null;
}

export const FallenCaneForm: React.FC<FallenCaneFormProps> = ({
  onSaveFallenCane,
  onDeleteFallenCane,
  fallenCaneRecords = [],
  isSyncing,
  userEmail,
}) => {
  const initialDate = getCurrentThaiDate();

  // Form states
  const [fallenStation, setFallenStation] = useState<string>(STATIONS[0]);
  const [fallenDate, setFallenDate] = useState<string>(initialDate.dateStr);
  const [fallenImage, setFallenImage] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [fallenNote, setFallenNote] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Photo Modal state
  const [activePhotoModal, setActivePhotoModal] = useState<{
    title: string;
    stationName: string;
    url: string;
  } | null>(null);

  const fallenInputRef = useRef<HTMLInputElement>(null);

  // Thai Buddhist Year representation
  const [fallenYearStr] = fallenDate.split('-');
  const fallenThaiYear = parseInt(fallenYearStr, 10) + 543;
  const formattedFallenThaiDate = toThaiDateFormatted(fallenDate);

  // Handle image upload & compression
  const handleImageUpload = async (file: File) => {
    if (!file) return;
    try {
      const { url, name } = await compressImageFile(file, 1600, 1600, 0.82);
      setFallenImage({ url, name });
    } catch (err: any) {
      alert('ไม่สามารถประมวลผลรูปภาพได้: ' + (err.message || err));
    }
  };

  // Submit Fallen Cane Record
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fallenImage?.url) {
      alert('กรุณาแนบรูปถ่ายอ้อยตกหล่นก่อนทำการบันทึก');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveFallenCane({
        stationName: fallenStation,
        dateStr: fallenDate,
        thaiDateFormatted: formattedFallenThaiDate,
        buddhistYear: fallenThaiYear,
        imageUrl: fallenImage.url,
        imageName: fallenImage.name,
        note: fallenNote.trim(),
        recordedBy: userEmail ? userEmail.split('@')[0] : 'เจ้าหน้าที่ตรวจการณ์',
      });

      setSuccessMsg(
        `บันทึกรายงานอ้อยตกหล่น ${fallenStation} (${formattedFallenThaiDate}) สำเร็จ`
      );
      setTimeout(() => setSuccessMsg(null), 5000);

      // Reset image and note
      setFallenImage(null);
      setFallenNote('');
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการบันทึกอ้อยตกหล่น: ' + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('คุณต้องการล้างข้อมูลในฟอร์มนี้ใช่หรือไม่?')) {
      setFallenImage(null);
      setFallenNote('');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-medium mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>ปีการผลิต 2569/70 • โรงงานน้ำตาลราชสีมา</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-amber-200" />
              รายงานอ้อยตกหล่น
            </h2>
            <p className="text-amber-100 text-xs sm:text-sm mt-1 max-w-2xl">
              บันทึกข้อมูลรายวัน วันละ 1 ช่วงเวลา พร้อมแนบรูปถ่ายอ้อยตกหล่นเพื่อจัดเก็บลง Google Drive
            </p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-xl p-3 text-right backdrop-blur-xs shrink-0">
            <div className="text-xs text-amber-100">วันที่บันทึก (พ.ศ. แบบไทย)</div>
            <div className="text-base font-bold">{formattedFallenThaiDate}</div>
            <div className="text-xs text-amber-200 mt-0.5">พ.ศ. {fallenThaiYear}</div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold text-sm">{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-1"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Main Fallen Cane Recording Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xs border border-amber-200 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            ข้อมูลการบันทึกอ้อยตกหล่นประจำวัน
          </h3>
          <div className="inline-flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-300 px-3 py-1 rounded-xl font-medium">
            <FolderTree className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Google Drive: อ้อยตกหล่น2569/70 (แยกรายวัน)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Station Dropdown (All 43 Stations) */}
          <div className="space-y-1.5">
            <label htmlFor="station-select" className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>เลือกสถานีขนถ่าย (ทั้งหมด 43 สถานี)</span>
              <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                id="station-select"
                value={fallenStation}
                onChange={(e) => setFallenStation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-medium focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-hidden transition-all"
              >
                {STATIONS.map((st, idx) => (
                  <option key={st} value={st}>
                    {idx + 1}. {st}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-400">
              ระบุสถานีขนถ่ายที่พบอ้อยตกหล่น
            </p>
          </div>

          {/* 2. Thai Buddhist Era Date */}
          <div className="space-y-1.5">
            <label htmlFor="date-input" className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>วันที่บันทึก (พ.ศ. แบบไทย)</span>
                <span className="text-rose-500">*</span>
              </span>
              <span className="text-[11px] font-normal text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md font-medium border border-amber-200">
                พ.ศ. {fallenThaiYear}
              </span>
            </label>
            <div className="relative flex items-center">
              <input
                id="date-input"
                type="date"
                value={fallenDate}
                onChange={(e) => setFallenDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-hidden transition-all"
              />
            </div>
            <p className="text-[11px] text-amber-800 font-medium">
              {formattedFallenThaiDate} (พ.ศ. {fallenThaiYear})
            </p>
          </div>
        </div>

        {/* 3. Photo Attachment with 5*4 cm indication */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-amber-600" />
              แนบรูปถ่ายอ้อยตกหล่น <span className="text-rose-500">*</span>
            </span>
            <span className="text-[11px] text-slate-500">
              แสดงในตารางแดชบอร์ดสรุปขนาด 5*4 เซนติเมตร
            </span>
          </div>

          {fallenImage ? (
            <div className="border border-amber-300 bg-amber-50/30 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div
                  className="relative group rounded-xl overflow-hidden border border-amber-200 bg-black shrink-0 flex items-center justify-center cursor-pointer shadow-xs"
                  style={{ width: '5cm', height: '4cm' }}
                  onClick={() =>
                    setActivePhotoModal({
                      title: `รูปอ้อยตกหล่น - ${fallenStation}`,
                      stationName: fallenStation,
                      url: fallenImage.url,
                    })
                  }
                >
                  <img
                    src={fallenImage.url}
                    alt="รูปอ้อยตกหล่น"
                    className="w-[5cm] h-[4cm] object-cover"
                    style={{ width: '5cm', height: '4cm', objectFit: 'cover' }}
                  />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <span className="bg-white/95 text-slate-800 font-bold text-xs px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-amber-600" />
                      <span>ดูภาพขยาย</span>
                    </span>
                  </div>
                  <span className="absolute bottom-1 right-1 bg-black/75 text-amber-200 text-[9px] font-mono px-1.5 py-0.5 rounded-sm">
                    5×4 ซม.
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                      พร้อมบันทึก
                    </span>
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {fallenImage.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    สถานี: <strong>{fallenStation}</strong> • วันที่: {formattedFallenThaiDate}
                  </p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    บันทึกใน Google Drive: อ้อยตกหล่น2569/70 &gt; วันที่ {formattedFallenThaiDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setActivePhotoModal({
                      title: `รูปอ้อยตกหล่น - ${fallenStation}`,
                      stationName: fallenStation,
                      url: fallenImage.url,
                    })
                  }
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>ดูภาพขยาย</span>
                </button>
                <button
                  type="button"
                  onClick={() => fallenInputRef.current?.click()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>เปลี่ยนรูป</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFallenImage(null)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบรูป</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fallenInputRef.current?.click()}
              className="border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-amber-50/20 group"
            >
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                <Camera className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-amber-950">
                คลิกเพื่อถ่ายรูป หรือ เลือกรูปถ่ายอ้อยตกหล่น
              </p>
              <p className="text-xs text-slate-500 mt-1">
                รองรับไฟล์ภาพ JPG, PNG จากกล้องมือถือหรือไฟล์คอมพิวเตอร์ (ขนาด 5*4 ซม.)
              </p>
            </div>
          )}

          <input
            ref={fallenInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleImageUpload(e.target.files[0]);
              }
            }}
            className="hidden"
          />
        </div>

        {/* 4. Notes / Optional */}
        <div className="space-y-1.5">
          <label htmlFor="fallen-note-input" className="block text-xs font-semibold text-slate-700">
            หมายเหตุเพิ่มเติม (ถ้ามี)
          </label>
          <input
            id="fallen-note-input"
            type="text"
            value={fallenNote}
            onChange={(e) => setFallenNote(e.target.value)}
            placeholder="เช่น ทางเข้าสถานีชั่ง, บริเวณทางโค้งปากทางเข้าลาน, จุดคีบอ้อย..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-hidden transition-all"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-sm font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ล้างข้อมูล</span>
          </button>

          <button
            type="submit"
            id="submit-fallen-cane-btn"
            disabled={isSaving || isSyncing}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-amber-600/30 transition-all disabled:opacity-50 cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            <span>
              {isSaving
                ? 'กำลังบันทึกลง Google Drive...'
                : 'บันทึกรายงานอ้อยตกหล่น'}
            </span>
          </button>
        </div>
      </form>

      {/* History of Fallen Cane records */}
      <div className="bg-white rounded-2xl p-6 border border-amber-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-amber-100 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">
              ประวัติการบันทึกรายงานอ้อยตกหล่น
            </h3>
          </div>
          <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full font-semibold">
            รวม {fallenCaneRecords.length} รายการ
          </span>
        </div>

        {fallenCaneRecords.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fallenCaneRecords.map((item) => {
              const displayImg = getDriveThumbnailUrl(item.imageUrl) || item.imageUrl;
              return (
                <div
                  key={item.id}
                  className="border border-amber-200 rounded-xl p-3 bg-amber-50/20 flex flex-col justify-between gap-3 hover:border-amber-400 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{item.stationName}</span>
                      </div>
                      <span className="text-[11px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md font-medium">
                        {item.thaiDateFormatted}
                      </span>
                    </div>

                    {/* 5*4 cm image preview */}
                    <div className="flex justify-center">
                      <div
                        onClick={() =>
                          setActivePhotoModal({
                            title: `รูปอ้อยตกหล่น - ${item.stationName}`,
                            stationName: item.stationName,
                            url: item.imageUrl,
                          })
                        }
                        className="cursor-pointer overflow-hidden rounded-lg border border-amber-300 shadow-2xs relative group bg-black"
                        style={{ width: '5cm', height: '4cm' }}
                      >
                        <img
                          src={displayImg}
                          alt={item.stationName}
                          referrerPolicy="no-referrer"
                          className="w-[5cm] h-[4cm] object-cover group-hover:opacity-90 transition-opacity"
                          style={{ width: '5cm', height: '4cm', objectFit: 'cover' }}
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="w-5 h-5 text-white" />
                        </div>
                        <span className="absolute bottom-1 right-1 bg-black/75 text-amber-200 text-[9px] font-mono px-1 py-0.5 rounded-xs">
                          5×4 ซม.
                        </span>
                      </div>
                    </div>

                    {item.note && (
                      <p className="text-[11px] text-slate-600 line-clamp-1 italic">
                        "{item.note}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-amber-100 text-[11px]">
                    <span className="text-slate-400">
                      {new Date(item.createdAt).toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })} น.
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setActivePhotoModal({
                            title: `รูปอ้อยตกหล่น - ${item.stationName}`,
                            stationName: item.stationName,
                            url: item.imageUrl,
                          })
                        }
                        className="p-1 text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded-md transition-colors"
                        title="ดูภาพขยาย"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {onDeleteFallenCane && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`ต้องการลบรายงานอ้อยตกหล่นของ ${item.stationName} หรือไม่?`)) {
                              onDeleteFallenCane(item.id);
                            }
                          }}
                          className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors"
                          title="ลบรายงาน"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs">
            ยังไม่มีรายการบันทึกอ้อยตกหล่น
          </div>
        )}
      </div>

      {/* High-res Image Viewing Modal */}
      {activePhotoModal && (
        <PhotoModal
          isOpen={true}
          onClose={() => setActivePhotoModal(null)}
          title={activePhotoModal.title}
          stationName={activePhotoModal.stationName}
          timeSlot="อ้อยตกหล่น"
          imageUrl={activePhotoModal.url}
          imageType="fallen"
        />
      )}
    </div>
  );
};
