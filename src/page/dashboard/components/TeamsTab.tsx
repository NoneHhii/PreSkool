import React, { useState, useEffect } from 'react';
import {
  teamsService,
  type TeamData,
  type TeamChannel,
  type MeetingData,
  type PresenceStatus,
} from '../../../services/teams.service';
import { academicService, type Class } from '../../../services/academic.service';
import {
  Users,
  MessageSquare,
  Video,
  Calendar,
  Bell,
  Hash,
  Lock,
  Plus,
  RefreshCw,
  ChevronDown,
  X,
} from 'lucide-react';
import TeamsChannelChat from './teams/TeamsChannelChat';
import TeamsDirectChat from './teams/TeamsDirectChat';
import TeamsMeetingRoom from './teams/TeamsMeetingRoom';
import TeamsCalendarAppointments from './teams/TeamsCalendarAppointments';
import TeamsActivityFeed from './teams/TeamsActivityFeed';

type TeamsRailTab = 'activity' | 'chat' | 'teams' | 'meetings' | 'calendar';

export default function TeamsTab({ user }: { user: any }) {
  const isAdmin = user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';

  const [activeRail, setActiveRail] = useState<TeamsRailTab>('teams');
  const [presence, setPresence] = useState<PresenceStatus>('ONLINE');

  // Teams & Channels state
  const [teams, setTeams] = useState<TeamData[]>([
    {
      id: 'team-se101',
      name: 'Lớp SE101.N11 - Lập trình RESTful API & Backend',
      description: 'Không gian cộng tác học tập chính thức học kỳ 1 (2026-2027)',
      role: isTeacher ? 'OWNER' : 'MEMBER',
      channelsCount: 3,
      membersCount: 45,
      channels: [
        {
          id: 'ch-general',
          teamId: 'team-se101',
          name: 'General',
          displayName: '📢 Kênh Chung (Thông Báo)',
          description: 'Kênh thông báo chính thức từ Giảng viên',
          type: 'PUBLIC',
          isGeneral: true,
        },
        {
          id: 'ch-qa',
          teamId: 'team-se101',
          name: 'Q&A',
          displayName: '💬 Hỏi Đáp & Thảo Luận',
          description: 'Kênh trao đổi kiến thức tự do giữa sinh viên và giảng viên',
          type: 'PUBLIC',
        },
        {
          id: 'ch-grp-1',
          teamId: 'team-se101',
          name: 'nhom-1-ecommerce',
          displayName: '🔒 Nhóm 1 - Đề tài E-Commerce',
          description: 'Kênh thảo luận đồ án kín của Nhóm 1 (Đồng bộ từ LMS)',
          type: 'PRIVATE',
          assignmentGroupId: 'grp-1',
        },
      ],
    },
    {
      id: 'team-clb',
      name: 'CLB Lập Trình & Nghiên Cứu Khoa Học PreSkool',
      description: 'Sinh hoạt chuyên môn, chia sẻ công nghệ và hướng nghiệp',
      role: 'MEMBER',
      channelsCount: 2,
      membersCount: 68,
      channels: [
        {
          id: 'ch-clb-general',
          teamId: 'team-clb',
          name: 'Chung',
          displayName: '📢 Thông Báo CLB',
          type: 'PUBLIC',
        },
        {
          id: 'ch-clb-nckh',
          teamId: 'team-clb',
          name: 'NCKH-2026',
          displayName: '🔬 Đề Tài NCKH 2026',
          type: 'PUBLIC',
        },
      ],
    },
  ]);

  const [selectedTeamId, setSelectedTeamId] = useState<string>('team-se101');
  const [selectedChannelId, setSelectedChannelId] = useState<string>('ch-general');

  // Active Meeting state
  const [activeMeeting, setActiveMeeting] = useState<MeetingData | null>(null);

  // Modals state
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [erpClasses, setErpClasses] = useState<Class[]>([]);
  const [selectedClassToSync, setSelectedClassToSync] = useState('');
  const [syncing, setSyncing] = useState(false);

  const [showCustomTeamModal, setShowCustomTeamModal] = useState(false);
  const [customTeamName, setCustomTeamName] = useState('');
  const [customTeamDesc, setCustomTeamDesc] = useState('');

  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDisplayName, setNewChannelDisplayName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [newChannelDesc, setNewChannelDesc] = useState('');

  // Load ERP Classes for sync and load teams from API
  useEffect(() => {
    fetchTeams();
    fetchErpClasses();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await teamsService.getMyTeams();
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setTeams(res.data);
        setSelectedTeamId(res.data[0].id);
        if (res.data[0].channels && res.data[0].channels.length > 0) {
          setSelectedChannelId(res.data[0].channels[0].id);
        }
      }
    } catch {
      // fallback to initial state
    }
  };

  const fetchErpClasses = async () => {
    try {
      const res = await academicService.getClasses();
      const list = res.data || [];
      setErpClasses(list);
      if (list.length > 0) {
        setSelectedClassToSync(list[0].id);
      }
    } catch {
      // fallback
    }
  };

  const handlePresenceChange = async (newStatus: PresenceStatus) => {
    setPresence(newStatus);
    try {
      await teamsService.updatePresence(newStatus);
    } catch {
      // fallback
    }
  };

  // Sync Team from ERP
  const handleSyncFromErp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);

    try {
      await teamsService.syncTeamFromErp({ classId: selectedClassToSync });
    } catch {
      // fallback
    }

    const selectedCls = erpClasses.find((c) => c.id === selectedClassToSync);
    const newTeam: TeamData = {
      id: `team-${Date.now()}`,
      name: `Lớp ${selectedCls?.code || 'SE102'} - ${selectedCls?.course?.name || 'Môn Học'}`,
      description: 'Nhóm đồng bộ tự động từ Lớp học phần ERP',
      role: 'OWNER',
      membersCount: 45,
      channelsCount: 2,
      channels: [
        {
          id: `ch-gen-${Date.now()}`,
          teamId: `team-${Date.now()}`,
          name: 'General',
          displayName: '📢 Kênh Chung (Thông Báo)',
          type: 'PUBLIC',
          isGeneral: true,
        },
        {
          id: `ch-qa-${Date.now()}`,
          teamId: `team-${Date.now()}`,
          name: 'Q&A',
          displayName: '💬 Hỏi Đáp & Thảo Luận',
          type: 'PUBLIC',
        },
      ],
    };

    setTeams((prev) => [newTeam, ...prev]);
    setSelectedTeamId(newTeam.id);
    setSelectedChannelId(newTeam.channels![0].id);
    setSyncing(false);
    setShowSyncModal(false);
    alert('Đồng bộ Team từ ERP thành công! Đã tự động phân quyền Giảng viên làm OWNER và sinh viên làm MEMBER.');
  };

  // Create Custom Team
  const handleCreateCustomTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTeamName.trim()) return;

    const newTeam: TeamData = {
      id: `team-${Date.now()}`,
      name: customTeamName,
      description: customTeamDesc,
      role: 'OWNER',
      membersCount: 1,
      channelsCount: 1,
      channels: [
        {
          id: `ch-${Date.now()}`,
          teamId: `team-${Date.now()}`,
          name: 'General',
          displayName: '📢 Kênh Chung',
          type: 'PUBLIC',
        },
      ],
    };

    try {
      await teamsService.createCustomTeam({ name: customTeamName, description: customTeamDesc });
    } catch {
      // fallback
    }

    setTeams((prev) => [...prev, newTeam]);
    setSelectedTeamId(newTeam.id);
    setSelectedChannelId(newTeam.channels![0].id);
    setCustomTeamName('');
    setCustomTeamDesc('');
    setShowCustomTeamModal(false);
  };

  // Create Channel
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelDisplayName.trim()) return;

    const cleanName = newChannelName.trim()
      ? newChannelName.toLowerCase().replace(/\s+/g, '-')
      : newChannelDisplayName.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const newChan: TeamChannel = {
      id: `ch-${Date.now()}`,
      teamId: selectedTeamId,
      name: cleanName,
      displayName: newChannelDisplayName,
      description: newChannelDesc,
      type: newChannelType,
    };

    try {
      await teamsService.createChannel(selectedTeamId, {
        name: cleanName,
        displayName: newChannelDisplayName,
        description: newChannelDesc,
        type: newChannelType,
      });
    } catch {
      // fallback
    }

    setTeams((prev) =>
      prev.map((t) => (t.id === selectedTeamId ? { ...t, channels: [...(t.channels || []), newChan] } : t))
    );
    setSelectedChannelId(newChan.id);
    setNewChannelName('');
    setNewChannelDisplayName('');
    setNewChannelDesc('');
    setShowCreateChannelModal(false);
  };

  const handleStartInstantMeeting = (title?: string) => {
    setActiveMeeting({
      id: `meet-${Date.now()}`,
      title: title || 'Họp Trực Tuyến: ' + activeChannel?.displayName,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString(),
      roomCode: 'ROOM-' + Math.floor(1000 + Math.random() * 9000),
      isLive: true,
      hostName: user?.fullName || 'TS. Nguyễn Văn Hùng',
    });
  };

  const activeTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];
  const activeChannel =
    activeTeam?.channels?.find((c) => c.id === selectedChannelId) || activeTeam?.channels?.[0];

  const getPresenceBadge = (p: PresenceStatus) => {
    switch (p) {
      case 'ONLINE':
        return { label: 'Trực tuyến', color: 'bg-emerald-500' };
      case 'BUSY':
        return { label: 'Đang bận', color: 'bg-rose-500' };
      case 'IN_A_CALL':
        return { label: 'Trong cuộc gọi', color: 'bg-rose-500' };
      case 'AWAY':
        return { label: 'Vắng mặt', color: 'bg-amber-500' };
      default:
        return { label: 'Ngoại tuyến', color: 'bg-gray-400' };
    }
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col rounded-3xl border border-gray-200/90 bg-white shadow-xl overflow-hidden text-gray-800">
      {/* FULLSCREEN MEETING ROOM OVERLAY */}
      {activeMeeting && (
        <TeamsMeetingRoom
          meeting={activeMeeting}
          user={user}
          onLeave={() => setActiveMeeting(null)}
        />
      )}

      {/* TOP TEAMS HEADER */}
      <header className="h-14 shrink-0 border-b border-gray-200 bg-[#464775] px-4 text-white flex items-center justify-between shadow-xs select-none">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#464775] font-black text-sm shadow-2xs">
            T
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">PreSkool MS Teams</h2>
            <p className="text-[10px] text-violet-200">Không Gian Cộng Tác & Phòng Học Ảo Thời Gian Thực</p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          {/* Presence Dropdown */}
          <div className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">
            <span className={`h-2.5 w-2.5 rounded-full ${getPresenceBadge(presence).color}`} />
            <select
              value={presence}
              onChange={(e) => handlePresenceChange(e.target.value as PresenceStatus)}
              className="bg-transparent text-white text-xs outline-none cursor-pointer font-medium"
            >
              <option value="ONLINE" className="text-gray-900">Trực tuyến</option>
              <option value="BUSY" className="text-gray-900">Đang bận</option>
              <option value="IN_A_CALL" className="text-gray-900">Trong cuộc gọi</option>
              <option value="AWAY" className="text-gray-900">Vắng mặt</option>
              <option value="OFFLINE" className="text-gray-900">Ngoại tuyến</option>
            </select>
          </div>

          {/* Sync from ERP (Teacher/Admin only) */}
          {(isAdmin || isTeacher) && (
            <button
              onClick={() => setShowSyncModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25 transition cursor-pointer backdrop-blur-md"
              title="Đồng bộ Team từ Lớp Học Phần ERP"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Đồng Bộ ERP</span>
            </button>
          )}

          {/* Quick Meet */}
          <button
            onClick={() => handleStartInstantMeeting()}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-bold hover:bg-emerald-600 transition shadow-xs cursor-pointer"
          >
            <Video className="h-4 w-4" />
            <span>Họp Ngay</span>
          </button>
        </div>
      </header>

      {/* BODY WITH LEFT TEAMS APP RAIL */}
      <div className="flex-1 flex overflow-hidden">
        {/* 1. TEAMS APP RAIL (FAR LEFT) */}
        <nav className="w-16 shrink-0 border-r border-gray-200 bg-[#ebebeb] flex flex-col items-center py-4 space-y-4 select-none">
          <button
            onClick={() => setActiveRail('activity')}
            className={`flex flex-col items-center justify-center h-12 w-12 rounded-2xl transition cursor-pointer relative ${
              activeRail === 'activity' ? 'bg-white text-[#464775] shadow-xs font-bold' : 'text-gray-600 hover:bg-gray-200'
            }`}
            title="Hoạt động"
          >
            <Bell className="h-5 w-5" />
            <span className="text-[9px] mt-0.5">Hoạt động</span>
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500" />
          </button>

          <button
            onClick={() => setActiveRail('chat')}
            className={`flex flex-col items-center justify-center h-12 w-12 rounded-2xl transition cursor-pointer ${
              activeRail === 'chat' ? 'bg-white text-[#464775] shadow-xs font-bold' : 'text-gray-600 hover:bg-gray-200'
            }`}
            title="Trò chuyện 1-1"
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-[9px] mt-0.5">Chat</span>
          </button>

          <button
            onClick={() => setActiveRail('teams')}
            className={`flex flex-col items-center justify-center h-12 w-12 rounded-2xl transition cursor-pointer ${
              activeRail === 'teams' ? 'bg-white text-[#464775] shadow-xs font-bold' : 'text-gray-600 hover:bg-gray-200'
            }`}
            title="Nhóm & Kênh"
          >
            <Users className="h-5 w-5" />
            <span className="text-[9px] mt-0.5">Nhóm</span>
          </button>

          <button
            onClick={() => setActiveRail('calendar')}
            className={`flex flex-col items-center justify-center h-12 w-12 rounded-2xl transition cursor-pointer ${
              activeRail === 'calendar' ? 'bg-white text-[#464775] shadow-xs font-bold' : 'text-gray-600 hover:bg-gray-200'
            }`}
            title="Lịch & Tư vấn"
          >
            <Calendar className="h-5 w-5" />
            <span className="text-[9px] mt-0.5">Lịch</span>
          </button>
        </nav>

        {/* 2. TEAMS SUB-BAR (WHEN 'teams' RAIL IS ACTIVE) */}
        {activeRail === 'teams' && (
          <aside className="w-64 shrink-0 border-r border-gray-200 bg-[#f5f5f7] flex flex-col select-none">
            {/* Header with New Team button */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Danh Sách Nhóm</h3>
              <button
                onClick={() => setShowCustomTeamModal(true)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                title="Tạo Nhóm Mới"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Teams & Channels Accordion */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {teams.map((t) => {
                const isTeamActive = t.id === selectedTeamId;
                return (
                  <div key={t.id} className="space-y-1">
                    {/* Team Item Header */}
                    <div
                      onClick={() => setSelectedTeamId(t.id)}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition ${
                        isTeamActive ? 'bg-white shadow-2xs font-bold text-gray-900' : 'hover:bg-gray-200/60 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-800 text-xs font-bold">
                          {t.name.charAt(0)}
                        </div>
                        <span className="text-xs truncate">{t.name}</span>
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    </div>

                    {/* Channels List under this Team */}
                    {isTeamActive && (
                      <div className="pl-6 space-y-0.5 pt-1">
                        {t.channels?.map((chan) => {
                          const isChanActive = chan.id === selectedChannelId;
                          return (
                            <div
                              key={chan.id}
                              onClick={() => setSelectedChannelId(chan.id)}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition ${
                                isChanActive
                                  ? 'bg-violet-600 text-white font-bold shadow-2xs'
                                  : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                {chan.type === 'PRIVATE' ? (
                                  <Lock className="h-3.5 w-3.5 shrink-0" />
                                ) : (
                                  <Hash className="h-3.5 w-3.5 shrink-0" />
                                )}
                                <span className="truncate">{chan.name}</span>
                              </div>
                            </div>
                          );
                        })}

                        {/* Add Channel Button */}
                        <button
                          onClick={() => setShowCreateChannelModal(true)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-violet-700 hover:underline cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Tạo Kênh Mới</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* 3. MAIN WORKSPACE CONTENT */}
        <main className="flex-1 overflow-hidden bg-white flex flex-col">
          {activeRail === 'teams' && activeChannel && activeTeam && (
            <TeamsChannelChat
              team={activeTeam}
              channel={activeChannel}
              user={user}
              onStartMeeting={() => handleStartInstantMeeting()}
            />
          )}

          {activeRail === 'chat' && (
            <TeamsDirectChat
              user={user}
              onStartVideoCall={(name) => handleStartInstantMeeting(`Cuộc gọi Video với ${name}`)}
            />
          )}

          {activeRail === 'calendar' && (
            <div className="flex-1 overflow-y-auto p-6">
              <TeamsCalendarAppointments
                user={user}
                onJoinMeeting={(title) => handleStartInstantMeeting(title)}
              />
            </div>
          )}

          {activeRail === 'activity' && (
            <div className="flex-1 overflow-y-auto p-6">
              <TeamsActivityFeed
                onNavigateToMeeting={(title) => handleStartInstantMeeting(title)}
                onNavigateToChannel={() => setActiveRail('teams')}
              />
            </div>
          )}
        </main>
      </div>

      {/* MODAL: Đồng Bộ Team Từ ERP */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Đồng Bộ Team Từ ERP Đào Tạo</h3>
                <p className="text-xs text-gray-500">Khởi tạo nhóm lớp học phần và gán sinh viên tự động</p>
              </div>
              <button onClick={() => setShowSyncModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSyncFromErp} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Chọn Lớp Học Phần ERP</label>
                <select
                  value={selectedClassToSync}
                  onChange={(e) => setSelectedClassToSync(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-violet-500"
                >
                  {erpClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.code} - {cls.course?.name || 'Lớp Học Phần'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl bg-violet-50 border border-violet-200 p-3 text-violet-900 space-y-1">
                <p className="font-bold">Quy trình tự động hóa:</p>
                <ul className="text-[11px] list-disc list-inside space-y-0.5 text-violet-800">
                  <li>Tự động gán Giảng viên / Cố vấn làm <strong>OWNER</strong>.</li>
                  <li>Tự động gán toàn bộ sinh viên đã đăng ký làm <strong>MEMBER</strong>.</li>
                  <li>Khởi tạo sẵn 2 kênh: <code>#General</code> và <code>#Q&A</code>.</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSyncModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={syncing}
                  className="rounded-xl bg-violet-600 px-5 py-2 font-bold text-white hover:bg-violet-700 shadow-xs cursor-pointer"
                >
                  {syncing ? 'Đang Đồng Bộ...' : 'Bắt Đầu Đồng Bộ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Tạo Nhóm Tùy Chỉnh */}
      {showCustomTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Tạo Nhóm Mới (Custom Team)</h3>
              <button onClick={() => setShowCustomTeamModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomTeam} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Tên Nhóm</label>
                <input
                  type="text"
                  placeholder="Ví dụ: CLB Tin Học & Lập Trình..."
                  value={customTeamName}
                  onChange={(e) => setCustomTeamName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Mô Tả Mục Tiêu Nhóm</label>
                <textarea
                  rows={3}
                  value={customTeamDesc}
                  onChange={(e) => setCustomTeamDesc(e.target.value)}
                  placeholder="Mô tả ngắn về hoạt động nhóm..."
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomTeamModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 font-semibold text-gray-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 px-5 py-2 font-bold text-white hover:bg-violet-700"
                >
                  Tạo Nhóm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Tạo Kênh Mới */}
      {showCreateChannelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Tạo Kênh Mới Trong Nhóm</h3>
              <button onClick={() => setShowCreateChannelModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChannel} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Tên Hiển Thị Của Kênh</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 🔒 Nhóm 2 - Đề tài Quản lý Bệnh Viện..."
                  value={newChannelDisplayName}
                  onChange={(e) => setNewChannelDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Mã Định Danh Kênh (Slug)</label>
                <input
                  type="text"
                  placeholder="nhom-2-hospital (chữ thường, không dấu)"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Loại Kênh</label>
                <select
                  value={newChannelType}
                  onChange={(e: any) => setNewChannelType(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none"
                >
                  <option value="PUBLIC">Công khai (Mọi thành viên nhóm đều thấy)</option>
                  <option value="PRIVATE">Riêng tư (Chỉ thành viên được chỉ định/Nhóm đồ án LMS)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Mô Tả Kênh</label>
                <textarea
                  rows={2}
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateChannelModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 font-semibold text-gray-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 px-5 py-2 font-bold text-white hover:bg-violet-700"
                >
                  Tạo Kênh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
