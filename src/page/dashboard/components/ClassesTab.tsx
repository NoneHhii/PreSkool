import React, { useState, useEffect } from 'react';
import { academicService, type Class, type Course, type HomeroomClass, type Major } from '../../../services/academic.service';
import { Layers, AlertCircle, CheckCircle, UserPlus, Zap, X } from 'lucide-react';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { type Column } from '../../../components/common/DataTable';
import StatusBadge from '../../../components/common/StatusBadge';
import Button from '../../../components/common/Button';

export default function ClassesTab() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [homerooms, setHomerooms] = useState<HomeroomClass[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({ code: '', courseId: '', teacherId: '', academicYear: '2026-2027', semester: 1 });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Assign Student Modal
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [assignMode, setAssignMode] = useState<'HOMEROOM' | 'MANUAL'>('HOMEROOM');
  const [studentIdsStr, setStudentIdsStr] = useState('');
  const [selectedHomeroomId, setSelectedHomeroomId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // Auto Assign Modal
  const [showAutoAssign, setShowAutoAssign] = useState(false);
  const [autoAssignData, setAutoAssignData] = useState({ courseId: '', academicYear: '2026-2027', semester: 1, numberOfClasses: 1 });
  const [autoAssignLoading, setAutoAssignLoading] = useState(false);
  const [unassignedCount, setUnassignedCount] = useState<number | null>(null);
  const [unassignedStudentIds, setUnassignedStudentIds] = useState<string[]>([]);

  // Auto Assign Filters
  const [filterCohort, setFilterCohort] = useState('');
  const [filterMajorId, setFilterMajorId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, coursesRes, homeroomsRes, majorsRes, teachersRes] = await Promise.all([
        academicService.getClasses(),
        academicService.getCourses(),
        academicService.getHomerooms(),
        academicService.getMajors(),
        academicService.getTeachers(),
      ]);
      setClasses(classesRes.data || []);
      setCourses(coursesRes.data || []);
      setHomerooms(homeroomsRes.data || []);
      setMajors(majorsRes.data || []);
      setTeachers(teachersRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage(null);
    try {
      await academicService.createClass({
        ...formData,
        teacherId: formData.teacherId || undefined,
      });
      setMessage({ type: 'success', text: 'Tạo Lớp Học Phần thành công!' });
      setFormData({ code: '', courseId: '', teacherId: '', academicYear: '2026-2027', semester: 1 });
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Không thể tạo Lớp Học Phần' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignModal) return;

    setAssignLoading(true);
    setMessage(null);
    try {
      if (assignMode === 'MANUAL') {
        const idsArray = studentIdsStr.split(',').map((id) => id.trim()).filter((id) => id);
        await academicService.assignStudentsToClass(showAssignModal, idsArray);
        setMessage({ type: 'success', text: `Đã gán ${idsArray.length} sinh viên vào lớp học phần!` });
      } else {
        await academicService.assignHomeroomToClass(showAssignModal, selectedHomeroomId);
        setMessage({ type: 'success', text: 'Đã gán toàn bộ sinh viên lớp hành chính vào lớp học phần!' });
      }
      setShowAssignModal(null);
      setStudentIdsStr('');
      setSelectedHomeroomId('');
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Không thể gán sinh viên' });
    } finally {
      setAssignLoading(false);
    }
  };

  const checkUnassigned = async () => {
    if (!filterCohort && !filterMajorId && !autoAssignData.courseId) return;
    try {
      const res = await academicService.getUnassignedStudents({
        cohort: filterCohort || undefined,
        majorId: filterMajorId || undefined,
        courseId: autoAssignData.courseId || undefined,
      });
      const students = res.data || [];
      setUnassignedCount(students.length);
      setUnassignedStudentIds(students.map((s) => s.id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAutoAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (unassignedCount === 0 || unassignedCount === null) {
      alert('Không có sinh viên hợp lệ để chia lớp!');
      return;
    }

    setAutoAssignLoading(true);
    setMessage(null);
    try {
      await academicService.autoAssignClasses({
        courseId: autoAssignData.courseId,
        academicYear: autoAssignData.academicYear,
        semester: autoAssignData.semester,
        numberOfClasses: autoAssignData.numberOfClasses,
        studentIds: unassignedStudentIds,
      });
      setMessage({
        type: 'success',
        text: `Đã tự động rải đều ${unassignedCount} sinh viên vào ${autoAssignData.numberOfClasses} lớp học phần mới!`,
      });
      setShowAutoAssign(false);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Không thể chia lớp học phần tự động' });
    } finally {
      setAutoAssignLoading(false);
    }
  };

  const columns: Column<Class>[] = [
    {
      key: 'code',
      header: 'Mã Lớp Học Phần',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-blue-600 hover:underline cursor-pointer">
          {row.code}
        </span>
      ),
    },
    {
      key: 'course',
      header: 'Môn Học',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-gray-900">{row.course?.code}</div>
          <div className="text-xs text-gray-500">{row.course?.name}</div>
        </div>
      ),
    },
    {
      key: 'teacher',
      header: 'Giảng Viên',
      render: (row) => (
        <span className="text-xs text-gray-700">
          {row.teacher?.profile?.fullName || row.teacher?.fullName || row.teacher?.username || (
            <span className="text-gray-400 italic">Chưa phân công</span>
          )}
        </span>
      ),
    },
    {
      key: 'academicYear',
      header: 'Năm Học',
      sortable: true,
      render: (row) => <span className="text-gray-700">{row.academicYear}</span>,
    },
    {
      key: 'semester',
      header: 'Học Kỳ',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
          Kỳ {row.semester}
        </span>
      ),
    },
    {
      key: 'students',
      header: 'Số Lượng SV',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
          {row.students?.length || 0} SV
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      render: () => <StatusBadge status="Active" label="Đang mở" />,
    },
    {
      key: 'enroll',
      header: 'Gán Sinh Viên',
      render: (row) => (
        <button
          onClick={() => setShowAssignModal(row.id)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition cursor-pointer"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Gán SV</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản Lý Lớp Học Phần (Course Classes)"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Academic' },
          { label: 'Classes' },
        ]}
        actionLabel="Mở Lớp Học Phần"
        onActionClick={() => setShowForm(true)}
        onRefresh={fetchData}
        extraActions={
          <Button
            variant="secondary"
            leftIcon={<Zap className="h-4 w-4 text-purple-600" />}
            onClick={() => setShowAutoAssign(true)}
            className="border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100"
          >
            Tự Động Rải Lớp (Auto-Assign)
          </Button>
        }
      />

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border shadow-xs animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <p className="text-xs font-medium">{message.text}</p>
          <button onClick={() => setMessage(null)} className="ml-auto text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Auto Assign Modal */}
      {showAutoAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Tự Động Chia Lớp Học Phần</h3>
                  <p className="text-xs text-purple-700">Lọc sinh viên chưa đăng ký môn và rải đều vào các lớp mới</p>
                </div>
              </div>
              <button
                onClick={() => setShowAutoAssign(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAutoAssign} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Môn Học Cần Mở Lớp *</label>
                  <select
                    required
                    value={autoAssignData.courseId}
                    onChange={(e) => setAutoAssignData({ ...autoAssignData, courseId: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="" disabled>-- Chọn Môn Học --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Năm Học *</label>
                  <input
                    required
                    value={autoAssignData.academicYear}
                    onChange={(e) => setAutoAssignData({ ...autoAssignData, academicYear: e.target.value })}
                    type="text"
                    placeholder="2026-2027"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Học Kỳ</label>
                  <select
                    value={autoAssignData.semester}
                    onChange={(e) => setAutoAssignData({ ...autoAssignData, semester: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value={1}>Học kỳ 1</option>
                    <option value={2}>Học kỳ 2</option>
                    <option value={3}>Học kỳ Hè</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Lọc Theo Ngành (Major)</label>
                  <select
                    value={filterMajorId}
                    onChange={(e) => setFilterMajorId(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="">-- Tất cả ngành --</option>
                    {majors.map((m) => (
                      <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Lọc Theo Khóa (Cohort)</label>
                  <input
                    value={filterCohort}
                    onChange={(e) => setFilterCohort(e.target.value)}
                    type="text"
                    placeholder="e.g. K26"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Số Lớp Muốn Sinh</label>
                  <input
                    required
                    type="number"
                    min={1}
                    max={20}
                    value={autoAssignData.numberOfClasses}
                    onChange={(e) => setAutoAssignData({ ...autoAssignData, numberOfClasses: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                <span className="text-xs text-gray-600">Kiểm tra số sinh viên chưa học môn này:</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={checkUnassigned}
                  disabled={!autoAssignData.courseId}
                >
                  Tìm Sinh Viên
                </Button>
              </div>

              {unassignedCount !== null && (
                <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800 border border-blue-200 flex items-center justify-between">
                  <span>Tìm thấy <strong>{unassignedCount}</strong> sinh viên đủ điều kiện gán vào môn học này.</span>
                  {unassignedCount > 0 && (
                    <span className="font-bold text-blue-900 bg-blue-100/80 px-2.5 py-1 rounded-lg">
                      ~{Math.ceil(unassignedCount / Math.max(1, autoAssignData.numberOfClasses))} SV / lớp
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAutoAssign(false)}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={autoAssignLoading || !unassignedCount}
                  isLoading={autoAssignLoading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Chạy Tự Động Chia Lớp
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Create Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Mở Lớp Học Phần Mới</h3>
                  <p className="text-xs text-gray-500">Mở lớp cho môn học trong học kỳ hiện tại</p>
                </div>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Mã Lớp Học Phần *</label>
                <input
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  type="text"
                  placeholder="Ví dụ: CS101202601"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Môn Học *</label>
                <select
                  required
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="" disabled>-- Chọn Môn Học --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Năm Học *</label>
                  <input
                    required
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    type="text"
                    placeholder="2026-2027"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Học Kỳ *</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value={1}>Học kỳ 1</option>
                    <option value={2}>Học kỳ 2</option>
                    <option value={3}>Học kỳ Hè</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Giảng Viên Phụ Trách (Tùy chọn)</label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="">-- Chưa chỉ định (Có thể gán sau) --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.profile?.fullName || t.teacher?.teacherCode || t.username || t.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={!formData.courseId} isLoading={submitLoading}>
                  Lưu Lớp Học Phần
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enroll Students Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Gán Sinh Viên Vào Lớp</h3>
                  <p className="text-xs text-gray-500">Thêm sinh viên theo lớp hành chính hoặc nhập mã sinh viên</p>
                </div>
              </div>
              <button
                onClick={() => setShowAssignModal(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setAssignMode('HOMEROOM')}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition cursor-pointer ${
                  assignMode === 'HOMEROOM' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Theo Lớp Hành Chính (1-Click)
              </button>
              <button
                type="button"
                onClick={() => setAssignMode('MANUAL')}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition cursor-pointer ${
                  assignMode === 'MANUAL' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Nhập Thủ Công (UUIDs)
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="mt-4 space-y-4">
              {assignMode === 'HOMEROOM' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Chọn Lớp Hành Chính *</label>
                  <select
                    required
                    value={selectedHomeroomId}
                    onChange={(e) => setSelectedHomeroomId(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="" disabled>-- Chọn Lớp Hành Chính --</option>
                    {homerooms.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.code} - {h.name} ({h.students?.length || 0} sinh viên)
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-400">
                    Toàn bộ danh sách sinh viên của lớp hành chính này sẽ được chuyển vào học lớp học phần.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Mã UUID Sinh Viên (phân cách bằng dấu phẩy) *</label>
                  <textarea
                    required
                    rows={4}
                    value={studentIdsStr}
                    onChange={(e) => setStudentIdsStr(e.target.value)}
                    placeholder="uuid-student-1, uuid-student-2..."
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 font-mono text-xs text-gray-800 outline-none resize-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAssignModal(null)}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={assignLoading || (assignMode === 'HOMEROOM' ? !selectedHomeroomId : !studentIdsStr.trim())}
                  isLoading={assignLoading}
                >
                  {assignMode === 'HOMEROOM' ? 'Gán Cả Lớp Hành Chính' : 'Gán Sinh Viên'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DataTable
        title="Danh Sách Lớp Học Phần"
        data={classes}
        columns={columns}
        keyExtractor={(row) => row.id}
        isLoading={loading}
        emptyMessage="Chưa có lớp học phần nào trong hệ thống."
      />
    </div>
  );
}
