import api from './api';

// ==========================================
// 1. KHÔNG GIAN KHÓA HỌC & HỌC LIỆU (Course Space & Materials)
// ==========================================
export interface SyllabusData {
  objectives: string;
  clos: string[];
  gradeWeights: {
    quiz: number;
    assignment: number;
    midterm: number;
    final: number;
  };
  textbooks: string[];
  description: string;
}

export interface LmsModuleData {
  id?: string;
  classId: string;
  title: string;
  week?: number;
  order?: number;
  orderIndex?: number;
  description?: string;
  materials?: MaterialData[];
}

export interface MaterialData {
  id?: string;
  moduleId?: string;
  title: string;
  type: 'PDF' | 'VIDEO' | 'LINK' | 'PPTX' | 'DOCX' | 'SCORM';
  url: string;
  description?: string;
  prerequisiteMaterialId?: string;
  unlockAt?: string;
  isLocked?: boolean;
  lockReason?: string;
  progressPercent?: number;
  isCompleted?: boolean;
}

// ==========================================
// 2. BÀI TẬP & ĐỒ ÁN (Assignments & Groups)
// ==========================================
export interface RubricItem {
  criteria: string;
  maxPoints: number;
}

export interface AssignmentData {
  id?: string;
  classId: string;
  title: string;
  description: string;
  openDate?: string;
  deadline: string;
  cutOffDate?: string;
  allowLate?: boolean;
  isGroup?: boolean;
  maxFileSizeMb?: number;
  allowedFileTypes?: string;
  submissionType?: 'FILE' | 'ONLINE_TEXT' | 'LINK' | 'HYBRID';
  maxScore?: number;
  rubric?: RubricItem[];
  isSubmitted?: boolean;
}

export interface AssignmentGroup {
  id: string;
  name: string;
  classId: string;
  members: {
    id: string;
    studentCode: string;
    fullName: string;
    email?: string;
  }[];
}

export interface SubmissionData {
  fileUrl?: string;
  onlineText?: string;
  linkUrl?: string;
  submissionType?: 'FILE' | 'ONLINE_TEXT' | 'LINK' | 'HYBRID';
  comments?: string;
  note?: string;
}

export interface GradeSubmissionData {
  score: number;
  feedback?: string;
  annotations?: { page: number; x: number; y: number; comment: string }[];
  rubricScores?: Record<string, number>;
}

// ==========================================
// 3. KHẢO THÍ & THI ONLINE (Quizzes & Anti-Cheating)
// ==========================================
export interface QuestionBankData {
  id?: string;
  courseId: string;
  title: string;
  type?: 'MULTIPLE_CHOICE' | 'ESSAY';
  lmsType?: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK' | 'MATCHING' | 'SHORT_ANSWER' | 'CODE';
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';
  chapter: string;
  topic?: string;
  content: string;
  options?: string[];
  answer: string;
}

export interface QuizData {
  id?: string;
  classId: string;
  title: string;
  description?: string;
  openTime: string;
  closeTime: string;
  durationMinutes: number;
  password?: string;
  ipRange?: string;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  passingScore?: number;
  questionMatrix?: {
    difficulty: {
      EASY?: number;
      MEDIUM?: number;
      HARD?: number;
      VERY_HARD?: number;
    };
  };
}

export interface QuizAttemptAnswer {
  questionBankId: string;
  studentAnswer: string;
}

// ==========================================
// 4. DIỄN ĐÀN & LỚP HỌC ẢO (Forum & Virtual Classroom)
// ==========================================
export interface ForumThread {
  id: string;
  classId: string;
  title: string;
  content: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  isPinned: boolean;
  isResolved: boolean;
  votes: number;
  hasVoted?: boolean;
  commentCount: number;
  createdAt: string;
}

export interface ForumComment {
  id: string;
  threadId: string;
  parentId?: string | null;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  content: string;
  isResolvedAnswer?: boolean;
  createdAt: string;
}

export interface VirtualClassroomData {
  id?: string;
  classId: string;
  title: string;
  platform: 'JITSI' | 'ZOOM' | 'TEAMS' | 'LIVEKIT';
  meetingUrl: string;
  startTime: string;
  endTime: string;
  recordings?: { id: string; title: string; url: string; duration?: string }[];
}

// ==========================================
// 5. SỔ ĐIỂM & PHÂN TÍCH (Gradebook & Analytics)
// ==========================================
export interface GradeWeightsData {
  quizWeight: number;
  assignmentWeight: number;
  midtermWeight: number;
  isLocked?: boolean;
}

// ==========================================
// LMS SERVICE IMPLEMENTATION
// ==========================================
export const lmsService = {
  // 1. Không gian khóa học & Học liệu
  getCourseSpace: (classId: string) => {
    return api.get(`/v1/lms/classes/${classId}/space`);
  },

  updateSyllabus: (classId: string, data: SyllabusData) => {
    return api.put(`/v1/lms/classes/${classId}/syllabus`, data);
  },

  getModules: (classId: string) => {
    return api.get(`/v1/lms/classes/${classId}/modules`);
  },

  createModule: (data: LmsModuleData) => {
    return api.post('/v1/lms/modules', data);
  },

  updateModule: (moduleId: string, data: Partial<LmsModuleData>) => {
    return api.put(`/v1/lms/modules/${moduleId}`, data);
  },

  deleteModule: (moduleId: string) => {
    return api.delete(`/v1/lms/modules/${moduleId}`);
  },

  uploadMaterial: (moduleId: string, data: MaterialData) => {
    return api.post(`/v1/lms/modules/${moduleId}/materials`, data);
  },

  createMaterial: (moduleId: string, data: MaterialData) => {
    return api.post(`/v1/lms/modules/${moduleId}/materials`, data);
  },

  updateMaterial: (materialId: string, data: Partial<MaterialData>) => {
    return api.put(`/v1/lms/materials/${materialId}`, data);
  },

  deleteMaterial: (materialId: string) => {
    return api.delete(`/v1/lms/materials/${materialId}`);
  },

  updateMaterialProgress: (materialId: string, data: { progressPercent: number; isCompleted: boolean }) => {
    return api.post(`/v1/lms/materials/${materialId}/progress`, data);
  },

  // 2. Bài tập & Nhóm làm bài
  getAssignments: (classId: string) => {
    return api.get(`/v1/lms/classes/${classId}/assignments`);
  },

  getAssignmentDetail: (assignmentId: string) => {
    return api.get(`/v1/lms/assignments/${assignmentId}`);
  },

  createAssignment: (data: AssignmentData) => {
    return api.post('/v1/lms/assignments', data);
  },

  updateAssignment: (assignmentId: string, data: Partial<AssignmentData>) => {
    return api.put(`/v1/lms/assignments/${assignmentId}`, data);
  },

  createAssignmentGroup: (classId: string, data: { name: string; memberIds?: string[] }) => {
    return api.post(`/v1/lms/classes/${classId}/assignment-groups`, data);
  },

  autoSplitGroups: (data: { classId: string; groupSize: number; prefix?: string }) => {
    return api.post(`/v1/lms/classes/${data.classId}/assignment-groups/auto-split`, data);
  },

  getAssignmentGroups: (classId: string) => {
    return api.get(`/v1/lms/classes/${classId}/assignment-groups`);
  },

  joinGroup: (groupId: string) => {
    return api.post(`/v1/lms/assignment-groups/${groupId}/join`);
  },

  submitAssignment: (assignmentId: string, data: SubmissionData) => {
    return api.post(`/v1/lms/assignments/${assignmentId}/submissions`, data);
  },

  getSubmissions: (assignmentId: string) => {
    return api.get(`/v1/lms/assignments/${assignmentId}/submissions`);
  },

  gradeSubmission: (submissionId: string, data: GradeSubmissionData) => {
    return api.put(`/v1/lms/submissions/${submissionId}/grade`, data);
  },

  // 3. Khảo thí & Thi Online
  addQuestionBank: (data: QuestionBankData) => {
    return api.post('/v1/lms/question-bank', data);
  },

  getQuestionBank: (courseId: string, params?: { chapter?: string; difficulty?: string }) => {
    return api.get(`/v1/lms/courses/${courseId}/question-bank`, { params });
  },

  createQuiz: (data: QuizData) => {
    return api.post('/v1/lms/quizzes', data);
  },

  getQuizzes: (classId: string) => {
    return api.get(`/v1/lms/classes/${classId}/quizzes`);
  },

  startQuiz: (quizId: string, password?: string) => {
    return api.post(`/v1/lms/quizzes/${quizId}/start`, { password });
  },

  saveQuizAnswer: (attemptId: string, data: QuizAttemptAnswer) => {
    return api.post(`/v1/lms/quiz-attempts/${attemptId}/save-answer`, data);
  },

  logCheating: (attemptId: string, data: { event: string; details: string }) => {
    return api.post(`/v1/lms/quiz-attempts/${attemptId}/log-cheating`, data);
  },

  submitQuiz: (attemptId: string) => {
    return api.post(`/v1/lms/quiz-attempts/${attemptId}/submit`);
  },

  getQuizMonitoring: (quizId: string) => {
    return api.get(`/v1/lms/quizzes/${quizId}/monitoring`);
  },

  reopenQuizAttempt: (quizId: string, studentId: string) => {
    return api.post(`/v1/lms/quizzes/${quizId}/students/${studentId}/reopen-attempt`);
  },

  // 4. Diễn đàn thảo luận & Lớp học ảo
  getForumThreads: (classId: string) => {
    return api.get(`/v1/lms/classes/${classId}/forum/threads`);
  },

  createForumThread: (classId: string, data: { title: string; content: string; tags?: string[] }) => {
    return api.post(`/v1/lms/classes/${classId}/forum/threads`, data);
  },

  getForumThreadDetail: (threadId: string) => {
    return api.get(`/v1/lms/forum/threads/${threadId}`);
  },

  createForumComment: (threadId: string, data: { content: string; parentId?: string | null }) => {
    return api.post(`/v1/lms/forum/threads/${threadId}/comments`, data);
  },

  voteForum: (data: { threadId: string; vote: number }) => {
    return api.post('/v1/lms/forum/vote', data);
  },

  pinForumThread: (threadId: string) => {
    return api.put(`/v1/lms/forum/threads/${threadId}/pin`);
  },

  markCommentResolved: (commentId: string) => {
    return api.put(`/v1/lms/forum/comments/${commentId}/mark-resolved`);
  },

  getVirtualClassrooms: (classId: string) => {
    return api.get(`/v1/lms/classes/${classId}/virtual-classrooms`);
  },

  createVirtualClassroom: (classId: string, data: VirtualClassroomData) => {
    return api.post(`/v1/lms/classes/${classId}/virtual-classrooms`, data);
  },

  updateRecording: (classroomId: string, data: { recordingUrl: string; title?: string }) => {
    return api.put(`/v1/lms/virtual-classrooms/${classroomId}/recordings`, data);
  },

  // 5. Sổ điểm & Phân tích học tập
  updateGradeWeights: (classId: string, data: GradeWeightsData) => {
    return api.put(`/v1/lms/classes/${classId}/grade-weights`, data);
  },

  getGradebook: (classId: string) => {
    return api.get(`/v1/lms/classes/${classId}/gradebook`);
  },

  syncToErp: (classId: string) => {
    return api.post(`/v1/lms/classes/${classId}/gradebook/sync-to-erp`);
  },

  getAnalytics: (classId: string) => {
    return api.get(`/v1/lms/classes/${classId}/analytics`);
  },

  // 6. Lịch học tập & Thông báo
  getMyCalendar: () => {
    return api.get('/v1/lms/my-calendar');
  },

  getAnnouncements: (classId: string) => {
    return api.get(`/v1/lms/classes/${classId}/announcements`);
  },

  createAnnouncement: (classId: string, data: { title: string; content: string }) => {
    return api.post(`/v1/lms/classes/${classId}/announcements`, data);
  },

  getNotifications: () => {
    return api.get('/v1/lms/notifications');
  },

  markNotificationRead: (id: string) => {
    return api.put(`/v1/lms/notifications/${id}/read`);
  },
};

export default lmsService;
