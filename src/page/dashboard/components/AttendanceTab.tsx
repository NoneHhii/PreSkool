import React, { useState, useEffect } from 'react';
import { academicService, type Schedule } from '../../../services/academic.service';
import {
  CheckCircle,
  AlertCircle,
  Search,
  UserCheck,
  UserX,
  Clock,
  X,
  FileCheck
} from 'lucide-react';
import PageHeader from '../../../components/common/PageHeader';
import Button from '../../../components/common/Button';

export default function AttendanceTab() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection states
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  // Mark Attendance states
  const [studentId, setStudentId] = useState('');
  const [status, setStatus] = useState<'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE'>('PRESENT');
  const [notes, setNotes] = useState('');

  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Stats view
  const [searchStudentId, setSearchStudentId] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsMessage, setStatsMessage] = useState<{ type: 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await academicService.getSchedule();
      const sorted = (res.data || []).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setSchedules(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule) return;

    setSubmitLoading(true);
    setMessage(null);
    try {
      await academicService.markAttendance({
        scheduleId: selectedSchedule.id,
        studentId,
        status,
        notes,
      });
      setMessage({ type: 'success', text: `Đã cập nhật trạng thái ${status} cho sinh viên thành công!` });
      setStudentId('');
      setNotes('');
      setStatus('PRESENT');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Không thể lưu điểm danh' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSearchStats = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchStudentId.trim()) return;

    setStatsLoading(true);
    setStatsMessage(null);
    setStats(null);
    try {
      const res = await academicService.getStudentAttendanceStats(searchStudentId.trim());
      setStats(res.data);
    } catch (err: any) {
      setStatsMessage({
        type: 'error',
        text: err.response?.data?.message || 'Không tìm thấy thống kê của sinh viên này',
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản Lý Điểm Danh (Attendance)"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'HRM & Academic' },
          { label: 'Attendance' },
        ]}
        onRefresh={fetchSchedules}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Mark Attendance Form */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Chấm Điểm Danh Sinh Viên</h3>
                <p className="text-xs text-gray-500">Chọn buổi học và ghi nhận chuyên cần</p>
              </div>
            </div>

            {message && (
              <div
                className={`mb-4 p-3 rounded-xl flex items-center gap-2.5 text-xs animate-in fade-in ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <span className="font-medium">{message.text}</span>
                <button onClick={() => setMessage(null)} className="ml-auto text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Chọn Ca Học (Class Session) *</label>
                {loading ? (
                  <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
                ) : (
                  <select
                    value={selectedSchedule?.id || ''}
                    onChange={(e) =>
                      setSelectedSchedule(schedules.find((s) => s.id === e.target.value) || null)
                    }
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="" disabled>-- Chọn ca học cần điểm danh --</option>
                    {schedules.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.classInfo?.code} | {formatDate(s.date)} | {s.shift} (Phòng: {s.room})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedSchedule && (
                <form onSubmit={handleMarkAttendance} className="space-y-4 pt-3 border-t border-gray-100 animate-in fade-in">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Mã Sinh Viên (Student ID / UUID) *</label>
                    <input
                      required
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      type="text"
                      placeholder="Dán Student UUID hoặc MSSV..."
                      className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 font-mono text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Trạng Thái Chuyên Cần *</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <label
                        className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold cursor-pointer transition ${
                          status === 'PRESENT'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="status"
                          value="PRESENT"
                          checked={status === 'PRESENT'}
                          onChange={() => setStatus('PRESENT')}
                          className="hidden"
                        />
                        <UserCheck className="h-4 w-4" /> Có Mặt (Present)
                      </label>

                      <label
                        className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold cursor-pointer transition ${
                          status === 'ABSENT'
                            ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="status"
                          value="ABSENT"
                          checked={status === 'ABSENT'}
                          onChange={() => setStatus('ABSENT')}
                          className="hidden"
                        />
                        <UserX className="h-4 w-4" /> Vắng (Absent)
                      </label>

                      <label
                        className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold cursor-pointer transition ${
                          status === 'LATE'
                            ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-xs'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="status"
                          value="LATE"
                          checked={status === 'LATE'}
                          onChange={() => setStatus('LATE')}
                          className="hidden"
                        />
                        <Clock className="h-4 w-4" /> Đi Trễ (Late)
                      </label>

                      <label
                        className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold cursor-pointer transition ${
                          status === 'EXCUSED'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="status"
                          value="EXCUSED"
                          checked={status === 'EXCUSED'}
                          onChange={() => setStatus('EXCUSED')}
                          className="hidden"
                        />
                        <AlertCircle className="h-4 w-4" /> Có Phép (Excused)
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Ghi Chú</label>
                    <input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      type="text"
                      placeholder="Ví dụ: Đi trễ 15 phút, có đơn xin phép..."
                      className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    isLoading={submitLoading}
                  >
                    Lưu Điểm Danh
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Search & Statistics */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Tra Cứu Chuyên Cần Sinh Viên</h3>
                <p className="text-xs text-gray-500">Xem tỷ lệ chuyên cần và lịch sử điểm danh theo sinh viên</p>
              </div>
            </div>

            <form onSubmit={handleSearchStats} className="flex gap-2 mb-4">
              <input
                required
                value={searchStudentId}
                onChange={(e) => setSearchStudentId(e.target.value)}
                type="text"
                placeholder="Nhập UUID Sinh Viên cần tra cứu..."
                className="flex-1 rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 font-mono text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
              />
              <Button type="submit" isLoading={statsLoading} leftIcon={<Search className="h-3.5 w-3.5" />}>
                Tra Cứu
              </Button>
            </form>

            {statsMessage && (
              <div className="p-3 rounded-lg flex items-center gap-2 text-xs bg-rose-50 text-rose-800 border border-rose-200 mb-4">
                <AlertCircle className="h-4 w-4" />
                <span>{statsMessage.text}</span>
              </div>
            )}

            {stats && (
              <div className="space-y-4 animate-in fade-in">
                {/* 4 Stat Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Tổng Buổi</p>
                    <p className="mt-1 text-xl font-bold text-gray-900">{stats.stats.total}</p>
                  </div>
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Có Mặt</p>
                    <p className="mt-1 text-xl font-bold text-emerald-700">{stats.stats.PRESENT}</p>
                  </div>
                  <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Vắng</p>
                    <p className="mt-1 text-xl font-bold text-rose-700">{stats.stats.ABSENT}</p>
                  </div>
                  <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Trễ</p>
                    <p className="mt-1 text-xl font-bold text-amber-700">{stats.stats.LATE}</p>
                  </div>
                </div>

                {/* History list */}
                {stats.records && stats.records.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 mb-2">Chi Tiết Từng Ngày:</h4>
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                      {stats.records.slice(0, 10).map((r: any) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between rounded-lg border border-gray-100 p-2.5 text-xs bg-white hover:bg-gray-50 transition"
                        >
                          <div>
                            <span className="font-semibold text-gray-800">Mã Lịch: {r.scheduleId.substring(0, 8)}...</span>
                            {r.notes && <p className="text-[11px] text-gray-400 italic">"{r.notes}"</p>}
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              r.status === 'PRESENT'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.status === 'ABSENT'
                                ? 'bg-rose-100 text-rose-800'
                                : r.status === 'LATE'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {r.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
