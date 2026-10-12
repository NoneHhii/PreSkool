import api from './api';

export interface RegistrationPeriodData {
  name: string;
  academicYear: string;
  semester: number;
  startTime: string;
  endTime: string;
  minCredits: number;
  maxCredits: number;
}

export interface AutoEnrollBatchData {
  homeroomClassId: string;
  classIds: string[];
}

export interface ManualOverrideData {
  studentId: string;
  classId: string;
}

export const registrationService = {
  getPeriods: () => {
    return api.get('/v1/registration/periods');
  },

  createPeriod: (data: RegistrationPeriodData) => {
    return api.post('/v1/registration/periods', data);
  },

  autoEnrollBatch: (data: AutoEnrollBatchData) => {
    return api.post('/v1/registration/auto-enroll-batch', data);
  },

  selfEnroll: (classId: string) => {
    return api.post(`/v1/registration/classes/${classId}/enroll`);
  },

  selfUnenroll: (classId: string) => {
    return api.delete(`/v1/registration/classes/${classId}/unenroll`);
  },

  manualOverride: (data: ManualOverrideData) => {
    return api.post('/v1/registration/manual-override', data);
  },
};
