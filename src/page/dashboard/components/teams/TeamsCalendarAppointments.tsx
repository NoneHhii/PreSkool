import React, { useState, useEffect, useCallback } from 'react';
import {
  teamsService,
  type UnifiedCalendarEvent,
  type AppointmentData,
  type DirectoryUser,
} from '../../../../services/teams.service';
import { academicService, type Schedule, type Class } from '../../../../services/academic.service';
import {
  Calendar,
  Clock,
  Video,
  UserCheck,
  Plus,
  MapPin,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface TeamsCalendarAppointmentsProps {
  user: any;
  directoryUsers?: DirectoryUser[];
  classes?: Class[];
  onJoinMeeting?: (meetingTitle?: string, meetingUrl?: string) => void;
}

export const TeamsCalendarAppointments: React.FC<TeamsCalendarAppointmentsProps> = ({
  user,
  directoryUsers = [],
  classes = [],
  onJoinMeeting,
}) => {
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState<'calendar' | 'appointments'>('calendar');

  // Unified Calendar events - starts EMPTY (No fake data!)
  const [calendarEvents, setCalendarEvents] = useState<UnifiedCalendarEvent[]>([]);
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(false);

  // Book appointment modal (Student)
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [bookTeacherId, setBookTeacherId] = useState('');
  const [bookDate, setBookDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookStartTime, setBookStartTime] = useState('10:00');
  const [bookEndTime, setBookEndTime] = useState('10:30');
  const [bookNotes, setBookNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookFeedback, setBookFeedback] = useState<string | null>(null);

  // Teachers list for booking
  const teachers = directoryUsers.filter((u) => u.role === 'TEACHER' || u.role === 'ADMIN');

  useEffect(() => {
    if (teachers.length > 0 && !bookTeacherId) {
      setBookTeacherId(teachers[0].id);
    }
  }, [teachers, bookTeacherId]);

  // Load real unified calendar & schedules
  const loadData = useCallback(async () => {
    setLoading(true);
    const events: UnifiedCalendarEvent[] = [];

    // 1. Fetch from Unified Calendar API
    try {
      const calRes = await teamsService.getUnifiedCalendar();
      if (calRes.data?.data && Array.isArray(calRes.data.data)) {
        events.push(...calRes.data.data);
      }
    } catch {
      // ignore
    }

    // 2. Fetch real ERP Schedules
    try {
      const schRes = await academicService.getSchedule();
      if (schRes.data && Array.isArray(schRes.data)) {
        schRes.data.forEach((sch: Schedule) => {
          const matchedClass = classes.find((c) => c.id === sch.classId);
          events.push({
            id: `sch-${sch.id}`,
            title: `Lịch học ERP: Ca ${sch.shift} (Phòng ${sch.room})`,
            type: 'ERP_SCHEDULE',
            date: sch.date,
            startTime: sch.shift === '1' ? '07:30' : sch.shift === '2' ? '09:30' : sch.shift === '3' ? '13:00' : '15:00',
            endTime: sch.shift === '1' ? '09:20' : sch.shift === '2' ? '11:20' : sch.shift === '3' ? '14:50' : '16:50',
            courseName: matchedClass?.course?.name || matchedClass?.code || 'Học phần',
            room: `Phòng ${sch.room}`,
            isLive: false,
          });
        });
      }
    } catch {
      // ignore
    }

    // Sort by date descending
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setCalendarEvents(events);

    // 3. Fetch real appointments
    try {
      const appRes = await teamsService.getMyAppointments();
      if (appRes.data?.data && Array.isArray(appRes.data.data)) {
        setAppointments(appRes.data.data);
      }
    } catch {
      // ignore
    }

    setLoading(false);
  }, [classes]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Submit appointment request
  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim() || !bookTeacherId) return;

    setBookingLoading(true);
    setBookFeedback(null);

    const targetTeacher = teachers.find((u) => u.id === bookTeacherId) || directoryUsers.find((u) => u.id === bookTeacherId);
    const resolvedTeacherId = targetTeacher?.teacherProfileId || bookTeacherId;

    try {
      await teamsService.bookAppointment({
        teacherId: resolvedTeacherId,
        title: bookTitle.trim(),
        appointmentDate: bookDate,
        startTime: bookStartTime,
        endTime: bookEndTime,
        notes: bookNotes.trim() || undefined,
      });

      const newApp: AppointmentData = {
        id: `app-${Date.now()}`,
        teacherId: resolvedTeacherId,
        teacherName: targetTeacher?.fullName || 'Giảng viên',
        studentId: user?.id || 'current-user',
        studentName: user?.fullName || 'Bạn',
        title: bookTitle.trim(),
        appointmentDate: bookDate,
        startTime: bookStartTime,
        endTime: bookEndTime,
        notes: bookNotes.trim(),
        status: 'PENDING',
      };

      setAppointments((prev) => [newApp, ...prev]);
      setBookFeedback('Đã gửi yêu cầu đặt lịch tư vấn thành công! Vui lòng chờ Giảng viên xác nhận.');
      setTimeout(() => {
        setShowBookModal(false);
        setBookFeedback(null);
        setBookTitle('');
        setBookNotes('');
      }, 2000);
    } catch (err: any) {
      setBookFeedback(err.response?.data?.message || err.message || 'Lỗi khi gửi yêu cầu đặt lịch');
    }
    setBookingLoading(false);
  };

  // Teacher responds to appointment
  const handleRespondAppointment = async (
    appId: string,
    status: 'CONFIRMED' | 'CANCELLED'
  ) => {
    const roomCode = `office-hours-${Math.floor(1000 + Math.random() * 9000)}`;
    const meetingUrl =
      status === 'CONFIRMED'
        ? `https://meet.preskool.edu.vn/room/${roomCode}`
        : undefined;

    try {
      await teamsService.respondAppointment(appId, { status, meetingUrl });
      setAppointments((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status, meetingUrl } : a))
      );
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Không thể cập nhật trạng thái lịch hẹn');
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Top Header & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex rounded-xl bg-gray-100 p-1 self-start">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'calendar'
                ? 'bg-white text-violet-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Lịch Học ERP Hợp Nhất ({calendarEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'appointments'
                ? 'bg-white text-violet-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Lịch Tư Vấn 1-1 ({appointments.length})</span>
          </button>
        </div>

        {activeTab === 'appointments' && !isTeacher && (
          <button
            onClick={() => setShowBookModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700 transition shadow-2xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Đặt Lịch Tư Vấn 1-1</span>
          </button>
        )}
      </div>

      {/* TAB 1: UNIFIED CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="space-y-3">
          {loading ? (
            <div className="p-8 text-center text-xs text-gray-500 bg-white rounded-2xl border border-gray-200">
              Đang tải lịch học ERP và phòng học trực tuyến...
            </div>
          ) : calendarEvents.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-3xl bg-white">
              <Calendar className="h-8 w-8 mx-auto text-gray-300 mb-2" />
              <p className="font-semibold text-gray-700">Chưa có lịch học nào</p>
              <p className="text-[11px] text-gray-400 mt-1">
                Lịch giảng dạy và thời khóa biểu ERP sẽ hiển thị tại đây khi được ban hành.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {calendarEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs hover:shadow-xs transition space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        ev.type === 'LIVE_CLASS'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : ev.type === 'ERP_SCHEDULE'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-violet-50 text-violet-700 border border-violet-200'
                      }`}
                    >
                      {ev.type === 'LIVE_CLASS'
                        ? 'Lớp học trực tuyến'
                        : ev.type === 'ERP_SCHEDULE'
                        ? 'Lịch học phòng máy ERP'
                        : 'Lịch tư vấn 1-1'}
                    </span>

                    <span className="text-[11px] font-mono text-gray-500 font-bold">
                      {ev.date}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-gray-900 leading-snug">{ev.title}</h4>
                    {ev.courseName && (
                      <p className="text-xs text-violet-700 font-semibold mt-0.5">{ev.courseName}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 pt-1 font-mono">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      <span>{ev.startTime} - {ev.endTime}</span>
                    </div>

                    {ev.room && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        <span>{ev.room}</span>
                      </div>
                    )}
                  </div>

                  {ev.meetingUrl && (
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-mono truncate max-w-xs">
                        {ev.meetingUrl}
                      </span>
                      <button
                        onClick={() => onJoinMeeting?.(ev.title, ev.meetingUrl)}
                        className="flex items-center gap-1 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700 transition cursor-pointer"
                      >
                        <Video className="h-3.5 w-3.5" />
                        <span>Tham Gia</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: APPOINTMENTS (OFFICE HOURS) */}
      {activeTab === 'appointments' && (
        <div className="space-y-3">
          {appointments.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-3xl bg-white">
              <UserCheck className="h-8 w-8 mx-auto text-gray-300 mb-2" />
              <p className="font-semibold text-gray-700">Chưa có lịch tư vấn nào</p>
              <p className="text-[11px] text-gray-400 mt-1">
                Sinh viên có thể đặt lịch hẹn tư vấn 1-1 với giảng viên bộ môn hoặc cố vấn học tập.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments.map((app) => (
                <div
                  key={app.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs hover:shadow-xs transition space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        app.status === 'CONFIRMED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : app.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {app.status === 'CONFIRMED'
                        ? 'Đã xác nhận'
                        : app.status === 'PENDING'
                        ? 'Chờ xác nhận'
                        : 'Đã hủy'}
                    </span>

                    <span className="text-[11px] font-mono text-gray-500 font-bold">
                      {app.appointmentDate}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-gray-900 leading-snug">{app.title}</h4>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Giảng viên: <span className="font-semibold text-violet-700">{app.teacherName}</span>
                      {app.studentName && (
                        <span> • Sinh viên: <span className="font-semibold text-gray-800">{app.studentName}</span></span>
                      )}
                    </p>
                  </div>

                  {app.notes && (
                    <p className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded-xl italic">
                      "{app.notes}"
                    </p>
                  )}

                  <div className="flex items-center gap-1 text-xs text-gray-500 font-mono">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <span>{app.startTime} - {app.endTime}</span>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    {app.status === 'CONFIRMED' && app.meetingUrl ? (
                      <button
                        onClick={() => onJoinMeeting?.(app.title, app.meetingUrl)}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer"
                      >
                        <Video className="h-3.5 w-3.5" />
                        <span>Vào Phòng Họp 1-1</span>
                      </button>
                    ) : isTeacher && app.status === 'PENDING' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRespondAppointment(app.id, 'CONFIRMED')}
                          className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                        >
                          Chấp Nhận
                        </button>
                        <button
                          onClick={() => handleRespondAppointment(app.id, 'CANCELLED')}
                          className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                        >
                          Từ Chối
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">Đang chờ xác nhận...</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ĐẶT LỊCH TƯ VẤN 1-1 */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Đặt Lịch Hẹn Tư Vấn 1-1</h3>
              <button onClick={() => setShowBookModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {bookFeedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  bookFeedback.includes('thành công')
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {bookFeedback.includes('thành công') ? (
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                )}
                <span>{bookFeedback}</span>
              </div>
            )}

            <form onSubmit={handleBookSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Chủ Đề Cần Tư Vấn *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Trao đổi hướng đề tài nghiên cứu..."
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Giảng Viên Hướng Dẫn *</label>
                <select
                  value={bookTeacherId}
                  onChange={(e) => setBookTeacherId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-violet-500"
                  required
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.teacherCode || t.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Ngày Hẹn</label>
                  <input
                    type="date"
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2 text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Bắt Đầu</label>
                  <input
                    type="time"
                    value={bookStartTime}
                    onChange={(e) => setBookStartTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2 text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Kết Thúc</label>
                  <input
                    type="time"
                    value={bookEndTime}
                    onChange={(e) => setBookEndTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2 text-xs outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Ghi Chú Chi Tiết Cho Thầy/Cô</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả cụ thể nội dung em cần thầy/cô hỗ trợ..."
                  value={bookNotes}
                  onChange={(e) => setBookNotes(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="rounded-xl bg-violet-600 px-5 py-2 font-bold text-white hover:bg-violet-700 disabled:opacity-50 transition cursor-pointer"
                >
                  {bookingLoading ? 'Đang Gửi...' : 'Gửi Yêu Cầu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsCalendarAppointments;
