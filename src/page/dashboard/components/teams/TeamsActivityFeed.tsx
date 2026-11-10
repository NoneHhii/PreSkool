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
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

interface TeamsActivityFeedProps {
  onNavigateToChannel?: (channelId: string) => void;
  onNavigateToMeeting?: (meetingTitle: string) => void;
}

export const TeamsActivityFeed: React.FC<TeamsActivityFeedProps> = ({
  onNavigateToChannel,
  onNavigateToMeeting,
}) => {
  // Real activity feed - starts EMPTY (No fake data!)
  const [feedItems, setFeedItems] = useState<ActivityFeedItem[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      try {
        const res = await teamsService.getActivityFeed();
        if (res.data?.data && Array.isArray(res.data.data)) {
          setFeedItems(res.data.data);
        }
      } catch {
        // Fallback to empty
        setFeedItems([]);
      }
      setLoading(false);
    };
    fetchFeed();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    setFeedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
    try {
      await teamsService.markActivityRead(id);
    } catch {
      // ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    setFeedItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

  const filteredItems = feedItems.filter((item) => {
    if (filterType === 'UNREAD') return !item.isRead;
    if (filterType !== 'ALL') return item.type === filterType;
    return true;
  });

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'MEETING':
        return <Video className="h-4 w-4 text-emerald-600" />;
      case 'MENTION':
        return <MessageSquare className="h-4 w-4 text-violet-600" />;
      case 'POLL':
        return <Vote className="h-4 w-4 text-amber-600" />;
      case 'TASK':
        return <Kanban className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const unreadCount = feedItems.filter((item) => !item.isRead).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 select-none">
      {/* Feed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900">Bảng Tin Hoạt Động & Thông Báo</h3>
            {unreadCount > 0 && (
              <span className="rounded-full bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5">
                {unreadCount} mới
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Tổng hợp hoạt động thời gian thực từ các cuộc họp, nhóm học phần và bài tập
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer self-start sm:self-auto"
          >
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
            <span>Đánh dấu đã đọc tất cả</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'UNREAD', label: `Chưa đọc (${unreadCount})` },
          { key: 'MEETING', label: 'Cuộc họp' },
          { key: 'MENTION', label: 'Nhắc đến (@)' },
          { key: 'TASK', label: 'Giao việc' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            className={`rounded-xl px-3.5 py-1.5 transition cursor-pointer ${
              filterType === tab.key
                ? 'bg-violet-600 text-white font-bold shadow-xs'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-gray-500 bg-white rounded-2xl border border-gray-200">
          Đang tải thông báo từ hệ thống...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-16 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-3xl bg-white">
          <Bell className="h-10 w-10 mx-auto text-gray-300 mb-2" />
          <h4 className="font-bold text-gray-700 text-sm">Chưa có thông báo mới nào</h4>
          <p className="text-[11px] text-gray-500 mt-1">
            Các hoạt động họp lớp, phân công bài tập và thảo luận sẽ tự động xuất hiện tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleMarkAsRead(item.id)}
              className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-4 ${
                !item.isRead
                  ? 'bg-violet-50/50 border-violet-200 shadow-2xs'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  !item.isRead ? 'bg-white shadow-xs' : 'bg-gray-100'
                }`}
              >
                {getItemIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-gray-900 leading-snug">{item.title}</h5>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {new Date(item.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>

                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.content}</p>

                <div className="flex items-center gap-3 mt-2 text-[11px]">
                  <span className="font-semibold text-violet-700">{item.sourceName}</span>

                  {item.type === 'MEETING' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToMeeting?.(item.title);
                      }}
                      className="text-emerald-700 hover:underline font-bold flex items-center gap-1"
                    >
                      <Video className="h-3 w-3" />
                      <span>Tham gia ngay</span>
                    </button>
                  )}

                  {item.type === 'MENTION' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToChannel?.(item.id);
                      }}
                      className="text-violet-700 hover:underline font-bold flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Mở kênh</span>
                    </button>
                  )}
                </div>
              </div>

              {!item.isRead && (
                <span className="h-2 w-2 rounded-full bg-violet-600 shrink-0 mt-1.5" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamsActivityFeed;
