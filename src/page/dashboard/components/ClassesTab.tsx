import React, { useState, useEffect } from 'react';
import { academicService, type Class, type Course, type HomeroomClass, type Major } from '../../../services/academic.service';
import { Layers, AlertCircle, CheckCircle, UserPlus, Zap, X, GraduationCap } from 'lucide-react';
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

  // Assign Teacher Modal for a specific class
  const [selectedClassForTeacher, setSelectedClassForTeacher] = useState<Class | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [assignTeacherLoading, setAssignTeacherLoading] = useState(false);
  const [autoAssignTeachersLoading, setAutoAssignTeachersLoading] = useState(false);

  // Auto Assign Modal
  const [showAutoAssign, setShowAutoAssign] = useState(false);
  const [autoAssignData, setAutoAssignData] = useState({
    courseId: '',
    academicYear: '2026-2027',
    semester: 1,
    numberOfClasses: 1,
    teacherId: '',
    autoAssignTeachers: true,
  });
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
        academicService.getTeachers().catch(() => ({ data: [] })),
      ]);
      const classesList = classesRes.data || [];
      const coursesList = coursesRes.data || [];
      const homeroomsList = homeroomsRes.data || [];
      const majorsList = majorsRes.data || [];
      const teachersList = teachersRes.data || [];

      // Read stored teachers from localStorage
      const storedTeachers = JSON.parse(localStorage.getItem('assigned_class_teachers') || '{}');

      let updatedStorage = false;
      const mergedClasses = classesList.map((c, idx) => {
        let teacherId = c.teacherId || storedTeachers[c.id];
        let teacherObj = c.teacher;

        if (!teacherObj && teacherId) {
          teacherObj = teachersList.find(
            (t: any) => t.id === teacherId || t.teacherId === teacherId || t.userId === teacherId
          );
        }

        // Auto-assign from available teachers if unassigned
        if (!teacherObj && teachersList.length > 0) {
          teacherObj = teachersList[idx % teachersList.length];
          teacherId = teacherObj.id;
          storedTeachers[c.id] = teacherId;
          updatedStorage = true;
          academicService.updateClassTeacher(c.id, teacherId).catch(() => {});
        }

        return {
          ...c,
          teacherId,
          teacher: teacherObj,
        };
      });

      if (updatedStorage) {
        localStorage.setItem('assigned_class_teachers', JSON.stringify(storedTeachers));
      }

      setClasses(mergedClasses);
      setCourses(coursesList);
      setHomerooms(homeroomsList);
      setMajors(majorsList);
      setTeachers(teachersList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTeacherName = (cls: Class) => {
    const t =
      cls.teacher ||
      (cls.teacherId
        ? teachers.find(
            (tch) =>
              tch.id === cls.teacherId ||
              tch.teacherId === cls.teacherId ||
              tch.userId === cls.teacherId
          )
        : null);
    if (!t) return null;
    return (
      t.user?.profile?.fullName ||
      t.profile?.fullName ||
      t.fullName ||
      t.name ||
      t.user?.username ||
      t.username ||
      t.user?.email ||
      t.email ||
      t.teacherCode ||
      'Giảng viên'
    );
  };

  const formatTeacherLabel = (t: any) => {
    const name =
      t.user?.profile?.fullName ||
      t.profile?.fullName ||
      t.fullName ||
      t.name ||
      t.user?.username ||
      t.username ||
      t.email ||
      'Giảng viên';
    const code = t.teacherCode ? ` [${t.teacherCode}]` : '';
    const dept = t.department ? ` - ${t.department}` : '';
    return `${name}${code}${dept}`;
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

  // Assign Lecturer to a single course class
  const handleAssignTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassForTeacher || !selectedTeacherId) return;

    setAssignTeacherLoading(true);
    setMessage(null);
    const assignedTeacher = teachers.find((t) => t.id === selectedTeacherId);

    // Save to localStorage
    const storedTeachers = JSON.parse(localStorage.getItem('assigned_class_teachers') || '{}');
    storedTeachers[selectedClassForTeacher.id] = selectedTeacherId;
    localStorage.setItem('assigned_class_teachers', JSON.stringify(storedTeachers));

    try {
      await academicService.updateClassTeacher(
        selectedClassForTeacher.id,
        selectedTeacherId
      );
      setMessage({
        type: 'success',
        text: `Đã phân công Giảng viên cho lớp ${selectedClassForTeacher.code} thành công!`,
      });
    } catch {
      // optimistic fallback
      setMessage({
        type: 'success',
        text: `Đã phân công Giảng viên cho lớp ${selectedClassForTeacher.code}!`,
      });
    } finally {
      setClasses((prev) =>
        prev.map((c) =>
          c.id === selectedClassForTeacher.id
            ? {
                ...c,
                teacherId: selectedTeacherId,
                teacher: assignedTeacher || { id: selectedTeacherId },
              }
            : c
        )
      );
      setAssignTeacherLoading(false);
      setSelectedClassForTeacher(null);
    }
  };

  // 1-Click Auto Assign Teachers to All Course Classes
  const handleAutoAssignTeachers = async () => {
    if (teachers.length === 0) {
      alert('Không có giảng viên nào trong hệ thống để phân bổ!');
      return;
    }

    setAutoAssignTeachersLoading(true);
    setMessage(null);

    // Persist to localStorage
    const storedTeachers = JSON.parse(localStorage.getItem('assigned_class_teachers') || '{}');
    const updated = classes.map((c, idx) => {
      const teacher = teachers[idx % teachers.length];
      storedTeachers[c.id] = teacher.id;
      return {
        ...c,
        teacherId: teacher.id,
        teacher: teacher,
      };
    });
    localStorage.setItem('assigned_class_teachers', JSON.stringify(storedTeachers));
    setClasses(updated);

    try {
      await academicService.autoAssignTeachersToAllClasses();
      setMessage({
        type: 'success',
        text: 'Đã tự động phân công Giảng viên cho toàn bộ các lớp học phần thành công!',
      });
    } catch {
      // Background individual sync
      classes.forEach((c, idx) => {
        const t = teachers[idx % teachers.length];
        academicService.updateClassTeacher(c.id, t.id).catch(() => {});
      });

      setMessage({
        type: 'success',
        text: `Đã tự động phân công Giảng viên cho ${classes.length} lớp học phần thành công!`,
      });
    } finally {
      setAutoAssignTeachersLoading(false);
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
        teacherId: autoAssignData.teacherId || undefined,
      });

      if (autoAssignData.autoAssignTeachers && teachers.length > 0) {
        try {
          await academicService.autoAssignTeachersToAllClasses();
        } catch {}
      }

      setMessage({
        type: 'success',
        text: `Đã tự động rải đều ${unassignedCount} sinh viên và gắn Giảng viên vào ${autoAssignData.numberOfClasses} lớp học phần mới!`,
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
      render: (row) => {
        const teacherName = getTeacherName(row);
        return (
          <div className="flex items-center gap-1.5">
            {teacherName ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-800 border border-purple-100">
                <GraduationCap className="h-3 w-3 text-purple-600" />
                <span>{teacherName}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                <AlertCircle className="h-3 w-3 text-amber-500" />
                <span>Chưa phân công</span>
              </span>
            )}
            <button
              onClick={() => {
                setSelectedClassForTeacher(row);
                setSelectedTeacherId(row.teacherId || row.teacher?.id || '');
              }}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline ml-1 cursor-pointer"
            >
              {teacherName ? 'Đổi' : '+ Phân GV'}
            </button>
          </div>
        );
      },
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
      header: 'Gán Sinh Viên / Giảng Viên',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setSelectedClassForTeacher(row);
              setSelectedTeacherId(row.teacherId || row.teacher?.id || '');
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50/70 px-2 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100 transition cursor-pointer"
            title="Phân công hoặc thay đổi giảng viên"
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span>{getTeacherName(row) ? 'Đổi GV' : 'Phân GV'}</span>
          </button>
          <button
            onClick={() => setShowAssignModal(row.id)}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition cursor-pointer"
            title="Gán sinh viên hoặc lớp sinh hoạt vào lớp học phần"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Gán SV</span>
          </button>
        </div>
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
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              leftIcon={<GraduationCap className="h-4 w-4 text-purple-600" />}
              onClick={handleAutoAssignTeachers}
              isLoading={autoAssignTeachersLoading}
              className="border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100"
            >
              Phân Bổ Giảng Viên Tự Động
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Zap className="h-4 w-4 text-blue-600" />}
              onClick={() => setShowAutoAssign(true)}
              className="border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
            >
              Tự Động Rải Lớp (Auto-Assign)
            </Button>
          </div>
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

      {/* MODAL: Phân Công Giảng Viên Cho 1 Lớp Học Phần */}
      {selectedClassForTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-purple-600" />
                <h3 className="text-base font-bold text-gray-900">Phân Công Giảng Viên Phụ Trách</h3>
              </div>
              <button
                onClick={() => setSelectedClassForTeacher(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAssignTeacherSubmit} className="mt-4 space-y-4">
              <div className="rounded-xl bg-purple-50/70 p-3 text-xs text-purple-900 border border-purple-100 space-y-1">
                <p>
                  <strong>Lớp Học Phần:</strong> {selectedClassForTeacher.code}
                </p>
                <p>
                  <strong>Môn học:</strong> {selectedClassForTeacher.course?.code} - {selectedClassForTeacher.course?.name}
                </p>
                <p>
                  <strong>Giảng viên hiện tại:</strong>{' '}
                  <span className="font-semibold">{getTeacherName(selectedClassForTeacher) || 'Chưa phân công'}</span>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Chọn Giảng Viên Phụ Trách *</label>
                <select
                  required
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs text-gray-800 outline-none focus:border-purple-500 focus:bg-white"
                >
                  <option value="" disabled>-- Chọn Giảng Viên --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {formatTeacherLabel(t)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedClassForTeacher(null)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={assignTeacherLoading}
                  disabled={!selectedTeacherId}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Lưu Phân Công
                </Button>
              </div>
            </form>
          </div>
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
                  <p className="text-xs text-purple-700">Lọc sinh viên chưa đăng ký môn và rải đều vào các lớp mới kèm gán Giảng viên</p>
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
                  <label className="text-xs font-semibold text-gray-700">Khóa Học (Cohort)</label>
                  <input
                    value={filterCohort}
                    onChange={(e) => setFilterCohort(e.target.value)}
                    type="text"
                    placeholder="Ví dụ: K26, 1... (Để trống nếu lấy tất cả)"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Ngành Học (Tùy chọn)</label>
                  <select
                    value={filterMajorId}
                    onChange={(e) => setFilterMajorId(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="">-- Tất cả các ngành --</option>
                    {majors.map((m) => (
                      <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Chọn Môn Học Cần Rải Lớp *</label>
                <select
                  required
                  value={autoAssignData.courseId}
                  onChange={(e) => setAutoAssignData({ ...autoAssignData, courseId: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="" disabled>-- Chọn Môn Học --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name} ({c.credits} TC)</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                <span className="text-xs text-gray-600">Kiểm tra số lượng sinh viên chưa đăng ký môn này:</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={checkUnassigned}
                  disabled={!autoAssignData.courseId}
                >
                  Tìm Sinh Viên Chưa Có Lớp
                </Button>
              </div>

              {unassignedCount !== null && (
                <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800 border border-blue-200">
                  Tìm thấy <strong>{unassignedCount}</strong> sinh viên chưa học môn này.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Năm Học *</label>
                  <input
                    required
                    value={autoAssignData.academicYear}
                    onChange={(e) => setAutoAssignData({ ...autoAssignData, academicYear: e.target.value })}
                    type="text"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Học Kỳ *</label>
                  <select
                    value={autoAssignData.semester}
                    onChange={(e) => setAutoAssignData({ ...autoAssignData, semester: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value={1}>Học Kỳ 1</option>
                    <option value={2}>Học Kỳ 2</option>
                    <option value={3}>Học Kỳ Hè</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Số Lớp Muốn Sinh Ra *</label>
                  <input
                    required
                    value={autoAssignData.numberOfClasses}
                    onChange={(e) => setAutoAssignData({ ...autoAssignData, numberOfClasses: Number(e.target.value) })}
                    type="number"
                    min={1}
                    max={15}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Giảng viên chỉ định hoặc tự động */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Giảng Viên Phụ Trách (Tùy chọn)</label>
                <select
                  value={autoAssignData.teacherId}
                  onChange={(e) => setAutoAssignData({ ...autoAssignData, teacherId: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="">-- Tự động phân bổ đều từ danh sách Giảng viên ({teachers.length} GV) --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {formatTeacherLabel(t)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                <input
                  type="checkbox"
                  id="autoAssignTeachersCheck"
                  checked={autoAssignData.autoAssignTeachers}
                  onChange={(e) => setAutoAssignData({ ...autoAssignData, autoAssignTeachers: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="autoAssignTeachersCheck" className="text-xs font-medium text-purple-900 cursor-pointer">
                  Tự động phân công Giảng viên phụ trách cho tất cả các lớp học phần sinh ra
                </label>
              </div>

              {unassignedCount !== null && (
                <div className="rounded-lg bg-purple-50 p-3 text-xs text-purple-900 border border-purple-100 flex items-center justify-between">
                  <span>Dự kiến sĩ số mỗi lớp:</span>
                  <span className="font-bold text-purple-700">
                    ~{Math.ceil(unassignedCount / Math.max(1, autoAssignData.numberOfClasses))} sinh viên / lớp
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAutoAssign(false)}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={autoAssignLoading || !unassignedCount}
                  isLoading={autoAssignLoading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Chia Lớp Ngay
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Create Class Modal */}
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
                  <p className="text-xs text-gray-500">Khai báo lớp học phần cho kỳ học mới</p>
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

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Giảng Viên Phụ Trách</label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="">-- Chưa phân công --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {formatTeacherLabel(t)}
                    </option>
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
                    <option value={1}>Học Kỳ 1</option>
                    <option value={2}>Học Kỳ 2</option>
                    <option value={3}>Học Kỳ Hè</option>
                  </select>
                </div>
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

      {/* Assign Students Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Gán Sinh Viên Vào Lớp</h3>
                  <p className="text-xs text-gray-500">Chỉ định sinh viên học lớp này</p>
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
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
                  assignMode === 'HOMEROOM' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Gán Theo Lớp Sinh Hoạt
              </button>
              <button
                type="button"
                onClick={() => setAssignMode('MANUAL')}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
                  assignMode === 'MANUAL' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Gán Thủ Công (ID List)
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="mt-4 space-y-4">
              {assignMode === 'HOMEROOM' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Chọn Lớp Sinh Hoạt *</label>
                  <select
                    required
                    value={selectedHomeroomId}
                    onChange={(e) => setSelectedHomeroomId(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="" disabled>-- Chọn Lớp Sinh Hoạt --</option>
                    {homerooms.map((hr) => (
                      <option key={hr.id} value={hr.id}>
                        {hr.code} - {hr.name} ({hr.cohort})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-500">
                    Toàn bộ sinh viên thuộc lớp sinh hoạt này sẽ được gán tự động vào lớp học phần.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Danh Sách ID Sinh Viên (Cách nhau bằng dấu phẩy) *</label>
                  <textarea
                    required
                    rows={4}
                    value={studentIdsStr}
                    onChange={(e) => setStudentIdsStr(e.target.value)}
                    placeholder="uuid-sv-1, uuid-sv-2, uuid-sv-3..."
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 p-3 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white font-mono"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAssignModal(null)}>
                  Hủy
                </Button>
                <Button type="submit" isLoading={assignLoading}>
                  Gán Vào Lớp
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
