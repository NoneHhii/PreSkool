import React, { useState, useEffect, useRef } from 'react';
import {
  teamsService,
  type DirectConversation,
  type ChatMessage,
  type DirectoryUser,
  type PresenceStatus,
} from '../../../../services/teams.service';
import { socketService } from '../../../../services/socket.service';
import {
  Search,
  Plus,
  Send,
  Users,
  X,
  Video,
  Pin,
  Paperclip,
  Code,
  Reply,
  Info,
  Check,
  ExternalLink,
} from 'lucide-react';

interface TeamsDirectChatProps {
  user: any;
  directoryUsers?: DirectoryUser[];
  presenceMap?: Record<string, PresenceStatus>;
  onStartVideoCall?: (roomCode: string, meetingTitle: string) => void;
}

export const TeamsDirectChat: React.FC<TeamsDirectChatProps> = ({
  user,
  directoryUsers = [],
  presenceMap = {},
  onStartVideoCall,
}) => {
  const currentUserId = user?.id || '';

  // Conversations state
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [inputText, setInputText] = useState('');
  const [activeTypingUser, setActiveTypingUser] = useState<string | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Messages in selected conversation
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  // New Chat Modal
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatTab, setNewChatTab] = useState<'DIRECT' | 'GROUP'>('DIRECT');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<DirectoryUser[]>([]);
  const [groupNameInput, setGroupNameInput] = useState('');

  // Right Drawer
  const [showRightDrawer, setShowRightDrawer] = useState(false);

  // Extra Message Features
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState('typescript');
  const [codeContent, setCodeContent] = useState('');

  const [showAttachModal, setShowAttachModal] = useState(false);
  const [attachName, setAttachName] = useState('');
  const [attachUrl, setAttachUrl] = useState('');

  // Scroll to bottom on new message
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedConvId]);

  // Load conversations from Backend API
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const res = await teamsService.getConversations();
        if (res.data?.data && Array.isArray(res.data.data)) {
          setConversations(res.data.data);
          if (res.data.data.length > 0 && !selectedConvId) {
            setSelectedConvId(res.data.data[0].id);
          }
        }
      } catch {
        // May be empty initially
      }
    };
    loadConversations();
  }, []);

  // Listen for real-time Socket.IO direct messages
  useEffect(() => {
    const handleNewDirect = (msg: ChatMessage) => {
      if (!msg || !msg.conversationId) return;

      const convId = msg.conversationId;

      // Update messages map
      setMessages((prev) => {
        const list = prev[convId] || [];
        if (list.some((m) => m.id === msg.id)) return prev;
        return {
          ...prev,
          [convId]: [...list, msg],
        };
      });

      // Update conversations list
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === convId);
        if (idx !== -1) {
          const updated = [...prev];
          const conv = updated[idx];
          const unread = convId === selectedConvId ? 0 : (conv.unreadCount || 0) + 1;
          updated[idx] = { ...conv, lastMessage: msg, unreadCount: unread };
          // Move to top
          const [item] = updated.splice(idx, 1);
          return [item, ...updated];
        } else {
          // New conversation from sender
          const newConv: DirectConversation = {
            id: convId,
            isGroup: false,
            participants: [
              {
                id: msg.senderId,
                userId: msg.senderId,
                fullName: msg.senderName,
                role: (msg.senderRole as any) || 'MEMBER',
                avatarUrl: msg.senderAvatar,
              },
            ],
            lastMessage: msg,
            unreadCount: convId === selectedConvId ? 0 : 1,
          };
          return [newConv, ...prev];
        }
      });
    };

    const handleTyping = (data: { userId: string; userName: string; isTyping: boolean }) => {
      if (data.userId !== currentUserId) {
        if (data.isTyping) {
          setActiveTypingUser(data.userName);
        } else {
          setActiveTypingUser(null);
        }
      }
    };

    socketService.on('new_direct_message', handleNewDirect);
    socketService.on('user_typing', handleTyping);

    return () => {
      socketService.off('new_direct_message', handleNewDirect);
      socketService.off('user_typing', handleTyping);
    };
  }, [selectedConvId, currentUserId]);

  // Auto-join conversation rooms for all known conversations and deterministic 1-1 pairs
  useEffect(() => {
    if (!currentUserId) return;
    directoryUsers.forEach((u) => {
      if (u.id && u.id !== currentUserId) {
        const dmId = `dm_${[currentUserId, u.id].sort().join('_')}`;
        socketService.joinConversation(dmId);
      }
    });
    conversations.forEach((c) => {
      if (c.id) {
        socketService.joinConversation(c.id);
      }
    });
  }, [currentUserId, directoryUsers, conversations]);

  // Join conversation socket room & load messages when selectedConvId changes
  useEffect(() => {
    if (!selectedConvId) return;

    socketService.emit('join_conversation', selectedConvId);

    // Reset unread count
    setConversations((prev) =>
      prev.map((c) => (c.id === selectedConvId ? { ...c, unreadCount: 0 } : c))
    );

    // Fetch messages from DB if not already loaded
    if (!messages[selectedConvId]) {
      teamsService
        .getDirectMessages(selectedConvId)
        .then((res: any) => {
          if (res.data?.data && Array.isArray(res.data.data)) {
            setMessages((prev) => ({
              ...prev,
              [selectedConvId]: res.data.data,
            }));
          }
        })
        .catch(() => {});
    }
  }, [selectedConvId]);

  // Handle typing input
  const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    socketService.emit('typing', {
      conversationId: selectedConvId,
      isTyping: true,
      userName: user?.fullName || 'Người dùng',
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketService.emit('typing', {
        conversationId: selectedConvId,
        isTyping: false,
        userName: user?.fullName || 'Người dùng',
      });
    }, 1500);
  };

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const content = inputText.trim();
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: selectedConvId,
      senderId: currentUserId,
      senderName: user?.fullName || user?.username || 'Bạn',
      senderRole: user?.role,
      content,
      replyToId: replyingTo?.id,
      replyToMessage: replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName,
            content: replyingTo.content,
          }
        : undefined,
      reactions: [],
      createdAt: new Date().toISOString(),
    };

    // Emit via Socket.IO
    socketService.emit('direct_message', {
      conversationId: selectedConvId,
      message: newMsg,
    });

    // Save to DB
    teamsService
      .sendDirectMessage(selectedConvId, {
        content,
        codeSnippet: newMsg.codeSnippet,
        attachments: newMsg.attachments,
      })
      .catch(() => {});

    // Update local state
    setMessages((prev) => ({
      ...prev,
      [selectedConvId]: [...(prev[selectedConvId] || []), newMsg],
    }));

    setConversations((prev) =>
      prev.map((c) => (c.id === selectedConvId ? { ...c, lastMessage: newMsg } : c))
    );

    setInputText('');
    setReplyingTo(null);
  };

  // Send Code Snippet
  const handleSendCode = () => {
    if (!codeContent.trim() || !selectedConvId) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: selectedConvId,
      senderId: currentUserId,
      senderName: user?.fullName || 'Bạn',
      senderRole: user?.role,
      content: 'Đã chia sẻ đoạn mã nguồn:',
      codeSnippet: {
        language: codeLanguage,
        code: codeContent.trim(),
      },
      createdAt: new Date().toISOString(),
    };

    socketService.emit('direct_message', {
      conversationId: selectedConvId,
      message: newMsg,
    });

    setMessages((prev) => ({
      ...prev,
      [selectedConvId]: [...(prev[selectedConvId] || []), newMsg],
    }));

    setCodeContent('');
    setShowCodeModal(false);
  };

  // Send Attachment Link
  const handleSendAttachment = () => {
    if (!attachUrl.trim() || !selectedConvId) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: selectedConvId,
      senderId: currentUserId,
      senderName: user?.fullName || 'Bạn',
      senderRole: user?.role,
      content: 'Đã gửi tệp đính kèm / tài liệu:',
      attachments: [
        {
          name: attachName.trim() || 'Tai_Lieu_Dinh_Kem',
          url: attachUrl.trim(),
        },
      ],
      createdAt: new Date().toISOString(),
    };

    socketService.emit('direct_message', {
      conversationId: selectedConvId,
      message: newMsg,
    });

    setMessages((prev) => ({
      ...prev,
      [selectedConvId]: [...(prev[selectedConvId] || []), newMsg],
    }));

    setAttachName('');
    setAttachUrl('');
    setShowAttachModal(false);
  };

  // Reactions toggle
  const handleReaction = (msgId: string, emoji: string) => {
    setMessages((prev) => {
      const list = prev[selectedConvId] || [];
      const updated = list.map((m) => {
        if (m.id !== msgId) return m;
        const currentReactions = m.reactions || [];
        const existing = currentReactions.find((r) => r.reaction === emoji);
        let nextReactions;
        if (existing) {
          if (existing.hasReacted) {
            nextReactions = currentReactions
              .map((r) =>
                r.reaction === emoji
                  ? { ...r, count: r.count - 1, hasReacted: false }
                  : r
              )
              .filter((r) => r.count > 0);
          } else {
            nextReactions = currentReactions.map((r) =>
              r.reaction === emoji
                ? { ...r, count: r.count + 1, hasReacted: true }
                : r
            );
          }
        } else {
          nextReactions = [
            ...currentReactions,
            { reaction: emoji, count: 1, users: [currentUserId], hasReacted: true },
          ];
        }
        return { ...m, reactions: nextReactions };
      });
      return { ...prev, [selectedConvId]: updated };
    });
  };

  // Pin / Unpin message
  const handleTogglePin = (msgId: string) => {
    setMessages((prev) => {
      const list = prev[selectedConvId] || [];
      const updated = list.map((m) =>
        m.id === msgId ? { ...m, isPinned: !m.isPinned } : m
      );
      return { ...prev, [selectedConvId]: updated };
    });
  };

  // Start Video Call from chat
  const handleStartCall = () => {
    const roomCode = `meet-${Math.random().toString(36).substring(2, 9)}`;
    const title = `Cuộc gọi: ${convName}`;

    // Send Meeting Invite Card into Chat
    const inviteMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: selectedConvId,
      senderId: currentUserId,
      senderName: user?.fullName || 'Bạn',
      senderRole: user?.role,
      content: `📞 Đã bắt đầu cuộc họp video trực tuyến! Mã phòng: ${roomCode}`,
      attachments: [
        {
          name: `Tham gia phòng họp: ${roomCode}`,
          url: `https://meet.preskool.edu.vn/room/${roomCode}`,
          type: 'MEETING_CARD',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    socketService.emit('direct_message', {
      conversationId: selectedConvId,
      message: inviteMsg,
    });

    setMessages((prev) => ({
      ...prev,
      [selectedConvId]: [...(prev[selectedConvId] || []), inviteMsg],
    }));

    onStartVideoCall?.(roomCode, title);
  };

  // 1-1 Chat creation
  const handleStartDirectWithUser = (targetUser: DirectoryUser) => {
    const sortedIds = [currentUserId, targetUser.id].sort();
    const convId = `dm_${sortedIds.join('_')}`;

    const existing = conversations.find((c) => c.id === convId);
    if (existing) {
      setSelectedConvId(convId);
    } else {
      const newConv: DirectConversation = {
        id: convId,
        isGroup: false,
        participants: [
          {
            id: targetUser.id,
            userId: targetUser.id,
            fullName: targetUser.fullName,
            role: (targetUser.role as any) || 'MEMBER',
            avatarUrl: targetUser.avatarUrl,
            email: targetUser.email,
            presence: presenceMap[targetUser.id] || targetUser.presence || 'OFFLINE',
            studentCode: targetUser.studentCode,
            teacherCode: targetUser.teacherCode,
          },
        ],
        unreadCount: 0,
      };

      setConversations((prev) => [newConv, ...prev]);
      setSelectedConvId(convId);
      socketService.emit('join_conversation', convId);

      // Persist to DB
      teamsService.createDirectConversation(targetUser.id).catch(() => {});
    }

    setShowNewChatModal(false);
  };

  // Group Chat creation
  const handleCreateGroupChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupNameInput.trim() || selectedGroupMembers.length === 0) return;

    const convId = `grp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const participants = selectedGroupMembers.map((m) => ({
      id: m.id,
      userId: m.id,
      fullName: m.fullName,
      role: (m.role as any) || 'MEMBER',
      avatarUrl: m.avatarUrl,
      email: m.email,
      presence: presenceMap[m.id] || m.presence || 'OFFLINE',
      studentCode: m.studentCode,
      teacherCode: m.teacherCode,
    }));

    const newConv: DirectConversation = {
      id: convId,
      name: groupNameInput.trim(),
      isGroup: true,
      participants,
      unreadCount: 0,
    };

    setConversations((prev) => [newConv, ...prev]);
    setSelectedConvId(convId);
    socketService.emit('join_conversation', convId);

    // Persist to DB
    teamsService
      .createGroupConversation(
        groupNameInput.trim(),
        selectedGroupMembers.map((m) => m.id)
      )
      .catch(() => {});

    setGroupNameInput('');
    setSelectedGroupMembers([]);
    setShowNewChatModal(false);
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const title = c.isGroup ? c.name : c.participants[0]?.fullName;
    return title?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const activeConv = conversations.find((c) => c.id === selectedConvId);
  const convName = activeConv?.isGroup
    ? activeConv.name
    : activeConv?.participants[0]?.fullName || 'Cuộc trò chuyện';

  const otherParticipant = !activeConv?.isGroup ? activeConv?.participants[0] : null;
  const otherPresence = otherParticipant
    ? presenceMap[otherParticipant.userId] || otherParticipant.presence || 'OFFLINE'
    : 'OFFLINE';

  const getPresenceColor = (status?: string) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-emerald-500';
      case 'BUSY':
      case 'IN_A_CALL':
        return 'bg-rose-500';
      case 'AWAY':
        return 'bg-amber-500';
      default:
        return 'bg-gray-400';
    }
  };

  // Filter directory users for new chat modal
  const searchableUsers = directoryUsers.filter((u) => {
    if (u.id === currentUserId) return false;
    const q = userSearchTerm.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.studentCode?.toLowerCase().includes(q) ||
      u.teacherCode?.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const pinnedMessages = (messages[selectedConvId] || []).filter((m) => m.isPinned);

  return (
    <div className="flex h-full bg-[#f8fafc] overflow-hidden select-none">
      {/* 1. LEFT CONVERSATIONS LIST */}
      <aside className="w-80 border-r border-gray-200 bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Trò Chuyện Trực Tiếp</h3>
            <button
              onClick={() => {
                setUserSearchTerm('');
                setShowNewChatModal(true);
              }}
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
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400">
              <Users className="h-8 w-8 mx-auto text-gray-300 mb-2" />
              <p className="font-semibold text-gray-600">Chưa có cuộc trò chuyện nào</p>
              <p className="text-[11px] text-gray-400 mt-1">
                Bấm nút <Plus className="inline h-3 w-3" /> phía trên để bắt đầu nhắn tin với giảng viên hoặc sinh viên.
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === selectedConvId;
              const displayName = conv.isGroup ? conv.name : conv.participants[0]?.fullName;
              const part = conv.participants[0];
              const pStatus = part ? presenceMap[part.userId] || part.presence || 'OFFLINE' : 'OFFLINE';

              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition ${
                    isSelected ? 'bg-violet-50/80 border-l-4 border-l-violet-600' : 'hover:bg-gray-50'
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
                          pStatus
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
            })
          )}
        </div>
      </aside>

      {/* 2. CHAT CONTENT AREA */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden">
        {activeConv ? (
          <>
            {/* Header */}
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-6 bg-white">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${
                      activeConv.isGroup ? 'bg-indigo-100 text-indigo-700' : 'bg-violet-100 text-violet-700'
                    }`}
                  >
                    {activeConv.isGroup ? <Users className="h-4 w-4" /> : convName?.charAt(0)}
                  </div>
                  {!activeConv.isGroup && (
                    <span
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white ${getPresenceColor(
                        otherPresence
                      )}`}
                    />
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900">{convName}</h3>
                  <p className="text-[11px] text-gray-500">
                    {activeConv.isGroup
                      ? `${activeConv.participants.length} thành viên`
                      : otherPresence === 'ONLINE'
                      ? 'Đang trực tuyến'
                      : otherPresence === 'IN_A_CALL'
                      ? 'Đang trong cuộc gọi'
                      : 'Ngoại tuyến'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleStartCall}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                  title="Gọi video trực tuyến"
                >
                  <Video className="h-4 w-4 text-violet-600" />
                  <span>Gọi Video</span>
                </button>

                <button
                  onClick={() => setShowRightDrawer(!showRightDrawer)}
                  className={`flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 transition cursor-pointer ${
                    showRightDrawer ? 'bg-violet-50 text-violet-700 border-violet-300' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  title="Thông tin cuộc hội thoại"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
            </header>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fbfbfe]">
              {(messages[selectedConvId] || []).length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400">
                  <p className="font-semibold text-gray-600">Bắt đầu cuộc trò chuyện với {convName}</p>
                  <p className="text-[11px] text-gray-400 mt-1">Gửi tin nhắn đầu tiên để kết nối.</p>
                </div>
              ) : (
                (messages[selectedConvId] || []).map((msg) => {
                  const isMe = msg.senderId === currentUserId;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1 group`}
                    >
                      <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <span className="font-semibold text-gray-700">{msg.senderName}</span>
                        <span>•</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString('vi-VN')}</span>
                        {msg.isPinned && (
                          <span className="text-amber-500 font-bold flex items-center gap-0.5">
                            <Pin className="h-3 w-3" /> Đã ghim
                          </span>
                        )}
                      </div>

                      {/* Replying quote if any */}
                      {msg.replyToMessage && (
                        <div
                          className={`text-[10px] border-l-2 border-violet-500 bg-gray-100/80 px-2.5 py-1 rounded-r-md text-gray-600 max-w-sm truncate ${
                            isMe ? 'mr-1' : 'ml-1'
                          }`}
                        >
                          <span className="font-bold text-gray-800">{msg.replyToMessage.senderName}: </span>
                          <span>{msg.replyToMessage.content}</span>
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        className={`max-w-md rounded-2xl px-4 py-2.5 text-xs shadow-2xs relative ${
                          isMe
                            ? 'bg-violet-600 text-white rounded-tr-none'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                        }`}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                        {/* Code Snippet Box */}
                        {msg.codeSnippet && (
                          <div className="mt-2 rounded-xl bg-gray-900 text-gray-100 p-3 font-mono text-[11px] overflow-x-auto">
                            <div className="flex items-center justify-between pb-1 mb-1 border-b border-gray-800 text-[9px] text-violet-400 uppercase font-bold">
                              <span>{msg.codeSnippet.language}</span>
                            </div>
                            <pre className="whitespace-pre">{msg.codeSnippet.code}</pre>
                          </div>
                        )}

                        {/* Attachments / Meeting Card */}
                        {msg.attachments?.map((att, idx) => (
                          <div key={idx} className="mt-2">
                            {att.type === 'MEETING_CARD' ? (
                              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-950 flex items-center justify-between gap-3 shadow-2xs">
                                <div>
                                  <p className="font-bold text-xs flex items-center gap-1.5 text-emerald-900">
                                    <Video className="h-4 w-4 text-emerald-600" />
                                    {att.name}
                                  </p>
                                  <p className="text-[10px] text-emerald-700 mt-0.5">
                                    Cuộc họp WebRTC thời gian thực
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    const code = att.url.replace(/^https?:\/\/.*\/room\//, '');
                                    onStartVideoCall?.(code, `Phòng họp: ${code}`);
                                  }}
                                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white transition cursor-pointer shrink-0"
                                >
                                  Tham Gia Ngay
                                </button>
                              </div>
                            ) : (
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 rounded-lg bg-black/5 hover:bg-black/10 px-2.5 py-1.5 text-[11px] text-violet-700 underline font-medium"
                              >
                                <ExternalLink className="h-3 w-3 shrink-0" />
                                <span className="truncate">{att.name}</span>
                              </a>
                            )}
                          </div>
                        ))}

                        {/* Reactions display */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5 pt-1 border-t border-black/10">
                            {msg.reactions.map((r, i) => (
                              <button
                                key={i}
                                onClick={() => handleReaction(msg.id, r.reaction)}
                                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] cursor-pointer transition ${
                                  r.hasReacted ? 'bg-violet-200 text-violet-900 font-bold' : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                <span>{r.reaction}</span>
                                <span>{r.count}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Hover action bar */}
                      <div className="hidden group-hover:flex items-center gap-1 text-gray-400 text-xs px-1">
                        <button
                          onClick={() => setReplyingTo(msg)}
                          className="hover:text-violet-600 p-1"
                          title="Trả lời"
                        >
                          <Reply className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleTogglePin(msg.id)}
                          className="hover:text-amber-500 p-1"
                          title="Ghim tin nhắn"
                        >
                          <Pin className="h-3.5 w-3.5" />
                        </button>
                        {['👍', '❤️', '😂', '😮', '🎉'].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(msg.id, emoji)}
                            className="hover:scale-125 transition px-1"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {activeTypingUser && (
                <div className="text-[11px] text-violet-600 italic animate-pulse">
                  {activeTypingUser} đang soạn tin nhắn...
                </div>
              )}
              <div ref={messageEndRef} />
            </div>

            {/* Replying banner */}
            {replyingTo && (
              <div className="bg-violet-50 px-4 py-2 border-t border-violet-100 flex items-center justify-between text-xs text-violet-900">
                <div className="truncate">
                  <span className="font-bold">Đang trả lời {replyingTo.senderName}: </span>
                  <span className="text-violet-700 italic">{replyingTo.content}</span>
                </div>
                <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Composer */}
            <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-gray-400">
                  <button
                    type="button"
                    onClick={() => setShowCodeModal(true)}
                    className="p-1.5 hover:text-violet-600 rounded-lg hover:bg-gray-100 transition"
                    title="Gửi đoạn mã"
                  >
                    <Code className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAttachModal(true)}
                    className="p-1.5 hover:text-violet-600 rounded-lg hover:bg-gray-100 transition"
                    title="Đính kèm link/tệp"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                </div>

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
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
            <Users className="h-12 w-12 text-gray-300 mb-3" />
            <h4 className="text-sm font-bold text-gray-700">Chọn hoặc tạo một cuộc trò chuyện</h4>
            <p className="text-xs text-gray-500 max-w-sm mt-1">
              Bạn có thể trò chuyện 1-1 với giảng viên, sinh viên hoặc tạo nhóm thảo luận đồ án.
            </p>
            <button
              onClick={() => {
                setUserSearchTerm('');
                setShowNewChatModal(true);
              }}
              className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700 transition cursor-pointer"
            >
              Bắt Đầu Trò Chuyện
            </button>
          </div>
        )}
      </main>

      {/* 3. RIGHT DRAWER: DETAILS & PINNED MESSAGES */}
      {showRightDrawer && activeConv && (
        <aside className="w-72 border-l border-gray-200 bg-white p-4 overflow-y-auto space-y-4 shrink-0 animate-in slide-in-from-right">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h4 className="text-xs font-bold text-gray-900 uppercase">Thông Tin Chi Tiết</h4>
            <button onClick={() => setShowRightDrawer(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Participant list or contact card */}
          {activeConv.isGroup ? (
            <div>
              <span className="text-[11px] font-bold text-gray-600 uppercase block mb-2">
                Thành Viên Nhóm ({activeConv.participants.length}):
              </span>
              <div className="space-y-2">
                {activeConv.participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-50 text-xs">
                    <div className="h-7 w-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-[10px]">
                      {p.fullName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{p.fullName}</p>
                      <span className="text-[10px] text-gray-400">{p.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            otherParticipant && (
              <div className="text-center p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                <div className="h-14 w-14 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-lg mx-auto shadow-md">
                  {otherParticipant.fullName?.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-xs">{otherParticipant.fullName}</h4>
                  <p className="text-[11px] text-gray-500 font-mono mt-0.5">{otherParticipant.email || 'N/A'}</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <span className="rounded bg-violet-100 text-violet-800 px-1.5 py-0.5 text-[9px] font-bold">
                      {otherParticipant.role}
                    </span>
                    {otherParticipant.studentCode && (
                      <span className="rounded bg-gray-200 text-gray-700 px-1.5 py-0.5 text-[9px] font-mono">
                        {otherParticipant.studentCode}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          )}

          {/* Pinned Messages */}
          <div className="border-t border-gray-100 pt-3">
            <span className="text-[11px] font-bold text-gray-600 uppercase flex items-center gap-1 mb-2">
              <Pin className="h-3.5 w-3.5 text-amber-500" /> Tin Nhắn Đã Ghim ({pinnedMessages.length}):
            </span>
            {pinnedMessages.length === 0 ? (
              <p className="text-[11px] text-gray-400 italic">Chưa có tin nhắn nào được ghim.</p>
            ) : (
              <div className="space-y-2">
                {pinnedMessages.map((pm) => (
                  <div key={pm.id} className="p-2 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-gray-800">
                    <p className="font-bold text-[10px] text-amber-800">{pm.senderName}:</p>
                    <p className="truncate text-[11px] mt-0.5">{pm.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      )}

      {/* MODAL: TẠO CUỘC TRÒ CHUYỆN MỚI TỪ DANH BẠ HỆ THỐNG */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-900">Tạo Cuộc Trò Chuyện Mới</h3>
                <p className="text-xs text-gray-500">Tra cứu danh bạ thực tế từ ERP PreSkool</p>
              </div>
              <button onClick={() => setShowNewChatModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            {/* Tab switch */}
            <div className="flex rounded-xl bg-gray-100 p-1 shrink-0 text-xs font-semibold">
              <button
                onClick={() => setNewChatTab('DIRECT')}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                  newChatTab === 'DIRECT' ? 'bg-white text-violet-700 shadow-xs' : 'text-gray-600'
                }`}
              >
                Nhắn Tin Cá Nhân (1-1)
              </button>
              <button
                onClick={() => setNewChatTab('GROUP')}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                  newChatTab === 'GROUP' ? 'bg-white text-violet-700 shadow-xs' : 'text-gray-600'
                }`}
              >
                Tạo Nhóm Trò Chuyện (Group Chat)
              </button>
            </div>

            {/* TAB 1: 1-1 DIRECT CHAT SEARCH */}
            {newChatTab === 'DIRECT' && (
              <div className="flex-1 flex flex-col space-y-3 min-h-0">
                <div className="relative shrink-0">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo họ tên, email, mã SV/GV..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-8 pr-3 py-2 text-xs outline-none focus:border-violet-500 focus:bg-white"
                  />
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                  {searchableUsers.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400">
                      Không tìm thấy người dùng nào phù hợp.
                    </div>
                  ) : (
                    searchableUsers.map((u) => {
                      const pStatus = presenceMap[u.id] || u.presence || 'OFFLINE';
                      return (
                        <div
                          key={u.id}
                          onClick={() => handleStartDirectWithUser(u)}
                          className="p-2.5 flex items-center justify-between hover:bg-violet-50 rounded-xl cursor-pointer transition"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div className="relative">
                              <div className="h-8 w-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs">
                                {u.fullName.charAt(0)}
                              </div>
                              <span
                                className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ring-2 ring-white ${getPresenceColor(
                                  pStatus
                                )}`}
                              />
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold text-gray-900 truncate">{u.fullName}</p>
                              <p className="text-[10px] text-gray-400 truncate font-mono">
                                {u.email || u.studentCode || u.teacherCode}
                              </p>
                            </div>
                          </div>

                          <span className="rounded bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 shrink-0">
                            {u.role}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: GROUP CHAT CREATION */}
            {newChatTab === 'GROUP' && (
              <form onSubmit={handleCreateGroupChat} className="flex-1 flex flex-col space-y-3 min-h-0 text-xs">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Tên Nhóm Trò Chuyện *</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nhóm Đồ Án Chuyên Ngành..."
                    value={groupNameInput}
                    onChange={(e) => setGroupNameInput(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2 text-xs outline-none focus:border-violet-500"
                    required
                  />
                </div>

                {/* Selected members chips */}
                {selectedGroupMembers.length > 0 && (
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      Thành Viên Đã Chọn ({selectedGroupMembers.length}):
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-1 bg-gray-50 rounded-xl">
                      {selectedGroupMembers.map((m) => (
                        <span
                          key={m.id}
                          className="flex items-center gap-1 rounded-lg bg-violet-100 text-violet-800 text-[11px] font-semibold px-2 py-0.5"
                        >
                          <span>{m.fullName}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedGroupMembers((prev) => prev.filter((i) => i.id !== m.id))
                            }
                            className="text-violet-600 hover:text-violet-900 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search members */}
                <div className="relative shrink-0">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm thêm thành viên vào nhóm..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-8 pr-3 py-1.5 text-xs outline-none focus:border-violet-500"
                  />
                </div>

                {/* Users to add list */}
                <div className="flex-1 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-xl p-1">
                  {searchableUsers.map((u) => {
                    const isSelected = selectedGroupMembers.some((m) => m.id === u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedGroupMembers((prev) => prev.filter((i) => i.id !== u.id));
                          } else {
                            setSelectedGroupMembers((prev) => [...prev, u]);
                          }
                        }}
                        className={`p-2 flex items-center justify-between rounded-lg cursor-pointer transition ${
                          isSelected ? 'bg-violet-50 text-violet-900 font-bold' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className="h-6 w-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[10px] font-bold">
                            {u.fullName.charAt(0)}
                          </div>
                          <span className="text-xs truncate">{u.fullName}</span>
                        </div>
                        {isSelected ? (
                          <Check className="h-4 w-4 text-violet-600" />
                        ) : (
                          <Plus className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowNewChatModal(false)}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={!groupNameInput.trim() || selectedGroupMembers.length === 0}
                    className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50 transition cursor-pointer"
                  >
                    Tạo Nhóm ({selectedGroupMembers.length})
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: GỬI ĐOẠN MÃ CODE */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Chia Sẻ Đoạn Mã Nguồn (Code Snippet)</h3>
            <select
              value={codeLanguage}
              onChange={(e) => setCodeLanguage(e.target.value)}
              className="w-full rounded-xl border border-gray-200 p-2 text-xs outline-none"
            >
              <option value="typescript">TypeScript</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="sql">SQL</option>
              <option value="json">JSON</option>
            </select>
            <textarea
              rows={8}
              placeholder="// Nhập mã nguồn ở đây..."
              value={codeContent}
              onChange={(e) => setCodeContent(e.target.value)}
              className="w-full rounded-xl border border-gray-200 p-3 text-xs font-mono outline-none bg-gray-50 focus:bg-white"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSendCode}
                className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700"
              >
                Gửi Đoạn Mã
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ĐÍNH KÈM TỆP / LINK */}
      {showAttachModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Đính Kèm Liên Kết / Tài Liệu</h3>
            <input
              type="text"
              placeholder="Tên tệp hoặc tiêu đề liên kết..."
              value={attachName}
              onChange={(e) => setAttachName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 p-2 text-xs outline-none"
            />
            <input
              type="text"
              placeholder="https://storage.preskool.edu.vn/... hoặc URL"
              value={attachUrl}
              onChange={(e) => setAttachUrl(e.target.value)}
              className="w-full rounded-xl border border-gray-200 p-2 text-xs font-mono outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAttachModal(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSendAttachment}
                className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700"
              >
                Gửi Tệp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsDirectChat;
