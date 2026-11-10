import api from './api';

// ==========================================
// 1. TEAMS & CHANNELS INTERFACES
// ==========================================
export type PresenceStatus = 'ONLINE' | 'IN_A_CALL' | 'BUSY' | 'AWAY' | 'OFFLINE';

export interface TeamMember {
  id: string;
  userId: string;
  role: 'OWNER' | 'MEMBER';
  fullName: string;
  avatarUrl?: string;
  email?: string;
  presence?: PresenceStatus;
  studentCode?: string;
  teacherCode?: string;
}

export interface DirectoryUser {
  id: string;
  fullName: string;
  email?: string;
  avatarUrl?: string;
  role: string;
  studentCode?: string;
  teacherCode?: string;
  department?: string;
  presence?: PresenceStatus;
  studentProfileId?: string;
  teacherProfileId?: string;
}

export interface TeamChannel {
  id: string;
  teamId: string;
  name: string;
  displayName: string;
  description?: string;
  type: 'PUBLIC' | 'PRIVATE';
  assignmentGroupId?: string;
  memberIds?: string[];
  unreadCount?: number;
  isGeneral?: boolean;
}

export interface TeamData {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  classId?: string;
  homeroomClassId?: string;
  role?: 'OWNER' | 'MEMBER';
  membersCount?: number;
  channelsCount?: number;
  channels?: TeamChannel[];
  members?: TeamMember[];
}

export interface ChannelCreateData {
  name: string;
  displayName: string;
  description?: string;
  type: 'PUBLIC' | 'PRIVATE';
  assignmentGroupId?: string;
  memberIds?: string[];
}

// ==========================================
// 2. MESSAGING & CHAT INTERFACES
// ==========================================
export interface MessageAttachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

export interface CodeSnippet {
  language: string;
  code: string;
}

export interface MessageReaction {
  reaction: string;
  count: number;
  users: string[];
  hasReacted?: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId?: string;
  channelId?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole?: string;
  content: string;
  codeSnippet?: CodeSnippet;
  attachments?: MessageAttachment[];
  replyToId?: string;
  replyToMessage?: {
    id: string;
    senderName: string;
    content: string;
  };
  mentions?: string[];
  isPinned?: boolean;
  reactions?: MessageReaction[];
  createdAt: string;
}

export interface DirectConversation {
  id: string;
  name?: string;
  isGroup: boolean;
  participants: TeamMember[];
  lastMessage?: ChatMessage;
  unreadCount?: number;
}

// ==========================================
// 3. MEETINGS & VIDEO CONFERENCING INTERFACES
// ==========================================
export interface BreakoutRoom {
  id: string;
  name: string;
  members: string[];
}

export interface MeetingData {
  id: string;
  teamId?: string;
  channelId?: string;
  title: string;
  startTime: string;
  endTime: string;
  passcode?: string;
  roomCode?: string;
  isLive?: boolean;
  hostId?: string;
  hostName?: string;
  isMuteForced?: boolean;
  activePresenterId?: string;
  breakoutRooms?: BreakoutRoom[];
  recordingUrl?: string;
  targetLmsWeek?: number;
}

export interface RaisedHand {
  userId: string;
  userName: string;
  userAvatar?: string;
  raisedAt: string;
}

export interface LivePollOption {
  option: string;
  votes: number;
}

export interface LivePoll {
  id: string;
  meetingId: string;
  question: string;
  options: string[];
  correctAnswer?: string;
  results?: Record<string, number>;
  totalVotes?: number;
  userVotedOption?: string;
  isActive?: boolean;
}

export interface WhiteboardStroke {
  color: string;
  width: number;
  points: { x: number; y: number }[];
  type?: 'free' | 'rect' | 'circle' | 'arrow';
}

export interface WhiteboardData {
  strokes: WhiteboardStroke[];
}

export interface AttendanceStudentReport {
  studentId: string;
  studentCode: string;
  fullName: string;
  avatarUrl?: string;
  joinedAt?: string;
  leftAt?: string;
  totalDurationMinutes: number;
  presencePercentage: number;
  attendanceStatus: 'PRESENT' | 'LATE' | 'ABSENT';
}

export interface MeetingAttendanceReport {
  meetingId: string;
  meetingTitle: string;
  totalMeetingMinutes: number;
  recordingUrl?: string;
  targetLmsWeek?: number;
  students: AttendanceStudentReport[];
}

// ==========================================
// 4. FILES & KANBAN TASKS INTERFACES
// ==========================================
export interface ChannelFileItem {
  id: string;
  name: string;
  url: string;
  folder?: string;
  size?: number;
  uploadedBy?: string;
  uploadedAt: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ChannelTask {
  id: string;
  channelId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  dueDate?: string;
  createdAt?: string;
}

// ==========================================
// 5. CALENDAR & APPOINTMENTS INTERFACES
// ==========================================
export interface UnifiedCalendarEvent {
  id: string;
  title: string;
  type: 'LIVE_CLASS' | 'ERP_SCHEDULE' | 'APPOINTMENT';
  date: string;
  startTime: string;
  endTime: string;
  courseName?: string;
  room?: string;
  meetingUrl?: string;
  isLive?: boolean;
  appointmentStatus?: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  advisorName?: string;
}

export interface AppointmentData {
  id: string;
  teacherId: string;
  teacherName?: string;
  studentId: string;
  studentName?: string;
  title: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  meetingUrl?: string;
}

export interface ActivityFeedItem {
  id: string;
  type: 'MENTION' | 'MEETING' | 'POLL' | 'TASK' | 'APPOINTMENT';
  title: string;
  content: string;
  sourceName: string;
  isRead: boolean;
  createdAt: string;
  linkUrl?: string;
}

// ==========================================
// TEAMS SERVICE API CLIENT
// ==========================================
export const teamsService = {
  // 1. Teams & Channels
  syncTeamFromErp: (data: { classId?: string; homeroomClassId?: string }) => {
    return api.post('/v1/teams/sync', data);
  },

  createCustomTeam: (data: { name: string; description?: string; avatarUrl?: string }) => {
    return api.post('/v1/teams/custom', data);
  },

  getMyTeams: () => {
    return api.get('/v1/teams/my');
  },

  getTeamDetail: (teamId: string) => {
    return api.get(`/v1/teams/${teamId}`);
  },

  createChannel: (teamId: string, data: ChannelCreateData) => {
    return api.post(`/v1/teams/${teamId}/channels`, data);
  },

  // 2. Video Meetings & LMS Virtual Classrooms
  createVirtualClassroom: (
    classId: string,
    data: {
      classId: string;
      title: string;
      platform: 'TEAMS' | 'ZOOM' | 'JITSI' | 'LIVEKIT';
      meetingUrl: string;
      roomPassword?: string | null;
      startTime: string;
      endTime?: string | null;
      recordings?: any;
    }
  ) => {
    return api.post(`/v1/lms/classes/${classId}/virtual-classrooms`, data);
  },

  getVirtualClassrooms: (classId: string) => {
    return api.get(`/v1/lms/classes/${classId}/virtual-classrooms`);
  },

  updateRecordings: (
    classroomId: string,
    recordings: { title: string; url: string; duration?: string }[]
  ) => {
    return api.put(`/v1/lms/virtual-classrooms/${classroomId}/recordings`, { recordings });
  },

  getAssignmentGroups: (classId: string) => {
    return api.get(`/v1/lms/classes/${classId}/assignment-groups`);
  },

  scheduleMeeting: (data: {
    teamId?: string;
    channelId?: string;
    title: string;
    startTime: string;
    endTime: string;
    passcode?: string;
  }) => {
    return api.post('/v1/teams/meetings', data);
  },

  joinMeeting: (meetingId: string) => {
    return api.post(`/v1/teams/meetings/${meetingId}/join`);
  },

  leaveMeeting: (meetingId: string) => {
    return api.post(`/v1/teams/meetings/${meetingId}/leave`);
  },

  raiseHand: (meetingId: string) => {
    return api.post(`/v1/teams/meetings/${meetingId}/raise-hand`);
  },

  lowerHand: (meetingId: string) => {
    return api.post(`/v1/teams/meetings/${meetingId}/lower-hand`);
  },

  getHandsQueue: (meetingId: string) => {
    return api.get(`/v1/teams/meetings/${meetingId}/hands`);
  },

  createPoll: (meetingId: string, data: { question: string; options: string[]; correctAnswer?: string }) => {
    return api.post(`/v1/teams/meetings/${meetingId}/polls`, data);
  },

  votePoll: (pollId: string, selectedOption: string) => {
    return api.post(`/v1/teams/polls/${pollId}/vote`, { selectedOption });
  },

  getPollResults: (pollId: string) => {
    return api.get(`/v1/teams/polls/${pollId}/results`);
  },

  moderateMeeting: (
    meetingId: string,
    data: { isMuteForced?: boolean; activePresenterId?: string; breakoutRooms?: BreakoutRoom[] }
  ) => {
    return api.put(`/v1/teams/meetings/${meetingId}/moderate`, data);
  },

  updateWhiteboard: (meetingId: string, data: WhiteboardData) => {
    return api.put(`/v1/teams/meetings/${meetingId}/whiteboard`, { whiteboardData: data });
  },

  // 3. Recording & Auto-Attendance
  endMeeting: (meetingId: string, data: { recordingUrl: string; targetLmsWeek: number }) => {
    return api.post(`/v1/teams/meetings/${meetingId}/end`, data);
  },

  getAttendanceReport: (meetingId: string) => {
    return api.get(`/v1/teams/meetings/${meetingId}/attendance-report`);
  },

  // 4. Chat & Presence
  updatePresence: (status: PresenceStatus) => {
    return api.put('/v1/teams/presence', { status });
  },

  createDirectConversation: (targetUserId: string) => {
    return api.post('/v1/teams/conversations/direct', { targetUserId });
  },

  createGroupConversation: (name: string, participantIds: string[]) => {
    return api.post('/v1/teams/conversations/group', { name, participantIds });
  },

  getConversations: () => {
    return api.get('/v1/teams/conversations');
  },

  getDirectMessages: (conversationId: string, params?: { limit?: number }) => {
    return api.get(`/v1/teams/conversations/${conversationId}/messages`, { params });
  },

  sendDirectMessage: (
    conversationId: string,
    data: { content: string; codeSnippet?: CodeSnippet; attachments?: MessageAttachment[] }
  ) => {
    return api.post(`/v1/teams/conversations/${conversationId}/messages`, data);
  },

  getChannelMessages: (channelId: string, params?: { limit?: number }) => {
    return api.get(`/v1/teams/channels/${channelId}/messages`, { params });
  },

  sendChannelMessage: (
    channelId: string,
    data: {
      content: string;
      codeSnippet?: CodeSnippet;
      attachments?: MessageAttachment[];
      replyToId?: string;
      mentions?: string[];
    }
  ) => {
    return api.post(`/v1/teams/channels/${channelId}/messages`, data);
  },

  reactMessage: (messageId: string, reaction: string, isChannel = true) => {
    return api.post(`/v1/teams/messages/${messageId}/react?isChannel=${isChannel}`, { reaction });
  },

  pinMessage: (messageId: string, isPinned: boolean, isChannel = true) => {
    return api.put(`/v1/teams/messages/${messageId}/pin?isChannel=${isChannel}`, { isPinned });
  },

  // 5. Shared Files & Kanban
  getChannelFiles: (channelId: string) => {
    return api.get(`/v1/teams/channels/${channelId}/files`);
  },

  registerChannelFile: (channelId: string, data: { name: string; url: string; folder?: string }) => {
    return api.post(`/v1/teams/channels/${channelId}/files`, data);
  },

  getChannelTasks: (channelId: string) => {
    return api.get(`/v1/teams/channels/${channelId}/tasks`);
  },

  createChannelTask: (
    channelId: string,
    data: {
      title: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      assigneeId?: string;
      dueDate?: string;
    }
  ) => {
    return api.post(`/v1/teams/channels/${channelId}/tasks`, data);
  },

  updateTask: (taskId: string, data: Partial<ChannelTask>) => {
    return api.put(`/v1/teams/tasks/${taskId}`, data);
  },

  deleteTask: (taskId: string) => {
    return api.delete(`/v1/teams/tasks/${taskId}`);
  },

  // 6. Unified Calendar & Appointments & Activity Feed
  getUnifiedCalendar: () => {
    return api.get('/v1/teams/calendar');
  },

  bookAppointment: (data: {
    teacherId: string;
    title: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }) => {
    return api.post('/v1/teams/appointments', data);
  },

  respondAppointment: (
    appointmentId: string,
    data: { status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'; meetingUrl?: string }
  ) => {
    return api.put(`/v1/teams/appointments/${appointmentId}/respond`, data);
  },

  getMyAppointments: () => {
    return api.get('/v1/teams/appointments');
  },

  getActivityFeed: () => {
    return api.get('/v1/teams/activity-feed');
  },

  markActivityRead: (id: string) => {
    return api.put(`/v1/teams/activity-feed/${id}/read`);
  },
};

export default teamsService;

