import React, { useState, useEffect } from 'react';
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
  Folder,
  Calendar,
  Video,
} from 'lucide-react';

interface TeamsChannelChatProps {
  team: TeamData;
  channel: TeamChannel;
  user: any;
  onStartMeeting?: () => void;
}

export const TeamsChannelChat: React.FC<TeamsChannelChatProps> = ({
  team,
  channel,
  user,
  onStartMeeting,
}) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'files' | 'tasks'>('posts');

  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      channelId: channel.id,
      senderId: 'teacher-1',
      senderName: 'TS. Nguyễn Văn Hùng',
      senderRole: 'TEACHER',
      content:
        'Chào cả lớp! Đây là kênh thảo luận chính thức của môn học. Tài liệu đề cương và slide tuần 1 đã được đăng tải trong tab Tệp.',
      isPinned: true,
      reactions: [{ reaction: '👍', count: 12, users: ['st-1', 'st-2'], hasReacted: true }],
      createdAt: '2026-11-01T08:30:00Z',
    },
    {
      id: 'msg-2',
      channelId: channel.id,
      senderId: 'st-01',
      senderName: 'Nguyễn Văn An',
      senderRole: 'STUDENT',
      content:
        'Thưa thầy, em đã cấu hình xong Prisma Client và tạo module Auth với JWT. Em gửi đoạn mã mẫu cho các bạn tham khảo ạ!',
      codeSnippet: {
        language: 'typescript',
        code: `// auth.service.ts
export async function generateToken(payload: UserPayload) {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '7d',
    algorithm: 'HS256'
  });
}`,
      },
      attachments: [
        {
          name: 'Prisma_Schema_Review.pdf',
          url: 'https://storage.preskool.edu.vn/teams/schema.pdf',
          size: 245000,
        },
      ],
      reactions: [
        { reaction: '❤️', count: 5, users: ['st-2'], hasReacted: false },
        { reaction: '🔥', count: 8, users: ['st-3'], hasReacted: true },
      ],
      createdAt: '2026-11-01T10:15:00Z',
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeLang, setCodeLang] = useState('typescript');
  const [codeBody, setCodeBody] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Files state
  const [files, setFiles] = useState<ChannelFileItem[]>([
    {
      id: 'f-1',
      name: 'DeCuong_ChiTiet_RESTful_API.pdf',
      url: 'https://storage.preskool.edu.vn/materials/de_cuong.pdf',
      folder: 'Tài Liệu Môn Học',
      size: 1540000,
      uploadedBy: 'TS. Nguyễn Văn Hùng',
      uploadedAt: '2026-10-30T09:00:00Z',
    },
    {
      id: 'f-2',
      name: 'Slide_Tuan1_Architecture.pptx',
      url: 'https://storage.preskool.edu.vn/materials/slide_week1.pptx',
      folder: 'Bài Giảng Slide',
      size: 4200000,
      uploadedBy: 'TS. Nguyễn Văn Hùng',
      uploadedAt: '2026-10-31T14:20:00Z',
    },
    {
      id: 'f-3',
      name: 'BaoCao_TienDo_Nhom1.pdf',
      url: 'https://storage.preskool.edu.vn/materials/report1.pdf',
      folder: 'Nộp Đồ Án',
      size: 890000,
      uploadedBy: 'Nguyễn Văn An',
      uploadedAt: '2026-11-01T16:00:00Z',
    },
  ]);

  const [showAddFileModal, setShowAddFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileFolder, setNewFileFolder] = useState('Tài Liệu Chung');

  // Tasks state (Kanban)
  const [tasks, setTasks] = useState<ChannelTask[]>([
    {
      id: 'task-1',
      channelId: channel.id,
      title: 'Thiết kế sơ đồ CSDL quan hệ 3NF',
      description: 'Hoàn thiện ERD gồm 12 bảng và tạo migration Prisma.',
      status: 'DONE',
      priority: 'HIGH',
      assigneeName: 'Nguyễn Văn An',
      dueDate: '2026-11-03',
    },
    {
      id: 'task-2',
      channelId: channel.id,
      title: 'Xây dựng API Xác thực JWT & Phân quyền RBAC',
      description: 'Viết guard kiểm tra role ADMIN, TEACHER, STUDENT.',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      assigneeName: 'Trần Thị Mai',
      dueDate: '2026-11-06',
    },
    {
      id: 'task-3',
      channelId: channel.id,
      title: 'Viết Unit Test & Tài liệu Swagger OpenAPI 3.0',
      description: 'Đảm bảo code coverage đạt trên 80%.',
      status: 'TODO',
      priority: 'MEDIUM',
      assigneeName: 'Lê Hoàng Nam',
      dueDate: '2026-11-10',
    },
    {
      id: 'task-4',
      channelId: channel.id,
      title: 'Kiểm thử tải đồng thời 500 requests với k6',
      description: 'Kiểm tra tốc độ phản hồi và connection pooling.',
      status: 'REVIEW',
      priority: 'HIGH',
      assigneeName: 'Phạm Minh Đức',
      dueDate: '2026-11-08',
    },
  ]);

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('MEDIUM');
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('TODO');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  // Load channel messages from API & listen for new messages via Socket.io
  useEffect(() => {
    socketService.emit('join_channel', channel.id);

    const loadMessages = async () => {
      try {
        const res = await teamsService.getChannelMessages(channel.id);
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setMessages(res.data);
        }
      } catch {
        // fallback
      }
    };

    loadMessages();

    const handleNewMessage = (msg: ChatMessage) => {
      if (msg.channelId === channel.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    socketService.on('new_channel_message', handleNewMessage);

    return () => {
      socketService.off('new_channel_message', handleNewMessage);
    };
  }, [channel.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() && !codeBody.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      channelId: channel.id,
      senderId: user?.id || 'current-user',
      senderName: user?.fullName || user?.username || 'Bạn',
      senderRole: user?.role || 'STUDENT',
      content: inputMessage,
      codeSnippet: codeBody.trim() ? { language: codeLang, code: codeBody } : undefined,
      reactions: [],
      createdAt: new Date().toISOString(),
    };

    try {
      await teamsService.sendChannelMessage(channel.id, {
        content: newMsg.content,
        codeSnippet: newMsg.codeSnippet,
      });
    } catch {
      // demo fallback
    }

    socketService.emit('channel_message', { channelId: channel.id, message: newMsg });
    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
    setCodeBody('');
    setShowCodeInput(false);
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId) {
          const reactions = m.reactions || [];
          const existing = reactions.find((r) => r.reaction === emoji);
          if (existing) {
            if (existing.hasReacted) {
              return {
                ...m,
                reactions: reactions
                  .map((r) =>
                    r.reaction === emoji ? { ...r, count: r.count - 1, hasReacted: false } : r
                  )
                  .filter((r) => r.count > 0),
              };
            } else {
              return {
                ...m,
                reactions: reactions.map((r) =>
                  r.reaction === emoji ? { ...r, count: r.count + 1, hasReacted: true } : r
                ),
              };
            }
          } else {
            return {
              ...m,
              reactions: [...reactions, { reaction: emoji, count: 1, users: ['me'], hasReacted: true }],
            };
          }
        }
        return m;
      })
    );

    try {
      await teamsService.reactMessage(messageId, emoji, true);
    } catch {
      // fallback
    }
  };

  const handleTogglePin = async (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isPinned: !m.isPinned } : m))
    );
    try {
      await teamsService.pinMessage(messageId, true, true);
    } catch {
      // fallback
    }
  };

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Add file
  const handleAddFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const newF: ChannelFileItem = {
      id: `f-${Date.now()}`,
      name: newFileName,
      url: 'https://storage.preskool.edu.vn/teams/' + newFileName,
      folder: newFileFolder,
      size: 1024000,
      uploadedBy: user?.fullName || 'Bạn',
      uploadedAt: new Date().toISOString(),
    };

    try {
      await teamsService.registerChannelFile(channel.id, {
        name: newF.name,
        url: newF.url,
        folder: newF.folder,
      });
    } catch {
      // fallback
    }

    setFiles((prev) => [newF, ...prev]);
    setNewFileName('');
    setShowAddFileModal(false);
  };

  // Move task status
  const handleMoveTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    try {
      await teamsService.updateTask(taskId, { status: newStatus });
    } catch {
      // fallback
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newT: ChannelTask = {
      id: `task-${Date.now()}`,
      channelId: channel.id,
      title: newTaskTitle,
      description: newTaskDesc,
      status: newTaskStatus,
      priority: newTaskPriority,
      assigneeName: newTaskAssignee || user?.fullName || 'Chưa gán',
      dueDate: newTaskDueDate || '2026-11-15',
    };

    try {
      await teamsService.createChannelTask(channel.id, newT);
    } catch {
      // fallback
    }

    setTasks((prev) => [...prev, newT]);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setShowAddTaskModal(false);
  };

  const pinnedMessages = messages.filter((m) => m.isPinned);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* 1. CHANNEL HEADER */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            {channel.type === 'PRIVATE' ? <Lock className="h-5 w-5" /> : <Hash className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">{channel.displayName}</h3>
              <span
                className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                  channel.type === 'PRIVATE'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {channel.type}
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              {team.name} • {channel.description || 'Không gian trao đổi trực tuyến'}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onStartMeeting}
            className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:from-violet-700 hover:to-indigo-700 transition shadow-xs cursor-pointer"
          >
            <Video className="h-4 w-4" />
            <span>Họp Nhanh (Meet Now)</span>
          </button>
        </div>
      </header>

      {/* 2. SUB-TABS (Posts / Files / Tasks) */}
      <div className="flex items-center gap-1 border-b border-gray-200 bg-white px-6">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-semibold transition cursor-pointer ${
            activeTab === 'posts'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Bài Đăng & Chat ({messages.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('files')}
          className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-semibold transition cursor-pointer ${
            activeTab === 'files'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Tệp Chung ({files.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-semibold transition cursor-pointer ${
            activeTab === 'tasks'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Kanban className="h-4 w-4" />
          <span>Bảng Công Việc Kanban ({tasks.length})</span>
        </button>
      </div>

      {/* 3. TAB CONTENT */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* POSTS TAB */}
        {activeTab === 'posts' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Pinned Messages Banner */}
            {pinnedMessages.length > 0 && (
              <div className="bg-amber-50/70 border-b border-amber-200/60 px-6 py-2 flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center gap-2 truncate">
                  <Pin className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                  <span className="font-bold">Đã ghim:</span>
                  <span className="truncate">{pinnedMessages[0].content}</span>
                </div>
                <span className="text-[10px] text-amber-700 font-semibold shrink-0">
                  {pinnedMessages.length} tin ghim
                </span>
              </div>
            )}

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-2xs hover:border-gray-300 transition space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                        {msg.senderName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900">{msg.senderName}</span>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                              msg.senderRole === 'TEACHER'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {msg.senderRole}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {new Date(msg.createdAt).toLocaleTimeString('vi-VN')} •{' '}
                          {new Date(msg.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleTogglePin(msg.id)}
                        className={`rounded-lg p-1 transition cursor-pointer ${
                          msg.isPinned ? 'text-amber-600 bg-amber-50' : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title="Ghim tin nhắn"
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Message Text */}
                  <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                  {/* Code Snippet Box */}
                  {msg.codeSnippet && (
                    <div className="rounded-xl border border-gray-800 bg-[#1e1e2e] text-gray-200 overflow-hidden text-xs">
                      <div className="flex items-center justify-between bg-[#181825] px-3.5 py-1.5 border-b border-gray-700 text-[11px] text-gray-400">
                        <span>{msg.codeSnippet.language}</span>
                        <button
                          onClick={() => copyCode(msg.id, msg.codeSnippet!.code)}
                          className="flex items-center gap-1 hover:text-white transition cursor-pointer"
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
                      <pre className="p-3.5 font-mono overflow-x-auto text-[11px] leading-relaxed">
                        {msg.codeSnippet.code}
                      </pre>
                    </div>
                  )}

                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {msg.attachments.map((att, aIdx) => (
                        <div
                          key={aIdx}
                          className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/70 p-2.5 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-violet-600" />
                            <span className="font-semibold text-gray-800">{att.name}</span>
                            {att.size && (
                              <span className="text-[10px] text-gray-400">
                                ({Math.round(att.size / 1024)} KB)
                              </span>
                            )}
                          </div>
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 border border-gray-200 text-[11px] font-semibold text-violet-700 hover:bg-violet-50 transition"
                          >
                            <Download className="h-3 w-3" />
                            Tải về
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reactions */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {msg.reactions?.map((r, rIdx) => (
                      <button
                        key={rIdx}
                        onClick={() => handleToggleReaction(msg.id, r.reaction)}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition cursor-pointer border ${
                          r.hasReacted
                            ? 'bg-violet-50 border-violet-200 text-violet-800 font-bold'
                            : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <span>{r.reaction}</span>
                        <span className="font-mono text-[10px]">{r.count}</span>
                      </button>
                    ))}

                    <div className="flex items-center gap-1">
                      {['👍', '❤️', '👏', '🎉', '🔥'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleToggleReaction(msg.id, emoji)}
                          className="text-xs hover:scale-125 transition cursor-pointer p-0.5"
                          title={`Thả ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Code Snippet Drawer */}
            {showCodeInput && (
              <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 flex items-center gap-1.5">
                    <Code className="h-4 w-4 text-violet-600" /> Chèn đoạn mã nguồn (Code Snippet)
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={codeLang}
                      onChange={(e) => setCodeLang(e.target.value)}
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] outline-none"
                    >
                      <option value="typescript">TypeScript</option>
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="sql">SQL / Prisma</option>
                      <option value="json">JSON</option>
                      <option value="html">HTML / CSS</option>
                    </select>
                    <button
                      onClick={() => setShowCodeInput(false)}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <textarea
                  rows={4}
                  value={codeBody}
                  onChange={(e) => setCodeBody(e.target.value)}
                  placeholder="Dán mã nguồn vào đây..."
                  className="w-full rounded-xl border border-gray-300 bg-white p-3 font-mono text-xs outline-none focus:border-violet-500"
                />
              </div>
            )}

            {/* Message Composer */}
            <form onSubmit={handleSendMessage} className="border-t border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCodeInput(!showCodeInput)}
                  className={`rounded-lg p-2 transition cursor-pointer ${
                    showCodeInput ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  title="Chèn đoạn mã"
                >
                  <Code className="h-4 w-4" />
                </button>

                <input
                  type="text"
                  placeholder={`Gửi tin nhắn vào #${channel.name}...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-2.5 text-xs text-gray-800 outline-none transition focus:border-violet-500 focus:bg-white"
                />

                <button
                  type="submit"
                  disabled={!inputMessage.trim() && !codeBody.trim()}
                  className="flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-700 transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* FILES TAB */}
        {activeTab === 'files' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-900">Kho Lưu Trữ Tệp Kênh #{channel.name}</h4>
                <p className="text-[11px] text-gray-500">Tài liệu, giáo trình và bài nộp đồ án</p>
              </div>

              <button
                onClick={() => setShowAddFileModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-violet-700 transition shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm Tệp Mới</span>
              </button>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Tên Tệp</th>
                    <th className="py-3 px-4">Thư Mục</th>
                    <th className="py-3 px-4">Người Đăng</th>
                    <th className="py-3 px-4">Ngày Cập Nhật</th>
                    <th className="py-3 px-4 text-right">Tải Về</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {files.map((file) => (
                    <tr key={file.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-semibold text-gray-900 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-violet-600" />
                        <span>{file.name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                          <Folder className="h-3 w-3 text-amber-500" />
                          {file.folder}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{file.uploadedBy}</td>
                      <td className="py-3 px-4 text-gray-400 font-mono">
                        {new Date(file.uploadedAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-50 transition"
                        >
                          <Download className="h-3 w-3" />
                          Tải
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* KANBAN TASKS TAB */}
        {activeTab === 'tasks' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-900">Bảng Quản Lý Công Việc Nhóm (Kanban)</h4>
                <p className="text-[11px] text-gray-500">Kéo thả và theo dõi tiến độ đồ án</p>
              </div>

              <button
                onClick={() => setShowAddTaskModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-violet-700 transition shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Tạo Task Mới</span>
              </button>
            </div>

            {/* 4 Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'] as TaskStatus[]).map((colStatus) => {
                const colTasks = tasks.filter((t) => t.status === colStatus);
                const colTitle =
                  colStatus === 'TODO'
                    ? 'Cần Làm (To Do)'
                    : colStatus === 'IN_PROGRESS'
                    ? 'Đang Làm (In Progress)'
                    : colStatus === 'REVIEW'
                    ? 'Chờ Duyệt (Review)'
                    : 'Hoàn Thành (Done)';
                const colColor =
                  colStatus === 'TODO'
                    ? 'border-t-gray-400'
                    : colStatus === 'IN_PROGRESS'
                    ? 'border-t-blue-500'
                    : colStatus === 'REVIEW'
                    ? 'border-t-amber-500'
                    : 'border-t-emerald-500';

                return (
                  <div
                    key={colStatus}
                    className={`rounded-2xl border border-gray-200 bg-gray-50/70 p-3.5 shadow-2xs border-t-4 ${colColor} space-y-3 flex flex-col`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs text-gray-800">
                      <span>{colTitle}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-gray-600 border border-gray-200">
                        {colTasks.length}
                      </span>
                    </div>

                    <div className="space-y-2.5 flex-1">
                      {colTasks.map((task) => (
                        <div
                          key={task.id}
                          className="rounded-xl border border-gray-200 bg-white p-3 shadow-2xs space-y-2 text-xs hover:border-violet-300 transition"
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                                task.priority === 'URGENT'
                                  ? 'bg-rose-100 text-rose-700'
                                  : task.priority === 'HIGH'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {task.priority}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {task.dueDate}
                            </span>
                          </div>

                          <h5 className="font-bold text-gray-900 leading-snug">{task.title}</h5>
                          {task.description && (
                            <p className="text-[11px] text-gray-500 line-clamp-2">{task.description}</p>
                          )}

                          <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[11px]">
                            <span className="font-semibold text-gray-700">{task.assigneeName}</span>

                            {/* Move state select */}
                            <select
                              value={task.status}
                              onChange={(e) => handleMoveTaskStatus(task.id, e.target.value as TaskStatus)}
                              className="rounded border border-gray-200 bg-gray-50 text-[10px] py-0.5 px-1 outline-none font-semibold text-violet-700"
                            >
                              <option value="TODO">To Do</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="REVIEW">Review</option>
                              <option value="DONE">Done</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Thêm Tệp Mới */}
      {showAddFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Tải Lên Tệp Tài Liệu Kênh</h3>
              <button
                onClick={() => setShowAddFileModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddFile} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Tên Tệp (Kèm đuôi .pdf, .docx...)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: BaoCao_DoAn_KTPM.pdf"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Thư Mục</label>
                <input
                  type="text"
                  value={newFileFolder}
                  onChange={(e) => setNewFileFolder(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFileModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 cursor-pointer"
                >
                  Lưu Tệp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Thêm Task Kanban Mới */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Tạo Công Việc Kanban Mới</h3>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Tiêu Đề Công Việc</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Thiết kế giao diện Dashboard..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Mô Tả Chi Tiết</label>
                <textarea
                  rows={2}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Độ Ưu Tiên</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e: any) => setNewTaskPriority(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2 outline-none"
                  >
                    <option value="LOW">Thấp (Low)</option>
                    <option value="MEDIUM">Trung bình (Medium)</option>
                    <option value="HIGH">Cao (High)</option>
                    <option value="URGENT">Khẩn cấp (Urgent)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Cột Ban Đầu</label>
                  <select
                    value={newTaskStatus}
                    onChange={(e: any) => setNewTaskStatus(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2 outline-none"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="REVIEW">Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Người Đảm Nhận</label>
                  <input
                    type="text"
                    placeholder="Họ tên sinh viên..."
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Hạn Chót (Due Date)</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 cursor-pointer"
                >
                  Tạo Task
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
