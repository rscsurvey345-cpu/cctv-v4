import React, { useState } from 'react';
import { X, Download, RotateCw, Trash2, Upload, ZoomIn, ZoomOut } from 'lucide-react';

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  stationName: string;
  timeSlot: string;
  imageUrl?: string;
  imageType: 'scale' | 'crane';
  onDeletePhoto?: () => void;
  onReplacePhoto?: (file: File) => void;
}

export const PhotoModal: React.FC<PhotoModalProps> = ({
  isOpen,
  onClose,
  title,
  stationName,
  timeSlot,
  imageUrl,
  imageType,
  onDeletePhoto,
  onReplacePhoto,
}) => {
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);

  if (!isOpen) return null;

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    const typeLabel = imageType === 'scale' ? 'ตาชั่ง' : 'เครน';
    const cleanStation = stationName.replace(/[\(\)\/\s]/g, '_');
    link.download = `${typeLabel}_${cleanStation}_${timeSlot.replace(/[\s\:]/g, '_')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onReplacePhoto) {
      onReplacePhoto(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-emerald-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-emerald-50/50">
          <div>
            <h3 className="text-base font-semibold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {stationName} • {timeSlot}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Image Body */}
        <div className="flex-1 bg-slate-950 flex items-center justify-center p-4 overflow-hidden relative min-h-[350px]">
          {imageUrl ? (
            <div
              className="transition-transform duration-200 ease-out max-h-[60vh] flex items-center justify-center"
              style={{
                transform: `rotate(${rotation}deg) scale(${zoom})`,
              }}
            >
              <img
                src={imageUrl}
                alt={title}
                className="max-h-[55vh] max-w-full object-contain rounded-md shadow-lg"
              />
            </div>
          ) : (
            <div className="text-center text-slate-400">
              <p>ไม่มีรูปภาพในรายการนี้</p>
            </div>
          )}
        </div>

        {/* Modal Controls & Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {/* Zoom and Rotate controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleZoomIn}
              disabled={!imageUrl}
              title="ซูมเข้า"
              className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 disabled:opacity-40 transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              disabled={!imageUrl}
              title="ซูมออก"
              className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 disabled:opacity-40 transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleRotate}
              disabled={!imageUrl}
              title="หมุนภาพ"
              className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 disabled:opacity-40 transition-colors"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Action buttons: Download, Replace, Delete */}
          <div className="flex items-center gap-2">
            {imageUrl && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลดรูปภาพ</span>
              </button>
            )}

            {onReplacePhoto && (
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>{imageUrl ? 'เปลี่ยนรูป' : 'เพิ่มรูป'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            )}

            {imageUrl && onDeletePhoto && (
              <button
                onClick={() => {
                  if (window.confirm('คุณต้องการลบรูปภาพนี้ใช่หรือไม่?')) {
                    onDeletePhoto();
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบรูป</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
