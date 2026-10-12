import React from 'react';
import {
  LayoutDashboard, Building2, BookOpen, Users, GraduationCap,
  FileSpreadsheet, Calendar, ClipboardCheck, LogOut, Settings,
  User, Video, MessageSquare, MessageCircle, CheckSquare,
  FileBarChart, Banknote, HelpCircle
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  handleLogout: () => void;
}

const NavItem = ({ id, icon: Icon, label, hidden = false, activeTab, setActiveTab }: { id: string, icon: any, label: string, hidden?: boolean, activeTab: string, setActiveTab: (tab: string) => void }) => {
  if (hidden) return null;
  return (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === id
          ? 'bg-blue-50 text-blue-700'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
    >
      <Icon className="w-5 h-5" />
      <span className="truncate">{label}</span>
    </button>
  );
};

const NavGroup = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="mb-6">
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">{title}</p>
    <nav className="space-y-1">
      {children}
    </nav>
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, user, handleLogout }) => {
  const isAdmin = user?.role === 'ADMIN';

  return (
    <aside className="w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col h-screen">
      {/* Logo - Fixed at top */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-800 tracking-tight">PreSkool</span>
        </div>
      </div>

      {/* Menu - Scrollable */}
      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
        <NavGroup title="Main">
          <NavItem id="overview" icon={LayoutDashboard} label="Dashboard" activeTab={activeTab} setActiveTab={setActiveTab} />
        </NavGroup>

        <NavGroup title="Academic & Management">
          <NavItem id="faculties" icon={Building2} label="Faculties & Majors" hidden={!isAdmin} activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem id="courses" icon={BookOpen} label="Courses (Môn học)" hidden={!isAdmin} activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem id="homerooms" icon={GraduationCap} label="Homerooms (Lớp sinh hoạt)" hidden={!isAdmin} activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem id="classes" icon={Users} label="Course Classes (Lớp học phần)" hidden={!isAdmin} activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem id="registration" icon={CheckSquare} label="Course Registration" hidden={user?.role === 'TEACHER'} activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem id="schedule" icon={Calendar} label="Schedule" activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem id="attendance" icon={ClipboardCheck} label="Attendance" activeTab={activeTab} setActiveTab={setActiveTab} />
        </NavGroup>

        <NavGroup title="Student Affairs">
          <NavItem id="directory" icon={Users} label="Student Directory" hidden={user?.role === 'STUDENT'} activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem id="affairs" icon={HelpCircle} label="One-Stop & Points" activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem id="advisor" icon={User} label="Homeroom Advisor" hidden={user?.role === 'STUDENT'} activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem id="import" icon={FileSpreadsheet} label="Import Users" hidden={!isAdmin} activeTab={activeTab} setActiveTab={setActiveTab} />
        </NavGroup>

        <NavGroup title="LMS & Examination">
          <NavItem id="lms" icon={BookOpen} label="LMS & Materials" activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem id="exams" icon={FileBarChart} label="Exams & Grading" activeTab={activeTab} setActiveTab={setActiveTab} />
        </NavGroup>

        {user?.role !== 'TEACHER' && (
          <NavGroup title="Finance">
            <NavItem id="tuition" icon={Banknote} label="Tuition & Invoices" activeTab={activeTab} setActiveTab={setActiveTab} />
          </NavGroup>
        )}

        <NavGroup title="Communication">
          <NavItem id="virtual" icon={Video} label="Virtual Classrooms" activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem id="discussions" icon={MessageSquare} label="Discussions" activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem id="messages" icon={MessageCircle} label="Messages" activeTab={activeTab} setActiveTab={setActiveTab} />
        </NavGroup>

        <NavGroup title="Personal">
          <NavItem id="profile" icon={User} label="My Profile" activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem id="settings" icon={Settings} label="Settings" activeTab={activeTab} setActiveTab={setActiveTab} />
        </NavGroup>
      </div>

      {/* User Profile Summary - Fixed at bottom */}
      <div className="p-4 border-t border-gray-100 flex-shrink-0 bg-white">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold flex-shrink-0">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName || user?.email}</p>
            <p className="text-xs text-gray-500 font-medium">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
