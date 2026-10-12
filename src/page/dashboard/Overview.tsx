import React from 'react';
import {
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  FileBarChart,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  User,
  CalendarDays,
} from 'lucide-react';

interface OverviewProps {
  user: any;
}

const Overview: React.FC<OverviewProps> = ({ user }) => {
  const isAdmin = user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';

  const renderWelcomeBanner = () => (
    <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden h-full">
      <div className="relative z-10">
        <h2 className="text-2xl font-bold mb-2">Welcome Back, {user?.fullName || user?.role}!</h2>
        <p className="text-blue-100 mb-6 max-w-lg">
          Have a good day at work. Here's what's happening with your {isAdmin ? 'institution' : 'classes'} today.
        </p>
        {isAdmin && (
          <div className="flex gap-4 mt-6">
            <button className="bg-white text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition shadow-sm">
              Add New Student
            </button>
            <button className="bg-blue-600 border border-blue-400 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-500 transition shadow-sm">
              View Details
            </button>
          </div>
        )}
      </div>
      {/* Decorative elements */}
      <div className="absolute right-0 top-0 w-64 h-full bg-white opacity-5 transform skew-x-12 translate-x-16"></div>
      <div className="absolute right-12 bottom-0 w-32 h-32 bg-blue-500 rounded-full opacity-20 blur-2xl"></div>
    </div>
  );

  if (isTeacher) {
    // Mock slots matching Image 2
    const classSlots = [
      { time: '09:00 - 09:45', class: 'Class V, B', variant: 'rose' },
      { time: '09:45 - 10:30', class: 'Class IV, C', variant: 'rose' },
      { time: '11:30 - 12:15', class: 'Class V, A', variant: 'blue' },
      { time: '01:30 - 02:15', class: 'Class V, B', variant: 'blue' },
      { time: '02:15 - 03:00', class: 'Class IV, A', variant: 'blue' },
    ];

    // Attendance days matching Image 2
    const attendanceDays = [
      { day: 'M', status: 'present' },
      { day: 'T', status: 'present' },
      { day: 'W', status: 'present' },
      { day: 'T', status: 'present' },
      { day: 'F', status: 'absent' },
      { day: 'S', status: 'off' },
      { day: 'S', status: 'off' },
    ];

    // Calendar matrix matching Image 2 (July 2024 demo)
    const calendarDays = [
      { num: 27, currentMonth: false },
      { num: 28, currentMonth: false },
      { num: 29, currentMonth: false },
      { num: 30, currentMonth: false },
      { num: 31, currentMonth: false },
      { num: 1, currentMonth: true },
      { num: 2, currentMonth: true },
      { num: 3, currentMonth: true },
      { num: 4, currentMonth: true },
      { num: 5, currentMonth: true },
      { num: 6, currentMonth: true, active: true },
      { num: 7, currentMonth: true, active: true },
      { num: 8, currentMonth: true },
      { num: 9, currentMonth: true },
      { num: 10, currentMonth: true },
      { num: 11, currentMonth: true },
      { num: 12, currentMonth: true, active: true },
      { num: 13, currentMonth: true },
      { num: 14, currentMonth: true },
      { num: 15, currentMonth: true },
      { num: 16, currentMonth: true },
      { num: 17, currentMonth: true },
      { num: 27, currentMonth: true, active: true },
      { num: 19, currentMonth: true },
      { num: 20, currentMonth: true },
      { num: 21, currentMonth: true },
      { num: 22, currentMonth: true },
      { num: 23, currentMonth: true },
      { num: 24, currentMonth: true },
      { num: 25, currentMonth: true },
      { num: 26, currentMonth: true },
      { num: 27, currentMonth: true },
      { num: 28, currentMonth: true },
      { num: 29, currentMonth: true },
      { num: 30, currentMonth: true },
    ];

    // Upcoming events matching Image 2
    const upcomingEvents = [
      {
        id: 1,
        title: 'Vacation Meeting',
        date: '07 July 2024 - 07 July 2024',
        time: '09:10 AM - 10:50 PM',
        accentColor: 'border-l-rose-500',
        iconBg: 'bg-rose-50 text-rose-500',
        attendees: [
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop&crop=face',
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
        ],
      },
      {
        id: 2,
        title: 'Parents, Teacher Meet',
        date: '15 July 2024',
        time: '09:10 AM - 10:50 PM',
        accentColor: 'border-l-sky-400',
        iconBg: 'bg-sky-50 text-sky-500',
        attendees: [
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&crop=face',
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face',
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face',
        ],
      },
      {
        id: 3,
        title: 'Staff Meeting',
        date: '10 July 2024',
        time: '09:10 AM - 10:50 PM',
        accentColor: 'border-l-blue-600',
        iconBg: 'bg-blue-50 text-blue-600',
        attendees: [
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop&crop=face',
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=60&h=60&fit=crop&crop=face',
        ],
      },
      {
        id: 4,
        title: 'Vacation Meeting',
        date: '07 July 2024 - 07 July 2024',
        time: '09:10 AM - 10:50 PM',
        accentColor: 'border-l-rose-500',
        iconBg: 'bg-rose-50 text-rose-500',
        attendees: [
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face',
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&crop=face',
        ],
      },
    ];

    const teacherId = user?.id ? `#T${String(user.id).padStart(6, '0')}` : '#T594651';
    const teacherName = user?.fullName || 'Henriques Morgan';
    const teacherSubtitle = 'Classes : IV-A, V-B  •  Physics';

    return (
      <div className="space-y-6">
        {/* Welcome Banner (Original Bluish Banner) */}
        {renderWelcomeBanner()}

        {/* Dashboard Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left 2 Columns */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            {/* Row 1: Teacher Profile Banner (Black/Dark Card) + Syllabus */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Teacher Profile Banner (Khung màu đen) */}
              <div className="md:col-span-2 bg-[#0d1b2a] rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-5">
                {/* Geometric Background Shapes */}
                <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 border-8 border-blue-500/10 rounded-3xl transform rotate-12 pointer-events-none"></div>
                <div className="absolute top-3 left-48 w-3 h-3 border-2 border-cyan-400/40 rounded-sm transform rotate-45"></div>

                <div className="flex items-center gap-4 z-10 w-full sm:w-auto">
                  <div className="relative">
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&h=160&fit=crop&crop=face"
                      alt={teacherName}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-white/20 shadow-md"
                    />
                  </div>
                  <div>
                    <div className="mb-1">
                      <span className="bg-blue-500/25 text-blue-300 text-xs font-semibold px-2 py-0.5 rounded border border-blue-400/20">
                        {teacherId}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white leading-snug">{teacherName}</h2>
                    <p className="text-gray-300 text-xs mt-0.5">{teacherSubtitle}</p>
                  </div>
                </div>

                <div className="z-10 w-full sm:w-auto flex justify-end">
                  <button className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-4 py-2 rounded-lg transition shadow-sm whitespace-nowrap">
                    Edit Profile
                  </button>
                </div>
              </div>

              {/* Syllabus Circular Chart Widget */}
              <div className="md:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-800">Syllabus</h3>
                  <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">Mẫu</span>
                </div>

                <div className="flex items-center gap-4 my-2">
                  {/* Circular Gauge */}
                  <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        stroke="#f1f5f9"
                        strokeWidth="9"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        stroke="#22c55e"
                        strokeWidth="9"
                        strokeDasharray="226.8 238.8"
                        strokeLinecap="round"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        stroke="#ef4444"
                        strokeWidth="9"
                        strokeDasharray="12 238.8"
                        strokeDashoffset="-227"
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-800">95%</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                      <span className="text-gray-600 font-medium">Completed : <strong className="text-gray-800">95%</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span className="text-gray-600 font-medium">Pending : <strong className="text-gray-800">5%</strong></span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 text-center">Chưa có dữ liệu API • Đang hiển thị mẫu</p>
              </div>
            </div>

          {/* Row 2: Today's Class */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-gray-800">Today's Class</h3>
                <div className="flex items-center gap-1">
                  <button className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 transition">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-md">
                  Chưa có dữ liệu thời khóa biểu thực tế
                </span>
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                  <ChevronLeft className="w-4 h-4 cursor-pointer text-gray-400 hover:text-gray-600" />
                  <span>16 May 2024</span>
                  <ChevronRight className="w-4 h-4 cursor-pointer text-gray-400 hover:text-gray-600" />
                </div>
              </div>
            </div>

            {/* Class Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
              {classSlots.map((slot, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50/70 border border-gray-100 hover:border-gray-200 rounded-xl p-3.5 transition hover:shadow-sm"
                >
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-white mb-2.5 ${
                      slot.variant === 'rose' ? 'bg-rose-500' : 'bg-blue-600'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{slot.time}</span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-800">{slot.class}</h4>
                </div>
              ))}
            </div>
          </div>

          {/* Row 3: Attendance */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-800">Attendance</h3>
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                  Chưa có dữ liệu điểm danh
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg cursor-pointer">
                <CalendarDays className="w-3.5 h-3.5 text-gray-500" />
                <span>This Month</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Sub-Section: Last 7 days + metrics */}
              <div className="md:col-span-7 flex flex-col gap-4">
                {/* Last 7 Days Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-sm font-bold text-gray-800">Last 7 Days</span>
                  <span className="text-xs text-gray-400">14 May 2024 - 21 May 2024</span>
                </div>

                {/* Day status pills */}
                <div className="flex items-center gap-2">
                  {attendanceDays.map((item, idx) => (
                    <div
                      key={idx}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition ${
                        item.status === 'present'
                          ? 'bg-green-600 text-white shadow-sm'
                          : item.status === 'absent'
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'border border-gray-200 text-gray-400 bg-white'
                      }`}
                    >
                      {item.day}
                    </div>
                  ))}
                </div>

                {/* Total working days info */}
                <div className="flex items-center gap-2 text-xs text-gray-600 pt-1">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>No of total working days:</span>
                  <strong className="text-gray-900 font-bold">28 Days</strong>
                </div>

                {/* 4 Stats Cards */}
                <div className="grid grid-cols-4 gap-2.5 pt-2">
                  <div className="border border-gray-100 rounded-xl p-3 text-center bg-gray-50/50">
                    <span className="text-[11px] text-gray-500 font-medium block">Present</span>
                    <span className="text-lg font-bold text-gray-800">25</span>
                  </div>
                  <div className="border border-gray-100 rounded-xl p-3 text-center bg-gray-50/50">
                    <span className="text-[11px] text-gray-500 font-medium block">Absent</span>
                    <span className="text-lg font-bold text-gray-800">2</span>
                  </div>
                  <div className="border border-gray-100 rounded-xl p-3 text-center bg-gray-50/50">
                    <span className="text-[11px] text-gray-500 font-medium block">Halfday</span>
                    <span className="text-lg font-bold text-gray-800">0</span>
                  </div>
                  <div className="border border-gray-100 rounded-xl p-3 text-center bg-gray-50/50">
                    <span className="text-[11px] text-gray-500 font-medium block">Late</span>
                    <span className="text-lg font-bold text-gray-800">1</span>
                  </div>
                </div>
              </div>

              {/* Right Sub-Section: Large Donut Chart */}
              <div className="md:col-span-5 flex flex-col items-center justify-center pl-0 md:pl-4 border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0">
                <div className="relative w-40 h-40 mb-3 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background track */}
                    <circle cx="50" cy="50" r="38" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                    {/* Present Green ~75% */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#22c55e"
                      strokeWidth="8"
                      strokeDasharray="175 238.8"
                      strokeLinecap="round"
                      fill="transparent"
                    />
                    {/* Absent Red ~8% */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#ef4444"
                      strokeWidth="8"
                      strokeDasharray="22 238.8"
                      strokeDashoffset="-180"
                      strokeLinecap="round"
                      fill="transparent"
                    />
                    {/* Late Blue ~5% */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#3b82f6"
                      strokeWidth="8"
                      strokeDasharray="14 238.8"
                      strokeDashoffset="-206"
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[11px] text-gray-400 font-medium">Attendance</span>
                    <span className="text-2xl font-bold text-gray-800">95%</span>
                  </div>
                </div>

                {/* Legend items */}
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span>Present</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>Absent</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>Late</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                    <span>Half Day</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Schedules & Upcoming Events */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          {/* Schedules / Calendar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Schedules</h3>
              <button className="text-blue-600 text-xs font-semibold flex items-center gap-1 hover:text-blue-700 transition">
                <Plus className="w-3.5 h-3.5" /> Add New
              </button>
            </div>

            {/* Month Navigation */}
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold text-gray-800">July 2024</span>
              <div className="flex items-center gap-1">
                <button className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 transition">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-400 mb-2">
              <span>S</span>
              <span>M</span>
              <span>T</span>
              <span>W</span>
              <span>T</span>
              <span>F</span>
              <span>S</span>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {calendarDays.map((day, idx) => (
                <div
                  key={idx}
                  className={`h-8 flex items-center justify-center rounded-lg transition font-medium ${
                    day.active
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : day.currentMonth
                      ? 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                      : 'text-gray-300'
                  }`}
                >
                  {day.num}
                </div>
              ))}
            </div>

            <p className="text-[11px] text-gray-400 text-center mt-4">
              Hiện chưa có lịch học thực tế từ API • Hiển thị giao diện mẫu
            </p>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Upcoming Events</h3>
              <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">Mẫu</span>
            </div>

            <div className="space-y-3.5">
              {upcomingEvents.map((evt) => (
                <div
                  key={evt.id}
                  className={`border border-gray-100 rounded-xl p-3.5 pl-4 border-l-4 ${evt.accentColor} hover:shadow-sm transition bg-white`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${evt.iconBg}`}>
                      {evt.accentColor.includes('sky') ? (
                        <User className="w-4 h-4" />
                      ) : evt.accentColor.includes('blue') ? (
                        <Users className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-800 truncate mb-1">{evt.title}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                        <Calendar className="w-3 h-3" />
                        <span className="truncate">{evt.date}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                        <div className="flex items-center gap-1 text-[11px] text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>{evt.time}</span>
                        </div>
                        {/* Stacked avatars */}
                        <div className="flex items-center -space-x-1.5">
                          {evt.attendees.map((avatar, aIdx) => (
                            <img
                              key={aIdx}
                              src={avatar}
                              alt="Attendee"
                              className="w-5 h-5 rounded-full border border-white object-cover"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-gray-400 text-center mt-4">
              Hiện chưa có dữ liệu sự kiện từ backend
            </p>
          </div>
        </div>
      </div>
    </div>
  );
  }

  // Admin (or default) layout
  return (
    <div className="space-y-6">
      {renderWelcomeBanner()}

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Users className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-semibold mb-1">Total Students</p>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold text-gray-900">3,654</h3>
              <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded">+1.2%</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-semibold mb-1">Total Teachers</p>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold text-gray-900">284</h3>
              <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded">+2.4%</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-semibold mb-1">Total Classes</p>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold text-gray-900">162</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-semibold mb-1">Total Subjects</p>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold text-gray-900">82</h3>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chart Mockups Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6 min-h-[300px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileBarChart className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">Activity Chart Visualization</p>
            <p className="text-sm text-gray-400">Data will be available soon</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 min-h-[300px] flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-100"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-blue-500"
                  strokeDasharray="75, 100"
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-800">75%</span>
              </div>
            </div>
            <p className="text-gray-600 font-bold">Attendance Overview</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
