import React, { useState, useMemo } from 'react';
import { StationRecord, StatusType, DashboardSummaryPeriod } from '../types';
import {
  STATUS_LIST,
  TIME_SLOTS,
  STATIONS,
  THAI_MONTHS,
  toThaiDateFormatted,
  getCurrentThaiDate,
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
} from 'lucide-react';

interface DashboardProps {
  records: StationRecord[];
}

export const Dashboard: React.FC<DashboardProps> = ({ records }) => {
  const today = getCurrentThaiDate();

  // Summary Period dropdown
  const [period, setPeriod] = useState<DashboardSummaryPeriod>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(today.dateStr);
  const [selectedHourSlot, setSelectedHourSlot] = useState<string>(TIME_SLOTS[0]);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

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
      return records.filter((r) => r.dateStr === selectedDate && r.timeSlot === selectedHourSlot);
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

  // Status breakdown along 12 time slots for Line/Bar comparison chart
  const timeSlotComparisonData = useMemo(() => {
    return TIME_SLOTS.map((slot) => {
      const slotRecords = filteredRecords.filter((r) => r.timeSlot === slot);
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
        slot: slot.replace('  น.', ''),
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
                    label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
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
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
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
            <span className="text-[11px] text-slate-400 font-mono">08:00 - 20:00 น.</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSlotComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="slot" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="plainline" />
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
    </div>
  );
};
