import React, { useState, useEffect } from 'react';
import {
  teamsService,
  type TeamData,
  type TeamChannel,
  type MeetingData,
  type PresenceStatus,
  type DirectoryUser,
} from '../../../services/teams.service';
import { academicService, type Class, type HomeroomClass } from '../../../services/academic.service';
import { studentService } from '../../../services/student.service';
import { userService } from '../../../services/user.service';
import { socketService } from '../../../services/socket.service';
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
  AlertCircle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import TeamsChannelChat from './teams/TeamsChannelChat';
import TeamsDirectChat from './teams/TeamsDirectChat';
import TeamsMeetingRoom from './teams/TeamsMeetingRoom';
import TeamsMeetingsHub from './teams/TeamsMeetingsHub';
import TeamsCalendarAppointments from './teams/TeamsCalendarAppointments';
import TeamsActivityFeed from './teams/TeamsActivityFeed';

type TeamsRailTab = 'chat' | 'teams' | 'meetings' | 'activity';

export default function TeamsTab({ user }: { user: any }) {
  // Current user normalized with real UUID
  const [currentUser, setCurrentUser] = useState<any>(user);

  const isAdmin = currentUser?.role === 'ADMIN';
  const isTeacher = currentUser?.role === 'TEACHER';
  const isFacultyOrAdmin = isAdmin || isTeacher;

  // Rail & Navigation
  const [activeRail, setActiveRail] = useState<TeamsRailTab>('teams');
  const [activitySubTab, setActivitySubTab] = useState<'feed' | 'calendar'>('feed');

  // Real Socket.IO connection status
  const [socketConnected, setSocketConnected] = useState<boolean>(socketService.connected);
  const [presence, setPresence] = useState<PresenceStatus>('ONLINE');
  const [presenceMap, setPresenceMap] = useState<Record<string, PresenceStatus>>({});

  // Teams & Channels state - starts EMPTY (No fake data!)
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [loadingTeams, setLoadingTeams] = useState(false);

  // ERP Classes & Homerooms for sync
  const [erpClasses, setErpClasses] = useState<Class[]>([]);
  const [erpHomerooms, setErpHomerooms] = useState<HomeroomClass[]>([]);

  // Directory users for real-time contact & membership lookup
  const [directoryUsers, setDirectoryUsers] = useState<DirectoryUser[]>([]);

  // Active Video Meeting state
  const [activeMeeting, setActiveMeeting] = useState<MeetingData | null>(null);

  // Sync Modal
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncType, setSyncType] = useState<'CLASS' | 'HOMEROOM'>('CLASS');
  const [selectedClassToSync, setSelectedClassToSync] = useState('');
  const [selectedHomeroomToSync, setSelectedHomeroomToSync] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Custom Team Modal
  const [showCustomTeamModal, setShowCustomTeamModal] = useState(false);
  const [customTeamName, setCustomTeamName] = useState('');
  const [customTeamDesc, setCustomTeamDesc] = useState('');
  const [creatingCustomTeam, setCreatingCustomTeam] = useState(false);
  const [customTeamError, setCustomTeamError] = useState<string | null>(null);

  // Create Channel Modal
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDisplayName, setNewChannelDisplayName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [newChannelDesc, setNewChannelDesc] = useState('');

  // ============================================================
  // 1. INITIALIZE CURRENT USER & SOCKET.IO CONNECTION
  // ============================================================
  useEffect(() => {
    // 1. Ensure user has real UUID from /api/users/me
    userService
      .getMe()
      .then((res: any) => {
        if (res.data) {
          const u = res.data;
          setCurrentUser({
            id: u.id,
            username: u.username,
            email: u.email,
            role: u.role,
            fullName: u.profile?.fullName || user?.fullName || u.username,
            avatarUrl: u.profile?.avatarUrl,
            student: u.student,
            teacher: u.teacher,
          });
        }
      })
      .catch(() => {
        setCurrentUser(user);
      });

    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);
    const handleConnectError = () => setSocketConnected(false);

    const handlePresenceChange = (data: { userId: string; status: PresenceStatus }) => {
      if (data?.userId && data?.status) {
        setPresenceMap((prev) => ({
          ...prev,
          [data.userId]: data.status,
        }));
      }
    };

    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('connect_error', handleConnectError);
    socketService.on('presence_change', handlePresenceChange);

    // 2. Connect Socket.IO
    socketService.connect();
    if (socketService.connected) {
      setSocketConnected(true);
    }

    return () => {
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('connect_error', handleConnectError);
      socketService.off('presence_change', handlePresenceChange);
    };
  }, []);

  // Update own presence
  const handlePresenceChange = async (newStatus: PresenceStatus) => {
    setPresence(newStatus);
    socketService.emit('update_presence', { status: newStatus });
    try {
      await teamsService.updatePresence(newStatus);
    } catch {
      // ignore
    }
  };

  // Reconnect Socket.IO manually
  const handleManualReconnect = () => {
    socketService.connect();
  };

  // ============================================================
  // 2. LOAD TEAMS, CLASSES, HOMEROOMS & DIRECTORY USERS
  // ============================================================
  const buildTeamDataFromClass = async (cls: Class, rawTeam?: any): Promise<TeamData> => {
    const teamId = rawTeam?.id || `team-cls-${cls.id}`;

    // Build standard channels
    const channels: TeamChannel[] = [
      {
        id: `${teamId}_general`,
        teamId,
        name: 'general',
        displayName: '📢 Kênh Chung (Thông Báo)',
        description: 'Kênh thông báo chính thức của giảng viên',
        type: 'PUBLIC',
        isGeneral: true,
      },
      {
        id: `${teamId}_qa`,
        teamId,
        name: 'q-and-a',
        displayName: '💬 Hỏi Đáp & Thảo Luận',
        description: 'Kênh trao đổi tự do giữa sinh viên và giảng viên',
        type: 'PUBLIC',
      },
    ];

    // Fetch LMS assignment groups for this class if classId exists
    if (cls.id) {
      try {
        const grpRes = await teamsService.getAssignmentGroups(cls.id);
        if (grpRes.data?.data && Array.isArray(grpRes.data.data)) {
          grpRes.data.data.forEach((grp: any) => {
            channels.push({
              id: `${teamId}_grp_${grp.id}`,
              teamId,
              name: `nhom-${grp.groupNumber || grp.name}`,
              displayName: `🔒 Nhóm ${grp.groupNumber || ''}: ${grp.name}`,
              description: 'Kênh làm việc nhóm đồ án LMS',
              type: 'PRIVATE',
              assignmentGroupId: grp.id,
            });
          });
        }
      } catch {
        // ignore
      }
    }

    // Extract members
    const members: any[] = [];
    if (cls.teacher?.user) {
      members.push({
        id: cls.teacher.user.id,
        userId: cls.teacher.user.id,
        role: 'OWNER',
        fullName: cls.teacher.user.profile?.fullName || (cls.teacher as any)?.name || 'Giảng viên',
        avatarUrl: cls.teacher.user.profile?.avatarUrl,
        email: cls.teacher.user.email,
        teacherCode: cls.teacher.teacherCode,
      });
    } else if (currentUser) {
      members.push({
        id: currentUser.id,
        userId: currentUser.id,
        role: 'OWNER',
        fullName: currentUser.fullName || currentUser.username || 'Giảng viên',
        avatarUrl: currentUser.avatarUrl,
        email: currentUser.email,
      });
    }

    if (cls.students && Array.isArray(cls.students)) {
      cls.students.forEach((st) => {
        if (st.student?.user) {
          members.push({
            id: st.student.user.id,
            userId: st.student.user.id,
            role: 'MEMBER',
            fullName: st.student.user.profile?.fullName || (st.student as any)?.name || 'Sinh viên',
            avatarUrl: st.student.user.profile?.avatarUrl,
            email: st.student.user.email,
            studentCode: st.student.studentCode,
          });
        }
      });
    }

    const isOwner =
      cls.teacher?.user?.id === currentUser?.id ||
      !cls.teacher?.user?.id ||
      isFacultyOrAdmin;

    return {
      id: teamId,
      name: rawTeam?.name || `Lớp ${cls.code} - ${cls.course?.name || 'Học Phần'}`,
      description: rawTeam?.description || `Không gian làm việc lớp học phần ERP (${cls.course?.name || cls.code})`,
      classId: cls.id,
      role: isOwner ? 'OWNER' : 'MEMBER',
      channelsCount: channels.length,
      membersCount: members.length > 0 ? members.length : 1,
      channels,
      members,
    };
  };

  const buildTeamDataFromHomeroom = (hr: HomeroomClass, rawTeam?: any): TeamData => {
    const teamId = rawTeam?.id || `team-hr-${hr.id}`;
    const channels: TeamChannel[] = [
      {
        id: `${teamId}_general`,
        teamId,
        name: 'general',
        displayName: '📢 Kênh Chung (Thông Báo)',
        description: 'Kênh sinh hoạt lớp chủ nhiệm',
        type: 'PUBLIC',
        isGeneral: true,
      },
      {
        id: `${teamId}_qa`,
        teamId,
        name: 'q-and-a',
        displayName: '💬 Diễn Đàn Lớp',
        description: 'Trao đổi, thảo luận chung của lớp sinh hoạt',
        type: 'PUBLIC',
      },
    ];

    const members: any[] = [];
    if (hr.advisor?.user) {
      members.push({
        id: hr.advisor.user.id,
        userId: hr.advisor.user.id,
        role: 'OWNER',
        fullName: hr.advisor.user.profile?.fullName || 'Cố vấn học tập',
        avatarUrl: hr.advisor.user.profile?.avatarUrl,
        email: hr.advisor.user.email,
        teacherCode: hr.advisor.teacherCode,
      });
    } else if (currentUser) {
      members.push({
        id: currentUser.id,
        userId: currentUser.id,
        role: 'OWNER',
        fullName: currentUser.fullName || currentUser.username || 'Cố vấn',
        avatarUrl: currentUser.avatarUrl,
        email: currentUser.email,
      });
    }

    return {
      id: teamId,
      name: rawTeam?.name || `Lớp SH: ${hr.code} - ${hr.name}`,
      description: rawTeam?.description || 'Không gian lớp sinh hoạt / cố vấn học tập PreSkool Teams',
      homeroomClassId: hr.id,
      role: hr.advisor?.user?.id === currentUser?.id || isFacultyOrAdmin ? 'OWNER' : 'MEMBER',
      channelsCount: channels.length,
      membersCount: members.length > 0 ? members.length : 1,
      channels,
      members,
    };
  };

  const loadWorkspaceData = async () => {
    setLoadingTeams(true);

    let fetchedClasses: Class[] = [];
    let fetchedHomerooms: HomeroomClass[] = [];
    const dirMap = new Map<string, DirectoryUser>();

    // 1. Load Classes
    try {
      const clsRes = await academicService.getClasses();
      if (clsRes.data && Array.isArray(clsRes.data)) {
        fetchedClasses = clsRes.data;

        // Sort so classes with assigned teachers appear first
        fetchedClasses.sort((a, b) => {
          const hasA = Boolean(a.teacher?.user?.id);
          const hasB = Boolean(b.teacher?.user?.id);
          if (hasA && !hasB) return -1;
          if (!hasA && hasB) return 1;
          return 0;
        });

        setErpClasses(fetchedClasses);
        const firstWithTeacher = fetchedClasses.find((c) => Boolean(c.teacher?.user?.id)) || fetchedClasses[0];
        if (firstWithTeacher && !selectedClassToSync) {
          setSelectedClassToSync(firstWithTeacher.id);
        }

        // Extract teachers & students from classes into directory
        fetchedClasses.forEach((cls) => {
          if (cls.teacher?.user) {
            const tUser = cls.teacher.user;
            dirMap.set(tUser.id, {
              id: tUser.id,
              fullName: tUser.profile?.fullName || 'Giảng viên',
              email: tUser.email,
              avatarUrl: tUser.profile?.avatarUrl,
              role: 'TEACHER',
              teacherCode: cls.teacher.teacherCode,
              teacherProfileId: cls.teacher.id || (cls as any).homeroomTeacher?.id,
              presence: presenceMap[tUser.id] || 'OFFLINE',
            });
          }

          if (cls.students && Array.isArray(cls.students)) {
            cls.students.forEach((stWrapper) => {
              const sUser = stWrapper.student?.user;
              if (sUser) {
                dirMap.set(sUser.id, {
                  id: sUser.id,
                  fullName: sUser.profile?.fullName || 'Sinh viên',
                  email: sUser.email,
                  avatarUrl: sUser.profile?.avatarUrl,
                  role: 'STUDENT',
                  studentCode: stWrapper.student?.studentCode,
                  studentProfileId: stWrapper.student?.id || (stWrapper as any).studentId,
                  presence: presenceMap[sUser.id] || 'OFFLINE',
                });
              }
            });
          }
        });
      }
    } catch {
      // ignore
    }

    // 2. Load Homerooms
    try {
      const hrRes = await academicService.getHomerooms();
      if (hrRes.data && Array.isArray(hrRes.data)) {
        fetchedHomerooms = hrRes.data;
        setErpHomerooms(fetchedHomerooms);
        if (fetchedHomerooms.length > 0 && !selectedHomeroomToSync) {
          setSelectedHomeroomToSync(fetchedHomerooms[0].id);
        }

        fetchedHomerooms.forEach((hr) => {
          if (hr.advisor?.user) {
            const advUser = hr.advisor.user;
            dirMap.set(advUser.id, {
              id: advUser.id,
              fullName: advUser.profile?.fullName || 'Cố vấn học tập',
              email: advUser.email,
              avatarUrl: advUser.profile?.avatarUrl,
              role: 'TEACHER',
              teacherCode: hr.advisor.teacherCode,
              teacherProfileId: hr.advisor.id,
              presence: presenceMap[advUser.id] || 'OFFLINE',
            });
          }
        });
      }
    } catch {
      // ignore
    }

    const currentRole = currentUser?.role || user?.role || '';

    // 3. Load Students list (Only ADMIN or TEACHER)
    if (currentRole === 'ADMIN' || currentRole === 'TEACHER') {
      try {
        const stRes = await studentService.getStudents({ limit: 200 });
        if (stRes.data?.data && Array.isArray(stRes.data.data)) {
          stRes.data.data.forEach((st: any) => {
            const uid = st.userId || st.user?.id || st.id;
            if (uid) {
              const existing = dirMap.get(uid);
              dirMap.set(uid, {
                id: uid,
                fullName: st.user?.profile?.fullName || st.fullName || 'Sinh viên',
                email: st.user?.email || st.email,
                avatarUrl: st.user?.profile?.avatarUrl,
                role: 'STUDENT',
                studentCode: st.studentCode,
                studentProfileId: st.id || existing?.studentProfileId,
                presence: presenceMap[uid] || 'OFFLINE',
              });
            }
          });
        }
      } catch {
        // ignore
      }
    }

    // 4. Load Teachers list (ONLY ADMIN)
    if (currentRole === 'ADMIN') {
      try {
        const tchRes = await academicService.getTeachers();
        if (tchRes.data && Array.isArray(tchRes.data)) {
          tchRes.data.forEach((t: any) => {
            const uid = t.userId || t.user?.id || t.id;
            if (uid) {
              const existing = dirMap.get(uid);
              dirMap.set(uid, {
                id: uid,
                fullName: t.user?.profile?.fullName || t.name || 'Giảng viên',
                email: t.user?.email || t.email,
                avatarUrl: t.user?.profile?.avatarUrl,
                role: 'TEACHER',
                teacherCode: t.teacherCode,
                teacherProfileId: t.id || existing?.teacherProfileId,
                presence: presenceMap[uid] || 'OFFLINE',
              });
            }
          });
        }
      } catch {
        // ignore
      }
    }

    setDirectoryUsers(Array.from(dirMap.values()));

    // 5. Load Teams from Backend & Local Storage
    let mappedTeams: TeamData[] = [];

    // Read cached synced teams
    let cachedTeams: TeamData[] = [];
    try {
      const savedStr = localStorage.getItem('preskool_synced_teams_v1');
      if (savedStr) {
        cachedTeams = JSON.parse(savedStr);
      }
    } catch {
      // ignore
    }

    try {
      const teamRes = await teamsService.getMyTeams();
      if (teamRes.data?.data && Array.isArray(teamRes.data.data) && teamRes.data.data.length > 0) {
        const rawTeams = teamRes.data.data;
        mappedTeams = await Promise.all(
          rawTeams.map(async (t: any) => {
            const matchedClass = fetchedClasses.find((c) => c.id === t.classId);
            if (matchedClass) {
              return buildTeamDataFromClass(matchedClass, t);
            }
            const matchedHomeroom = fetchedHomerooms.find((h) => h.id === t.homeroomClassId);
            if (matchedHomeroom) {
              return buildTeamDataFromHomeroom(matchedHomeroom, t);
            }
            return {
              id: t.id,
              name: t.name || 'Nhóm Dự Án',
              description: t.description || 'Không gian làm việc PreSkool Teams',
              role: t.ownerId === currentUser?.id || isFacultyOrAdmin ? 'OWNER' : 'MEMBER',
              channelsCount: 2,
              membersCount: t._count?.members || 1,
              channels: [
                {
                  id: `${t.id}_general`,
                  teamId: t.id,
                  name: 'general',
                  displayName: '📢 Kênh Chung (Thông Báo)',
                  description: 'Kênh chung của nhóm',
                  type: 'PUBLIC',
                  isGeneral: true,
                },
                {
                  id: `${t.id}_qa`,
                  teamId: t.id,
                  name: 'q-and-a',
                  displayName: '💬 Hỏi Đáp & Thảo Luận',
                  description: 'Kênh trao đổi tự do',
                  type: 'PUBLIC',
                },
              ],
              members: [],
            };
          })
        );
      }
    } catch {
      // Teams may be empty on Backend due to req.user.id issue
    }

    // Merge cached teams that are not yet in mappedTeams
    if (cachedTeams.length > 0) {
      cachedTeams.forEach((ct) => {
        if (!mappedTeams.some((mt) => mt.id === ct.id || (ct.classId && mt.classId === ct.classId))) {
          mappedTeams.push(ct);
        }
      });
    }

    // If still no teams and we have fetchedClasses, auto-populate from classes!
    if (mappedTeams.length === 0 && fetchedClasses.length > 0) {
      const userClasses = fetchedClasses.filter((c) => c.teacher?.user?.id === currentUser?.id);
      const targetClasses = userClasses.length > 0 ? userClasses : fetchedClasses.slice(0, 3);

      const autoBuilt = await Promise.all(
        targetClasses.map(async (cls) => {
          let rawTeam: any = null;
          if (cls.teacher?.user?.id) {
            try {
              const syncRes = await teamsService.syncTeamFromErp({ classId: cls.id });
              if (syncRes.data?.data) {
                rawTeam = syncRes.data.data;
              }
            } catch {
              // ignore
            }
          }
          return buildTeamDataFromClass(cls, rawTeam);
        })
      );
      mappedTeams.push(...autoBuilt);
    }

    // Save active list to cache
    try {
      localStorage.setItem('preskool_synced_teams_v1', JSON.stringify(mappedTeams));
    } catch {
      // ignore
    }

    setTeams(mappedTeams);

    if (mappedTeams.length > 0) {
      const currentSelectedExists = mappedTeams.some((t) => t.id === selectedTeamId);
      if (!currentSelectedExists) {
        setSelectedTeamId(mappedTeams[0].id);
        if (mappedTeams[0].channels && mappedTeams[0].channels.length > 0) {
          setSelectedChannelId(mappedTeams[0].channels[0].id);
        }
      }
    }

    setLoadingTeams(false);
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [currentUser?.id]);

  // Sync Team from ERP
  const handleSyncFromErp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);
    setSyncError(null);
    setSyncSuccessMsg(null);

    const payload =
      syncType === 'CLASS'
        ? { classId: selectedClassToSync }
        : { homeroomClassId: selectedHomeroomToSync };

    const matchedClass = erpClasses.find((c) => c.id === selectedClassToSync);
    const matchedHomeroom = erpHomerooms.find((h) => h.id === selectedHomeroomToSync);

    const hasTeacherUser = Boolean(matchedClass?.teacher?.user?.id);
    const hasAdvisorUser = Boolean(matchedHomeroom?.advisor?.user?.id);

    // If ERP class has no linked teacher user account, Backend POST /teams/sync will 100% fail with 400
    // "Giảng viên lớp học phần chưa được gán tài khoản User để làm Team Owner".
    // Initialize locally directly without sending a failing HTTP request!
    if (syncType === 'CLASS' && matchedClass && !hasTeacherUser) {
      const fallbackTeam = await buildTeamDataFromClass(matchedClass);
      setTeams((prev) => {
        const filtered = prev.filter((t) => t.id !== fallbackTeam.id && (!fallbackTeam.classId || t.classId !== fallbackTeam.classId));
        const updated = [fallbackTeam, ...filtered];
        try {
          localStorage.setItem('preskool_synced_teams_v1', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setSelectedTeamId(fallbackTeam.id);
      if (fallbackTeam.channels && fallbackTeam.channels.length > 0) {
        setSelectedChannelId(fallbackTeam.channels[0].id);
      }

      setSyncSuccessMsg('Đã khởi tạo không gian Nhóm trực tiếp từ dữ liệu Lớp học phần ERP (Gán bạn làm Chủ nhóm)!');
      setTimeout(() => {
        setShowSyncModal(false);
        setSyncSuccessMsg(null);
      }, 1200);
      setSyncing(false);
      return;
    }

    if (syncType === 'HOMEROOM' && matchedHomeroom && !hasAdvisorUser) {
      const fallbackTeam = buildTeamDataFromHomeroom(matchedHomeroom);
      setTeams((prev) => {
        const filtered = prev.filter((t) => t.id !== fallbackTeam.id);
        const updated = [fallbackTeam, ...filtered];
        try {
          localStorage.setItem('preskool_synced_teams_v1', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setSelectedTeamId(fallbackTeam.id);
      if (fallbackTeam.channels && fallbackTeam.channels.length > 0) {
        setSelectedChannelId(fallbackTeam.channels[0].id);
      }

      setSyncSuccessMsg('Đã khởi tạo không gian Nhóm trực tiếp từ dữ liệu Lớp sinh hoạt ERP!');
      setTimeout(() => {
        setShowSyncModal(false);
        setSyncSuccessMsg(null);
      }, 1200);
      setSyncing(false);
      return;
    }

    try {
      const res = await teamsService.syncTeamFromErp(payload);
      const rawTeam = res.data?.data;

      let newTeam: TeamData;
      if (syncType === 'CLASS' && matchedClass) {
        newTeam = await buildTeamDataFromClass(matchedClass, rawTeam);
      } else if (syncType === 'HOMEROOM' && matchedHomeroom) {
        newTeam = buildTeamDataFromHomeroom(matchedHomeroom, rawTeam);
      } else {
        newTeam = {
          id: rawTeam?.id || `team-sync-${Date.now()}`,
          name: rawTeam?.name || 'Nhóm Đào Tạo ERP',
          role: 'OWNER',
          channelsCount: 2,
          membersCount: 1,
          channels: [
            { id: 'gen', teamId: 'team', name: 'general', displayName: '📢 Kênh Chung', type: 'PUBLIC', isGeneral: true },
            { id: 'qa', teamId: 'team', name: 'q-and-a', displayName: '💬 Thảo Luận', type: 'PUBLIC' },
          ],
          members: [],
        };
      }

      setTeams((prev) => {
        const filtered = prev.filter((t) => t.id !== newTeam.id && (!newTeam.classId || t.classId !== newTeam.classId));
        const updated = [newTeam, ...filtered];
        try {
          localStorage.setItem('preskool_synced_teams_v1', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setSelectedTeamId(newTeam.id);
      if (newTeam.channels && newTeam.channels.length > 0) {
        setSelectedChannelId(newTeam.channels[0].id);
      }

      setSyncSuccessMsg(res.data?.message || 'Đồng bộ Team từ ERP thành công!');
      setTimeout(() => {
        setShowSyncModal(false);
        setSyncSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      // Fallback if unexpected error occurs
      if (syncType === 'CLASS' && matchedClass) {
        const fallbackTeam = await buildTeamDataFromClass(matchedClass);
        setTeams((prev) => {
          const filtered = prev.filter((t) => t.id !== fallbackTeam.id && (!fallbackTeam.classId || t.classId !== fallbackTeam.classId));
          const updated = [fallbackTeam, ...filtered];
          try {
            localStorage.setItem('preskool_synced_teams_v1', JSON.stringify(updated));
          } catch {}
          return updated;
        });

        setSelectedTeamId(fallbackTeam.id);
        if (fallbackTeam.channels && fallbackTeam.channels.length > 0) {
          setSelectedChannelId(fallbackTeam.channels[0].id);
        }

        setSyncSuccessMsg('Đã khởi tạo không gian Nhóm trực tiếp từ dữ liệu Lớp học phần ERP (Gán bạn làm Chủ nhóm)!');
        setTimeout(() => {
          setShowSyncModal(false);
          setSyncSuccessMsg(null);
        }, 1200);
      } else if (syncType === 'HOMEROOM' && matchedHomeroom) {
        const fallbackTeam = buildTeamDataFromHomeroom(matchedHomeroom);
        setTeams((prev) => {
          const filtered = prev.filter((t) => t.id !== fallbackTeam.id);
          const updated = [fallbackTeam, ...filtered];
          try {
            localStorage.setItem('preskool_synced_teams_v1', JSON.stringify(updated));
          } catch {}
          return updated;
        });

        setSelectedTeamId(fallbackTeam.id);
        if (fallbackTeam.channels && fallbackTeam.channels.length > 0) {
          setSelectedChannelId(fallbackTeam.channels[0].id);
        }

        setSyncSuccessMsg('Đã khởi tạo không gian Nhóm trực tiếp từ dữ liệu Lớp sinh hoạt ERP!');
        setTimeout(() => {
          setShowSyncModal(false);
          setSyncSuccessMsg(null);
        }, 1200);
      } else {
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          'Không thể đồng bộ Team từ lớp này.';
        setSyncError(errorMsg);
      }
    }
    setSyncing(false);
  };

  // Create Custom Team
  const handleCreateCustomTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTeamName.trim()) return;

    setCreatingCustomTeam(true);
    setCustomTeamError(null);

    try {
      await teamsService.createCustomTeam({
        name: customTeamName.trim(),
        description: customTeamDesc.trim(),
      });
      await loadWorkspaceData();
      setCustomTeamName('');
      setCustomTeamDesc('');
      setShowCustomTeamModal(false);
    } catch (err: any) {
      setCustomTeamError(err.response?.data?.message || err.message || 'Lỗi khi tạo nhóm mới');
    }
    setCreatingCustomTeam(false);
  };

  // Create Channel inside Team
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelDisplayName.trim() || !selectedTeamId) return;

    const cleanName = newChannelName.trim()
      ? newChannelName.toLowerCase().replace(/\s+/g, '-')
      : newChannelDisplayName.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const newChanId = `${selectedTeamId}_${cleanName}_${Date.now()}`;
    const newChan: TeamChannel = {
      id: newChanId,
      teamId: selectedTeamId,
      name: cleanName,
      displayName: newChannelDisplayName.trim(),
      description: newChannelDesc.trim(),
      type: newChannelType,
    };

    try {
      await teamsService.createChannel(selectedTeamId, {
        name: cleanName,
        displayName: newChannelDisplayName.trim(),
        description: newChannelDesc.trim(),
        type: newChannelType,
      });
    } catch {
      // Local fallback if API fails
    }

    setTeams((prev) =>
      prev.map((t) =>
        t.id === selectedTeamId
          ? { ...t, channels: [...(t.channels || []), newChan] }
          : t
      )
    );

    setSelectedChannelId(newChan.id);
    setNewChannelName('');
    setNewChannelDisplayName('');
    setNewChannelDesc('');
    setShowCreateChannelModal(false);
  };

  // Quick Start Instant Meeting
  const handleStartInstantMeeting = (title?: string, customRoomCode?: string) => {
    const roomCode = customRoomCode || `meet-${Math.random().toString(36).substring(2, 9)}`;
    setActiveMeeting({
      id: `adhoc-${Date.now()}`,
      title: title || (activeChannel ? `Họp: ${activeChannel.displayName}` : 'Họp Trực Tuyến Nhanh'),
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 7200000).toISOString(),
      roomCode,
      isLive: true,
      hostName: currentUser?.fullName || 'Chủ tọa',
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
    <div className="h-[calc(100vh-8.5rem)] flex flex-col rounded-3xl border border-gray-200/90 bg-white shadow-xl overflow-hidden text-gray-800 select-none">
      {/* FULLSCREEN REAL WEBRTC MEETING ROOM OVERLAY */}
      {activeMeeting && (
        <TeamsMeetingRoom
          meeting={activeMeeting}
          user={currentUser}
          directoryUsers={directoryUsers}
          onLeave={() => setActiveMeeting(null)}
        />
      )}

      {/* TOP TEAMS HEADER */}
      <header className="h-14 shrink-0 border-b border-gray-200 bg-[#464775] px-4 text-white flex items-center justify-between shadow-xs">
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
          {/* Socket.IO Real-time Connection Indicator */}
          {socketConnected ? (
            <div
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 px-3 py-1 text-xs font-semibold border border-emerald-500/30"
              title={
                socketService.mode === 'BROADCAST_MESH'
                  ? 'Đồng bộ thời gian thực (Cloud / Multi-Tab Mesh)'
                  : 'Đã kết nối Socket.IO thời gian thực'
              }
            >
              <Wifi className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Đã kết nối Realtime</span>
            </div>
          ) : (
            <button
              onClick={handleManualReconnect}
              className="flex items-center gap-1.5 rounded-xl bg-rose-500/20 text-rose-300 px-3 py-1 text-xs font-semibold border border-rose-500/40 hover:bg-rose-500/30 transition cursor-pointer"
              title="Bấm để kết nối lại Socket.IO"
            >
              <WifiOff className="h-3.5 w-3.5 text-rose-400" />
              <span>Mất kết nối (Thử lại)</span>
            </button>
          )}

          {/* User Presence Dropdown */}
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
          {isFacultyOrAdmin && (
            <button
              onClick={() => {
                setSyncError(null);
                setSyncSuccessMsg(null);
                setShowSyncModal(true);
              }}
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
        <nav className="w-16 shrink-0 border-r border-gray-200 bg-[#ebebeb] flex flex-col items-center py-4 space-y-4">
          <button
            onClick={() => setActiveRail('activity')}
            className={`flex flex-col items-center justify-center h-12 w-12 rounded-2xl transition cursor-pointer relative ${
              activeRail === 'activity' ? 'bg-white text-[#464775] shadow-xs font-bold' : 'text-gray-600 hover:bg-gray-200'
            }`}
            title="Hoạt động & Lịch học"
          >
            <Bell className="h-5 w-5" />
            <span className="text-[9px] mt-0.5">Hoạt động</span>
          </button>

          <button
            onClick={() => setActiveRail('chat')}
            className={`flex flex-col items-center justify-center h-12 w-12 rounded-2xl transition cursor-pointer ${
              activeRail === 'chat' ? 'bg-white text-[#464775] shadow-xs font-bold' : 'text-gray-600 hover:bg-gray-200'
            }`}
            title="Trò chuyện 1-1 & Nhóm"
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
            onClick={() => setActiveRail('meetings')}
            className={`flex flex-col items-center justify-center h-12 w-12 rounded-2xl transition cursor-pointer ${
              activeRail === 'meetings' ? 'bg-white text-[#464775] shadow-xs font-bold' : 'text-gray-600 hover:bg-gray-200'
            }`}
            title="Quản lý cuộc họp & WebRTC"
          >
            <Video className="h-5 w-5" />
            <span className="text-[9px] mt-0.5">Cuộc Họp</span>
          </button>
        </nav>

        {/* 2. TEAMS SUB-BAR (WHEN 'teams' RAIL IS ACTIVE) */}
        {activeRail === 'teams' && (
          <aside className="w-64 shrink-0 border-r border-gray-200 bg-[#f5f5f7] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Danh Sách Nhóm</h3>
              {isFacultyOrAdmin && (
                <button
                  onClick={() => setShowCustomTeamModal(true)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                  title="Tạo Nhóm Mới"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Teams & Channels Accordion */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {loadingTeams ? (
                <div className="p-4 text-center text-xs text-gray-400">
                  <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-1 text-violet-600" />
                  Đang tải danh sách nhóm...
                </div>
              ) : teams.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-500 space-y-2">
                  <p className="font-semibold text-gray-700">Chưa có nhóm nào</p>
                  <p className="text-[11px] text-gray-400">
                    {isFacultyOrAdmin
                      ? 'Giảng viên có thể bấm "Đồng Bộ ERP" để tự động tạo nhóm từ lớp học phần.'
                      : 'Bạn chưa được thêm vào nhóm học phần nào.'}
                  </p>
                  {isFacultyOrAdmin && (
                    <button
                      onClick={() => setShowSyncModal(true)}
                      className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700 transition cursor-pointer"
                    >
                      Đồng Bộ ERP Ngay
                    </button>
                  )}
                </div>
              ) : (
                teams.map((t) => {
                  const isTeamActive = t.id === selectedTeamId;
                  return (
                    <div key={t.id} className="space-y-1">
                      <div
                        onClick={() => {
                          setSelectedTeamId(t.id);
                          if (t.channels && t.channels.length > 0) {
                            setSelectedChannelId(t.channels[0].id);
                          }
                        }}
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

                      {/* Channels list under active team */}
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
                                  <span className="truncate">{chan.displayName || chan.name}</span>
                                </div>
                              </div>
                            );
                          })}

                          {/* Add Channel Button (Owner/Teacher only) */}
                          {isFacultyOrAdmin && (
                            <button
                              onClick={() => setShowCreateChannelModal(true)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-violet-700 hover:underline cursor-pointer"
                            >
                              <Plus className="h-3 w-3" />
                              <span>Tạo Kênh Mới</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}

        {/* 3. MAIN WORKSPACE CONTENT */}
        <main className="flex-1 overflow-hidden bg-white flex flex-col">
          {/* TAB: TEAMS (CHANNELS) */}
          {activeRail === 'teams' && activeChannel && activeTeam && (
            <TeamsChannelChat
              team={activeTeam}
              channel={activeChannel}
              user={currentUser}
              onStartMeeting={(roomCode, title) =>
                handleStartInstantMeeting(
                  title || `Họp Kênh: #${activeChannel?.name || 'general'}`,
                  roomCode
                )
              }
            />
          )}

          {/* TAB: CHAT (DIRECT & GROUP) */}
          {activeRail === 'chat' && (
            <TeamsDirectChat
              user={currentUser}
              directoryUsers={directoryUsers}
              presenceMap={presenceMap}
              onStartVideoCall={(roomCode, meetingTitle) =>
                setActiveMeeting({
                  id: `call-${Date.now()}`,
                  title: meetingTitle || 'Cuộc gọi trực tuyến',
                  startTime: new Date().toISOString(),
                  endTime: new Date(Date.now() + 3600000).toISOString(),
                  roomCode,
                  isLive: true,
                  hostName: currentUser?.fullName || 'Người gọi',
                })
              }
            />
          )}

          {/* TAB: MEETINGS (LMS VIRTUAL CLASSROOMS & WEBRTC HUB) */}
          {activeRail === 'meetings' && (
            <TeamsMeetingsHub
              user={currentUser}
              classes={erpClasses}
              directoryUsers={directoryUsers}
              presenceMap={presenceMap}
              onJoinMeeting={(meetingData) => setActiveMeeting(meetingData)}
            />
          )}

          {/* TAB: ACTIVITY & UNIFIED CALENDAR */}
          {activeRail === 'activity' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="h-12 border-b border-gray-200 bg-gray-50 px-6 flex items-center gap-4 text-xs font-bold text-gray-600">
                <button
                  onClick={() => setActivitySubTab('feed')}
                  className={`flex items-center gap-2 h-full border-b-2 transition cursor-pointer ${
                    activitySubTab === 'feed'
                      ? 'border-violet-600 text-violet-700 font-extrabold'
                      : 'border-transparent hover:text-gray-900'
                  }`}
                >
                  <Bell className="h-4 w-4" />
                  <span>Bảng Tin Hoạt Động</span>
                </button>
                <button
                  onClick={() => setActivitySubTab('calendar')}
                  className={`flex items-center gap-2 h-full border-b-2 transition cursor-pointer ${
                    activitySubTab === 'calendar'
                      ? 'border-violet-600 text-violet-700 font-extrabold'
                      : 'border-transparent hover:text-gray-900'
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  <span>Thời Khóa Biểu & Lịch Hẹn 1-1</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {activitySubTab === 'feed' ? (
                  <TeamsActivityFeed
                    onNavigateToMeeting={(title) => handleStartInstantMeeting(title)}
                    onNavigateToChannel={() => setActiveRail('teams')}
                  />
                ) : (
                  <TeamsCalendarAppointments
                    user={currentUser}
                    directoryUsers={directoryUsers}
                    classes={erpClasses}
                    onJoinMeeting={(title, meetingUrl) => {
                      const code = meetingUrl
                        ? meetingUrl.replace(/^https?:\/\/.*\/room\//, '')
                        : undefined;
                      handleStartInstantMeeting(title, code);
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: ĐỒNG BỘ TEAM TỪ ERP ĐÀO TẠO (POST /api/v1/teams/sync) */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Đồng Bộ Team Từ ERP Đào Tạo</h3>
                <p className="text-xs text-gray-500">Gọi API POST /api/v1/teams/sync lưu Database thực tế</p>
              </div>
              <button onClick={() => setShowSyncModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            {/* Error or Success Feedback */}
            {syncError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{syncError}</span>
              </div>
            )}
            {syncSuccessMsg && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2">
                <span className="font-bold">✓</span>
                <span>{syncSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSyncFromErp} className="space-y-4 text-xs">
              {/* Sync Type */}
              <div className="flex rounded-xl bg-gray-100 p-1 font-semibold">
                <button
                  type="button"
                  onClick={() => setSyncType('CLASS')}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                    syncType === 'CLASS' ? 'bg-white text-violet-700 shadow-xs' : 'text-gray-600'
                  }`}
                >
                  Lớp Học Phần (classId)
                </button>
                <button
                  type="button"
                  onClick={() => setSyncType('HOMEROOM')}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                    syncType === 'HOMEROOM' ? 'bg-white text-violet-700 shadow-xs' : 'text-gray-600'
                  }`}
                >
                  Lớp Sinh Hoạt (homeroomClassId)
                </button>
              </div>

              {syncType === 'CLASS' ? (
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Chọn Lớp Học Phần ERP</label>
                  <select
                    value={selectedClassToSync}
                    onChange={(e) => setSelectedClassToSync(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-violet-500"
                  >
                    {erpClasses.map((cls) => {
                      const teacherName =
                        cls.teacher?.user?.profile?.fullName || (cls.teacher as any)?.name;
                      return (
                        <option key={cls.id} value={cls.id}>
                          {teacherName
                            ? `✅ ${cls.code} - ${cls.course?.name || 'Lớp Học Phần'} (GV: ${teacherName})`
                            : `⚡ ${cls.code} - ${cls.course?.name || 'Lớp Học Phần'} (Khởi tạo nhanh với quyền GV hiện tại)`}
                        </option>
                      );
                    })}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Chọn Lớp Sinh Hoạt ERP</label>
                  <select
                    value={selectedHomeroomToSync}
                    onChange={(e) => setSelectedHomeroomToSync(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-violet-500"
                  >
                    {erpHomerooms.map((hr) => (
                      <option key={hr.id} value={hr.id}>
                        {hr.code} - {hr.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="rounded-2xl bg-violet-50 border border-violet-200 p-3.5 text-violet-900 space-y-1">
                <p className="font-bold">Quy trình tự động hóa của Backend:</p>
                <ul className="text-[11px] list-disc list-inside space-y-0.5 text-violet-800">
                  <li>Tạo bản ghi <code>Team</code> thực sự trong PostgreSQL.</li>
                  <li>Khởi tạo sẵn 2 kênh chuẩn: <code>#general</code> và <code>#q-and-a</code>.</li>
                  <li>Tự động liên kết Giảng viên làm <strong>OWNER</strong> và Sinh viên làm <strong>MEMBER</strong>.</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSyncModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={syncing}
                  className="rounded-xl bg-violet-600 px-5 py-2 font-bold text-white hover:bg-violet-700 disabled:opacity-50 transition cursor-pointer"
                >
                  {syncing ? 'Đang Đồng Bộ...' : 'Bắt Đầu Đồng Bộ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TẠO NHÓM MỚI (CUSTOM TEAM) */}
      {showCustomTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Tạo Nhóm Mới (Custom Team)</h3>
              <button onClick={() => setShowCustomTeamModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {customTeamError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                {customTeamError}
              </div>
            )}

            <form onSubmit={handleCreateCustomTeam} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Tên Nhóm *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: CLB Tin Học & Nghiên Cứu..."
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
                  placeholder="Mô tả về hoạt động của nhóm..."
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
                  disabled={creatingCustomTeam}
                  className="rounded-xl bg-violet-600 px-5 py-2 font-bold text-white hover:bg-violet-700 disabled:opacity-50"
                >
                  {creatingCustomTeam ? 'Đang Tạo...' : 'Tạo Nhóm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TẠO KÊNH MỚI */}
      {showCreateChannelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Tạo Kênh Mới Trong Nhóm</h3>
              <button onClick={() => setShowCreateChannelModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleCreateChannel} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Tên Hiển Thị Của Kênh *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 🔬 Thảo Luận Đề Tài 2..."
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
                  placeholder="nhom-2-research (chữ thường, không dấu)"
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
                  <option value="PRIVATE">Riêng tư (Chỉ thành viên được chỉ định)</option>
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
