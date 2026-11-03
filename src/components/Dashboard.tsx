import React, { useState, useMemo } from 'react';
import { StationRecord, StatusType, DashboardSummaryPeriod, FallenCaneRecord } from '../types';
import {
  STATUS_LIST,
  TIME_SLOTS,
  STATIONS,
  THAI_MONTHS,
  toThaiDateFormatted,
  getCurrentThaiDate,
  getCurrentTimeSlot,
  normalizeTimeSlot,
} from '../constants/stations';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieIcon,
  Calendar,
  Clock,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Layers,
  MapPin,
  Flame,
  Eye,
  Download,
  FolderTree,
  ExternalLink,
  AlertOctagon,
  Trash2,
} from 'lucide-react';
import { PhotoModal } from './PhotoModal';
import { getDriveThumbnailUrl } from '../lib/syncSheet';

interface DashboardProps {
  records: StationRecord[];
  fallenCaneRecords?: FallenCaneRecord[];
  onDeleteFallenCane?: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  records,
  fallenCaneRecords = [],
  onDeleteFallenCane,
}) => {
  const today = getCurrentThaiDate();

  // Summary Period dropdown
  const [period, setPeriod] = useState<DashboardSummaryPeriod>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(today.dateStr);
  const [selectedHourSlot, setSelectedHourSlot] = useState<string>(getCurrentTimeSlot());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

  // Photo modal state for fallen cane or station images
  const [activePhotoModal, setActivePhotoModal] = useState<{
    title: string;
    stationName: string;
    url: string;
    timeSlot?: string;
  } | null>(null);

  // Calendar filter for Fallen Sugarcane
  const [fallenFilterDate, setFallenFilterDate] = useState<string>('all');

  const filteredFallenCaneRecords = useMemo(() => {
    if (fallenFilterDate === 'all') return fallenCaneRecords;
    return fallenCaneRecords.filter((r) => r.dateStr === fallenFilterDate);
  }, [fallenCaneRecords, fallenFilterDate]);

  // Filter records based on selected period
  const filteredRecords = useMemo(() => {
    if (period === 'all') {
      return records;
    }
    if (period === 'monthly') {
      return records.filter((r) => {
        const [, m] = r.dateStr.split('-');
        return parseInt(m, 10) - 1 === selectedMonth;
      });
    }
    if (period === 'daily') {
      return records.filter((r) => r.dateStr === selectedDate);
    }
    if (period === 'hourly') {
      return records.filter(
        (r) =>
          r.dateStr === selectedDate &&
          normalizeTimeSlot(r.timeSlot) === normalizeTimeSlot(selectedHourSlot)
      );
    }
    return records;
  }, [records, period, selectedDate, selectedHourSlot, selectedMonth]);

  // Aggregate Status counts for Pie Chart
  const pieData = useMemo(() => {
    const counts: Record<StatusType, number> = {
      ปกติ: 0,
      หยุดรอรถ: 0,
      หยุดรออ้อย: 0,
      หยุดไม่ทราบสาเหตุ: 0,
      offline: 0,
      ปิดเครน: 0,
    };

    filteredRecords.forEach((r) => {
      r.statuses.forEach((st) => {
        if (counts[st] !== undefined) {
          counts[st]++;
        }
      });
    });

    return STATUS_LIST.map((item) => ({
      name: item.label,
      value: counts[item.value],
      color: item.chartColor,
    })).filter((item) => item.value > 0);
  }, [filteredRecords]);

  // Status breakdown along 24 time slots for Line/Bar comparison chart
  const timeSlotComparisonData = useMemo(() => {
    return TIME_SLOTS.map((slot) => {
      const slotRecords = filteredRecords.filter(
        (r) => normalizeTimeSlot(r.timeSlot) === normalizeTimeSlot(slot)
      );
      let normalCount = 0;
      let waitTruckCount = 0;
      let waitCaneCount = 0;
      let closedCount = 0;
      let otherCount = 0;

      slotRecords.forEach((r) => {
        if (r.statuses.includes('ปกติ')) normalCount++;
        if (r.statuses.includes('หยุดรอรถ')) waitTruckCount++;
        if (r.statuses.includes('หยุดรออ้อย')) waitCaneCount++;
        if (r.statuses.includes('ปิดเครน')) closedCount++;
        if (r.statuses.includes('หยุดไม่ทราบสาเหตุ') || r.statuses.includes('offline')) otherCount++;
      });

      return {
        slot: slot.replace(/\s*น\./, '').trim(),
        ปกติ: normalCount,
        หยุดรอรถ: waitTruckCount,
        หยุดรออ้อย: waitCaneCount,
        ปิดเครน: closedCount,
        ขัดข้อง: otherCount,
      };
    });
  }, [filteredRecords]);

  // High-frequency stations with waiting or issues
  const stationStats = useMemo(() => {
    const map: Record<
      string,
      { total: number; normal: number; issues: number; photos: number }
    > = {};

    filteredRecords.forEach((r) => {
      if (!map[r.stationName]) {
        map[r.stationName] = { total: 0, normal: 0, issues: 0, photos: 0 };
      }
      map[r.stationName].total++;
      if (r.statuses.includes('ปกติ')) {
        map[r.stationName].normal++;
      }
      if (
        r.statuses.some((s) => ['หยุดรอรถ', 'หยุดรออ้อย', 'หยุดไม่ทราบสาเหตุ'].includes(s))
      ) {
        map[r.stationName].issues++;
      }
      if (r.scaleImageUrl) map[r.stationName].photos++;
      if (r.craneImageUrl) map[r.stationName].photos++;
    });

    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        ...data,
      }))
      .sort((a, b) => b.issues - a.issues)
      .slice(0, 10);
  }, [filteredRecords]);

  // Overall metric counts
  const totalCount = filteredRecords.length;
  const normalCount = filteredRecords.filter((r) => r.statuses.includes('ปกติ')).length;
  const waitTruckCount = filteredRecords.filter((r) => r.statuses.includes('หยุดรอรถ')).length;
  const waitCaneCount = filteredRecords.filter((r) => r.statuses.includes('หยุดรออ้อย')).length;
  const totalPhotosCount = filteredRecords.reduce(
    (acc, r) => acc + (r.scaleImageUrl ? 1 : 0) + (r.craneImageUrl ? 1 : 0),
    0
  );
  const normalPercentage = totalCount > 0 ? Math.round((normalCount / totalCount) * 100) : 0;

  // Render Pie Label with 50% reduced font size (ลดขนาด font ให้เล็กลง 1 เท่าตัว)
  const renderReducedFontPieLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if ((percent || 0) < 0.05) return null;
    return (
      <text
        x={x}
        y={y}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontSize: '7.5px', // ลดขนาด font ลง 1 เท่าตัว (จากเดิม 14-15px)
          fontWeight: 'bold',
          textShadow: '0 1px 2px rgba(0,0,0,0.6)',
          pointerEvents: 'none',
        }}
      >
        {`${((percent || 0) * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Dashboard Top Filter Bar */}
      <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                แดชบอร์ดวิเคราะห์สถานการณ์สถานีขนถ่ายอ้อย
              </h2>
              <p className="text-xs text-slate-500">
                โรงงานน้ำตาลราชสีมา 2569/70 • สรุปสถานะตามช่วงเวลาและปฏิทิน
              </p>
            </div>
          </div>

          {/* Period Selector Dropdown as requested */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-semibold text-slate-700">เลือกมุมมองสรุป:</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as DashboardSummaryPeriod)}
              className="bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-emerald-300 outline-hidden"
            >
              <option value="hourly">สรุปรายชั่วโมง</option>
              <option value="daily">สรุปรายวัน</option>
              <option value="monthly">สรุปรายเดือน</option>
              <option value="all">สรุปทั้งหมด (ตลอดฤดูหีบ)</option>
            </select>
          </div>
        </div>

        {/* Dynamic Context Selector based on period */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
          {/* Daily & Hourly: Date selection */}
          {(period === 'daily' || period === 'hourly') && (
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span className="text-slate-600">วันที่ตามปฏิทินไทย:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 outline-hidden font-medium"
              />
              <span className="text-emerald-800 font-medium">
                ({toThaiDateFormatted(selectedDate)})
              </span>
            </div>
          )}

          {/* Hourly: Time Slot selection */}
          {period === 'hourly' && (
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span className="text-slate-600">ช่วงเวลา:</span>
              <select
                value={selectedHourSlot}
                onChange={(e) => setSelectedHourSlot(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 outline-hidden font-medium"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Monthly: Month selection */}
          {period === 'monthly' && (
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span className="text-slate-600">เลือกเดือน:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 outline-hidden font-medium"
              >
                {THAI_MONTHS.map((m, idx) => (
                  <option key={m} value={idx}>
                    เดือน {m} (พ.ศ. 2569)
                  </option>
                ))}
              </select>
            </div>
          )}

          {period === 'all' && (
            <div className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-medium">
              แสดงข้อมูลสถิติรวมของทุกสถานี (ทั้งหมด 43 สถานี) ตลอดฤดูการผลิต 2569/70
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Reports */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">รายงานทั้งหมด</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">จาก 43 สถานีขนถ่าย</p>
        </div>

        {/* Card 2: Normal Rate */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ความพร้อมปกติ</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{normalPercentage}%</div>
          <p className="text-[11px] text-slate-400 mt-0.5">{normalCount} สถานีที่พร้อมทำงาน</p>
        </div>

        {/* Card 3: Waiting Truck */}
        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">หยุดรอรถ</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{waitTruckCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">ไม่มีรถบรรทุกเข้ามาขน</p>
        </div>

        {/* Card 4: Waiting Cane */}
        <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-orange-700">หยุดรออ้อย</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-orange-600">{waitCaneCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">รออ้อยเข้าสู่ลานขนถ่าย</p>
        </div>

        {/* Card 5: Uploaded Photos */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-700">รูปถ่ายในระบบ</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-teal-700">{totalPhotosCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">รูปตาชั่งและรูปเครน</p>
        </div>
      </div>

      {/* Main Charts: 1. Donut/Pie Chart & 2. Line Comparison Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Donut / Pie Chart for Status Proportions */}
        <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                สัดส่วนสถานการณ์สถานีขนถ่าย (กราฟวงกลม)
              </h3>
            </div>
            <span className="text-[11px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
              {period === 'hourly'
                ? `ช่วง ${selectedHourSlot}`
                : period === 'daily'
                ? toThaiDateFormatted(selectedDate)
                : period === 'monthly'
                ? `เดือน ${THAI_MONTHS[selectedMonth]}`
                : 'ข้อมูลทั้งหมด'}
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={renderReducedFontPieLabel}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${val ?? 0} ครั้ง/สถานี`, 'จำนวน']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      fontSize: '8.5px', // ลดขนาด font เล็กลง 1 เท่าตัว (จากเดิม 14-16px)
                      padding: '4px 8px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={32}
                    iconType="circle"
                    iconSize={7}
                    wrapperStyle={{
                      fontSize: '7.5px', // ลดขนาด font เล็กลง 1 เท่าตัว (จากเดิม 14px)
                      paddingTop: '6px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 text-xs">
                ไม่มีข้อมูลสถานะในช่วงเวลาที่เลือก
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Line Chart for Hourly Comparison */}
        <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                แนวโน้มเปรียบเทียบสถานการณ์ (กราฟเส้นรายชั่วโมง)
              </h3>
            </div>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-medium">
              24 ชม. (08:00 - 08:00 น.)
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSlotComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="slot"
                  tick={{ fontSize: 5.5 }}
                  interval={1}
                  angle={-30}
                  textAnchor="end"
                  height={30}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 5.5 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '6.5px',
                    padding: '3px 6px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={28}
                  iconType="plainline"
                  iconSize={6}
                  wrapperStyle={{
                    fontSize: '6.5px',
                    paddingTop: '4px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="ปกติ"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="หยุดรอรถ"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 2.5 }}
                />
                <Line
                  type="monotone"
                  dataKey="หยุดรออ้อย"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ r: 2.5 }}
                />
                <Line
                  type="monotone"
                  dataKey="ปิดเครน"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ r: 2.5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top 10 Stations with Waiting Issues & Stats Table */}
      <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-bold text-slate-900">
              สถานีที่มีสถิติหยุดรอรถหรือรออ้อยสูงสุด (Top 10 Stations)
            </h3>
          </div>
          <span className="text-xs text-slate-500">สำหรับวางแผนจัดสรรรถบรรทุกและคิวตัด</span>
        </div>

        {stationStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 text-[11px] uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-4">ชื่อสถานีขนถ่าย</th>
                  <th className="py-2.5 px-4 text-center">รอบที่รายงาน</th>
                  <th className="py-2.5 px-4 text-center">รอบที่ปกติ</th>
                  <th className="py-2.5 px-4 text-center">รอบที่หยุดรอ</th>
                  <th className="py-2.5 px-4 text-center">รูปภาพแนบ</th>
                  <th className="py-2.5 px-4">สัดส่วนความพร้อม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stationStats.map((item) => {
                  const rate = item.total > 0 ? Math.round((item.normal / item.total) * 100) : 0;
                  return (
                    <tr key={item.name} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-semibold text-slate-800 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        {item.name}
                      </td>
                      <td className="py-2.5 px-4 text-center font-medium">{item.total}</td>
                      <td className="py-2.5 px-4 text-center text-emerald-700 font-medium">
                        {item.normal}
                      </td>
                      <td className="py-2.5 px-4 text-center text-orange-700 font-semibold">
                        {item.issues}
                      </td>
                      <td className="py-2.5 px-4 text-center text-slate-500">{item.photos} รูป</td>
                      <td className="py-2.5 px-4 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                rate >= 70
                                  ? 'bg-emerald-500'
                                  : rate >= 40
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono text-slate-600 w-8 text-right">
                            {rate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs">
            ไม่มีข้อมูลสถิติสถานีในช่วงเวลาที่เลือก
          </div>
        )}
      </div>

      {/* Bottom Section: Fallen Sugarcane Summary Table (สรุปรายงานอ้อยตกหล่น) */}
      <div className="bg-white rounded-2xl p-6 border-2 border-amber-200 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-amber-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                สรุปรายงานอ้อยตกหล่น ประจำสถานีขนถ่าย (ปีการผลิต 2569/70)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ตารางรายงานสถานการณ์อ้อยตกหล่นประจำสถานีขนถ่าย
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Calendar filter for date selection */}
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 rounded-xl px-3 py-1.5 text-xs">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span className="text-amber-900 font-semibold">เลือกวันที่:</span>
              <input
                type="date"
                value={fallenFilterDate === 'all' ? '' : fallenFilterDate}
                onChange={(e) => setFallenFilterDate(e.target.value || 'all')}
                className="bg-white border border-amber-300 rounded-lg px-2 py-1 text-xs text-slate-800 outline-hidden font-medium"
              />
              {fallenFilterDate !== 'all' && (
                <button
                  type="button"
                  onClick={() => setFallenFilterDate('all')}
                  className="text-amber-800 hover:text-amber-950 underline font-semibold text-[11px] cursor-pointer ml-1"
                >
                  แสดงทั้งหมด
                </button>
              )}
            </div>

            <div className="bg-amber-100/80 text-amber-900 text-xs px-3 py-1.5 rounded-xl font-bold">
              รวม {filteredFallenCaneRecords.length} รายการ
            </div>
          </div>
        </div>

        {/* Fallen Sugarcane Summary Metric Strip (Filtered) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3">
            <span className="text-[11px] font-semibold text-amber-800">สถานีที่พบรายงาน</span>
            <div className="text-xl font-bold text-amber-950 mt-1">
              {new Set(filteredFallenCaneRecords.map((r) => r.stationName)).size} สถานี
            </div>
            <span className="text-[10px] text-amber-700">จากทั้งหมด 43 สถานีขนถ่าย</span>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3">
            <span className="text-[11px] font-semibold text-amber-800">รูปภาพบันทึกในระบบ</span>
            <div className="text-xl font-bold text-amber-950 mt-1">
              {filteredFallenCaneRecords.filter((r) => r.imageUrl).length} ภาพ
            </div>
            <span className="text-[10px] text-amber-700">ขนาด 5*4 ซม.</span>
          </div>
        </div>

        {/* Table with Strictly Sized 5*4 cm photos */}
        {filteredFallenCaneRecords.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-amber-200 shadow-2xs">
            <table className="w-full text-left text-xs text-slate-700 divide-y divide-amber-100">
              <thead className="bg-amber-100/70 text-amber-950 text-[11px] uppercase font-bold">
                <tr>
                  <th className="py-3 px-3 text-center w-12">ลำดับ</th>
                  <th className="py-3 px-4 min-w-[130px]">วันที่บันทึก (พ.ศ.)</th>
                  <th className="py-3 px-4 min-w-[180px]">สถานีขนถ่าย (จาก 43 จุด)</th>
                  <th className="py-3 px-4 text-center min-w-[220px]">
                    รูปภาพอ้อยตกหล่น (ขนาด 5*4 ซม.)
                  </th>
                  <th className="py-3 px-3 text-center w-24">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 bg-white">
                {filteredFallenCaneRecords.map((item, index) => {
                  const displayImg = getDriveThumbnailUrl(item.imageUrl) || item.imageUrl;
                  return (
                    <tr key={item.id} className="hover:bg-amber-50/40 transition-colors">
                      {/* Index */}
                      <td className="py-3 px-3 text-center font-bold text-slate-600">
                        {index + 1}
                      </td>

                      {/* Thai Date */}
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{item.thaiDateFormatted}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block ml-5">
                          พ.ศ. {item.buddhistYear}
                        </span>
                      </td>

                      {/* Station Name */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{item.stationName}</span>
                        </div>
                      </td>

                      {/* Photo strictly sized at 5*4 cm */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          {displayImg ? (
                            <div
                              onClick={() =>
                                setActivePhotoModal({
                                  title: `รูปอ้อยตกหล่น - ${item.stationName}`,
                                  stationName: item.stationName,
                                  url: item.imageUrl,
                                })
                              }
                              className="group relative cursor-pointer overflow-hidden rounded-lg border-2 border-amber-300 shadow-xs bg-slate-950 flex items-center justify-center transition-transform hover:scale-[1.02]"
                              style={{
                                width: '5cm',
                                height: '4cm',
                              }}
                              title="คลิกเพื่อดูภาพขยาย"
                            >
                              <img
                                src={displayImg}
                                alt={`อ้อยตกหล่น ${item.stationName}`}
                                referrerPolicy="no-referrer"
                                className="w-[5cm] h-[4cm] max-w-[5cm] max-h-[4cm] object-cover transition-opacity group-hover:opacity-90"
                                style={{
                                  width: '5cm',
                                  height: '4cm',
                                  objectFit: 'cover',
                                }}
                              />
                              <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <span className="bg-white/95 text-slate-800 font-bold text-[11px] px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1">
                                  <Eye className="w-3.5 h-3.5 text-amber-600" />
                                  <span>คลิกดูภาพขยาย</span>
                                </span>
                              </div>
                              <span className="absolute bottom-1 right-1 bg-black/75 text-amber-200 text-[9px] font-mono px-1.5 py-0.5 rounded-sm">
                                5×4 ซม.
                              </span>
                            </div>
                          ) : (
                            <div
                              className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 flex items-center justify-center text-amber-700 text-[11px]"
                              style={{ width: '5cm', height: '4cm' }}
                            >
                              ไม่มีรูปภาพ
                            </div>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">
                            ขนาดรูปภาพ: 5 ซม. × 4 ซม.
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {displayImg && (
                            <button
                              type="button"
                              onClick={() =>
                                setActivePhotoModal({
                                  title: `รูปอ้อยตกหล่น - ${item.stationName}`,
                                  stationName: item.stationName,
                                  url: item.imageUrl,
                                })
                              }
                              title="ดูภาพขยาย"
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {onDeleteFallenCane && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`ต้องการลบรายงานอ้อยตกหล่นของ ${item.stationName} หรือไม่?`)) {
                                onDeleteFallenCane(item.id);
                                }
                              }}
                              title="ลบรายงาน"
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 bg-amber-50/30 rounded-xl border border-dashed border-amber-200 text-slate-500 text-xs">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">
              {fallenFilterDate !== 'all'
                ? `ไม่พบรายงานอ้อยตกหล่นในวันที่ ${toThaiDateFormatted(fallenFilterDate)}`
                : 'ยังไม่มีรายงานอ้อยตกหล่นในระบบ'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              สามารถบันทึกข้อมูลและแนบรูปภาพอ้อยตกหล่นได้ที่แท็บ รายงานอ้อยตกหล่น
            </p>
          </div>
        )}
      </div>

      {/* High-res Image Viewing Modal for Dashboard */}
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
