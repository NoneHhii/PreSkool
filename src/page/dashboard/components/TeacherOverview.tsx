import React, { useState, useEffect } from 'react';
import {
  Clock,
  ClipboardCheck,
  Sparkles,
  ChevronRight,
  CheckCircle,
  Bell
} from 'lucide-react';
import Avatar from '../../../components/ui/Avatar';
import { academicService, type Schedule } from '../../../services/academic.service';

interface TeacherOverviewProps {
  onNavigateTab: (tabId: string) => void;
  user: any;
}

export const TeacherOverview: React.FC<TeacherOverviewProps> = ({ onNavigateTab, user }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeacherSchedule = async () => {
      try {
        const res = await academicService.getSchedule();
        if (res?.data) {
          setSchedules(res.data);
        }
      } catch (err) {
        console.error('Error fetching teacher schedule', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeacherSchedule();
  }, []);

  const teacherName = user?.profile?.fullName || user?.username || 'Giảng Viên';

  return (
    <div className="space-y-6">
      {/* Teacher Welcome Banner matching Figma */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2152ff] via-[#3872ff] to-[#4e82f7] p-6 text-white shadow-md">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs text-white backdrop-blur-md mb-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>PreSkool ERP - Không Gian Giảng Viên</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Chào buổi sáng, {teacherName}!
          </h2>
          <p className="mt-1 text-xs md:text-sm text-blue-100">
            Chúc thầy/cô một ngày giảng dạy đầy năng lượng và hiệu quả.
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-xs backdrop-blur-md">
            <Bell className="h-4 w-4 shrink-0 text-amber-300 animate-bounce" />
            <span className="truncate">Thông báo: Cuộc họp bộ môn sẽ diễn ra lúc 09:30 AM tại Phòng Hội Đồng.</span>
          </div>
        </div>

        {/* Decorative Circle Shapes */}
        <div className="absolute -right-8 -bottom-8 h-48 w-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
      </div>

      {/* Profile & Syllabus Progress Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Profile Card */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs flex items-center gap-4">
          <Avatar
            src={user?.profile?.avatarUrl}
            name={teacherName}
            size="lg"
            status="online"
          />
          <div className="overflow-hidden">
            <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">#GV2026</span>
            <h3 className="mt-1 text-base font-bold text-gray-900 truncate">{teacherName}</h3>
            <p className="text-xs text-gray-500">Bộ môn Kỹ Thuật Phần Mềm</p>
          </div>
        </div>

        {/* Syllabus Completion */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tiến Độ Giảng Dạy</span>
            <h4 className="mt-1 text-2xl font-bold text-gray-900">95%</h4>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle className="h-3 w-3" /> Đã hoàn thành 18/20 bài
              </span>
            </div>
          </div>
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 font-bold text-sm ring-4 ring-emerald-100">
            95%
          </div>
        </div>

        {/* Quick Attendance Action */}
        <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Nghiệp Vụ Nhanh</span>
            <h4 className="mt-1 text-sm font-bold text-gray-900">Điểm Danh Lớp Học</h4>
            <p className="mt-1 text-xs text-gray-500">Chấm điểm danh sinh viên các ca dạy hôm nay.</p>
          </div>
          <button
            onClick={() => onNavigateTab('attendance')}
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
          >
            <ClipboardCheck className="h-4 w-4" />
            <span>Mở Trang Điểm Danh</span>
          </button>
        </div>
      </div>

      {/* Today's Classes List matching Figma */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Lịch Dạy Hôm Nay (Today's Classes)</h3>
            <p className="text-xs text-gray-500">Danh sách các ca học được xếp lịch giảng dạy</p>
          </div>
          <button
            onClick={() => onNavigateTab('schedule')}
            className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
          >
            Xem Toàn Bộ TKB &rarr;
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-gray-400">Đang tải lịch giảng dạy...</div>
        ) : schedules.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {schedules.slice(0, 4).map((item, idx) => (
              <div
                key={item.id || idx}
                className="flex flex-col justify-between rounded-xl border border-gray-100 bg-gray-50/60 p-4 transition hover:border-blue-200 hover:bg-white hover:shadow-xs"
              >
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                    <Clock className="h-3 w-3" />
                    <span>{item.shift || 'Ca 1'}</span>
                  </div>
                  <h4 className="mt-2 text-sm font-bold text-gray-900">
                    {item.classInfo?.code || 'Lớp Học Phần'}
                  </h4>
                  <p className="text-xs text-gray-500">Phòng: {item.room || 'Phòng A101'}</p>
                  <p className="text-xs text-gray-400 mt-1">Ngày: {item.date}</p>
                </div>

                <button
                  onClick={() => onNavigateTab('attendance')}
                  className="mt-4 flex items-center justify-between rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                >
                  <span>Điểm danh</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700">
                <Clock className="h-3 w-3" />
                <span>07:30 - 09:15</span>
              </div>
              <h4 className="mt-2 text-sm font-bold text-gray-900">CS101 - Nhập Môn Lập Trình</h4>
              <p className="text-xs text-gray-500">Phòng máy B204 | Lớp 26SE01</p>
              <button
                onClick={() => onNavigateTab('attendance')}
                className="mt-3 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Chấm điểm danh ca này &rarr;
              </button>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                <Clock className="h-3 w-3" />
                <span>09:30 - 11:15</span>
              </div>
              <h4 className="mt-2 text-sm font-bold text-gray-900">SE202 - Kiến Trúc Phần Mềm</h4>
              <p className="text-xs text-gray-500">Phòng lý thuyết A102 | Lớp 26SE02</p>
              <button
                onClick={() => onNavigateTab('attendance')}
                className="mt-3 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Chấm điểm danh ca này &rarr;
              </button>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                <Clock className="h-3 w-3" />
                <span>13:30 - 15:15</span>
              </div>
              <h4 className="mt-2 text-sm font-bold text-gray-900">CS105 - Cấu Trúc Dữ Liệu</h4>
              <p className="text-xs text-gray-500">Phòng máy B301 | Lớp 26IT01</p>
              <button
                onClick={() => onNavigateTab('attendance')}
                className="mt-3 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Chấm điểm danh ca này &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherOverview;
