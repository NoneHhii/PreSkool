import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  ClipboardCheck,
  Building2,
  ChevronDown,
  Layers,
  School,
  LogOut,
  User,
  UploadCloud
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
  onClose
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
  const isAdmin = user?.role === 'ADMIN';

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    dashboard: true,
    academic: true,
    peoples: false,
  });

  const toggleSection = (sectionKey: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
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
                <p className="truncate text-xs font-semibold text-gray-900">Global International</p>
                <p className="text-[10px] text-gray-400">School ERP System</p>
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          </div>
        </div>

        {/* Scrollable Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6 scrollbar-thin">
          {/* Main Section */}
          <div>
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Main</p>
            <div className="space-y-1">
              {/* Dashboard dropdown */}
              <div>
                <button
                  onClick={() => toggleSection('dashboard')}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                    activeTab === 'overview' || activeTab === 'teacher-overview'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="h-4 w-4 text-blue-600" />
                    <span>Dashboard</span>
                  </div>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-gray-400 transition-transform ${
                      openSections.dashboard ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {openSections.dashboard && (
                  <div className="mt-1 ml-4 space-y-1 border-l-2 border-gray-100 pl-3">
                    {isAdmin && (
                      <button
                        onClick={() => onSelectTab('overview')}
                        className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition cursor-pointer ${
                          activeTab === 'overview'
                            ? 'text-blue-600 font-semibold bg-blue-50/50'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        <span>Admin Dashboard</span>
                        <span className="rounded bg-blue-100 px-1 py-0.2 text-[9px] font-bold text-blue-700">Admin</span>
                      </button>
                    )}
                    <button
                      onClick={() => onSelectTab('teacher-overview')}
                      className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition cursor-pointer ${
                        activeTab === 'teacher-overview'
                          ? 'text-blue-600 font-semibold bg-blue-50/50'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <span>Teacher Dashboard</span>
                      <span className="rounded bg-emerald-100 px-1 py-0.2 text-[9px] font-bold text-emerald-700">Teacher</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Peoples Section (Admin only) */}
          {isAdmin && (
            <div>
              <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Peoples</p>
              <div className="space-y-1">
                <button
                  onClick={() => onSelectTab('import')}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                    activeTab === 'import'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <UploadCloud className="h-4 w-4 text-sky-500" />
                    <span>Import Sinh viên</span>
                  </div>
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">Excel</span>
                </button>
              </div>
            </div>
          )}

          {/* Academic Section */}
          <div>
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Academic</p>
            <div className="space-y-1">
              {isAdmin && (
                <>
                  {/* Lớp Học Phần */}
                  <button
                    onClick={() => onSelectTab('classes')}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                      activeTab === 'classes'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Layers className="h-4 w-4 text-indigo-500" />
                      <span>Lớp Học Phần</span>
                    </div>
                  </button>

                  {/* Lớp Hành Chính */}
                  <button
                    onClick={() => onSelectTab('homerooms')}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                      activeTab === 'homerooms'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span>Lớp Hành Chính</span>
                    </div>
                  </button>

                  {/* Môn Học (Courses) */}
                  <button
                    onClick={() => onSelectTab('courses')}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                      activeTab === 'courses'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="h-4 w-4 text-emerald-500" />
                      <span>Môn Học</span>
                    </div>
                  </button>

                  {/* Ngành Học (Majors) */}
                  <button
                    onClick={() => onSelectTab('majors')}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                      activeTab === 'majors'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <GraduationCap className="h-4 w-4 text-purple-500" />
                      <span>Ngành Học</span>
                    </div>
                  </button>

                  {/* Khoa / Viện (Faculties) */}
                  <button
                    onClick={() => onSelectTab('faculties')}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                      activeTab === 'faculties'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
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

              {/* Thời khóa biểu (Time Table) */}
              <button
                onClick={() => onSelectTab('schedule')}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                  activeTab === 'schedule'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-rose-500" />
                  <span>Thời Khóa Biểu</span>
                </div>
              </button>
            </div>
          </div>

          {/* HRM & Management Section */}
          <div>
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Quản Lý & Điểm Danh</p>
            <div className="space-y-1">
              <button
                onClick={() => onSelectTab('attendance')}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                  activeTab === 'attendance'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ClipboardCheck className="h-4 w-4 text-teal-500" />
                  <span>Điểm Danh (Attendance)</span>
                </div>
              </button>
            </div>
          </div>

          {/* User Settings */}
          <div>
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Tài Khoản</p>
            <div className="space-y-1">
              <button
                onClick={() => navigate('/profile')}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition cursor-pointer"
              >
                <User className="h-4 w-4 text-gray-500" />
                <span>Hồ Sơ Cá Nhân</span>
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
