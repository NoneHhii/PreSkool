import React, { useState, useEffect } from 'react';
import {
  teamsService,
  type ActivityFeedItem,
} from '../../../../services/teams.service';
import {
  Bell,
  MessageSquare,
  Video,
  Vote,
  Kanban,
} from 'lucide-react';

interface TeamsActivityFeedProps {
  onNavigateToChannel?: (channelId: string) => void;
  onNavigateToMeeting?: (meetingTitle: string) => void;
}

export const TeamsActivityFeed: React.FC<TeamsActivityFeedProps> = ({
  onNavigateToChannel,
  onNavigateToMeeting,
}) => {
  const [feedItems, setFeedItems] = useState<ActivityFeedItem[]>([
    {
      id: 'act-1',
      type: 'MEETING',
      title: 'Tiết học trực tuyến đang diễn ra!',
      content: 'TS. Nguyễn Văn Hùng đã bắt đầu buổi học "Lập trình RESTful API với Express & Prisma".',
      sourceName: 'Lớp SE101.N11',
      isRead: false,
      createdAt: '2026-11-02T08:00:00Z',
    },
    {
      id: 'act-2',
      type: 'MENTION',
      title: 'Nguyễn Văn An đã nhắc đến bạn',
      content: 'Trong kênh #General: "Nhờ @bạn kiểm tra lại đoạn migration Prisma trong schema nhé!"',
      sourceName: 'Kênh #General',
      isRead: false,
      createdAt: '2026-11-02T07:45:00Z',
    },
    {
      id: 'act-3',
      type: 'POLL',
      title: 'Bình chọn mới trong buổi học',
      content: 'Giảng viên vừa tung câu hỏi: "Các bạn đã cài đặt xong Node.js và Docker chưa?"',
      sourceName: 'Phòng học trực tuyến',
      isRead: true,
      createdAt: '2026-11-01T15:20:00Z',
    },
    {
      id: 'act-4',
      type: 'TASK',
      title: 'Giao việc mới trong Kanban',
      content: 'Bạn được phân công đảm nhận task: "Viết Unit Test & Tài liệu Swagger OpenAPI 3.0".',
      sourceName: 'Nhóm 1 - Đồ án',
      isRead: true,
      createdAt: '2026-11-01T11:00:00Z',
    },
    {
      id: 'act-5',
      type: 'APPOINTMENT',
      title: 'Lịch hẹn tư vấn 1-1 đã được duyệt',
      content: 'TS. Nguyễn Văn Hùng đã xác nhận lịch hẹn vào 14:00 ngày 04/11/2026 kèm đường dẫn phòng họp.',
      sourceName: 'Cố vấn học tập',
      isRead: true,
      createdAt: '2026-10-31T09:30:00Z',
    },
  ]);

  // Load activity feed from API
  useEffect(() => {
    const loadFeed = async () => {
      try {
        const res = await teamsService.getActivityFeed();
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setFeedItems(res.data);
        }
      } catch {
        // fallback
      }
    };
    loadFeed();
  }, []);

  const handleMarkRead = async (id: string) => {
    setFeedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
    try {
      await teamsService.markActivityRead(id);
    } catch {
      // fallback
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'MEETING':
        return <Video className="h-4 w-4 text-rose-600" />;
      case 'MENTION':
        return <MessageSquare className="h-4 w-4 text-violet-600" />;
      case 'POLL':
        return <Vote className="h-4 w-4 text-amber-600" />;
      case 'TASK':
        return <Kanban className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4 rounded-2xl shadow-2xs">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Trung Tâm Hoạt Động (Activity Feed)</h3>
          <p className="text-xs text-gray-500">Thông báo nhắc tên, lịch học, khảo sát và công việc nhóm</p>
        </div>

        <button
          onClick={() => setFeedItems((prev) => prev.map((item) => ({ ...item, isRead: true })))}
          className="text-xs font-semibold text-violet-700 hover:underline cursor-pointer"
        >
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      <div className="space-y-3">
        {feedItems.map((item) => (
          <div
            key={item.id}
            onClick={() => handleMarkRead(item.id)}
            className={`rounded-2xl border p-4 shadow-2xs transition flex items-start gap-3.5 cursor-pointer ${
              !item.isRead
                ? 'bg-violet-50/50 border-violet-200'
                : 'bg-white border-gray-200/80 hover:border-gray-300'
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-gray-100 shadow-2xs">
              {getItemIcon(item.type)}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-gray-900">{item.title}</h4>
                  {!item.isRead && (
                    <span className="h-2 w-2 rounded-full bg-violet-600" />
                  )}
                </div>
                <span className="text-[10px] text-gray-400 font-mono">
                  {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">{item.content}</p>

              <div className="flex items-center justify-between pt-1 text-[11px] text-gray-400">
                <span>Nguồn: {item.sourceName}</span>
                {item.type === 'MEETING' ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToMeeting?.('Tiết học trực tuyến: Lập trình RESTful API');
                    }}
                    className="font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Vào phòng họp ngay →
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToChannel?.('ch-general');
                    }}
                    className="font-semibold text-violet-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Xem kênh →
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamsActivityFeed;
