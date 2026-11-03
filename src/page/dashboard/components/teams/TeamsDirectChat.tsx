import React, { useState, useEffect } from 'react';
import {
  teamsService,
  type DirectConversation,
  type ChatMessage,
} from '../../../../services/teams.service';
import { socketService } from '../../../../services/socket.service';
import {
  Search,
  Plus,
  Send,
  Users,
  X,
  Video,
} from 'lucide-react';

interface TeamsDirectChatProps {
  user: any;
  onStartVideoCall?: (targetUserName: string) => void;
}

export const TeamsDirectChat: React.FC<TeamsDirectChatProps> = ({
  user,
  onStartVideoCall,
}) => {
  // Demo initial conversations
  const [conversations, setConversations] = useState<DirectConversation[]>([
    {
      id: 'conv-1',
      isGroup: false,
      participants: [
        {
          id: 'mem-1',
          userId: 'teacher-1',
          fullName: 'TS. Nguyễn Văn Hùng',
          role: 'OWNER',
          presence: 'ONLINE',
          avatarUrl: '',
        },
      ],
      unreadCount: 1,
      lastMessage: {
        id: 'lm-1',
        senderId: 'teacher-1',
        senderName: 'TS. Nguyễn Văn Hùng',
        content: 'Thầy đã xem qua đề tài của em, chiều nay 14h em qua phòng A102 nhé!',
        createdAt: '2026-11-02T08:30:00Z',
      },
    },
    {
      id: 'conv-2',
      name: 'Nhóm Ôn Thi CSDL Nâng Cao',
      isGroup: true,
      participants: [
        { id: 'mem-2', userId: 'st-2', fullName: 'Trần Thị Mai', role: 'MEMBER', presence: 'IN_A_CALL' },
        { id: 'mem-3', userId: 'st-3', fullName: 'Lê Hoàng Nam', role: 'MEMBER', presence: 'ONLINE' },
        { id: 'mem-4', userId: 'st-4', fullName: 'Phạm Minh Đức', role: 'MEMBER', presence: 'BUSY' },
      ],
      unreadCount: 0,
      lastMessage: {
        id: 'lm-2',
        senderId: 'st-2',
        senderName: 'Trần Thị Mai',
        content: 'Các bạn kiểm tra file bài tập mình vừa gửi nhé.',
        createdAt: '2026-11-01T21:40:00Z',
      },
    },
    {
      id: 'conv-3',
      isGroup: false,
      participants: [
        {
          id: 'mem-5',
          userId: 'st-5',
          fullName: 'Đỗ Thảo Linh',
          role: 'MEMBER',
          presence: 'AWAY',
        },
      ],
      unreadCount: 0,
      lastMessage: {
        id: 'lm-3',
        senderId: 'st-5',
        senderName: 'Đỗ Thảo Linh',
        content: 'Cậu làm xong phần Unit Test chưa?',
        createdAt: '2026-10-31T15:10:00Z',
      },
    },
  ]);

  const [selectedConvId, setSelectedConvId] = useState<string>('conv-1');
  const [searchTerm, setSearchTerm] = useState('');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTypingUser, setActiveTypingUser] = useState<string | null>(null);

  // Messages in selected conversation
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({
    'conv-1': [
      {
        id: 'm-1',
        senderId: 'current-user',
        senderName: user?.fullName || 'Bạn',
        content: 'Thưa thầy, em đã cập nhật lại sơ đồ thực thể kết hợp theo góp ý buổi trước.',
        createdAt: '2026-11-02T08:15:00Z',
      },
      {
        id: 'm-2',
        senderId: 'teacher-1',
        senderName: 'TS. Nguyễn Văn Hùng',
        content: 'Thầy đã xem qua đề tài của em, chiều nay 14h em qua phòng A102 nhé!',
        createdAt: '2026-11-02T08:30:00Z',
      },
    ],
    'conv-2': [
      {
        id: 'm-3',
        senderId: 'st-2',
        senderName: 'Trần Thị Mai',
        content: 'Mọi người ơi, tối nay 20h chúng ta họp online trên kênh để tổng kết phần thuyết trình nhé!',
        createdAt: '2026-11-01T20:00:00Z',
      },
      {
        id: 'm-4',
        senderId: 'st-3',
        senderName: 'Lê Hoàng Nam',
        content: 'Nhất trí nhé, mình chuẩn bị xong slide rồi.',
        createdAt: '2026-11-01T20:05:00Z',
      },
      {
        id: 'm-5',
        senderId: 'st-2',
        senderName: 'Trần Thị Mai',
        content: 'Các bạn kiểm tra file bài tập mình vừa gửi nhé.',
        createdAt: '2026-11-01T21:40:00Z',
      },
    ],
    'conv-3': [
      {
        id: 'm-6',
        senderId: 'st-5',
        senderName: 'Đỗ Thảo Linh',
        content: 'Cậu làm xong phần Unit Test chưa?',
        createdAt: '2026-10-31T15:10:00Z',
      },
    ],
  });

  // New Chat Modal
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatType, setNewChatType] = useState<'DIRECT' | 'GROUP'>('DIRECT');
  const [newChatTargetName, setNewChatTargetName] = useState('');
  const [newChatGroupName, setNewChatGroupName] = useState('');

  const activeConv = conversations.find((c) => c.id === selectedConvId) || conversations[0];

  // Load direct conversations from API
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const res = await teamsService.getConversations();
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setConversations(res.data);
          setSelectedConvId(res.data[0].id);
        }
      } catch {
        // fallback
      }
    };
    loadConversations();
  }, []);

  useEffect(() => {
    socketService.emit('join_conversation', selectedConvId);

    const loadMessages = async () => {
      try {
        const res = await teamsService.getDirectMessages(selectedConvId);
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setMessages((prev) => ({
            ...prev,
            [selectedConvId]: res.data,
          }));
        }
      } catch {
        // fallback
      }
    };
    loadMessages();

    const handleNewDirect = (msg: ChatMessage) => {
      if (msg.conversationId) {
        setMessages((prev) => {
          const list = prev[msg.conversationId!] || [];
          if (list.some((m) => m.id === msg.id)) return prev;
          return {
            ...prev,
            [msg.conversationId!]: [...list, msg],
          };
        });
      }
    };

    const handleTyping = (data: { userId: string; userName: string; isTyping: boolean }) => {
      if (data.isTyping) {
        setActiveTypingUser(data.userName);
      } else {
        setActiveTypingUser(null);
      }
    };

    socketService.on('new_direct_message', handleNewDirect);
    socketService.on('user_typing', handleTyping);

    return () => {
      socketService.off('new_direct_message', handleNewDirect);
      socketService.off('user_typing', handleTyping);
    };
  }, [selectedConvId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: selectedConvId,
      senderId: user?.id || 'current-user',
      senderName: user?.fullName || user?.username || 'Bạn',
      content: inputText,
      createdAt: new Date().toISOString(),
    };

    try {
      await teamsService.sendDirectMessage(selectedConvId, { content: inputText });
    } catch {
      // demo fallback
    }

    socketService.emit('direct_message', { conversationId: selectedConvId, message: newMsg });

    setMessages((prev) => ({
      ...prev,
      [selectedConvId]: [...(prev[selectedConvId] || []), newMsg],
    }));

    // Update last message in list
    setConversations((prev) =>
      prev.map((c) => (c.id === selectedConvId ? { ...c, lastMessage: newMsg } : c))
    );

    setInputText('');
  };

  const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      socketService.emit('user_typing', {
        userName: user?.fullName || 'Bạn',
        isTyping: true,
      });
      setTimeout(() => {
        setIsTyping(false);
        socketService.emit('user_typing', { isTyping: false });
      }, 1500);
    }
  };

  const handleCreateNewChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChatType === 'DIRECT' && newChatTargetName.trim()) {
      const newConv: DirectConversation = {
        id: `conv-${Date.now()}`,
        isGroup: false,
        participants: [
          {
            id: `mem-${Date.now()}`,
            userId: `u-${Date.now()}`,
            fullName: newChatTargetName,
            role: 'MEMBER',
            presence: 'ONLINE',
          },
        ],
        unreadCount: 0,
      };
      setConversations((prev) => [newConv, ...prev]);
      setSelectedConvId(newConv.id);
      setMessages((prev) => ({ ...prev, [newConv.id]: [] }));
    } else if (newChatType === 'GROUP' && newChatGroupName.trim()) {
      const newConv: DirectConversation = {
        id: `conv-${Date.now()}`,
        name: newChatGroupName,
        isGroup: true,
        participants: [
          { id: '1', userId: 'u1', fullName: 'Thành viên 1', role: 'MEMBER', presence: 'ONLINE' },
          { id: '2', userId: 'u2', fullName: 'Thành viên 2', role: 'MEMBER', presence: 'ONLINE' },
        ],
        unreadCount: 0,
      };
      setConversations((prev) => [newConv, ...prev]);
      setSelectedConvId(newConv.id);
      setMessages((prev) => ({ ...prev, [newConv.id]: [] }));
    }

    setNewChatTargetName('');
    setNewChatGroupName('');
    setShowNewChatModal(false);
  };

  const getPresenceColor = (presence?: string) => {
    switch (presence) {
      case 'ONLINE':
        return 'bg-emerald-500';
      case 'IN_A_CALL':
      case 'BUSY':
        return 'bg-rose-500';
      case 'AWAY':
        return 'bg-amber-500';
      default:
        return 'bg-gray-400';
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const title = c.isGroup ? c.name : c.participants[0]?.fullName;
    return title?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const convName = activeConv?.isGroup
    ? activeConv.name
    : activeConv?.participants[0]?.fullName || 'Người dùng';

  return (
    <div className="flex h-full bg-[#f8fafc] overflow-hidden">
      {/* 1. LEFT CONVERSATIONS LIST */}
      <aside className="w-80 border-r border-gray-200 bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Trò Chuyện Trực Tiếp</h3>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 transition cursor-pointer"
              title="Tạo cuộc trò chuyện mới"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm người hoặc nhóm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/70 pl-8 pr-3 py-2 text-xs outline-none focus:border-violet-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {filteredConversations.map((conv) => {
            const isSelected = conv.id === selectedConvId;
            const displayName = conv.isGroup ? conv.name : conv.participants[0]?.fullName;
            const presence = conv.participants[0]?.presence;

            return (
              <div
                key={conv.id}
                onClick={() => setSelectedConvId(conv.id)}
                className={`p-3.5 flex items-start gap-3 cursor-pointer transition ${
                  isSelected ? 'bg-violet-50/70 border-l-4 border-l-violet-600' : 'hover:bg-gray-50'
                }`}
              >
                <div className="relative shrink-0">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${
                      conv.isGroup ? 'bg-indigo-100 text-indigo-700' : 'bg-violet-100 text-violet-700'
                    }`}
                  >
                    {conv.isGroup ? <Users className="h-4 w-4" /> : displayName?.charAt(0)}
                  </div>
                  {!conv.isGroup && (
                    <span
                      className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white ${getPresenceColor(
                        presence
                      )}`}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-900 truncate">{displayName}</h4>
                    {conv.lastMessage && (
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(conv.lastMessage.createdAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">
                      {conv.lastMessage.content}
                    </p>
                  )}
                </div>

                {conv.unreadCount && conv.unreadCount > 0 ? (
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white">
                    {conv.unreadCount}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </aside>

      {/* 2. CHAT CONTENT AREA */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Chat Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-6 bg-white">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${
                  activeConv?.isGroup ? 'bg-indigo-100 text-indigo-700' : 'bg-violet-100 text-violet-700'
                }`}
              >
                {activeConv?.isGroup ? <Users className="h-4 w-4" /> : convName?.charAt(0)}
              </div>
              {!activeConv?.isGroup && (
                <span
                  className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white ${getPresenceColor(
                    activeConv?.participants[0]?.presence
                  )}`}
                />
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900">{convName}</h3>
              <p className="text-[11px] text-gray-500">
                {activeConv?.isGroup
                  ? `${activeConv.participants.length} thành viên`
                  : activeConv?.participants[0]?.presence === 'ONLINE'
                  ? 'Đang trực tuyến'
                  : activeConv?.participants[0]?.presence === 'IN_A_CALL'
                  ? 'Đang trong cuộc gọi'
                  : 'Ngoại tuyến'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onStartVideoCall?.(convName || 'Người dùng')}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            >
              <Video className="h-4 w-4 text-violet-600" />
              <span>Gọi Video</span>
            </button>
          </div>
        </header>

        {/* Message Bubble Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fbfbfe]">
          {(messages[selectedConvId] || []).map((msg) => {
            const isMe = msg.senderId === 'current-user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span className="font-semibold text-gray-700">{msg.senderName}</span>
                  <span>•</span>
                  <span>{new Date(msg.createdAt).toLocaleTimeString('vi-VN')}</span>
                </div>

                <div
                  className={`max-w-md rounded-2xl px-4 py-2.5 text-xs shadow-2xs ${
                    isMe
                      ? 'bg-violet-600 text-white rounded-tr-none'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {activeTypingUser && (
            <div className="text-[11px] text-violet-600 italic animate-pulse">
              {activeTypingUser} đang soạn tin nhắn...
            </div>
          )}
        </div>

        {/* Composer Form */}
        <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={`Nhắn tin cho ${convName}...`}
              value={inputText}
              onChange={handleTypingChange}
              className="flex-1 rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-2.5 text-xs outline-none focus:border-violet-500 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-700 transition disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </main>

      {/* MODAL: Tạo cuộc trò chuyện mới */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Cuộc Trò Chuyện Mới</h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewChat} className="mt-4 space-y-4 text-xs">
              <div className="flex rounded-xl bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => setNewChatType('DIRECT')}
                  className={`flex-1 rounded-lg py-1.5 font-semibold transition cursor-pointer ${
                    newChatType === 'DIRECT' ? 'bg-white text-violet-700 shadow-xs' : 'text-gray-600'
                  }`}
                >
                  Nhắn Tin 1-1
                </button>
                <button
                  type="button"
                  onClick={() => setNewChatType('GROUP')}
                  className={`flex-1 rounded-lg py-1.5 font-semibold transition cursor-pointer ${
                    newChatType === 'GROUP' ? 'bg-white text-violet-700 shadow-xs' : 'text-gray-600'
                  }`}
                >
                  Tạo Nhóm Chat
                </button>
              </div>

              {newChatType === 'DIRECT' ? (
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Nhập Họ tên hoặc MSSV/Email người nhận
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: ThS. Trần Thị Lan / 26107003..."
                    value={newChatTargetName}
                    onChange={(e) => setNewChatTargetName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-violet-500"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Tên Nhóm Trò Chuyện</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nhóm Đồ Án Chuyên Ngành..."
                    value={newChatGroupName}
                    onChange={(e) => setNewChatGroupName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-violet-500"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 cursor-pointer"
                >
                  Bắt Đầu Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsDirectChat;
