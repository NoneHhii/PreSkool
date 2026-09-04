import api from './api';

export interface ImportResponse {
  message: string;
  total: number;
  success: number;
  failed: number;
  successRows: any[];
  errors: any[];
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  profile?: {
    fullName?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    avatarUrl?: string;
  };
  student?: {
    studentCode?: string;
    enrollmentDate?: string | null;
  };
  teacher?: {
    teacherCode?: string;
    department?: string;
  };
}

export interface ProfileResponse {
  message: string;
  data: UserProfile;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  oldPassword?: string;
  newPassword?: string;
}

export interface BaseResponse {
  message: string;
}

export const userService = {
  importUsers: async (file: File): Promise<ImportResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ImportResponse>('/users/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  importStudents: async (file: File, enrollmentYear?: string): Promise<ImportResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (enrollmentYear) {
      formData.append('enrollmentYear', enrollmentYear);
    }

    const response = await api.post<ImportResponse>('/users/import-students', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  getMe: async (): Promise<ProfileResponse> => {
    const response = await api.get<ProfileResponse>('/users/me');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<ProfileResponse> => {
    const response = await api.put<ProfileResponse>('/users/me', data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>('/users/me/password', data);
    return response.data;
  }
};
