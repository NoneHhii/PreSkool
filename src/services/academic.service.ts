import api from './api';

export interface Student {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: string;
  cohort?: string;
  majorId?: string;
}

export interface HomeroomClass {
  id: string;
  code: string;
  name: string;
  majorId: string;
  cohort: string;
  advisorId?: string;
  major?: Major;
  advisor?: any;
  students?: Student[];
  _count?: {
    students: number;
  };
}
export interface Faculty {
  id: string;
  code: string;
  name: string;
  description?: string;
  majors?: Major[];
}

export interface Major {
  id: string;
  code: string;
  name: string;
  facultyId: string;
  faculty?: Faculty;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  description?: string;
  prerequisites?: string[];
}

export interface Class {
  id: string;
  code: string;
  courseId: string;
  teacherId?: string;
  academicYear: string;
  semester: number;
  course?: Course;
  teacher?: any;
  students?: any[];
}

export interface Schedule {
  id: string;
  classId: string;
  date: string;
  shift: string;
  room: string;
  classInfo?: Class;
  class?: Class;
}

export interface AttendanceStats {
  PRESENT: number;
  ABSENT: number;
  EXCUSED: number;
  LATE: number;
  total: number;
}

export interface AttendanceRecord {
  id: string;
  scheduleId: string;
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE';
  notes?: string;
}

export interface AttendanceResponse {
  message: string;
  data: {
    stats: AttendanceStats;
    records: AttendanceRecord[];
  };
}

export const academicService = {
  // Faculties
  getFaculties: async () => {
    const response = await api.get<{ data: Faculty[] }>('/v1/academic/faculties');
    return response.data;
  },
  createFaculty: async (data: { code: string; name: string; description?: string }) => {
    const response = await api.post<{ message: string; data: Faculty }>('/v1/academic/faculties', data);
    return response.data;
  },

  // Majors
  getMajors: async () => {
    const response = await api.get<{ data: Major[] }>('/v1/academic/majors');
    return response.data;
  },
  createMajor: async (data: { code: string; name: string; facultyId: string }) => {
    const response = await api.post<{ message: string; data: Major }>('/v1/academic/majors', data);
    return response.data;
  },

  // Courses
  getCourses: async () => {
    const response = await api.get<{ data: Course[] }>('/v1/academic/courses');
    return response.data;
  },
  createCourse: async (data: { code: string; name: string; credits: number; description?: string; prerequisites?: string[] }) => {
    const response = await api.post<{ message: string; data: Course }>('/v1/academic/courses', data);
    return response.data;
  },

  // Classes
  getClasses: async () => {
    const response = await api.get<{ data: Class[] }>('/v1/academic/classes');
    return response.data;
  },
  createClass: async (data: { code: string; courseId: string; teacherId?: string; academicYear: string; semester: number }) => {
    const response = await api.post<{ message: string; data: Class }>('/v1/academic/classes', data);
    return response.data;
  },
  assignStudentsToClass: async (classId: string, studentIds: string[]) => {
    const response = await api.post<{ message: string }>(`/v1/academic/classes/${classId}/assign-students`, { studentIds });
    return response.data;
  },
  assignHomeroomToClass: async (classId: string, homeroomClassId: string) => {
    const response = await api.post<{ message: string }>(`/v1/academic/classes/${classId}/assign-homeroom`, { homeroomClassId });
    return response.data;
  },
  autoAssignClasses: async (data: { courseId: string; academicYear: string; semester: number; studentIds: string[]; numberOfClasses: number }) => {
    const response = await api.post<{ message: string; data: any }>('/v1/academic/classes/auto-assign', data);
    return response.data;
  },

  // Homerooms
  getHomerooms: async () => {
    const response = await api.get<{ data: HomeroomClass[] }>('/v1/academic/homerooms');
    return response.data;
  },
  createHomeroom: async (data: { code: string; name: string; majorId: string; cohort: string; advisorId?: string }) => {
    const response = await api.post<{ message: string; data: HomeroomClass }>('/v1/academic/homerooms', data);
    return response.data;
  },
  autoAssignHomerooms: async (data: { majorId: string; cohort: string; studentIds: string[]; numberOfClasses: number; prefix: string; suffix?: string }) => {
    const response = await api.post<{ message: string; data: any }>('/v1/academic/homerooms/auto-assign', data);
    return response.data;
  },
  autoAssignAllFreshmen: async (data?: { cohort?: string }) => {
    const response = await api.post<{ message: string; data: any }>('/v1/academic/homerooms/auto-assign-all', data || {});
    return response.data;
  },

  // Lookups
  getUnassignedHomeroomStudents: async (params?: { cohort?: string; majorId?: string }) => {
    const response = await api.get<{ data: Student[] }>('/v1/academic/students/unassigned-homeroom', { params });
    return response.data;
  },
  getUnassignedStudents: async (params?: { cohort?: string; majorId?: string; courseId?: string }) => {
    const response = await api.get<{ data: Student[] }>('/v1/academic/students/unassigned', { params });
    return response.data;
  },
  getTeachers: async () => {
    const response = await api.get<{ data: any[] }>('/v1/academic/teachers');
    return response.data;
  },
  getStudents: async (params?: { homeroomClassId?: string }) => {
    const response = await api.get<{ data: Student[] }>('/v1/academic/students', { params });
    return response.data;
  },

  // Schedule
  getSchedule: async () => {
    const response = await api.get<{ data: Schedule[] }>('/v1/academic/schedule');
    return response.data;
  },
  createSchedule: async (data: { classId: string; date: string; shift: string; room: string }) => {
    const response = await api.post<{ message: string; data: Schedule }>('/v1/academic/schedule', data);
    return response.data;
  },

  // Attendance
  markAttendance: async (data: { scheduleId: string; studentId: string; status: 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE'; notes?: string }) => {
    const response = await api.post<{ message: string; data: AttendanceRecord }>('/v1/academic/attendance', data);
    return response.data;
  },
  getStudentAttendanceStats: async (studentId: string): Promise<AttendanceResponse> => {
    const response = await api.get<AttendanceResponse>(`/v1/academic/attendance/student/${studentId}`);
    return response.data;
  }
};
