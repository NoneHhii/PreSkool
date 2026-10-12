import api from './api';

export interface StudentProfileData {
  identityCard?: string;
  birthPlace?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  policyObject?: string;
}

export interface StudentStatusUpdateData {
  newStatus: 'ACTIVE' | 'SUSPENDED' | 'DROPPED' | 'GRADUATED';
  decisionNumber: string;
  effectiveDate: string;
  note?: string;
}

export interface StudentFilterParams {
  search?: string;
  cohort?: string;
  majorId?: string;
  homeroomClassId?: string;
  status?: string;
  gender?: string;
  page?: number;
  limit?: number;
}

export const studentService = {
  getStudents: (params?: StudentFilterParams) => {
    return api.get('/v1/students', { params });
  },

  getStudentById: (id: string) => {
    return api.get(`/v1/students/${id}`);
  },

  updateProfile: (id: string, data: StudentProfileData) => {
    return api.put(`/v1/students/${id}/profile`, data);
  },

  updateStatus: (id: string, data: StudentStatusUpdateData) => {
    return api.post(`/v1/students/${id}/status`, data);
  },
};
