import api from './api';

export interface TrainingPointData {
  score: number;
  level: 'SELF' | 'CLASS' | 'ADVISOR';
  evidenceUrl?: string;
  note?: string;
}

export interface StudentRequestData {
  requestType: 'CERTIFICATE' | 'MILITARY_DEFERRAL' | 'TRANSCRIPT' | 'OTHER';
  note: string;
}

export interface UpdateRequestStatusData {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  resultFileUrl?: string;
  feedback?: string;
}

export const affairsService = {
  submitTrainingPoint: (studentId: string, academicYear: string, semester: number, data: TrainingPointData) => {
    return api.post(`/v1/affairs/training-points/students/${studentId}/years/${academicYear}/semesters/${semester}`, data);
  },

  getTrainingPoints: (studentId: string) => {
    return api.get(`/v1/affairs/training-points/students/${studentId}`);
  },

  createRequest: (data: StudentRequestData) => {
    return api.post('/v1/affairs/requests', data);
  },

  getRequests: (params?: { studentId?: string; status?: string }) => {
    return api.get('/v1/affairs/requests', { params });
  },

  updateRequestStatus: (requestId: string, data: UpdateRequestStatusData) => {
    return api.put(`/v1/affairs/requests/${requestId}`, data);
  },
};
