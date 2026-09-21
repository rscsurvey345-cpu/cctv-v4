import React, { useState, useRef } from 'react';
import { StationRecord, StatusType } from '../types';
import {
  STATIONS,
  TIME_SLOTS,
  STATUS_LIST,
  THAI_MONTHS,
  toThaiDateFormatted,
} from '../constants/stations';
import {
  X,
  Check,
  Scale,
  Construction,
  Camera,
  Trash2,
  Download,
  Upload,
  Save,
  MapPin,
  Clock,
  Calendar,
} from 'lucide-react';
import { compressImageFile } from '../lib/imageUtils';

interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: StationRecord;
  onSaveEdit: (updated: StationRecord) => void;
}

export const EditRecordModal: React.FC<EditRecordModalProps> = ({
  isOpen,
  onClose,
  record,
  onSaveEdit,
}) => {
  if (!isOpen) return null;

  const [stationName, setStationName] = useState(record.stationName);
  const [dateStr, setDateStr] = useState(record.dateStr);
  const [timeSlot, setTimeSlot] = useState(record.timeSlot);
  const [statuses, setStatuses] = useState<StatusType[]>(record.statuses);
  const [note, setNote] = useState(record.note || '');
  const [recordedBy, setRecordedBy] = useState(record.recordedBy || '');

  const [scaleImageUrl, setScaleImageUrl] = useState(record.scaleImageUrl);
  const [scaleImageName, setScaleImageName] = useState(record.scaleImageName);
  const [craneImageUrl, setCraneImageUrl] = useState(record.craneImageUrl);
  const [craneImageName, setCraneImageName] = useState(record.craneImageName);

  const scaleInputRef = useRef<HTMLInputElement>(null);
  const craneInputRef = useRef<HTMLInputElement>(null);

  const toggleStatus = (statusVal: StatusType) => {
    setStatuses((prev) => {
      if (statusVal === 'ปกติ') {
        return prev.includes('ปกติ') ? prev.filter((s) => s !== 'ปกติ') : ['ปกติ'];
      } else {
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

  const handleFileUpload = async (file: File, type: 'scale' | 'crane') => {
    if (!file) return;
    const { url, name } = await compressImageFile(file, 1600, 1600, 0.82);
    if (type === 'scale') {
      setScaleImageUrl(url);
      setScaleImageName(name);
    } else {
      setCraneImageUrl(url);
      setCraneImageName(name);
    }
  };

  const handleDownloadImage = (url?: string, type?: string) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}_${stationName}_${timeSlot.replace(/[\s\:]/g, '_')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (statuses.length === 0) {
      alert('กรุณาเลือกสถานะอย่างน้อย 1 รายการ');
      return;
    }

    const thaiFormatted = toThaiDateFormatted(dateStr);
    const [y] = dateStr.split('-');
    const buddhistYear = parseInt(y, 10) + 543;

    onSaveEdit({
      ...record,
      stationName,
      dateStr,
      thaiDateFormatted: thaiFormatted,
      buddhistYear,
      timeSlot,
      statuses,
      note,
      recordedBy,
      scaleImageUrl,
      scaleImageName,
      craneImageUrl,
      craneImageName,
      updatedAt: Date.now(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-emerald-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">แก้ไขข้อมูลสถานีขนถ่ายอ้อย</h3>
            <p className="text-xs text-slate-500">รหัสบันทึก: {record.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Station, Date, Time slot */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                สถานีขนถ่าย
              </label>
              <select
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800"
              >
                {STATIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันที่บันทึก (พ.ศ.)
              </label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ช่วงเวลา
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              สถานการณ์ / สถานะ (เลือกได้มากกว่า 1 อย่าง)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STATUS_LIST.map((item) => {
                const checked = statuses.includes(item.value);
                return (
                  <button
                    type="button"
                    key={item.value}
                    onClick={() => toggleStatus(item.value)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                      checked
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-md border flex items-center justify-center text-white ${
                        checked ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-slate-300'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Photos: Scale and Crane with Replace / Delete / Download */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Scale Image */}
            <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-600" /> รูปตาชั่ง
                </span>
                {scaleImageUrl && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDownloadImage(scaleImageUrl, 'ตาชั่ง')}
                      className="p-1 text-slate-600 hover:text-emerald-700"
                      title="ดาวน์โหลด"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setScaleImageUrl(undefined)}
                      className="p-1 text-rose-600 hover:text-rose-800"
                      title="ลบรูป"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {scaleImageUrl ? (
                <div className="relative rounded-lg overflow-hidden bg-black max-h-[140px] flex items-center justify-center">
                  <img
                    src={scaleImageUrl}
                    alt="ตาชั่ง"
                    className="max-h-[140px] object-contain w-full"
                  />
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  ไม่มีรูปภาพตาชั่ง
                </div>
              )}

              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => scaleInputRef.current?.click()}
                  className="text-xs text-emerald-700 font-medium hover:underline flex items-center gap-1 ml-auto"
                >
                  <Upload className="w-3 h-3" /> {scaleImageUrl ? 'เปลี่ยนรูป' : 'เพิ่มรูปตาชั่ง'}
                </button>
                <input
                  ref={scaleInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0], 'scale');
                    }
                  }}
                  className="hidden"
                />
              </div>
            </div>

            {/* Crane Image */}
            <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Construction className="w-3.5 h-3.5 text-teal-600" /> รูปเครน
                </span>
                {craneImageUrl && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDownloadImage(craneImageUrl, 'เครน')}
                      className="p-1 text-slate-600 hover:text-emerald-700"
                      title="ดาวน์โหลด"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCraneImageUrl(undefined)}
                      className="p-1 text-rose-600 hover:text-rose-800"
                      title="ลบรูป"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {craneImageUrl ? (
                <div className="relative rounded-lg overflow-hidden bg-black max-h-[140px] flex items-center justify-center">
                  <img
                    src={craneImageUrl}
                    alt="เครน"
                    className="max-h-[140px] object-contain w-full"
                  />
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  ไม่มีรูปภาพเครน
                </div>
              )}

              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => craneInputRef.current?.click()}
                  className="text-xs text-emerald-700 font-medium hover:underline flex items-center gap-1 ml-auto"
                >
                  <Upload className="w-3 h-3" /> {craneImageUrl ? 'เปลี่ยนรูป' : 'เพิ่มรูปเครน'}
                </button>
                <input
                  ref={craneInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0], 'crane');
                    }
                  }}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Note and Recorder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                หมายเหตุเพิ่มเติม
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อผู้บันทึก
              </label>
              <input
                type="text"
                value={recordedBy}
                onChange={(e) => setRecordedBy(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>บันทึกการแก้ไข</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
