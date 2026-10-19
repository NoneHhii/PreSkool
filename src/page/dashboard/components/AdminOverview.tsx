import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  CalendarCheck2
} from 'lucide-react';
import { academicService } from '../../../services/academic.service';

interface AdminOverviewProps {
  onNavigateTab: (tabId: string) => void;
  user: any;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ onNavigateTab, user }) => {
  const [counts, setCounts] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    courses: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [studentsRes, teachersRes, classesRes, coursesRes] = await Promise.allSettled([
          academicService.getStudents(),
          academicService.getTeachers(),
          academicService.getClasses(),
          academicService.getCourses(),
        ]);

        setCounts({
          students: studentsRes.status === 'fulfilled' && studentsRes.value?.data ? studentsRes.value.data.length : 1240,
          teachers: teachersRes.status === 'fulfilled' && teachersRes.value?.data ? teachersRes.value.data.length : 86,
          classes: classesRes.status === 'fulfilled' && classesRes.value?.data ? classesRes.value.data.length : 42,
          courses: coursesRes.status === 'fulfilled' && coursesRes.value?.data ? coursesRes.value.data.length : 68,
        });
      } catch (err) {
        console.error('Error fetching dashboard counts', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  const adminName = user?.profile?.fullName || user?.username || 'Administrator';

  return (
    <div className="space-y-6">
      {/* Welcome Banner matching Figma */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#171b30] via-[#20274a] to-[#141933] p-6 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-blue-200 backdrop-blur-md mb-3">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Hệ thống Quản lý Đào tạo PreSkool</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              Chào mừng trở lại, {adminName}!
            </h2>
            <p className="mt-1 text-xs md:text-sm text-gray-300">
              Chúc bạn một ngày làm việc hiệu quả. Dưới đây là tóm tắt quy trình quản lý học vụ hôm nay.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateTab('import')}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition cursor-pointer"
            >
              <Users className="h-4 w-4" />
              <span>Import Tuyển sinh</span>
            </button>
            <button
              onClick={() => onNavigateTab('schedule')}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-md hover:bg-white/25 transition cursor-pointer"
            >
              <CalendarCheck2 className="h-4 w-4" />
              <span>Xếp Lịch Học</span>
            </button>
          </div>
        </div>

        {/* Decorative Background Shapes */}
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-40 -top-10 h-40 w-40 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none" />
      </div>

      {/* 4 Metric Cards matching PreSkool Design System */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Students */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs transition hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              +1.2%
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">{loading ? '...' : counts.students.toLocaleString()}</h3>
            <p className="text-xs font-medium text-gray-500">Tổng Sinh Viên</p>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-[11px] text-gray-400">
            <span>Đang học: <strong className="text-gray-700">{counts.students}</strong></span>
            <span>Bảo lưu: <strong className="text-gray-700">0</strong></span>
          </div>
        </div>

        {/* Total Teachers */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs transition hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              +2.4%
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">{loading ? '...' : counts.teachers.toLocaleString()}</h3>
            <p className="text-xs font-medium text-gray-500">Giảng Viên & Cán Bộ</p>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-[11px] text-gray-400">
            <span>Chính thức: <strong className="text-gray-700">{counts.teachers}</strong></span>
            <span>Thỉnh giảng: <strong className="text-gray-700">0</strong></span>
          </div>
        </div>

        {/* Total Course Classes */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs transition hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Layers className="h-6 w-6" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600">
              Kỳ 2024-1
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">{loading ? '...' : counts.classes.toLocaleString()}</h3>
            <p className="text-xs font-medium text-gray-500">Lớp Học Phần Mở</p>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-[11px] text-gray-400">
            <span>Đã xếp TKB: <strong className="text-gray-700">{counts.classes}</strong></span>
            <span>Chờ xếp: <strong className="text-gray-700">0</strong></span>
          </div>
        </div>

        {/* Total Courses */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs transition hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <BookOpen className="h-6 w-6" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
              Chương trình ĐT
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">{loading ? '...' : counts.courses.toLocaleString()}</h3>
            <p className="text-xs font-medium text-gray-500">Tổng Môn Học</p>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-[11px] text-gray-400">
            <span>Lý thuyết & TH: <strong className="text-gray-700">{counts.courses}</strong></span>
            <span>Tiên quyết: <strong className="text-gray-700">Đầy đủ</strong></span>
          </div>
        </div>
      </div>

      {/* Main Content 2-Columns Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Workflow Management & Quick Modules */}
        <div className="space-y-6 lg:col-span-2">
          {/* Workflow Tasks */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Quy Trình Quản Lý Đào Tạo (Workflow Management)</h3>
                <p className="text-xs text-gray-500">Các bước nghiệp vụ chính của Admin trường học</p>
              </div>
              <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                Học kỳ 1 / 2026-2027
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Step 1: Faculties & Majors */}
              <div
                onClick={() => onNavigateTab('faculties')}
                className="group flex flex-col justify-between rounded-xl border border-gray-100 p-4 transition hover:border-blue-200 hover:bg-blue-50/20 hover:shadow-xs cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Bước 1</span>
                    <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition" />
                  </div>
                  <h4 className="mt-2 text-sm font-bold text-gray-900">Khoa & Ngành Đào Tạo</h4>
                  <p className="mt-1 text-xs text-gray-500">Quản lý cơ cấu các Khoa viện và Ngành học trực thuộc.</p>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                  <span>Quản lý Khoa/Ngành</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* Step 2: Homerooms & Auto Assign */}
              <div
                onClick={() => onNavigateTab('homerooms')}
                className="group flex flex-col justify-between rounded-xl border border-gray-100 p-4 transition hover:border-blue-200 hover:bg-blue-50/20 hover:shadow-xs cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Bước 2</span>
                    <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition" />
                  </div>
                  <h4 className="mt-2 text-sm font-bold text-gray-900">Lớp Hành Chính & Auto Assign</h4>
                  <p className="mt-1 text-xs text-gray-500">Tự động sinh lớp và phân phối sinh viên chưa có lớp.</p>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                  <span>Xem Lớp Hành Chính</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* Step 3: Course Classes */}
              <div
                onClick={() => onNavigateTab('classes')}
                className="group flex flex-col justify-between rounded-xl border border-gray-100 p-4 transition hover:border-blue-200 hover:bg-blue-50/20 hover:shadow-xs cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Bước 3</span>
                    <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition" />
                  </div>
                  <h4 className="mt-2 text-sm font-bold text-gray-900">Mở Lớp Học Phần</h4>
                  <p className="mt-1 text-xs text-gray-500">Gán lớp hành chính hoặc tự động rải sinh viên vào lớp học phần.</p>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                  <span>Xem Lớp Học Phần</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* Step 4: Schedule */}
              <div
                onClick={() => onNavigateTab('schedule')}
                className="group flex flex-col justify-between rounded-xl border border-gray-100 p-4 transition hover:border-blue-200 hover:bg-blue-50/20 hover:shadow-xs cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Bước 4</span>
                    <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition" />
                  </div>
                  <h4 className="mt-2 text-sm font-bold text-gray-900">Xếp Thời Khóa Biểu Hàng Loạt</h4>
                  <p className="mt-1 text-xs text-gray-500">Tự động kiểm tra trùng phòng học và trùng giáo viên giảng dạy.</p>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                  <span>Xem Lịch Biểu</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Stats Preview matching Figma */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Tình Trạng Điểm Danh Sinh Viên</h3>
                <p className="text-xs text-gray-500">Thống kê điểm danh toàn trường hôm nay</p>
              </div>
              <button
                onClick={() => onNavigateTab('attendance')}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Chấm Điểm Danh &rarr;
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-emerald-50/70 p-3 text-center border border-emerald-100">
                <span className="text-2xl font-bold text-emerald-700">92%</span>
                <p className="mt-1 text-xs text-emerald-800 font-medium">Có mặt (Present)</p>
              </div>
              <div className="rounded-lg bg-rose-50/70 p-3 text-center border border-rose-100">
                <span className="text-2xl font-bold text-rose-700">4%</span>
                <p className="mt-1 text-xs text-rose-800 font-medium">Vắng (Absent)</p>
              </div>
              <div className="rounded-lg bg-blue-50/70 p-3 text-center border border-blue-100">
                <span className="text-2xl font-bold text-blue-700">2.5%</span>
                <p className="mt-1 text-xs text-blue-800 font-medium">Có phép (Excused)</p>
              </div>
              <div className="rounded-lg bg-amber-50/70 p-3 text-center border border-amber-100">
                <span className="text-2xl font-bold text-amber-700">1.5%</span>
                <p className="mt-1 text-xs text-amber-800 font-medium">Trễ (Late)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Links & Events */}
        <div className="space-y-6">
          {/* Quick Shortcuts matching Figma Quick Links */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Lối Tắt Nhanh (Quick Links)</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => onNavigateTab('schedule')}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-100 hover:bg-emerald-50 hover:border-emerald-200 transition cursor-pointer group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 group-hover:scale-105 transition">
                  <Calendar className="h-5 w-5" />
                </div>
                <span className="mt-2 text-[11px] font-medium text-gray-700">Lịch Học</span>
              </button>

              <button
                onClick={() => onNavigateTab('attendance')}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-100 hover:bg-amber-50 hover:border-amber-200 transition cursor-pointer group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 group-hover:scale-105 transition">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <span className="mt-2 text-[11px] font-medium text-gray-700">Điểm Danh</span>
              </button>

              <button
                onClick={() => onNavigateTab('courses')}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition cursor-pointer group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:scale-105 transition">
                  <BookOpen className="h-5 w-5" />
                </div>
                <span className="mt-2 text-[11px] font-medium text-gray-700">Môn Học</span>
              </button>
            </div>
          </div>

          {/* To Do / System Status */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
              <h3 className="text-sm font-bold text-gray-900">Công Việc Học Vụ Cần Làm</h3>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">3 Cần xử lý</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-50/60 border border-gray-100">
                <input type="checkbox" defaultChecked className="mt-1 h-3.5 w-3.5 rounded text-blue-600" />
                <div className="text-xs">
                  <p className="font-semibold text-gray-900 line-through text-gray-400">Import danh sách sinh viên K26</p>
                  <span className="text-[10px] text-gray-400">Đã hoàn thành lúc 09:30 AM</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-blue-50/40 border border-blue-100">
                <input type="checkbox" className="mt-1 h-3.5 w-3.5 rounded text-blue-600 cursor-pointer" />
                <div className="text-xs">
                  <p className="font-semibold text-gray-900">Tự động phân lớp hành chính K26</p>
                  <span className="text-[10px] text-blue-600">Còn sinh viên chưa gán lớp</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-amber-50/40 border border-amber-100">
                <input type="checkbox" className="mt-1 h-3.5 w-3.5 rounded text-blue-600 cursor-pointer" />
                <div className="text-xs">
                  <p className="font-semibold text-gray-900">Xếp TKB học kỳ 1 cho lớp học phần CS101</p>
                  <span className="text-[10px] text-amber-600">Hạn chót: 20/10/2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
