import React, { useState, useEffect } from 'react';
import {
  teamsService,
  type MeetingData,
  type DirectoryUser,
  type PresenceStatus,
} from '../../../../services/teams.service';
import { type Class } from '../../../../services/academic.service';
import {
  Video,
  Calendar,
  Clock,
  Play,
  Copy,
  Check,
  Lock,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Film,
} from 'lucide-react';

interface TeamsMeetingsHubProps {
  user: any;
  classes: Class[];
  directoryUsers: DirectoryUser[];
  presenceMap: Record<string, PresenceStatus>;
  onJoinMeeting: (meeting: MeetingData) => void;
}

interface VirtualClassroomItem {
  id: string;
  classId: string;
  title: string;
  platform: 'TEAMS' | 'ZOOM' | 'JITSI' | 'LIVEKIT';
  meetingUrl: string;
  roomPassword?: string | null;
  startTime: string;
  endTime?: string | null;
  recordings?: { id: string; title: string; url: string; duration?: string }[];
  classInfo?: {
    code: string;
    courseName: string;
  };
}

export const TeamsMeetingsHub: React.FC<TeamsMeetingsHubProps> = ({
  user,
  classes,
  onJoinMeeting,
}) => {
  const isHost = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  // Virtual classrooms list from DB
  const [classrooms, setClassrooms] = useState<VirtualClassroomItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterClassId, setFilterClassId] = useState<string>('ALL');

  // Join by room code
  const [joinCodeInput, setJoinCodeInput] = useState('');

  // Instant meeting modal/form
  const [showInstantModal, setShowInstantModal] = useState(false);
  const [instantTitle, setInstantTitle] = useState('');
  const [instantClassId, setInstantClassId] = useState('');
  const [instantPassword, setInstantPassword] = useState('');
  const [submittingInstant, setSubmittingInstant] = useState(false);

  // Schedule meeting modal/form
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleClassId, setScheduleClassId] = useState('');
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleStartTime, setScheduleStartTime] = useState('08:00');
  const [scheduleEndTime, setScheduleEndTime] = useState('10:00');
  const [schedulePassword, setSchedulePassword] = useState('');
  const [submittingSchedule, setSubmittingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Load virtual classrooms for all classes
  const loadClassrooms = async () => {
    setLoading(true);
    const results: VirtualClassroomItem[] = [];

    const targetClasses = filterClassId === 'ALL'
      ? classes
      : classes.filter((c) => c.id === filterClassId);

    for (const cls of targetClasses) {
      try {
        const res = await teamsService.getVirtualClassrooms(cls.id);
        if (res.data?.data && Array.isArray(res.data.data)) {
          const list = res.data.data.map((item: any) => ({
            ...item,
            classInfo: {
              code: cls.code,
              courseName: cls.course?.name || 'Môn học',
            },
          }));
          results.push(...list);
        }
      } catch {
        // Class may not have virtual rooms yet
      }
    }

    // Sort by startTime descending
    results.sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    setClassrooms(results);
    setLoading(false);
  };

  useEffect(() => {
    if (classes.length > 0) {
      loadClassrooms();
      if (!instantClassId) setInstantClassId(classes[0].id);
      if (!scheduleClassId) setScheduleClassId(classes[0].id);
    }
  }, [classes, filterClassId]);

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1. Instant Meeting Submit
  const handleStartInstant = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = instantTitle.trim() || `Họp Trực Tuyến - ${user?.fullName || 'PreSkool'}`;
    const roomCode = `meet-${Math.random().toString(36).substring(2, 9)}`;
    const meetingUrl = `https://meet.preskool.edu.vn/room/${roomCode}`;
    const now = new Date();
    const end = new Date(now.getTime() + 2 * 3600000);

    setSubmittingInstant(true);
    let createdRoomId = `adhoc-${Date.now()}`;

    // If linked to class and user is Teacher/Admin, save to PostgreSQL VirtualClassroom
    if (instantClassId && isHost) {
      try {
        const res = await teamsService.createVirtualClassroom(instantClassId, {
          classId: instantClassId,
          title,
          platform: 'TEAMS',
          meetingUrl,
          roomPassword: instantPassword.trim() || null,
          startTime: now.toISOString(),
          endTime: end.toISOString(),
        });
        if (res.data?.data?.id) {
          createdRoomId = res.data.data.id;
        }
        await loadClassrooms();
      } catch (err: any) {
        console.warn('Could not persist instant meeting to DB:', err);
      }
    }

    setSubmittingInstant(false);
    setShowInstantModal(false);

    onJoinMeeting({
      id: createdRoomId,
      title,
      startTime: now.toISOString(),
      endTime: end.toISOString(),
      roomCode,
      isLive: true,
      hostName: user?.fullName || 'Chủ tọa',
      passcode: instantPassword.trim() || undefined,
    });
  };

  // 2. Schedule Meeting Submit (Persist to DB)
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleError(null);

    if (!scheduleTitle.trim()) {
      setScheduleError('Vui lòng nhập tiêu đề cuộc họp');
      return;
    }
    if (!scheduleClassId) {
      setScheduleError('Vui lòng chọn Lớp học phần');
      return;
    }

    const startIso = new Date(`${scheduleDate}T${scheduleStartTime}:00`).toISOString();
    const endIso = new Date(`${scheduleDate}T${scheduleEndTime}:00`).toISOString();
    const roomCode = `sch-${Math.random().toString(36).substring(2, 9)}`;
    const meetingUrl = `https://meet.preskool.edu.vn/room/${roomCode}`;

    setSubmittingSchedule(true);
    try {
      await teamsService.createVirtualClassroom(scheduleClassId, {
        classId: scheduleClassId,
        title: scheduleTitle.trim(),
        platform: 'TEAMS',
        meetingUrl,
        roomPassword: schedulePassword.trim() || null,
        startTime: startIso,
        endTime: endIso,
      });

      setScheduleTitle('');
      setSchedulePassword('');
      setShowScheduleModal(false);
      setSubmittingSchedule(false);
      await loadClassrooms();
    } catch (err: any) {
      setSubmittingSchedule(false);
      const msg = err.response?.data?.message || err.message || 'Lỗi khi lên lịch cuộc họp';
      setScheduleError(msg);
    }
  };

  // 3. Join by Room Code
  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCodeInput.trim().replace(/^https?:\/\/.*\/room\//, '');
    if (!code) return;

    onJoinMeeting({
      id: `room-${code}`,
      title: `Phòng Họp: ${code}`,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString(),
      roomCode: code,
      isLive: true,
      hostName: 'Chủ phòng',
    });
    setJoinCodeInput('');
  };

  // Format Status
  const getMeetingStatus = (startStr: string, endStr?: string | null) => {
    const now = Date.now();
    const start = new Date(startStr).getTime();
    const end = endStr ? new Date(endStr).getTime() : start + 7200000;

    if (now >= start && now <= end) {
      return { label: 'Đang diễn ra', color: 'bg-emerald-500 text-white animate-pulse' };
    }
    if (now < start) {
      return { label: 'Sắp diễn ra', color: 'bg-indigo-100 text-indigo-700' };
    }
    return { label: 'Đã kết thúc', color: 'bg-gray-100 text-gray-600' };
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] overflow-y-auto p-6 space-y-6">
      {/* HEADER BANNER */}
      <div className="rounded-3xl bg-linear-to-r from-[#464775] to-[#5b5fc7] p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              LMS Virtual Classrooms & WebRTC
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Trung Tâm Quản Lý Cuộc Họp & Phòng Học Ảo</h2>
          <p className="text-xs text-violet-200 mt-1">
            Khởi tạo phiên họp tức thì, lên lịch giảng dạy trực tuyến lưu Database và kết nối WebRTC thời gian thực
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Meet Button */}
          <button
            onClick={() => setShowInstantModal(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition cursor-pointer"
          >
            <Video className="h-4 w-4" />
            <span>Họp Ngay</span>
          </button>

          {/* Schedule Button (Teacher/Admin) */}
          {isHost && (
            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-2 rounded-xl bg-white hover:bg-violet-50 px-4 py-2.5 text-xs font-bold text-[#464775] shadow-md transition cursor-pointer"
            >
              <Calendar className="h-4 w-4 text-[#464775]" />
              <span>Lên Lịch Cuộc Họp</span>
            </button>
          )}
        </div>
      </div>

      {/* QUICK JOIN BAR */}
      <div className="rounded-2xl bg-white p-4 border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-gray-700">
          <Lock className="h-4 w-4 text-violet-600" />
          <span className="text-xs font-bold">Tham Gia Cuộc Họp Bằng Mã Phòng:</span>
        </div>

        <form onSubmit={handleJoinByCode} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Nhập mã phòng (VD: meet-abc-xyz) hoặc link..."
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value)}
            className="flex-1 sm:w-80 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs outline-none focus:border-violet-500 focus:bg-white font-mono"
          />
          <button
            type="submit"
            disabled={!joinCodeInput.trim()}
            className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50 transition cursor-pointer shrink-0"
          >
            Vào Phòng
          </button>
        </form>
      </div>

      {/* FILTER & MEETINGS LIST */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900">Danh Sách Cuộc Họp Trực Tuyến</h3>
            <span className="rounded-full bg-violet-100 text-violet-800 text-[10px] font-bold px-2 py-0.5">
              {classrooms.length} phòng
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Filter by class */}
            <select
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 outline-none"
            >
              <option value="ALL">Tất cả lớp học phần</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.code} - {cls.course?.name || 'Lớp'}
                </option>
              ))}
            </select>

            <button
              onClick={loadClassrooms}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              title="Làm mới"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Làm Mới</span>
            </button>
          </div>
        </div>

        {/* MEETINGS GRID */}
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-xs text-gray-500">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-violet-600 mb-2" />
            Đang tải dữ liệu cuộc họp từ LMS Database...
          </div>
        ) : classrooms.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 mb-3">
              <Video className="h-7 w-7" />
            </div>
            <h4 className="text-sm font-bold text-gray-900">Chưa có cuộc họp nào</h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-4">
              Chưa có phiên học trực tuyến nào được lên lịch cho các lớp học phần này.
              Giảng viên có thể bấm "Lên Lịch Cuộc Họp" hoặc "Họp Ngay" để khởi tạo.
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setShowInstantModal(true)}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition cursor-pointer"
              >
                Họp Ngay
              </button>
              {isHost && (
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700 transition cursor-pointer"
                >
                  Lên Lịch Cuộc Họp
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classrooms.map((room) => {
              const status = getMeetingStatus(room.startTime, room.endTime);
              const roomCode = room.meetingUrl.replace(/^https?:\/\/.*\/room\//, '') || room.id;

              return (
                <div
                  key={room.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-3"
                >
                  <div>
                    {/* Status & Platform */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="rounded bg-violet-50 text-violet-700 text-[10px] font-mono font-bold px-1.5 py-0.5">
                        {room.platform}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">
                      {room.title}
                    </h4>

                    {/* Class Info */}
                    {room.classInfo && (
                      <p className="text-xs text-violet-700 font-semibold mt-1 truncate">
                        {room.classInfo.code} - {room.classInfo.courseName}
                      </p>
                    )}

                    {/* Time */}
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-2 font-mono">
                      <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span>
                        {new Date(room.startTime).toLocaleDateString('vi-VN')} (
                        {new Date(room.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        {room.endTime &&
                          ` - ${new Date(room.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
                        )
                      </span>
                    </div>

                    {/* Room Code */}
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-600 mt-1 font-mono">
                      <span className="text-gray-400">Mã phòng:</span>
                      <span className="font-bold text-gray-800">{roomCode}</span>
                    </div>

                    {/* Password if any */}
                    {room.roomPassword && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-700 mt-0.5">
                        <Lock className="h-3 w-3" />
                        <span>Mật khẩu: {room.roomPassword}</span>
                      </div>
                    )}

                    {/* Recordings if any */}
                    {room.recordings && room.recordings.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <span className="text-[10px] font-bold text-gray-600 flex items-center gap-1 mb-1">
                          <Film className="h-3 w-3 text-violet-600" />
                          Bản ghi hình ({room.recordings.length}):
                        </span>
                        <div className="space-y-1">
                          {room.recordings.map((rec, i) => (
                            <a
                              key={i}
                              href={rec.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-violet-600 hover:underline flex items-center gap-1 truncate"
                            >
                              <ExternalLink className="h-3 w-3 shrink-0" />
                              <span className="truncate">{rec.title || `Bản ghi ${i + 1}`}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleCopyLink(room.meetingUrl, room.id)}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                      title="Sao chép link phòng"
                    >
                      {copiedId === room.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() =>
                        onJoinMeeting({
                          id: room.id,
                          title: room.title,
                          startTime: room.startTime,
                          endTime: room.endTime || new Date().toISOString(),
                          roomCode,
                          isLive: true,
                          hostName: 'Giảng viên',
                          passcode: room.roomPassword || undefined,
                        })
                      }
                      className="flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 px-3.5 py-1.5 text-xs font-bold text-white transition shadow-2xs cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Tham Gia</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: TẠO CUỘC HỌP NGAY */}
      {showInstantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Khởi Tạo Cuộc Họp Ngay</h3>
                <p className="text-xs text-gray-500">Tạo nhanh phòng học WebRTC với mã phòng duy nhất</p>
              </div>
              <button
                onClick={() => setShowInstantModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStartInstant} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Tiêu Đề Cuộc Họp</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Thảo luận đồ án nhóm 1..."
                  value={instantTitle}
                  onChange={(e) => setInstantTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-violet-500"
                />
              </div>

              {classes.length > 0 && (
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Gắn với Lớp Học Phần (Tùy chọn)
                  </label>
                  <select
                    value={instantClassId}
                    onChange={(e) => setInstantClassId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-violet-500"
                  >
                    <option value="">Không gắn lớp (Cuộc họp tự do)</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.code} - {cls.course?.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Mật Khẩu Phòng (Tùy chọn)</label>
                <input
                  type="text"
                  placeholder="Để trống nếu không yêu cầu mật khẩu"
                  value={instantPassword}
                  onChange={(e) => setInstantPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-violet-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInstantModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingInstant}
                  className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700 transition cursor-pointer"
                >
                  {submittingInstant ? 'Đang Khởi Tạo...' : 'Vào Phòng Ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LÊN LỊCH CUỘC HỌP (LMS VIRTUAL CLASSROOM POSTGRESQL) */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Lên Lịch Cuộc Họp / Tiết Học Trực Tuyến</h3>
                <p className="text-xs text-gray-500">Lưu vào PostgreSQL qua LMS Virtual Classroom API</p>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {scheduleError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{scheduleError}</span>
              </div>
            )}

            <form onSubmit={handleScheduleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Tiêu Đề Cuộc Họp / Tiết Học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tiết 3-4: Thực hành REST API với Prisma..."
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Lớp Học Phần <span className="text-rose-500">*</span>
                </label>
                <select
                  value={scheduleClassId}
                  onChange={(e) => setScheduleClassId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-violet-500"
                  required
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.code} - {cls.course?.name || 'Lớp Học Phần'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Ngày Diễn Ra</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Giờ Bắt Đầu</label>
                  <input
                    type="time"
                    value={scheduleStartTime}
                    onChange={(e) => setScheduleStartTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Giờ Kết Thúc</label>
                  <input
                    type="time"
                    value={scheduleEndTime}
                    onChange={(e) => setScheduleEndTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Mật Khẩu Phòng (Tùy chọn)</label>
                <input
                  type="text"
                  placeholder="Mật khẩu bảo vệ phòng học..."
                  value={schedulePassword}
                  onChange={(e) => setSchedulePassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingSchedule}
                  className="rounded-xl bg-violet-600 px-5 py-2 font-bold text-white hover:bg-violet-700 transition cursor-pointer"
                >
                  {submittingSchedule ? 'Đang Lưu DB...' : 'Lên Lịch & Lưu Vào DB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsMeetingsHub;
