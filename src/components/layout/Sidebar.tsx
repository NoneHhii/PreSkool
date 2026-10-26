import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  ClipboardCheck,
  Building2,
  Layers,
  School,
  LogOut,
  User,
  UploadCloud,
  CreditCard,
  FileCheck2,
  Tv,
  FolderTree,
  FileText,
  UserCheck,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen = true,
  onClose,
}) => {
  const navigate = useNavigate();
  const user = (() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })();

  const role = user?.role || 'STUDENT';
  const isAdmin = role === 'ADMIN';
  const isTeacher = role === 'TEACHER';
  const isStudent = role === 'STUDENT';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  const handleTabClick = (tabId: string) => {
    onSelectTab(tabId);
    if (onClose && window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-100 bg-white transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3d5ee1] text-white shadow-xs">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Pre<span className="text-[#3d5ee1]">Skool</span>
            </span>
          </div>
        </div>

        {/* Institution Badge */}
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between rounded-xl border border-gray-200/80 bg-gray-50/70 p-2.5 transition hover:bg-gray-50">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 font-bold text-xs">
                <School className="h-4 w-4" />
              </div>
              <div className="truncate">
                <p className="truncate text-xs font-semibold text-gray-900">Đại Học Công Nghệ</p>
                <p className="text-[10px] text-gray-400">
                  {isAdmin ? 'Quản Trị Viên' : isTeacher ? 'Giảng Viên' : 'Cổng Sinh Viên'}
                </p>
              </div>
            </div>
            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 uppercase">
              {role}
            </span>
          </div>
        </div>

        {/* Scrollable Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-5 scrollbar-thin">
          {/* Main Section */}
          <div>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Tổng Quan</p>
            <div className="space-y-1">
              {isAdmin && (
                <button
                  onClick={() => handleTabClick('overview')}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                    activeTab === 'overview'
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="h-4 w-4 text-blue-600" />
                    <span>Admin Dashboard</span>
                  </div>
                  <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[9px] font-bold text-blue-700">Admin</span>
                </button>
              )}

              {isTeacher && (
                <button
                  onClick={() => handleTabClick('teacher-overview')}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                    activeTab === 'teacher-overview'
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="h-4 w-4 text-emerald-600" />
                    <span>Teacher Dashboard</span>
                  </div>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700">Giảng Viên</span>
                </button>
              )}
            </div>
          </div>

          {/* Peoples Section (Admin only) */}
          {isAdmin && (
            <div>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Hồ Sơ & Tuyển Sinh</p>
              <div className="space-y-1">
                {/* Hồ sơ Sinh viên */}
                <button
                  onClick={() => handleTabClick('students')}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                    activeTab === 'students'
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="h-4 w-4 text-indigo-500" />
                    <span>Hồ Sơ & Trạng Thái SV</span>
                  </div>
                  <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700">Audit</span>
                </button>

                {/* Import Users Excel */}
                <button
                  onClick={() => handleTabClick('import')}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                    activeTab === 'import'
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <UploadCloud className="h-4 w-4 text-sky-500" />
                    <span>Import Tuyển Sinh</span>
                  </div>
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">Excel</span>
                </button>
              </div>
            </div>
          )}

          {/* Academic & Teaching Section */}
          <div>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {isAdmin ? 'Quản Lý Đào Tạo' : 'Lịch & Giảng Dạy'}
            </p>
            <div className="space-y-1">
              {/* Thời khóa biểu (All roles) */}
              <button
                onClick={() => handleTabClick('schedule')}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                  activeTab === 'schedule'
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-rose-500" />
                  <span>Thời Khóa Biểu</span>
                </div>
              </button>

              {/* Điểm danh & Sổ đầu bài (Admin & Teacher) */}
              {(isAdmin || isTeacher) && (
                <button
                  onClick={() => handleTabClick('attendance')}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                    activeTab === 'attendance'
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ClipboardCheck className="h-4 w-4 text-teal-500" />
                    <span>Điểm Danh & Sổ Đầu Bài</span>
                  </div>
                </button>
              )}

              {/* Lớp Học Phần (Admin & Teacher) */}
              {(isAdmin || isTeacher) && (
                <button
                  onClick={() => handleTabClick('classes')}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                    activeTab === 'classes'
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="h-4 w-4 text-indigo-500" />
                    <span>Lớp Học Phần</span>
                  </div>
                </button>
              )}

              {/* Admin specific academic submodules */}
              {isAdmin && (
                <>
                  <button
                    onClick={() => handleTabClick('homerooms')}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                      activeTab === 'homerooms'
                        ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span>Lớp Hành Chính (Auto)</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleTabClick('curriculums')}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                      activeTab === 'curriculums'
                        ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <FolderTree className="h-4 w-4 text-purple-600" />
                      <span>Khung Chương Trình</span>
                    </div>
                    <span className="rounded bg-purple-50 px-1 py-0.2 text-[9px] font-bold text-purple-700">Mới</span>
                  </button>

                  <button
                    onClick={() => handleTabClick('courses')}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                      activeTab === 'courses'
                        ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="h-4 w-4 text-emerald-500" />
                      <span>Môn Học</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleTabClick('majors')}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                      activeTab === 'majors'
                        ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <GraduationCap className="h-4 w-4 text-purple-500" />
                      <span>Ngành Học</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleTabClick('faculties')}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                      activeTab === 'faculties'
                        ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 className="h-4 w-4 text-amber-500" />
                      <span>Khoa / Viện</span>
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ERP Core Modules Section */}
          <div>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Phân Hệ Nghiệp Vụ ERP</p>
            <div className="space-y-1">
              {/* Đăng Ký Tín Chỉ (Admin & Student) */}
              {(isAdmin || isStudent) && (
                <button
                  onClick={() => handleTabClick('registration')}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                    activeTab === 'registration'
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileCheck2 className="h-4 w-4 text-cyan-600" />
                    <span>Đăng Ký Tín Chỉ</span>
                  </div>
                </button>
              )}

              {/* Khảo Thí & Quản Trị Điểm (All Roles) */}
              <button
                onClick={() => handleTabClick('examination')}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                  activeTab === 'examination'
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 text-orange-500" />
                  <span>Khảo Thí & Quản Trị Điểm</span>
                </div>
              </button>

              {/* Tài Chính & Học Phí (Admin & Student) */}
              {(isAdmin || isStudent) && (
                <button
                  onClick={() => handleTabClick('finance')}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                    activeTab === 'finance'
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="h-4 w-4 text-emerald-600" />
                    <span>Tài Chính & Học Phí</span>
                  </div>
                </button>
              )}

              {/* Cố Vấn Học Tập (Admin & Teacher) */}
              {(isAdmin || isTeacher) && (
                <button
                  onClick={() => handleTabClick('advisor')}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                    activeTab === 'advisor'
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="h-4 w-4 text-blue-600" />
                    <span>Cố Vấn Học Tập</span>
                  </div>
                </button>
              )}

              {/* Công Tác Sinh Viên & Điểm Rèn Luyện (All roles) */}
              <button
                onClick={() => handleTabClick('affairs')}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                  activeTab === 'affairs'
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="h-4 w-4 text-pink-500" />
                  <span>Công Tác SV & Dịch Vụ 1 Cửa</span>
                </div>
              </button>

              {/* LMS & Học Trực Tuyến (All roles) */}
              <button
                onClick={() => handleTabClick('lms')}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                  activeTab === 'lms'
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Tv className="h-4 w-4 text-violet-600" />
                  <span>Khóa Học LMS (E-Learning)</span>
                </div>
                <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[9px] font-bold text-violet-700">LMS 2.0</span>
              </button>
            </div>
          </div>

          {/* User Settings */}
          <div>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Tài Khoản</p>
            <div className="space-y-1">
              <button
                onClick={() => navigate('/profile')}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition cursor-pointer"
              >
                <User className="h-4 w-4 text-gray-500" />
                <span>Hồ Sơ Cá Nhân & Bảo Mật</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Đăng Xuất</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info matching PreSkool */}
        <div className="border-t border-gray-100 p-4 text-center">
          <p className="text-[11px] text-gray-400">PreSkool ERP &copy; 2026</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
