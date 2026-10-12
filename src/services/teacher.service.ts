import api from './api';

export interface RescheduleRequestData {
  scheduleId: string;
  newDate: string;
  newShift: string;
  newRoom?: string;
  reason: string;
}

export interface RollCallData {
  classId: string;
  date: string;
  attendanceRecords: {
    studentId: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    note?: string;
  }[];
}

export interface TeachingLogData {
  classId: string;
  date: string;
  lessonContent: string;
  studentAttendanceCount: number;
  note?: string;
}

export const teacherService = {
  getMySchedule: (params?: { startDate?: string; endDate?: string }) => {
    return api.get('/v1/teacher/my-schedule', { params });
  },

  getAssignedClasses: () => {
    return api.get('/v1/teacher/assigned-classes');
  },

  getClassRoster: (classId: string) => {
    return api.get(`/v1/teacher/classes/${classId}/roster`);
  },

  requestReschedule: (data: RescheduleRequestData) => {
    return api.post('/v1/teacher/reschedule-requests', data);
  },

  saveRollCall: (data: RollCallData) => {
    return api.post('/v1/teacher/roll-call', data);
  },

  saveTeachingLog: (data: TeachingLogData) => {
    return api.post('/v1/teacher/teaching-log', data);
  },

  getAbsenceWarnings: (classId: string) => {
    return api.get(`/v1/teacher/classes/${classId}/absence-warnings`);
  },
};
