import React, { useState, useEffect } from 'react';
import {
  teamsService,
  type UnifiedCalendarEvent,
  type AppointmentData,
} from '../../../../services/teams.service';
import {
  Calendar,
  Clock,
  Video,
  UserCheck,
  Plus,
  X,
  Sparkles,
  MapPin,
} from 'lucide-react';

interface TeamsCalendarAppointmentsProps {
  user: any;
  onJoinMeeting?: (meetingTitle: string) => void;
}

export const TeamsCalendarAppointments: React.FC<TeamsCalendarAppointmentsProps> = ({
  user,
  onJoinMeeting,
}) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'appointments'>('calendar');

  // Unified Calendar events
  const [calendarEvents, setCalendarEvents] = useState<UnifiedCalendarEvent[]>([
    {
      id: 'ev-1',
      title: 'Tiết học trực tuyến: Lập trình RESTful API với Express & Prisma',
      type: 'LIVE_CLASS',
      date: '2026-11-02',
      startTime: '08:00',
      endTime: '10:00',
      courseName: 'Lập Trình Web Nâng Cao',
      isLive: true,
      meetingUrl: 'https://meet.preskool.edu.vn/room/se101-session1',
    },
    {
      id: 'ev-2',
      title: 'Lịch học phòng máy: Thực hành CSDL & Indexing B-Tree',
      type: 'ERP_SCHEDULE',
      date: '2026-11-03',
      startTime: '13:30',
      endTime: '15:30',
      courseName: 'Cơ Sở Dữ Liệu Nâng Cao',
      room: 'Phòng Lab A203',
      isLive: false,
    },
    {
      id: 'ev-3',
      title: 'Tư vấn hướng đề tài nghiên cứu khoa học 1-1',
      type: 'APPOINTMENT',
      date: '2026-11-04',
      startTime: '14:00',
      endTime: '14:30',
      advisorName: 'TS. Nguyễn Văn Hùng',
      appointmentStatus: 'CONFIRMED',
      meetingUrl: 'https://meet.preskool.edu.vn/room/office-hours-hung',
      isLive: false,
    },
    {
      id: 'ev-4',
      title: 'Tiết học trực tuyến: Đóng gói Docker & Microservices',
      type: 'LIVE_CLASS',
      date: '2026-11-05',
      startTime: '08:00',
      endTime: '10:00',
      courseName: 'Kiến Trúc Phần Mềm',
      isLive: false,
      meetingUrl: 'https://meet.preskool.edu.vn/room/arch-session2',
    },
  ]);

  // Appointments (Office Hours)
  const [appointments, setAppointments] = useState<AppointmentData[]>([
    {
      id: 'app-1',
      teacherId: 'teacher-1',
      teacherName: 'TS. Nguyễn Văn Hùng',
      studentId: 'st-01',
      studentName: 'Nguyễn Văn An',
      title: 'Tư vấn hướng đề tài nghiên cứu khoa học',
      appointmentDate: '2026-11-04',
      startTime: '14:00',
      endTime: '14:30',
      notes: 'Em muốn xin ý kiến thầy về đề tài AI và Microservices trong giáo dục.',
      status: 'CONFIRMED',
      meetingUrl: 'https://meet.preskool.edu.vn/room/office-hours-hung',
    },
    {
      id: 'app-2',
      teacherId: 'teacher-1',
      teacherName: 'TS. Nguyễn Văn Hùng',
      studentId: 'st-02',
      studentName: 'Trần Thị Mai',
      title: 'Giải đáp vướng mắc thuật toán xếp lịch',
      appointmentDate: '2026-11-06',
      startTime: '09:00',
      endTime: '09:30',
      notes: 'Nhóm em gặp khó khăn khi xử lý thuật toán chia ca thi.',
      status: 'PENDING',
    },
  ]);

  // Book appointment modal (Student)
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [bookTeacher, setBookTeacher] = useState('TS. Nguyễn Văn Hùng');
  const [bookDate, setBookDate] = useState('2026-11-10');
  const [bookStartTime, setBookStartTime] = useState('10:00');
  const [bookEndTime, setBookEndTime] = useState('10:30');
  const [bookNotes, setBookNotes] = useState('');

  // Load unified calendar and appointments from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const calRes = await teamsService.getUnifiedCalendar();
        if (calRes.data && Array.isArray(calRes.data) && calRes.data.length > 0) {
          setCalendarEvents(calRes.data);
        }
      } catch {
        // fallback
      }

      try {
        const appRes = await teamsService.getMyAppointments();
        if (appRes.data && Array.isArray(appRes.data) && appRes.data.length > 0) {
          setAppointments(appRes.data);
        }
      } catch {
        // fallback
      }
    };
    loadData();
  }, []);

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newApp: AppointmentData = {
      id: `app-${Date.now()}`,
      teacherId: 'teacher-1',
      teacherName: bookTeacher,
      studentId: user?.id || 'current-user',
      studentName: user?.fullName || 'Bạn',
      title: bookTitle,
      appointmentDate: bookDate,
      startTime: bookStartTime,
      endTime: bookEndTime,
      notes: bookNotes,
      status: 'PENDING',
    };

    try {
      await teamsService.bookAppointment({
        teacherId: 'teacher-1',
        title: bookTitle,
        appointmentDate: bookDate,
        startTime: bookStartTime,
        endTime: bookEndTime,
        notes: bookNotes,
      });
    } catch {
      // fallback
    }

    setAppointments((prev) => [newApp, ...prev]);
    setShowBookModal(false);
    alert('Đã gửi yêu cầu đặt lịch hẹn 1-1 thành công! Vui lòng chờ Giảng viên xác nhận.');
  };

  const handleRespondAppointment = async (
    appId: string,
    status: 'CONFIRMED' | 'CANCELLED'
  ) => {
    const meetingUrl =
      status === 'CONFIRMED'
        ? 'https://meet.preskool.edu.vn/room/office-hours-' + Math.floor(Math.random() * 1000)
        : undefined;

    setAppointments((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status, meetingUrl } : a))
    );

    try {
      await teamsService.respondAppointment(appId, { status, meetingUrl });
    } catch {
      // fallback
    }
  };

  return (
    <div className="space-y-6">
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
            <span>Lịch Hợp Nhất Trực Tuyến ({calendarEvents.length})</span>
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
            <span>Lịch Hẹn Tư Vấn 1-1 ({appointments.length})</span>
          </button>
        </div>

        {/* Action Button */}
        {activeTab === 'appointments' && (
          <button
            onClick={() => setShowBookModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-violet-700 transition shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Đặt Lịch Hẹn Tư Vấn 1-1</span>
          </button>
        )}
      </div>

      {/* 1. UNIFIED CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4 text-xs text-violet-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-600 shrink-0" />
              <span>
                Lịch hợp nhất tự động tổng hợp tiết học Live Teams, lịch học phòng máy ERP và lịch hẹn tư vấn cá nhân.
              </span>
            </div>
            <span className="font-bold text-violet-700 font-mono">Hôm nay: 02/11/2026</span>
          </div>

          <div className="space-y-3">
            {calendarEvents.map((ev) => (
              <div
                key={ev.id}
                className={`rounded-2xl border bg-white p-5 shadow-2xs transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  ev.isLive ? 'border-rose-300 ring-2 ring-rose-500/20' : 'border-gray-200/80 hover:border-gray-300'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    {ev.isLive ? (
                      <span className="inline-flex items-center gap-1 rounded bg-rose-500 text-white px-2 py-0.5 text-[10px] font-bold uppercase animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-white" /> Đang Diễn Ra
                      </span>
                    ) : (
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          ev.type === 'LIVE_CLASS'
                            ? 'bg-violet-100 text-violet-800'
                            : ev.type === 'APPOINTMENT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {ev.type === 'LIVE_CLASS'
                          ? 'Tiết Học Trực Tuyến'
                          : ev.type === 'APPOINTMENT'
                          ? 'Tư Vấn 1-1'
                          : 'Lịch Học ERP'}
                      </span>
                    )}

                    <h4 className="text-sm font-bold text-gray-900">{ev.title}</h4>
                  </div>

                  <p className="text-xs text-gray-500">
                    Môn học: <strong className="text-gray-700">{ev.courseName}</strong>
                    {ev.room && (
                      <span className="ml-3 inline-flex items-center gap-1 text-gray-600">
                        <MapPin className="h-3 w-3 text-gray-400" /> {ev.room}
                      </span>
                    )}
                    {ev.advisorName && (
                      <span className="ml-3 inline-flex items-center gap-1 text-gray-600">
                        <UserCheck className="h-3 w-3 text-gray-400" /> Cố vấn: {ev.advisorName}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-4 self-end md:self-center shrink-0">
                  <div className="text-right text-xs">
                    <span className="font-bold text-gray-900 block font-mono">
                      {ev.startTime} - {ev.endTime}
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono">{ev.date}</span>
                  </div>

                  {ev.isLive ? (
                    <button
                      onClick={() => onJoinMeeting?.(ev.title)}
                      className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition shadow-sm cursor-pointer animate-bounce"
                    >
                      <Video className="h-4 w-4" />
                      <span>Tham Gia Ngay</span>
                    </button>
                  ) : ev.meetingUrl ? (
                    <button
                      onClick={() => onJoinMeeting?.(ev.title)}
                      className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-50 transition cursor-pointer"
                    >
                      <Video className="h-4 w-4" />
                      <span>Mở Phòng</span>
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. APPOINTMENTS (OFFICE HOURS) */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments.map((app) => (
              <div
                key={app.id}
                className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        app.status === 'CONFIRMED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {app.status === 'CONFIRMED'
                        ? 'Đã Xác Nhận'
                        : app.status === 'PENDING'
                        ? 'Chờ Duyệt'
                        : 'Đã Hủy'}
                    </span>
                    <h4 className="text-sm font-bold text-gray-900">{app.title}</h4>
                  </div>
                </div>

                <div className="rounded-xl bg-gray-50/70 p-3 text-xs text-gray-600 space-y-1 border border-gray-100">
                  <p>
                    Giảng viên: <strong className="text-gray-800">{app.teacherName}</strong>
                  </p>
                  <p>
                    Sinh viên: <strong className="text-gray-800">{app.studentName}</strong>
                  </p>
                  <p className="flex items-center gap-1 font-mono text-gray-700">
                    <Clock className="h-3 w-3 text-gray-400" />
                    {app.appointmentDate} ({app.startTime} - {app.endTime})
                  </p>
                  {app.notes && <p className="italic text-gray-500 mt-1">"{app.notes}"</p>}
                </div>

                <div className="flex items-center justify-between pt-1">
                  {app.meetingUrl ? (
                    <button
                      onClick={() => onJoinMeeting?.(app.title)}
                      className="flex items-center gap-1 text-xs font-bold text-violet-700 hover:underline"
                    >
                      <Video className="h-3.5 w-3.5" />
                      <span>Vào Phòng Tư Vấn Trực Tuyến</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-gray-400">Đang chờ giảng viên xếp phòng</span>
                  )}

                  {/* Actions for teacher */}
                  {app.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRespondAppointment(app.id, 'CONFIRMED')}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
                      >
                        Xác Nhận Lịch
                      </button>
                      <button
                        onClick={() => handleRespondAppointment(app.id, 'CANCELLED')}
                        className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        Từ Chối
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Đặt Lịch Hẹn Tư Vấn 1-1 */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Đặt Lịch Hẹn Tư Vấn 1-1 (Office Hours)</h3>
              <button onClick={() => setShowBookModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Chủ Đề Cần Tư Vấn</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tư vấn đồ án tốt nghiệp, hướng nghiên cứu..."
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Chọn Giảng Viên</label>
                <select
                  value={bookTeacher}
                  onChange={(e) => setBookTeacher(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none"
                >
                  <option value="TS. Nguyễn Văn Hùng">TS. Nguyễn Văn Hùng (Khoa CNTT)</option>
                  <option value="ThS. Trần Thị Lan">ThS. Trần Thị Lan (Cố vấn học tập)</option>
                  <option value="PGS. TS. Lê Tuấn">PGS. TS. Lê Tuấn (Trưởng bộ môn KTPM)</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Ngày Hẹn</label>
                  <input
                    type="date"
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Giờ Bắt Đầu</label>
                  <input
                    type="time"
                    value={bookStartTime}
                    onChange={(e) => setBookStartTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Giờ Kết Thúc</label>
                  <input
                    type="time"
                    value={bookEndTime}
                    onChange={(e) => setBookEndTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Ghi Chú Chi Tiết Cho Thầy / Cô</label>
                <textarea
                  rows={3}
                  placeholder="Nội dung cần trao đổi trước để giảng viên chuẩn bị..."
                  value={bookNotes}
                  onChange={(e) => setBookNotes(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 shadow-xs"
                >
                  Gửi Đơn Đặt Lịch
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
