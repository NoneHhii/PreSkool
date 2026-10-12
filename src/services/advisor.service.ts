import api from './api';

export interface AdvisorHomeroomStats {
  homeroomClassId: string;
  totalStudents: number;
  averageGpa: number;
  academicWarningsCount: number;
  totalCompletedCredits: number;
}

export const advisorService = {
  getAdvisedClasses: () => {
    return api.get('/v1/advisor/classes');
  },

  getClassStats: (homeroomClassId: string) => {
    return api.get(`/v1/advisor/classes/${homeroomClassId}/stats`);
  },

  reviewTrainingPoint: (data: { studentId: string; score: number; note?: string; status: 'APPROVED' | 'ADJUSTED' }) => {
    return api.post('/v1/advisor/review-training-point', data);
  },

  reviewRequest: (data: { requestId: string; approved: boolean; feedback?: string }) => {
    return api.post('/v1/advisor/review-request', data);
  },
};
