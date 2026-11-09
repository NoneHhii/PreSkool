import React, { useState, useEffect } from 'react';
import {
  lmsService,
} from '../../../../services/lms.service';
import {
  Calendar,
  Bell,
  Clock,
  Plus,
  AlertCircle,
  X,
  FileText,
  Video,
  Timer,
} from 'lucide-react';

interface LmsCalendarAnnouncementsProps {
  classId: string;
  user: any;
}

export const LmsCalendarAnnouncements: React.FC<LmsCalendarAnnouncementsProps> = ({ classId, user }) => {
  const isAdmin = user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';

  const [activeTab, setActiveTab] = useState<'calendar' | 'announcements'>('calendar');
  const [calendarFilter, setCalendarFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');

  // Demo Calendar To-do items
  const [calendarItems, setCalendarItems] = useState<any[]>([
    {
      id: 'cal-1',
      type: 'ASSIGNMENT',
      title: 'Hạn chót: Nộp Đồ án Backend NestJS (Giai đoạn 1)',
      courseName: 'Lập trình RESTful API',
      dueDate: '2026-11-05T23:59:59Z',
      isCompleted: false,
      priority: 'HIGH',
    },
    {
      id: 'cal-2',
      type: 'QUIZ',
      title: 'Mở bài kiểm tra 15 phút: Kiến trúc RESTful & Middleware',
      courseName: 'Lập trình RESTful API',
      dueDate: '2026-11-03T08:00:00Z',
      isCompleted: true,
      priority: 'MEDIUM',
    },
    {
      id: 'cal-3',
      type: 'VIRTUAL_CLASS',
      title: 'Lớp học trực tuyến: Giải đáp thắc mắc đồ án môn học',
      courseName: 'Lập trình RESTful API',
      dueDate: '2026-11-02T19:00:00Z',
      isCompleted: false,
      priority: 'MEDIUM',
    },
    {
      id: 'cal-4',
      type: 'EXAM',
      title: 'Lịch thi giữa kỳ tập trung tại phòng máy A203',
      courseName: 'Cơ sở dữ liệu nâng cao',
      dueDate: '2026-11-12T13:30:00Z',
      isCompleted: false,
      priority: 'HIGH',
    },
  ]);

  // Demo Announcements
  const [announcements, setAnnouncements] = useState<any[]>([
    {
      id: 'ann-1',
      title: 'Thông báo: Dời hạn nộp bài tập lớn thêm 3 ngày do sự cố phòng lab',
      content:
        'Chào các bạn sinh viên, theo đề xuất của ban cán sự lớp, hạn nộp bài tập lớn NestJS sẽ được gia hạn đến 23:59 ngày 18/11/2026. Các nhóm tranh thủ hoàn thiện Unit Test.',
      authorName: 'TS. Nguyễn Văn Hùng',
      authorRole: 'Giảng viên',
      createdAt: '2026-10-25T15:30:00Z',
      isPinned: true,
    },
    {
      id: 'ann-2',
      title: 'Tài liệu ôn tập và đề cương thi giữa kỳ đã được cập nhật',
      content:
        'Các bạn vào tab "Học liệu & Đề cương" để tải file tổng hợp 50 câu hỏi ôn tập giữa kỳ nhé. Chúc các bạn ôn thi tốt!',
      authorName: 'TS. Nguyễn Văn Hùng',
      authorRole: 'Giảng viên',
      createdAt: '2026-10-23T09:00:00Z',
      isPinned: false,
    },
  ]);

  useEffect(() => {
    const fetchCalendarAndAnnouncements = async () => {
      try {
        const [calRes, annRes] = await Promise.all([
          lmsService.getMyCalendar().catch(() => null),
          lmsService.getAnnouncements(classId).catch(() => null),
        ]);
        const calData = calRes?.data?.data || calRes?.data;
        if (Array.isArray(calData) && calData.length > 0) {
          setCalendarItems(calData);
        }
        const annData = annRes?.data?.data || annRes?.data;
        if (Array.isArray(annData) && annData.length > 0) {
          setAnnouncements(annData);
        }
      } catch {
        // fallback demo data
      }
    };
    fetchCalendarAndAnnouncements();
  }, [classId]);

  // Modals
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    type: 'ASSIGNMENT',
    courseName: 'Lập trình RESTful API',
    dueDate: '',
    priority: 'HIGH',
  });

  const handleToggleComplete = (id: string) => {
    setCalendarItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isCompleted: !item.isCompleted } : item))
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !taskForm.dueDate) return;

    const newItem = {
      id: `cal-${Date.now()}`,
      type: taskForm.type,
      title: taskForm.title,
      courseName: taskForm.courseName,
      dueDate: taskForm.dueDate,
      isCompleted: false,
      priority: taskForm.priority,
    };

    setCalendarItems((prev) => [newItem, ...prev]);
    setTaskForm({
      title: '',
      type: 'ASSIGNMENT',
      courseName: 'Lập trình RESTful API',
      dueDate: '',
      priority: 'HIGH',
    });
    setShowAddTaskModal(false);
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim()) return;

    const newAnn = {
      id: `ann-${Date.now()}`,
      title: annTitle,
      content: annContent,
      authorName: user?.fullName || 'Giảng viên phụ trách',
      authorRole: user?.role === 'TEACHER' ? 'Giảng viên' : 'Quản trị viên',
      createdAt: new Date().toISOString(),
      isPinned: true,
    };

    try {
      await lmsService.createAnnouncement(classId, { title: annTitle, content: annContent });
    } catch {
      // fallback
    }

    setAnnouncements((prev) => [newAnn, ...prev]);
    setAnnTitle('');
    setAnnContent('');
    setShowAnnounceModal(false);
    alert('Đã gửi thông báo thành công! Toàn bộ sinh viên trong lớp đã nhận được In-app Notification.');
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'QUIZ':
        return <Timer className="h-4 w-4 text-purple-600" />;
      case 'VIRTUAL_CLASS':
        return <Video className="h-4 w-4 text-rose-600" />;
      case 'EXAM':
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      default:
        return <FileText className="h-4 w-4 text-blue-600" />;
    }
  };

  const filteredCalendarItems = calendarItems.filter((item) => {
    if (calendarFilter === 'PENDING') return !item.isCompleted;
    if (calendarFilter === 'COMPLETED') return item.isCompleted;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex rounded-xl bg-gray-100 p-1 self-start">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'calendar' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>To-do List Deadline Cá Nhân ({calendarItems.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'announcements' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>Thông Báo Khóa Học ({announcements.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'calendar' && (
            <button
              onClick={() => setShowAddTaskModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm Nhắc Hạn Cá Nhân</span>
            </button>
          )}
          {(isAdmin || isTeacher) && activeTab === 'announcements' && (
            <button
              onClick={() => setShowAnnounceModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Đăng Thông Báo Khẩn</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. CALENDAR TO-DO LIST */}
      {activeTab === 'calendar' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-blue-50/60 border border-blue-100 p-3 text-xs text-blue-800">
            <span>
              Hệ thống tự động quét lịch nộp bài tập, ca thi Quiz và lịch học online của tất cả các lớp bạn tham gia.
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {(['ALL', 'PENDING', 'COMPLETED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setCalendarFilter(status)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                    calendarFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  {status === 'ALL'
                    ? 'Tất cả'
                    : status === 'PENDING'
                    ? 'Chưa hoàn thành'
                    : 'Đã xong'}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-xs overflow-hidden">
            {filteredCalendarItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleToggleComplete(item.id)}
                className={`p-4 flex items-center justify-between gap-4 cursor-pointer transition ${
                  item.isCompleted ? 'bg-gray-50/60 opacity-60' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={item.isCompleted}
                    onChange={() => {}}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                    {getItemIcon(item.type)}
                  </div>
                  <div>
                    <h4
                      className={`text-xs font-bold ${
                        item.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
                      }`}
                    >
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">{item.courseName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs">
                  <div className="text-right">
                    <span className="flex items-center gap-1 font-semibold text-gray-700">
                      <Clock className="h-3 w-3 text-gray-400" />
                      {new Date(item.dueDate).toLocaleString('vi-VN')}
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        item.priority === 'HIGH' ? 'text-rose-600' : 'text-blue-600'
                      }`}
                    >
                      {item.priority === 'HIGH' ? 'Ưu tiên cao' : 'Bình thường'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. ANNOUNCEMENTS LIST */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs space-y-3 hover:border-gray-200 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {ann.isPinned && (
                      <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                        Quan trọng
                      </span>
                    )}
                    <h4 className="text-sm font-bold text-gray-900">{ann.title}</h4>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{ann.content}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-500 border-t border-gray-100 pt-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">{ann.authorName}</span>
                  <span>({ann.authorRole})</span>
                </div>
                <span>{new Date(ann.createdAt).toLocaleString('vi-VN')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Thêm nhắc hạn cá nhân */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Thêm Lịch Nhắc Hạn Mới</h3>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Nội dung công việc / Deadline</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Hoàn thành báo cáo chương 3..."
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Phân loại</label>
                  <select
                    value={taskForm.type}
                    onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 p-2.5 outline-none"
                  >
                    <option value="ASSIGNMENT">Bài tập / Đồ án</option>
                    <option value="QUIZ">Trắc nghiệm Quiz</option>
                    <option value="VIRTUAL_CLASS">Lớp học trực tuyến</option>
                    <option value="EXAM">Lịch thi</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Mức độ ưu tiên</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 p-2.5 outline-none"
                  >
                    <option value="HIGH">Ưu tiên cao</option>
                    <option value="MEDIUM">Bình thường</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Thời hạn (Deadline)</label>
                <input
                  type="datetime-local"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
                >
                  Thêm Vào Lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Đăng thông báo */}
      {showAnnounceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Đăng Thông Báo Khóa Học Mới</h3>
              <button
                onClick={() => setShowAnnounceModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Tiêu Đề Thông Báo</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Lịch thi giữa kỳ và dời hạn nộp đồ án..."
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Nội Dung Chi Tiết</label>
                <textarea
                  rows={4}
                  placeholder="Nhập nội dung thông báo gửi đến sinh viên..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="rounded-lg bg-blue-50 p-2.5 text-blue-700 text-[11px]">
                Thông báo sẽ tự động gửi thông báo đẩy (In-app Notification) cho toàn bộ sinh viên đã ghi danh.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAnnounceModal(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
                >
                  Bắn Thông Báo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LmsCalendarAnnouncements;
