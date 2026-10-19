import React, { useState, useEffect, useMemo } from 'react';
import { academicService, type Schedule, type Class } from '../../../services/academic.service';
import {
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  X,
  LayoutGrid,
  List,
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  Layers,
  GraduationCap
} from 'lucide-react';
import PageHeader from '../../../components/common/PageHeader';
import Button from '../../../components/common/Button';

const SHIFT_DEFS = [
  { id: 'ca1', label: 'Sáng (Ca 1: 07:00 - 09:15)', key: 'Ca 1', period: 'Sáng' },
  { id: 'ca2', label: 'Sáng (Ca 2: 09:30 - 11:45)', key: 'Ca 2', period: 'Sáng' },
  { id: 'ca3', label: 'Chiều (Ca 3: 13:00 - 15:15)', key: 'Ca 3', period: 'Chiều' },
  { id: 'ca4', label: 'Chiều (Ca 4: 15:30 - 17:45)', key: 'Ca 4', period: 'Chiều' },
  { id: 'ca5', label: 'Tối (Ca 5: 18:00 - 20:15)', key: 'Ca 5', period: 'Tối' },
];

const DOW_OPTIONS = [
  { val: 1, label: 'Thứ 2' },
  { val: 2, label: 'Thứ 3' },
  { val: 3, label: 'Thứ 4' },
  { val: 4, label: 'Thứ 5' },
  { val: 5, label: 'Thứ 6' },
  { val: 6, label: 'Thứ 7' },
  { val: 0, label: 'Chủ Nhật' },
];

export default function ScheduleTab() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({ classId: '', date: today, shift: 'Sáng (Ca 1: 07:00 - 09:15)', room: '' });
  const [submitLoading, setSubmitLoading] = useState(false);

  // Bulk schedule state
  const [bulkData, setBulkData] = useState({
    classId: '',
    startDate: today,
    endDate: '',
    daysOfWeek: [1, 3, 5],
    shift: 'Sáng (Ca 1: 07:00 - 09:15)',
    room: '',
  });
  const [bulkLoading, setBulkLoading] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Weekly Grid calculation
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    mon.setHours(0, 0, 0, 0);
    return mon;
  });

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      const yyyy = day.getFullYear();
      const mm = String(day.getMonth() + 1).padStart(2, '0');
      const dd = String(day.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
      return {
        date: day,
        dateStr,
        label: dayLabels[i],
        dayMonth: `${dd}/${mm}`,
        isToday: new Date().toISOString().split('T')[0] === dateStr,
      };
    });
  }, [weekStart]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [scheduleRes, classesRes] = await Promise.all([
        academicService.getSchedule(),
        academicService.getClasses(),
      ]);

      const sorted = (scheduleRes.data || []).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setSchedules(sorted);
      setClasses(classesRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage(null);
    try {
      const isoDate = new Date(formData.date).toISOString();
      await academicService.createSchedule({
        ...formData,
        date: isoDate,
      });
      setMessage({ type: 'success', text: 'Xếp lịch học thành công!' });
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Không thể xếp lịch' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkData.daysOfWeek.length === 0) {
      alert('Vui lòng chọn ít nhất một thứ trong tuần!');
      return;
    }
    setBulkLoading(true);
    setMessage(null);
    try {
      const res = await academicService.bulkCreateSchedule({
        classId: bulkData.classId,
        startDate: bulkData.startDate,
        endDate: bulkData.endDate,
        daysOfWeek: bulkData.daysOfWeek,
        shift: bulkData.shift,
        room: bulkData.room,
      });
      setMessage({
        type: 'success',
        text: `Xếp lịch học kỳ thành công! Đã tạo ${res.count ?? ''} buổi học định kỳ cho lớp.`,
      });
      setShowBulkModal(false);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Không thể xếp lịch học kỳ' });
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleDayOfWeek = (val: number) => {
    setBulkData((prev) => {
      const exists = prev.daysOfWeek.includes(val);
      return {
        ...prev,
        daysOfWeek: exists ? prev.daysOfWeek.filter((d) => d !== val) : [...prev.daysOfWeek, val].sort(),
      };
    });
  };

  const prevWeek = () => {
    setWeekStart((prev) => new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000));
  };

  const nextWeek = () => {
    setWeekStart((prev) => new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000));
  };

  const resetToCurrentWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    mon.setHours(0, 0, 0, 0);
    setWeekStart(mon);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thời Khóa Biểu (Time Table)"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Academic' },
          { label: 'Time Table' },
        ]}
        actionLabel="Thêm Lịch Học Đơn"
        onActionClick={() => setShowModal(true)}
        onRefresh={fetchData}
        extraActions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              leftIcon={<Layers className="h-4 w-4 text-purple-600" />}
              onClick={() => setShowBulkModal(true)}
              className="border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100"
            >
              Xếp Lịch Học Kỳ (Bulk)
            </Button>
            <div className="flex items-center rounded-lg border border-gray-200 bg-white p-1 shadow-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Dạng Lưới</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span>Dạng Thẻ</span>
              </button>
            </div>
          </div>
        }
      />

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border shadow-xs animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <p className="text-xs font-medium">{message.text}</p>
          <button onClick={() => setMessage(null)} className="ml-auto text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Week Navigator for Grid View */}
      {viewMode === 'grid' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={prevWeek}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition cursor-pointer"
              title="Tuần trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={resetToCurrentWeek}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            >
              Hôm Nay
            </button>
            <button
              onClick={nextWeek}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition cursor-pointer"
              title="Tuần sau"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span>
              Tuần: {weekDays[0].dayMonth} – {weekDays[6].dayMonth}/{weekDays[6].date.getFullYear()}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600"></span>
            <span>Hôm nay: {new Date().toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      )}

      {/* Modal Xếp Lịch Học Đơn */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <CalendarCheck2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Xếp Lịch Học Đơn</h3>
                  <p className="text-xs text-gray-500">Phân công ngày, ca học và phòng cho 1 buổi học</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Lớp Học Phần *</label>
                <select
                  required
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="" disabled>-- Chọn Lớp Học Phần --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} ({c.course?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Ngày Học *</label>
                  <input
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    type="date"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Phòng Học *</label>
                  <input
                    required
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    type="text"
                    placeholder="Ví dụ: A101, B204..."
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Ca Học (Shift) *</label>
                <select
                  required
                  value={formData.shift}
                  onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                >
                  {SHIFT_DEFS.map((s) => (
                    <option key={s.id} value={s.label}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={!formData.classId} isLoading={submitLoading}>
                  Lưu Lịch Học
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xếp Lịch Học Kỳ Định Kỳ (Bulk Schedule) */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Xếp Lịch Học Kỳ (Bulk Schedule)</h3>
                  <p className="text-xs text-purple-700">Tự động sinh toàn bộ lịch học lặp lại theo thứ trong kỳ</p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Lớp Học Phần *</label>
                <select
                  required
                  value={bulkData.classId}
                  onChange={(e) => setBulkData({ ...bulkData, classId: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="" disabled>-- Chọn Lớp Học Phần --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} ({c.course?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Ngày Bắt Đầu *</label>
                  <input
                    required
                    value={bulkData.startDate}
                    onChange={(e) => setBulkData({ ...bulkData, startDate: e.target.value })}
                    type="date"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Ngày Kết Thúc *</label>
                  <input
                    required
                    value={bulkData.endDate}
                    onChange={(e) => setBulkData({ ...bulkData, endDate: e.target.value })}
                    type="date"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Các Thứ Trong Tuần *</label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {DOW_OPTIONS.map((d) => {
                    const isSelected = bulkData.daysOfWeek.includes(d.val);
                    return (
                      <button
                        key={d.val}
                        type="button"
                        onClick={() => toggleDayOfWeek(d.val)}
                        className={`rounded-lg py-2 px-1 text-center text-xs font-semibold transition cursor-pointer border ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Ca Học *</label>
                  <select
                    required
                    value={bulkData.shift}
                    onChange={(e) => setBulkData({ ...bulkData, shift: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  >
                    {SHIFT_DEFS.map((s) => (
                      <option key={s.id} value={s.label}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Phòng Học *</label>
                  <input
                    required
                    value={bulkData.room}
                    onChange={(e) => setBulkData({ ...bulkData, room: e.target.value })}
                    type="text"
                    placeholder="Ví dụ: A101"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowBulkModal(false)}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={!bulkData.classId || !bulkData.endDate || bulkData.daysOfWeek.length === 0}
                  isLoading={bulkLoading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Sinh Lịch Học Kỳ Tự Động
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Schedule Content */}
      {loading ? (
        <div className="rounded-xl border border-gray-100 bg-white p-12 text-center text-xs text-gray-400">
          <div className="inline-flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span>Đang tải thời khóa biểu...</span>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Weekly Matrix Table View */
        <div className="rounded-xl border border-gray-100 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-600">
                  <th className="w-36 p-3 text-left font-semibold text-gray-500 uppercase tracking-wider text-[11px] border-r border-gray-200">
                    Ca Học
                  </th>
                  {weekDays.map((day) => (
                    <th
                      key={day.dateStr}
                      className={`min-w-[150px] p-3 text-center border-r border-gray-200 last:border-r-0 ${
                        day.isToday ? 'bg-blue-50/60 text-blue-700 font-bold' : 'font-semibold text-gray-700'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-xs uppercase">{day.label}</span>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full ${
                            day.isToday ? 'bg-blue-600 text-white font-bold' : 'text-gray-500 font-normal'
                          }`}
                        >
                          {day.dayMonth}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {SHIFT_DEFS.map((shift) => (
                  <tr key={shift.id} className="hover:bg-gray-50/40 transition">
                    <td className="p-3 bg-gray-50/50 border-r border-gray-200 text-left align-top">
                      <div className="font-semibold text-gray-800 text-xs">{shift.key}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">{shift.label.split(':')[1]?.replace(')', '').trim()}</div>
                      <span className="mt-1.5 inline-block text-[10px] px-1.5 py-0.5 rounded bg-gray-200/70 text-gray-600 font-medium">
                        {shift.period}
                      </span>
                    </td>

                    {weekDays.map((day) => {
                      const matched = schedules.filter(
                        (s) =>
                          s.date.startsWith(day.dateStr) &&
                          (s.shift.includes(shift.key) || s.shift === shift.label)
                      );

                      return (
                        <td
                          key={day.dateStr}
                          className={`p-2 border-r border-gray-200 last:border-r-0 align-top min-h-[90px] ${
                            day.isToday ? 'bg-blue-50/15' : ''
                          }`}
                        >
                          {matched.length === 0 ? (
                            <div className="h-full min-h-[75px] rounded-lg border border-dashed border-gray-100/80 flex items-center justify-center text-gray-300 text-[11px] hover:border-gray-300 transition">
                              -
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {matched.map((item) => (
                                <div
                                  key={item.id}
                                  className="group rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 p-2.5 shadow-2xs hover:shadow-sm hover:border-blue-400 transition"
                                >
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="font-bold text-blue-700 text-xs truncate">
                                      {item.classInfo?.code || 'Lớp HP'}
                                    </span>
                                    <span className="shrink-0 text-[10px] font-bold bg-white text-blue-600 px-1.5 py-0.5 rounded border border-blue-200">
                                      {item.room}
                                    </span>
                                  </div>
                                  <div className="font-medium text-gray-900 text-xs line-clamp-1">
                                    {item.classInfo?.course?.name || 'Môn học'}
                                  </div>
                                  <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-1 truncate">
                                    <GraduationCap className="h-3 w-3 text-gray-400 shrink-0" />
                                    <span className="truncate">
                                      {item.classInfo?.teacher?.profile?.fullName ||
                                        item.classInfo?.teacher?.username ||
                                        'Chưa gán GV'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : schedules.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-12 text-center text-xs text-gray-500">
          Chưa có lịch học nào được xếp.
        </div>
      ) : (
        /* List Mode Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xs transition hover:border-blue-200 hover:shadow-md"
            >
              {/* Header card */}
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 p-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition">
                    {schedule.classInfo?.code || 'Lớp Học Phần'}
                  </h4>
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">
                    {schedule.classInfo?.course?.name || 'Môn Học'}
                  </p>
                </div>
                <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  {schedule.classInfo?.semester ? `Kỳ ${schedule.classInfo.semester}` : 'Kỳ 1'}
                </span>
              </div>

              {/* Body info */}
              <div className="p-4 space-y-2.5 text-xs text-gray-600">
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="font-semibold text-gray-900">{formatDate(schedule.date)}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>{schedule.shift}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                  <span className="font-medium">Phòng: {schedule.room}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
