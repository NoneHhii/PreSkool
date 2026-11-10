import React, { useState } from 'react';
import {
  lmsService,
  type ForumThread,
  type ForumComment,
  type VirtualClassroomData,
} from '../../../../services/lms.service';
import {
  MessageSquare,
  Video,
  Pin,
  CheckCircle,
  ThumbsUp,
  Plus,
  Send,
  ExternalLink,
  Calendar,
  Clock,
  X,
} from 'lucide-react';

interface LmsDiscussionsProps {
  classId: string;
  user: any;
}

export const LmsDiscussions: React.FC<LmsDiscussionsProps> = ({ classId, user }) => {
  const isAdmin = user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';

  const [activeTab, setActiveTab] = useState<'forum' | 'virtual'>('forum');

  // Demo Forum Threads
  const [threads, setThreads] = useState<ForumThread[]>([
    {
      id: 'th-1',
      classId,
      title: 'Hỏi về cách cấu hình Connection Pooling trong Prisma với PostgreSQL',
      content:
        'Chào thầy và các bạn, khi em chạy test tải khoảng 500 requests đồng thời thì xuất hiện lỗi "Can not reach database server". Em cần cấu hình max_connections như thế nào ạ?',
      authorName: 'Nguyễn Văn An',
      authorRole: 'STUDENT',
      isPinned: true,
      isResolved: true,
      votes: 12,
      hasVoted: false,
      commentCount: 4,
      createdAt: '2026-10-24T14:30:00Z',
    },
    {
      id: 'th-2',
      classId,
      title: 'Thảo luận: Nên dùng JWT Stateless hay Session-based Authentication cho dự án đồ án?',
      content:
        'Em đang phân vân giữa việc lưu JWT trong HttpOnly Cookie hay kết hợp với Redis để có thể revoke token khi người dùng đăng xuất khẩn cấp.',
      authorName: 'Trần Thị Mai',
      authorRole: 'STUDENT',
      isPinned: false,
      isResolved: false,
      votes: 8,
      hasVoted: true,
      commentCount: 2,
      createdAt: '2026-10-25T09:15:00Z',
    },
  ]);

  // Demo Comments for active thread modal
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([
    {
      id: 'com-1',
      threadId: 'th-1',
      authorName: 'TS. Nguyễn Văn Hùng',
      authorRole: 'TEACHER',
      content:
        'Chào An, em cần cấu hình tham số `connection_limit=20` trong chuỗi DATABASE_URL và cài đặt thêm PgBouncer để quản lý connection pooling hiệu quả.',
      isResolvedAnswer: true,
      createdAt: '2026-10-24T16:00:00Z',
    },
    {
      id: 'com-2',
      threadId: 'th-1',
      authorName: 'Lê Hoàng Nam',
      authorRole: 'STUDENT',
      content: 'Cảm ơn thầy, em cũng gặp lỗi tương tự và áp dụng đã chạy mượt mà!',
      isResolvedAnswer: false,
      createdAt: '2026-10-24T17:20:00Z',
    },
  ]);
  const [newCommentText, setNewCommentText] = useState('');

  // Virtual Classrooms
  const [rooms, setRooms] = useState<VirtualClassroomData[]>([
    {
      id: 'room-1',
      classId,
      title: 'Buổi học trực tuyến: Giải đáp thắc mắc Kiến trúc Clean Architecture',
      platform: 'JITSI',
      meetingUrl: 'https://meet.jit.si/preskool-se101-session1',
      startTime: '2026-10-28T19:00:00Z',
      endTime: '2026-10-28T21:00:00Z',
      recordings: [
        {
          id: 'rec-1',
          title: 'Video Ghi hình Buổi 1: Tổng quan Microservices',
          url: 'https://storage.preskool.edu.vn/recordings/session1.mp4',
          duration: '1h 45m',
        },
      ],
    },
    {
      id: 'room-2',
      classId,
      title: 'Seminar: Tối ưu hiệu năng Database & NoSQL',
      platform: 'ZOOM',
      meetingUrl: 'https://zoom.us/j/123456789',
      startTime: '2026-11-02T19:30:00Z',
      endTime: '2026-11-02T21:30:00Z',
      recordings: [],
    },
  ]);

  // Modals
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);
  const [threadTitle, setThreadTitle] = useState('');
  const [threadContent, setThreadContent] = useState('');

  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [roomForm, setRoomForm] = useState<VirtualClassroomData>({
    classId,
    title: '',
    platform: 'JITSI',
    meetingUrl: '',
    startTime: '',
    endTime: '',
  });

  const handleVoteThread = async (threadId: string) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === threadId) {
          const newVote = t.hasVoted ? t.votes - 1 : t.votes + 1;
          return { ...t, votes: newVote, hasVoted: !t.hasVoted };
        }
        return t;
      })
    );

    try {
      await lmsService.voteForum({ threadId, vote: 1 });
    } catch {
      // fallback
    }
  };

  const handlePinThread = async (threadId: string) => {
    try {
      await lmsService.pinForumThread(threadId);
    } catch {
      // fallback
    }
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, isPinned: !t.isPinned } : t))
    );
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedThread) return;

    const newCom: ForumComment = {
      id: `com-${Date.now()}`,
      threadId: selectedThread.id,
      authorName: user?.fullName || 'Người dùng hiện tại',
      authorRole: user?.role || 'STUDENT',
      content: newCommentText,
      createdAt: new Date().toISOString(),
      isResolvedAnswer: false,
    };

    try {
      await lmsService.createForumComment(selectedThread.id, { content: newCommentText });
    } catch {
      // fallback
    }

    setComments((prev) => [...prev, newCom]);
    setThreads((prev) =>
      prev.map((t) => (t.id === selectedThread.id ? { ...t, commentCount: t.commentCount + 1 } : t))
    );
    setNewCommentText('');
  };

  const handleMarkResolved = async (commentId: string) => {
    try {
      await lmsService.markCommentResolved(commentId);
    } catch {
      // fallback
    }

    setComments((prev) =>
      prev.map((c) => ({ ...c, isResolvedAnswer: c.id === commentId ? true : c.isResolvedAnswer }))
    );
    if (selectedThread) {
      setThreads((prev) =>
        prev.map((t) => (t.id === selectedThread.id ? { ...t, isResolved: true } : t))
      );
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTh: ForumThread = {
      id: `th-${Date.now()}`,
      classId,
      title: threadTitle,
      content: threadContent,
      authorName: user?.fullName || 'Sinh viên hiện tại',
      authorRole: user?.role || 'STUDENT',
      isPinned: false,
      isResolved: false,
      votes: 1,
      commentCount: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      await lmsService.createForumThread(classId, { title: threadTitle, content: threadContent });
    } catch {
      // fallback
    }

    setThreads((prev) => [newTh, ...prev]);
    setThreadTitle('');
    setThreadContent('');
    setShowNewThreadModal(false);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const newR: VirtualClassroomData = {
      ...roomForm,
      id: `room-${Date.now()}`,
      recordings: [],
    };

    try {
      await lmsService.createVirtualClassroom(classId, newR);
    } catch {
      // fallback
    }

    setRooms((prev) => [...prev, newR]);
    setShowCreateRoomModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex rounded-xl bg-gray-100 p-1 self-start">
          <button
            onClick={() => setActiveTab('forum')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'forum' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Diễn Đàn Hỏi Đáp Q&A ({threads.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('virtual')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'virtual' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Video className="h-4 w-4" />
            <span>Lớp Học Ảo & Video Bài Giảng ({rooms.length})</span>
          </button>
        </div>

        <div>
          {activeTab === 'forum' ? (
            <button
              onClick={() => setShowNewThreadModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Đặt Câu Hỏi Mới</span>
            </button>
          ) : (
            (isAdmin || isTeacher) && (
              <button
                onClick={() => setShowCreateRoomModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Tạo Phòng Học Trực Tuyến</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* 1. FORUM TAB */}
      {activeTab === 'forum' && (
        <div className="space-y-4">
          {threads.map((th) => (
            <div
              key={th.id}
              onClick={() => setSelectedThread(th)}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs hover:border-gray-200 cursor-pointer transition space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {th.isPinned && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        <Pin className="h-2.5 w-2.5" /> Đã ghim
                      </span>
                    )}
                    {th.isResolved && (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <CheckCircle className="h-2.5 w-2.5" /> Đã giải quyết
                      </span>
                    )}
                    <h4 className="text-sm font-bold text-gray-900">{th.title}</h4>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{th.content}</p>
                </div>

                {/* Vote button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVoteThread(th.id);
                  }}
                  className={`flex flex-col items-center justify-center rounded-xl p-2 min-w-10 border transition cursor-pointer ${
                    th.hasVoted
                      ? 'bg-blue-50 border-blue-200 text-blue-600 font-bold'
                      : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ThumbsUp className="h-3.5 w-3.5 mb-0.5" />
                  <span className="text-xs font-mono">{th.votes}</span>
                </button>
              </div>

              {/* Author & Footer */}
              <div className="flex items-center justify-between text-[11px] text-gray-500 border-t border-gray-50 pt-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">{th.authorName}</span>
                  <span>•</span>
                  <span>{new Date(th.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>

                <div className="flex items-center gap-3">
                  {(isAdmin || isTeacher) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinThread(th.id);
                      }}
                      className="text-gray-400 hover:text-amber-600 cursor-pointer font-medium"
                    >
                      {th.isPinned ? 'Bỏ ghim' : 'Ghim bài'}
                    </button>
                  )}
                  <span className="flex items-center gap-1 text-blue-600 font-semibold">
                    <MessageSquare className="h-3 w-3" />
                    {th.commentCount} bình luận
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. VIRTUAL CLASSROOM TAB */}
      {activeTab === 'virtual' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs space-y-4 hover:border-gray-200 transition"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 uppercase">
                      {room.platform}
                    </span>
                    <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      Sắp diễn ra
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">{room.title}</h4>
                </div>

                <div className="rounded-xl bg-gray-50/70 p-3 text-xs text-gray-600 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <span>Bắt đầu: {new Date(room.startTime).toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <span>Kết thúc: {new Date(room.endTime).toLocaleTimeString('vi-VN')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <a
                    href={room.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition cursor-pointer shadow-xs"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Tham Gia Buổi Học</span>
                  </a>

                  {room.recordings && room.recordings.length > 0 && (
                    <span className="text-[11px] font-semibold text-emerald-600">
                      Có {room.recordings.length} video ghi hình
                    </span>
                  )}
                </div>

                {/* Recordings list */}
                {room.recordings && room.recordings.length > 0 && (
                  <div className="border-t border-gray-100 pt-3 space-y-2">
                    <p className="text-[11px] font-bold text-gray-700">Video xem lại buổi học:</p>
                    {room.recordings.map((rec) => (
                      <div
                        key={rec.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Video className="h-3.5 w-3.5 text-rose-500" />
                          <span className="font-medium text-gray-800">{rec.title}</span>
                          <span className="text-[10px] text-gray-400">({rec.duration})</span>
                        </div>
                        <a
                          href={rec.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 font-semibold hover:underline"
                        >
                          Xem lại
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Thread Detail & Nested Comments */}
      {selectedThread && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl animate-in fade-in max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {selectedThread.isResolved && (
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      ✓ Đã có câu trả lời chính xác
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    Bởi {selectedThread.authorName} ({selectedThread.authorRole})
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900">{selectedThread.title}</h3>
              </div>
              <button
                onClick={() => setSelectedThread(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Question full body */}
            <div className="rounded-xl bg-gray-50/70 p-4 border border-gray-100 text-xs text-gray-700 leading-relaxed">
              {selectedThread.content}
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Bình Luận & Câu Trả Lời ({comments.length})
              </h4>

              {comments.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-xl p-4 border text-xs space-y-2 transition ${
                    c.isResolvedAnswer
                      ? 'border-emerald-300 bg-emerald-50/50 shadow-2xs'
                      : 'border-gray-100 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">{c.authorName}</span>
                      <span
                        className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                          c.authorRole === 'TEACHER' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {c.authorRole}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(c.createdAt).toLocaleTimeString('vi-VN')}
                      </span>
                    </div>

                    {c.isResolvedAnswer ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        <CheckCircle className="h-3 w-3" /> Đáp án chính xác
                      </span>
                    ) : (
                      (isAdmin || isTeacher) && (
                        <button
                          onClick={() => handleMarkResolved(c.id)}
                          className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                        >
                          Đánh dấu đúng
                        </button>
                      )
                    )}
                  </div>

                  <p className="text-gray-700 leading-relaxed">{c.content}</p>
                </div>
              ))}
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-gray-100">
              <input
                type="text"
                placeholder="Nhập câu trả lời hoặc thảo luận của bạn..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2 text-xs outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Gửi</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Đặt câu hỏi mới */}
      {showNewThreadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Đặt Câu Hỏi / Tạo Thảo Luận Mới</h3>
              <button
                onClick={() => setShowNewThreadModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateThread} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Tiêu Đề Thảo Luận</label>
                <input
                  type="text"
                  placeholder="Mô tả ngắn gọn vấn đề bạn gặp phải..."
                  value={threadTitle}
                  onChange={(e) => setThreadTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Chi Tiết Thắc Mắc</label>
                <textarea
                  rows={4}
                  placeholder="Cung cấp ngữ cảnh, đoạn code hoặc lỗi bạn đang gặp..."
                  value={threadContent}
                  onChange={(e) => setThreadContent(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewThreadModal(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
                >
                  Đăng Câu Hỏi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Tạo phòng học trực tuyến */}
      {showCreateRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Tạo Buổi Học Trực Tuyến Mới</h3>
              <button
                onClick={() => setShowCreateRoomModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Chủ Đề Buổi Học</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Hướng dẫn đồ án & Giải đáp trực tuyến..."
                  value={roomForm.title}
                  onChange={(e) => setRoomForm({ ...roomForm, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Nền Tảng Trực Tuyến</label>
                <select
                  value={roomForm.platform}
                  onChange={(e: any) => setRoomForm({ ...roomForm, platform: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                >
                  <option value="JITSI">Jitsi Meet (Tích hợp sẵn)</option>
                  <option value="ZOOM">Zoom Meeting</option>
                  <option value="TEAMS">Microsoft Teams</option>
                  <option value="LIVEKIT">LiveKit Stream</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Đường Dẫn Họp Trực Tuyến (URL)</label>
                <input
                  type="url"
                  placeholder="https://meet.jit.si/... / https://zoom.us/..."
                  value={roomForm.meetingUrl}
                  onChange={(e) => setRoomForm({ ...roomForm, meetingUrl: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Bắt đầu</label>
                  <input
                    type="datetime-local"
                    value={roomForm.startTime}
                    onChange={(e) => setRoomForm({ ...roomForm, startTime: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 p-2 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Kết thúc</label>
                  <input
                    type="datetime-local"
                    value={roomForm.endTime}
                    onChange={(e) => setRoomForm({ ...roomForm, endTime: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 p-2 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateRoomModal(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                >
                  Lưu & Lên Lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LmsDiscussions;
