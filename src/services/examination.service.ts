import api from './api';

export interface ExamData {
  classId: string;
  examDate: string;
  examType: 'MULTIPLE_CHOICE' | 'ESSAY' | 'PRACTICAL' | 'ORAL';
}

export interface ExamRoomConfig {
  roomName: string;
  capacity: number;
}

export interface GradeInputData {
  processScore: number;
  midtermScore: number;
  finalScore: number;
}

export interface AdminGradeEditData {
  processScore?: number;
  midtermScore?: number;
  finalScore?: number;
  reason: string;
}

export interface QuestionData {
  courseId: string;
  content: string;
  options?: string[];
  correctAnswer?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface RescoreRequestData {
  classId: string;
  examId?: string;
  reason: string;
  requestedScoreComponent: 'PROCESS' | 'MIDTERM' | 'FINAL';
}

export const examinationService = {
  getExams: () => {
    return api.get('/v1/examination/exams');
  },

  createExam: (data: ExamData) => {
    return api.post('/v1/examination/exams', data);
  },

  assignRooms: (examId: string, rooms: ExamRoomConfig[]) => {
    return api.post(`/v1/examination/exams/${examId}/rooms`, { rooms });
  },

  submitGrades: (classId: string, studentId: string, data: GradeInputData) => {
    return api.put(`/v1/examination/classes/${classId}/students/${studentId}/grades`, data);
  },

  auditEditGrades: (classId: string, studentId: string, data: AdminGradeEditData) => {
    return api.put(`/v1/examination/classes/${classId}/students/${studentId}/grades/admin-edit`, data);
  },

  createQuestion: (data: QuestionData) => {
    return api.post('/v1/examination/questions', data);
  },

  getQuestions: (courseId: string) => {
    return api.get(`/v1/examination/courses/${courseId}/questions`);
  },

  createRescoreRequest: (data: RescoreRequestData) => {
    return api.post('/v1/examination/rescore-requests', data);
  },

  getRescoreRequests: () => {
    return api.get('/v1/examination/rescore-requests');
  },
};
