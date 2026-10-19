import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { userService, type ImportResponse } from '../../services/user.service';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import AdminOverview from './components/AdminOverview';
import TeacherOverview from './components/TeacherOverview';
import FacultiesTab from './components/FacultiesTab';
import MajorsTab from './components/MajorsTab';
import HomeroomsTab from './components/HomeroomsTab';
import CoursesTab from './components/CoursesTab';
import ClassesTab from './components/ClassesTab';
import ScheduleTab from './components/ScheduleTab';
import AttendanceTab from './components/AttendanceTab';

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(queryTab || 'overview');
  const [user, setUser] = useState<any>(null);

  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'STUDENTS' | 'TEACHERS'>('STUDENTS');
  const [enrollmentYear, setEnrollmentYear] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr || !localStorage.getItem('token')) {
      navigate('/');
      return;
    }
    try {
      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);
      if (!queryTab && parsedUser.role === 'TEACHER') {
        setActiveTab('teacher-overview');
      }
    } catch {
      navigate('/');
    }
  }, [navigate, queryTab]);

  useEffect(() => {
    if (queryTab) {
      setActiveTab(queryTab);
    }
  }, [queryTab]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setImportResult(null);
      setErrorMsg(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setUploading(true);
    setImportResult(null);
    setErrorMsg(null);

    try {
      const response =
        importType === 'STUDENTS'
          ? await userService.importStudents(file, enrollmentYear || undefined)
          : await userService.importUsers(file);

      setImportResult(response);
      setFile(null);
      setEnrollmentYear('');
      const fileInput = document.getElementById('excel-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      console.error('Import error:', error);
      setErrorMsg(error.response?.data?.message || 'Không thể import danh sách. Vui lòng kiểm tra lại file Excel.');
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
          <p className="text-xs font-medium text-gray-500">Đang tải không gian làm việc...</p>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'ADMIN';

  return (
    <DashboardLayout activeTab={activeTab} onSelectTab={setActiveTab}>
      {/* 1. Admin Overview Dashboard */}
      {activeTab === 'overview' && (
        <AdminOverview onNavigateTab={setActiveTab} user={user} />
      )}

      {/* 2. Teacher Overview Dashboard */}
      {activeTab === 'teacher-overview' && (
        <TeacherOverview onNavigateTab={setActiveTab} user={user} />
      )}

      {/* 3. Import Users Tab */}
      {activeTab === 'import' && isAdmin && (
        <div className="space-y-6">
          <PageHeader
            title="Import Sinh Viên / Giảng Viên (Tuyển Sinh)"
            breadcrumbs={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Peoples' },
              { label: 'Import Users' },
            ]}
          />

          <div className="max-w-3xl rounded-xl border border-gray-100 bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Import Bằng File Excel ({importType === 'STUDENTS' ? 'Sinh Viên' : 'Giảng Viên'})
                  </h3>
                  <p className="text-xs text-gray-500">
                    {importType === 'STUDENTS'
                      ? 'Tải lên danh sách tân sinh viên. Hệ thống sẽ tự động tạo MSSV và mật khẩu mặc định.'
                      : 'Tải lên danh sách tài khoản giảng viên mới.'}
                  </p>
                </div>
              </div>

              {/* Toggle switch between Students and Teachers */}
              <div className="flex rounded-lg bg-gray-100 p-1 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setImportType('STUDENTS');
                    setImportResult(null);
                    setErrorMsg(null);
                  }}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    importType === 'STUDENTS'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sinh Viên
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImportType('TEACHERS');
                    setImportResult(null);
                    setErrorMsg(null);
                  }}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    importType === 'TEACHERS'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Giảng Viên
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              {errorMsg && (
                <div className="p-4 rounded-xl flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p className="font-medium">{errorMsg}</p>
                </div>
              )}

              {importResult && (
                <div
                  className={`p-5 rounded-xl border ${
                    importResult.failed > 0
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-emerald-50 border-emerald-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {importResult.failed > 0 ? (
                      <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                    )}
                    <div className="flex-1">
                      <h4
                        className={`text-sm font-bold ${
                          importResult.failed > 0 ? 'text-amber-900' : 'text-emerald-900'
                        }`}
                      >
                        {importResult.message}
                      </h4>

                      <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                        <div className="bg-white/80 p-2.5 rounded-lg text-center border border-gray-100">
                          <span className="block text-xl font-bold text-gray-800">{importResult.total}</span>
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Tổng Số</span>
                        </div>
                        <div className="bg-white/80 p-2.5 rounded-lg text-center border border-gray-100">
                          <span className="block text-xl font-bold text-emerald-600">{importResult.success}</span>
                          <span className="text-[10px] text-emerald-700 uppercase tracking-wider font-semibold">Thành Công</span>
                        </div>
                        <div className="bg-white/80 p-2.5 rounded-lg text-center border border-gray-100">
                          <span className="block text-xl font-bold text-rose-500">{importResult.failed}</span>
                          <span className="text-[10px] text-rose-700 uppercase tracking-wider font-semibold">Thất Bại</span>
                        </div>
                      </div>

                      {importResult.success > 0 &&
                        importResult.successRows &&
                        importResult.successRows.length > 0 && (
                          <div className="mt-4 rounded-lg bg-white p-3 border border-emerald-100 max-h-48 overflow-y-auto">
                            <p className="text-xs font-bold text-emerald-800 mb-2">
                              Tài khoản đã tạo thành công kèm MSSV & mật khẩu:
                            </p>
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-emerald-100 text-gray-500 font-semibold">
                                  <th className="py-1 px-2">Dòng</th>
                                  <th className="py-1 px-2">Email</th>
                                  <th className="py-1 px-2">MSSV</th>
                                  <th className="py-1 px-2">Mật khẩu mặc định</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-emerald-50">
                                {importResult.successRows.map((row: any, i: number) => (
                                  <tr key={i}>
                                    <td className="py-1 px-2">{row.row}</td>
                                    <td className="py-1 px-2 font-medium text-gray-700">{row.email}</td>
                                    <td className="py-1 px-2 font-mono font-bold text-blue-600">{row.studentCode}</td>
                                    <td className="py-1 px-2 font-mono text-gray-600">{row.defaultPassword}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                      {importResult.failed > 0 &&
                        importResult.errors &&
                        importResult.errors.length > 0 && (
                          <div className="mt-4 rounded-lg bg-white p-3 border border-rose-100 max-h-48 overflow-y-auto">
                            <p className="text-xs font-bold text-rose-800 mb-2">
                              Chi tiết các dòng bị lỗi khi import:
                            </p>
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-rose-100 text-gray-500 font-semibold">
                                  <th className="py-1 px-2">Dòng</th>
                                  <th className="py-1 px-2">Nội dung lỗi</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-rose-50">
                                {importResult.errors.map((err: any, i: number) => (
                                  <tr key={i}>
                                    <td className="py-1 px-2 font-mono font-semibold text-rose-600">
                                      {err.row ?? (err.index !== undefined ? err.index + 1 : i + 1)}
                                    </td>
                                    <td className="py-1 px-2 text-rose-700">
                                      {err.message || err.error || (typeof err === 'string' ? err : JSON.stringify(err))}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              )}

              {importType === 'STUDENTS' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Năm Nhập Học (Tùy chọn)</label>
                  <input
                    type="number"
                    value={enrollmentYear}
                    onChange={(e) => setEnrollmentYear(e.target.value)}
                    placeholder="Ví dụ: 2026 (Dùng để sinh 2 chữ số đầu của MSSV)"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              )}

              {/* Upload Drag & Drop Area */}
              <label
                htmlFor="excel-upload"
                className={`flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-xl cursor-pointer transition ${
                  file ? 'border-blue-500 bg-blue-50/40' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col items-center justify-center p-5 text-center">
                  <UploadCloud className={`h-10 w-10 mb-2 ${file ? 'text-blue-600' : 'text-gray-400'}`} />
                  {file ? (
                    <>
                      <p className="text-sm font-bold text-blue-700">{file.name}</p>
                      <p className="text-xs text-blue-500 mt-0.5">Sẵn sàng để tải lên và import</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-gray-700">
                        Nhấp để chọn file hoặc kéo thả file Excel vào đây
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">Chấp nhận file Excel (.xlsx, .xls)</p>
                    </>
                  )}
                </div>
                <input
                  id="excel-upload"
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleImport}
                  disabled={!file || uploading}
                  isLoading={uploading}
                  leftIcon={<FileCheck className="h-4 w-4" />}
                >
                  Bắt Đầu Import Dữ Liệu
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Academic Modules */}
      {activeTab === 'faculties' && isAdmin && <FacultiesTab />}
      {activeTab === 'majors' && isAdmin && <MajorsTab />}
      {activeTab === 'homerooms' && isAdmin && <HomeroomsTab />}
      {activeTab === 'courses' && isAdmin && <CoursesTab />}
      {activeTab === 'classes' && isAdmin && <ClassesTab />}
      {activeTab === 'schedule' && <ScheduleTab />}
      {activeTab === 'attendance' && <AttendanceTab />}
    </DashboardLayout>
  );
}
