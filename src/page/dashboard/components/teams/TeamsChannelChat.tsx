import React, { useState, useEffect, useRef } from 'react';
import {
  teamsService,
  type TeamData,
  type TeamChannel,
  type ChatMessage,
  type ChannelFileItem,
  type ChannelTask,
  type TaskStatus,
  type TaskPriority,
} from '../../../../services/teams.service';
import { socketService } from '../../../../services/socket.service';
import {
  Hash,
  Lock,
  MessageSquare,
  FileText,
  Kanban,
  Send,
  Code,
  Pin,
  Plus,
  X,
  Copy,
  Check,
  Download,
  Video,
  Reply,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface TeamsChannelChatProps {
  team: TeamData;
  channel: TeamChannel;
  user: any;
  onStartMeeting?: (roomCode?: string, title?: string) => void;
}

export const TeamsChannelChat: React.FC<TeamsChannelChatProps> = ({
  team,
  channel,
  user,
  onStartMeeting,
}) => {
  const currentUserId = user?.id || '';
  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  // Tabs
  const [activeTab, setActiveTab] = useState<'posts' | 'files' | 'tasks'>('posts');

  // Channel key for consistent socket room
  const channelKey = channel.id;

  // Is Announcement channel (#general)
  const isAnnouncementOnly =
    channel.isGeneral ||
    channel.name.toLowerCase() === 'general' ||
    channel.displayName?.toLowerCase().includes('chung');

  // Messages state - starts EMPTY (No fake data!)
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // Code snippet modal
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeLang, setCodeLang] = useState('typescript');
  const [codeBody, setCodeBody] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Typing indicators state
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Files state - starts EMPTY (No fake data!)
  const [files, setFiles] = useState<ChannelFileItem[]>([]);
  const [showAddFileModal, setShowAddFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [newFileFolder, setNewFileFolder] = useState('Tài Liệu Chung');

  // Kanban Tasks state - starts EMPTY (No fake data!)
  const [tasks, setTasks] = useState<ChannelTask[]>([]);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('MEDIUM');
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('TODO');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  // ============================================================
  // LOAD CHANNEL DATA & REAL-TIME SOCKET SUBSCRIPTION
  // ============================================================
  useEffect(() => {
    // Join Socket.IO channel room
    socketService.emit('join_channel', channelKey);

    // 1. Fetch Channel Messages
    teamsService
      .getChannelMessages(channel.id)
      .then((res: any) => {
        if (res.data?.data && Array.isArray(res.data.data)) {
          setMessages(res.data.data);
        }
      })
      .catch(() => {
        // Clear previous channel messages if error/empty
        setMessages([]);
      });

    // 2. Fetch Channel Files
    teamsService
      .getChannelFiles(channel.id)
      .then((res: any) => {
        if (res.data?.data && Array.isArray(res.data.data)) {
          setFiles(res.data.data);
        }
      })
      .catch(() => setFiles([]));

    // 3. Fetch Channel Kanban Tasks
    teamsService
      .getChannelTasks(channel.id)
      .then((res: any) => {
        const raw = res.data?.data;
        if (Array.isArray(raw)) {
          setTasks(raw);
        } else if (raw && typeof raw === 'object') {
          const flattened = Object.values(raw).flat() as ChannelTask[];
          setTasks(flattened);
        }
      })
      .catch(() => setTasks([]));

    // Listen for new channel messages
    const handleNewMessage = (msg: ChatMessage) => {
      if (msg.channelId === channel.id || msg.channelId === channelKey) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    // Listen for channel typing
    const handleUserTyping = (data: { channelId?: string; userId: string; userName: string; isTyping: boolean }) => {
      if (data.channelId && data.channelId !== channelKey && data.channelId !== channel.id) return;
      if (data.userId !== currentUserId) {
        setTypingUsers((prev) => {
          const copy = { ...prev };
          if (data.isTyping) {
            copy[data.userId] = data.userName;
          } else {
            delete copy[data.userId];
          }
          return copy;
        });
      }
    };

    socketService.on('new_channel_message', handleNewMessage);
    socketService.on('user_typing', handleUserTyping);

    return () => {
      socketService.emit('leave_channel', channelKey);
      socketService.off('new_channel_message', handleNewMessage);
      socketService.off('user_typing', handleUserTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [channelKey, channel.id, currentUserId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputMessage(val);

    // Emit user is typing
    socketService.emit('user_typing', {
      channelId: channelKey,
      userId: currentUserId,
      userName: user?.fullName || user?.username || 'Bạn',
      isTyping: true,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketService.emit('user_typing', {
        channelId: channelKey,
        userId: currentUserId,
        userName: user?.fullName || user?.username || 'Bạn',
        isTyping: false,
      });
    }, 1500);
  };

  // Send Channel Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() && !codeBody.trim()) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketService.emit('user_typing', {
      channelId: channelKey,
      userId: currentUserId,
      userName: user?.fullName || user?.username || 'Bạn',
      isTyping: false,
    });

    // Check announcement permission
    if (isAnnouncementOnly && !isTeacherOrAdmin && !replyingTo) {
      alert('Kênh Chung (#General) chỉ dành cho Giảng viên đăng thông báo chính thức. Sinh viên vui lòng bấm "Trả lời (Reply)" vào thông báo hiện có hoặc chuyển sang kênh #Q&A.');
      return;
    }

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      channelId: channelKey,
      senderId: currentUserId,
      senderName: user?.fullName || user?.username || 'Bạn',
      senderRole: user?.role || 'STUDENT',
      content: inputMessage.trim(),
      codeSnippet: codeBody.trim() ? { language: codeLang, code: codeBody } : undefined,
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

    // Emit to Socket.IO
    socketService.emit('channel_message', {
      channelId: channelKey,
      message: newMsg,
    });

    // Save to DB
    teamsService
      .sendChannelMessage(channel.id, {
        content: newMsg.content,
        codeSnippet: newMsg.codeSnippet,
        replyToId: newMsg.replyToId,
      })
      .catch(() => {});

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
    setCodeBody('');
    setShowCodeInput(false);
    setReplyingTo(null);
  };

  // Channel Meet Now action
  const handleMeetNowInChannel = () => {
    const roomCode = `meet-${channelKey.substring(0, 8)}-${Math.random().toString(36).substring(2, 6)}`;

    // Emit meeting invitation card into channel
    const meetCardMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      channelId: channelKey,
      senderId: currentUserId,
      senderName: user?.fullName || 'Giảng viên',
      senderRole: user?.role,
      content: `📢 Đã bắt đầu phiên họp trực tuyến trong kênh ${channel.displayName || channel.name}!`,
      attachments: [
        {
          name: `Tham gia phòng họp: ${roomCode}`,
          url: `https://meet.preskool.edu.vn/room/${roomCode}`,
          type: 'MEETING_CARD',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    socketService.emit('channel_message', {
      channelId: channelKey,
      message: meetCardMsg,
    });

    setMessages((prev) => [...prev, meetCardMsg]);
    onStartMeeting?.(roomCode, meetCardMsg.content);
  };

  // Toggle reaction on channel message
  const handleReaction = (msgId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => {
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
      })
    );
  };

  // Add File
  const handleAddFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const fileItem: ChannelFileItem = {
      id: `f-${Date.now()}`,
      name: newFileName.trim(),
      url: newFileUrl.trim() || 'https://storage.preskool.edu.vn/materials/tailieu.pdf',
      folder: newFileFolder,
      uploadedBy: user?.fullName || 'Bạn',
      uploadedAt: new Date().toISOString(),
      size: 1024000,
    };

    teamsService
      .registerChannelFile(channel.id, {
        name: fileItem.name,
        url: fileItem.url,
        folder: fileItem.folder,
      })
      .catch(() => {});

    setFiles((prev) => [fileItem, ...prev]);
    setNewFileName('');
    setNewFileUrl('');
    setShowAddFileModal(false);
  };

  // Add Kanban Task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const taskItem: ChannelTask = {
      id: `task-${Date.now()}`,
      channelId: channel.id,
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim(),
      status: newTaskStatus,
      priority: newTaskPriority,
      assigneeName: user?.fullName || 'Chưa gán',
      dueDate: newTaskDueDate || undefined,
      createdAt: new Date().toISOString(),
    };

    teamsService
      .createChannelTask(channel.id, {
        title: taskItem.title,
        description: taskItem.description,
        status: taskItem.status,
        priority: taskItem.priority,
        dueDate: taskItem.dueDate,
      })
      .catch(() => {});

    setTasks((prev) => [taskItem, ...prev]);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setShowAddTaskModal(false);
  };

  // Move task status
  const handleMoveTaskStatus = (taskId: string, nextStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
    );
    teamsService.updateTask(taskId, { status: nextStatus }).catch(() => {});
  };

  // Copy code helper
  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden select-none">
      {/* 1. CHANNEL HEADER */}
      <header className="h-16 shrink-0 border-b border-gray-200 bg-white px-6 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            {channel.type === 'PRIVATE' ? <Lock className="h-5 w-5" /> : <Hash className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900 leading-tight">
                {channel.displayName || channel.name}
              </h3>
              {channel.type === 'PRIVATE' ? (
                <span className="rounded bg-gray-100 text-gray-600 px-1.5 py-0.5 text-[10px] font-bold">
                  Riêng tư
                </span>
              ) : isAnnouncementOnly ? (
                <span className="rounded bg-amber-100 text-amber-800 px-1.5 py-0.5 text-[10px] font-bold">
                  Thông báo
                </span>
              ) : null}
            </div>
            <p className="text-[11px] text-gray-500 truncate max-w-md">
              {channel.description || `Kênh trao đổi trong nhóm ${team.name}`}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Channel Meet Now Button */}
          <button
            onClick={handleMeetNowInChannel}
            className="flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition cursor-pointer"
          >
            <Video className="h-4 w-4" />
            <span>Họp Trong Kênh</span>
          </button>
        </div>
      </header>

      {/* 2. TAB NAVIGATION (BÀI ĐĂNG / TỆP / KANBAN) */}
      <div className="h-11 shrink-0 border-b border-gray-200 bg-white px-6 flex items-center gap-6 text-xs font-bold text-gray-600">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 h-full border-b-2 transition cursor-pointer ${
            activeTab === 'posts' ? 'border-violet-600 text-violet-700 font-extrabold' : 'border-transparent hover:text-gray-900'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Bài Đăng & Thảo Luận</span>
          <span className="rounded-full bg-gray-100 px-1.5 py-0.2 text-[10px]">{messages.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('files')}
          className={`flex items-center gap-2 h-full border-b-2 transition cursor-pointer ${
            activeTab === 'files' ? 'border-violet-600 text-violet-700 font-extrabold' : 'border-transparent hover:text-gray-900'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Tệp Tài Liệu</span>
          <span className="rounded-full bg-gray-100 px-1.5 py-0.2 text-[10px]">{files.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 h-full border-b-2 transition cursor-pointer ${
            activeTab === 'tasks' ? 'border-violet-600 text-violet-700 font-extrabold' : 'border-transparent hover:text-gray-900'
          }`}
        >
          <Kanban className="h-4 w-4" />
          <span>Công Việc (Kanban)</span>
          <span className="rounded-full bg-gray-100 px-1.5 py-0.2 text-[10px]">{tasks.length}</span>
        </button>
      </div>

      {/* 3. TAB 1: BÀI ĐĂNG (POSTS) */}
      {activeTab === 'posts' && (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#fbfbfe]">
          {/* Messages feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-16 text-xs text-gray-400">
                <MessageSquare className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                <h4 className="font-bold text-gray-700 text-sm">Chưa có bài đăng nào trong kênh này</h4>
                <p className="text-[11px] text-gray-500 mt-1">
                  Hãy bắt đầu cuộc thảo luận đầu tiên để kết nối với lớp học!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                return (
                  <div
                    key={msg.id}
                    className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs hover:shadow-xs transition space-y-2 group"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-bold text-xs">
                          {msg.senderName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">{msg.senderName}</span>
                            {msg.senderRole && (
                              <span
                                className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                                  msg.senderRole === 'TEACHER'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-indigo-50 text-indigo-700'
                                }`}
                              >
                                {msg.senderRole}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {new Date(msg.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                      </div>

                      {msg.isPinned && (
                        <span className="flex items-center gap-1 rounded bg-amber-50 text-amber-700 px-2 py-0.5 text-[10px] font-bold">
                          <Pin className="h-3 w-3" /> Đã ghim
                        </span>
                      )}
                    </div>

                    {/* Replying quote */}
                    {msg.replyToMessage && (
                      <div className="border-l-2 border-violet-500 bg-gray-50 px-3 py-1.5 rounded-r-lg text-xs text-gray-600">
                        <span className="font-bold text-gray-800">{msg.replyToMessage.senderName}: </span>
                        <span>{msg.replyToMessage.content}</span>
                      </div>
                    )}

                    {/* Content */}
                    <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                    {/* Code snippet block */}
                    {msg.codeSnippet && (
                      <div className="relative rounded-xl bg-gray-900 text-gray-100 p-3.5 font-mono text-xs overflow-x-auto shadow-inner">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800 text-[10px] text-violet-400 uppercase font-bold">
                          <span>{msg.codeSnippet.language}</span>
                          <button
                            onClick={() => handleCopyCode(msg.id, msg.codeSnippet!.code)}
                            className="flex items-center gap-1 text-gray-400 hover:text-white transition cursor-pointer"
                          >
                            {copiedCodeId === msg.id ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-400" />
                                <span className="text-emerald-400">Đã chép</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Sao chép</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="whitespace-pre">{msg.codeSnippet.code}</pre>
                      </div>
                    )}

                    {/* Attachments / Meeting Card */}
                    {msg.attachments?.map((att, idx) => (
                      <div key={idx} className="mt-2">
                        {att.type === 'MEETING_CARD' ? (
                          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-emerald-950 flex items-center justify-between gap-3 shadow-2xs">
                            <div>
                              <p className="font-bold text-xs flex items-center gap-1.5 text-emerald-900">
                                <Video className="h-4 w-4 text-emerald-600" />
                                {att.name}
                              </p>
                              <p className="text-[10px] text-emerald-700 mt-0.5">
                                Cuộc họp trực tuyến trong kênh
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                const code = att.url.replace(/^https?:\/\/.*\/room\//, '');
                                onStartMeeting?.(code, att.name);
                              }}
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white transition cursor-pointer shrink-0"
                            >
                              Tham Gia Phòng Họp
                            </button>
                          </div>
                        ) : (
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-violet-700 hover:bg-violet-50 transition font-medium"
                          >
                            <ExternalLink className="h-4 w-4 shrink-0" />
                            <span>{att.name}</span>
                          </a>
                        )}
                      </div>
                    ))}

                    {/* Reactions & Reply button bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {['👍', '❤️', '😂', '😮', '🎉'].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(msg.id, emoji)}
                            className="rounded-full bg-gray-50 hover:bg-gray-100 px-2 py-0.5 text-xs cursor-pointer transition hover:scale-110"
                          >
                            {emoji}
                          </button>
                        ))}

                        {msg.reactions?.map((r, i) => (
                          <span
                            key={i}
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              r.hasReacted ? 'bg-violet-100 text-violet-800' : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {r.reaction} {r.count}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => setReplyingTo(msg)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:underline cursor-pointer"
                      >
                        <Reply className="h-3.5 w-3.5" />
                        <span>Trả Lời</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing indicator */}
            {Object.keys(typingUsers).length > 0 && (
              <div className="flex items-center gap-1.5 pb-2 text-[11px] italic text-violet-600 animate-pulse">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-500"></span>
                <span>{Object.values(typingUsers).join(', ')} đang soạn tin nhắn trong kênh...</span>
              </div>
            )}
          </div>

          {/* Replying banner */}
          {replyingTo && (
            <div className="bg-violet-50 px-6 py-2 border-t border-violet-100 flex items-center justify-between text-xs text-violet-900">
              <div className="truncate">
                <span className="font-bold">Đang trả lời {replyingTo.senderName}: </span>
                <span className="text-violet-700 italic">{replyingTo.content}</span>
              </div>
              <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Announcement Lock Banner for Students */}
          {isAnnouncementOnly && !isTeacherOrAdmin && !replyingTo ? (
            <div className="p-4 bg-amber-50 border-t border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                Kênh Chung (#General) chỉ dành cho Giảng viên đăng thông báo chính thức. Sinh viên vui lòng bấm "Trả lời (Reply)" vào các thông báo hiện có hoặc chuyển sang kênh #Q&A.
              </span>
            </div>
          ) : (
            /* Composer */
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white space-y-2">
              {showCodeInput && (
                <div className="rounded-xl border border-gray-200 p-3 bg-gray-50 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-700">Chèn Đoạn Mã Nguồn</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={codeLang}
                        onChange={(e) => setCodeLang(e.target.value)}
                        className="rounded-lg border border-gray-200 bg-white p-1 text-xs"
                      >
                        <option value="typescript">TypeScript</option>
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="sql">SQL</option>
                        <option value="json">JSON</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowCodeInput(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="// Nhập mã nguồn..."
                    value={codeBody}
                    onChange={(e) => setCodeBody(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2 text-xs font-mono outline-none bg-white"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCodeInput(!showCodeInput)}
                  className={`p-2 rounded-xl transition ${
                    showCodeInput ? 'bg-violet-100 text-violet-700' : 'text-gray-400 hover:bg-gray-100'
                  }`}
                  title="Chèn mã code"
                >
                  <Code className="h-4 w-4" />
                </button>

                <input
                  type="text"
                  placeholder={
                    replyingTo
                      ? `Trả lời ${replyingTo.senderName}...`
                      : `Đăng bài viết mới trong kênh #${channel.name}...`
                  }
                  value={inputMessage}
                  onChange={handleInputChange}
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-2.5 text-xs text-gray-800 outline-none transition focus:border-violet-500 focus:bg-white"
                />

                <button
                  type="submit"
                  disabled={!inputMessage.trim() && !codeBody.trim()}
                  className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50 transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Send className="h-4 w-4" />
                  <span>Đăng</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 4. TAB 2: TỆP TÀI LIỆU (FILES) */}
      {activeTab === 'files' && (
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Tài Liệu Đã Chia Sẻ Trong Kênh
            </h4>
            <button
              onClick={() => setShowAddFileModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-violet-700 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tải Lên Tệp Mới</span>
            </button>
          </div>

          {files.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-2xl bg-white">
              <FileText className="h-8 w-8 mx-auto text-gray-300 mb-2" />
              <p className="font-semibold text-gray-700">Chưa có tệp nào được chia sẻ trong kênh này</p>
              <p className="text-[11px] text-gray-400 mt-1">
                Bấm "Tải Lên Tệp Mới" để chia sẻ slide, đề cương hoặc tài liệu môn học.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-2xs divide-y divide-gray-100">
              {files.map((file) => (
                <div key={file.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-gray-900">{file.name}</h5>
                      <p className="text-[10px] text-gray-400">
                        {file.folder} • Tải lên bởi {file.uploadedBy} • {new Date(file.uploadedAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
                  >
                    <Download className="h-3.5 w-3.5 text-violet-600" />
                    <span>Tải về</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 3: KANBAN BOARD (TASKS) */}
      {activeTab === 'tasks' && (
        <div className="flex-1 p-6 overflow-x-auto overflow-y-hidden flex flex-col space-y-4">
          <div className="flex items-center justify-between shrink-0">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Bảng Tiến Độ & Phân Công Nhiệm Vụ (Kanban)
            </h4>
            <button
              onClick={() => setShowAddTaskModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-violet-700 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm Công Việc Mới</span>
            </button>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 min-h-0">
            {(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'] as TaskStatus[]).map((colStatus) => {
              const colTasks = tasks.filter((t) => t.status === colStatus);
              const colTitle =
                colStatus === 'TODO'
                  ? 'Cần làm (To-Do)'
                  : colStatus === 'IN_PROGRESS'
                  ? 'Đang thực hiện'
                  : colStatus === 'REVIEW'
                  ? 'Chờ duyệt'
                  : 'Đã hoàn thành';

              return (
                <div
                  key={colStatus}
                  className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3 flex flex-col space-y-3 overflow-y-auto"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">{colTitle}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-gray-600 border border-gray-200">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {colTasks.length === 0 ? (
                      <p className="text-[11px] text-gray-400 italic text-center py-6">Trống</p>
                    ) : (
                      colTasks.map((task) => (
                        <div
                          key={task.id}
                          className="rounded-xl border border-gray-200 bg-white p-3 shadow-2xs space-y-2"
                        >
                          <h6 className="text-xs font-bold text-gray-900 leading-snug">{task.title}</h6>
                          {task.description && (
                            <p className="text-[11px] text-gray-500 line-clamp-2">{task.description}</p>
                          )}
                          <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-100">
                            <span className="font-semibold text-violet-700">{task.assigneeName}</span>
                            {task.dueDate && <span>Hạn: {task.dueDate}</span>}
                          </div>

                          {/* Quick Move Status */}
                          <div className="flex items-center gap-1 pt-1">
                            {colStatus !== 'TODO' && (
                              <button
                                onClick={() => handleMoveTaskStatus(task.id, 'TODO')}
                                className="text-[9px] text-gray-500 hover:underline"
                              >
                                ← Cần làm
                              </button>
                            )}
                            {colStatus !== 'IN_PROGRESS' && (
                              <button
                                onClick={() => handleMoveTaskStatus(task.id, 'IN_PROGRESS')}
                                className="text-[9px] text-indigo-600 hover:underline"
                              >
                                Đang làm
                              </button>
                            )}
                            {colStatus !== 'DONE' && (
                              <button
                                onClick={() => handleMoveTaskStatus(task.id, 'DONE')}
                                className="text-[9px] text-emerald-600 hover:underline"
                              >
                                Hoàn thành →
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: THÊM TỆP MỚI */}
      {showAddFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Chia Sẻ Tệp Mới Vào Kênh</h3>
            <form onSubmit={handleAddFile} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Tên Tệp *</label>
                <input
                  type="text"
                  placeholder="Slide_Chuong1.pdf..."
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2 text-xs outline-none"
                  required
                />
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">URL Liên Kết Tệp</label>
                <input
                  type="text"
                  placeholder="https://storage.preskool.edu.vn/..."
                  value={newFileUrl}
                  onChange={(e) => setNewFileUrl(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2 text-xs font-mono outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Thư Mục Phân Loại</label>
                <select
                  value={newFileFolder}
                  onChange={(e) => setNewFileFolder(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2 text-xs outline-none"
                >
                  <option value="Tài Liệu Chung">Tài Liệu Chung</option>
                  <option value="Bài Giảng Slide">Bài Giảng Slide</option>
                  <option value="Bài Tập & Đồ Án">Bài Tập & Đồ Án</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFileModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 font-semibold text-gray-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 px-4 py-2 font-bold text-white hover:bg-violet-700"
                >
                  Thêm Tệp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: THÊM CÔNG VIỆC KANBAN */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Giao Việc / Thêm Nhiệm Vụ Mới</h3>
            <form onSubmit={handleAddTask} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Tiêu Đề Công Việc *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Thiết kế schema Prisma..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2 text-xs outline-none"
                  required
                />
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Mô Tả Chi Tiết</label>
                <textarea
                  rows={3}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2 text-xs outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Trạng Thái Ban Đầu</label>
                  <select
                    value={newTaskStatus}
                    onChange={(e: any) => setNewTaskStatus(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2 text-xs outline-none"
                  >
                    <option value="TODO">Cần làm (To-Do)</option>
                    <option value="IN_PROGRESS">Đang làm</option>
                    <option value="REVIEW">Chờ duyệt</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Mức Độ Ưu Tiên</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e: any) => setNewTaskPriority(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2 text-xs outline-none"
                  >
                    <option value="LOW">Thấp</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HIGH">Cao</option>
                    <option value="URGENT">Khẩn cấp</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Hạn Hoàn Thành</label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 font-semibold text-gray-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 px-4 py-2 font-bold text-white hover:bg-violet-700"
                >
                  Tạo Công Việc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsChannelChat;
