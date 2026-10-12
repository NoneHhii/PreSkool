import api from './api';

export interface LmsModuleData {
  classId: string;
  title: string;
  orderIndex?: number;
  description?: string;
}

export interface MaterialData {
  title: string;
  type: 'PDF' | 'VIDEO' | 'LINK' | 'DOCUMENT';
  url: string;
}

export interface AssignmentData {
  classId: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
}

export interface SubmissionData {
  fileUrl: string;
  note?: string;
}

export interface GradeSubmissionData {
  score: number;
  feedback?: string;
}

export const lmsService = {
  getModules: (classId: string) => {
    return api.get(`/v1/lms/classes/${classId}/modules`);
  },

  createModule: (data: LmsModuleData) => {
    return api.post('/v1/lms/modules', data);
  },

  uploadMaterial: (moduleId: string, data: MaterialData) => {
    return api.post(`/v1/lms/modules/${moduleId}/materials`, data);
  },

  getAssignments: (classId: string) => {
    return api.get(`/v1/lms/classes/${classId}/assignments`);
  },

  createAssignment: (data: AssignmentData) => {
    return api.post('/v1/lms/assignments', data);
  },

  submitAssignment: (assignmentId: string, data: SubmissionData) => {
    return api.post(`/v1/lms/assignments/${assignmentId}/submissions`, data);
  },

  gradeSubmission: (submissionId: string, data: GradeSubmissionData) => {
    return api.put(`/v1/lms/submissions/${submissionId}/grade`, data);
  },
};
