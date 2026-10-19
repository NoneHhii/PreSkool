import React, { useState, useEffect } from 'react';
import { academicService, type HomeroomClass, type Major } from '../../../services/academic.service';
import { GraduationCap, AlertCircle, CheckCircle, Zap, X } from 'lucide-react';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { type Column } from '../../../components/common/DataTable';
import StatusBadge from '../../../components/common/StatusBadge';
import Button from '../../../components/common/Button';

export default function HomeroomsTab() {
  const [homerooms, setHomerooms] = useState<HomeroomClass[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({ code: '', name: '', majorId: '', cohort: '', advisorId: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto Assign Homerooms Modal
  const [showAutoAssign, setShowAutoAssign] = useState(false);
  const [autoAssignData, setAutoAssignData] = useState({ majorId: '', cohort: '', numberOfClasses: 1, prefix: '', suffix: '' });
  const [autoAssignLoading, setAutoAssignLoading] = useState(false);
  const [unassignedCount, setUnassignedCount] = useState<number | null>(null);
  const [unassignedStudentIds, setUnassignedStudentIds] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [homeroomsRes, majorsRes, teachersRes] = await Promise.all([
        academicService.getHomerooms(),
        academicService.getMajors(),
        academicService.getTeachers(),
      ]);
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
      await academicService.createHomeroom({
        ...formData,
        advisorId: formData.advisorId || undefined,
      });
      setMessage({ type: 'success', text: 'Tạo Lớp Hành Chính thành công!' });
      setFormData({ code: '', name: '', majorId: '', cohort: '', advisorId: '' });
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Không thể tạo lớp hành chính' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const checkUnassigned = async () => {
    if (!autoAssignData.cohort || !autoAssignData.majorId) return;
    try {
      const res = await academicService.getUnassignedHomeroomStudents({
        cohort: autoAssignData.cohort,
        majorId: autoAssignData.majorId,
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
      alert('Không có sinh viên hợp lệ để phân lớp!');
      return;
    }

    setAutoAssignLoading(true);
    setMessage(null);
    try {
      await academicService.autoAssignHomerooms({
        majorId: autoAssignData.majorId,
        cohort: autoAssignData.cohort,
        studentIds: unassignedStudentIds,
        numberOfClasses: autoAssignData.numberOfClasses,
        prefix: autoAssignData.prefix,
        suffix: autoAssignData.suffix || undefined,
      });
      setMessage({
        type: 'success',
        text: `Tự động tạo lớp và phân phối thành công ${unassignedCount} tân sinh viên!`,
      });
      setShowAutoAssign(false);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Không thể tự động phân lớp' });
    } finally {
      setAutoAssignLoading(false);
    }
  };

  const columns: Column<HomeroomClass>[] = [
    {
      key: 'code',
      header: 'Mã Lớp',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-blue-600 hover:underline cursor-pointer">
          {row.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Tên Lớp Hành Chính',
      sortable: true,
      render: (row) => <span className="font-medium text-gray-900">{row.name}</span>,
    },
    {
      key: 'cohort',
      header: 'Khóa Học',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center rounded bg-purple-50 px-2 py-0.5 text-xs font-bold text-purple-700">
          {row.cohort}
        </span>
      ),
    },
    {
      key: 'major',
      header: 'Ngành',
      render: (row) => <span className="text-gray-700">{row.major?.name || '-'}</span>,
    },
    {
      key: 'advisor',
      header: 'Cố Vấn Học Tập',
      render: (row) => (
        <span className="text-xs text-gray-600">
          {row.advisor ? row.advisor.fullName || row.advisor.username : <span className="text-gray-400 italic">Chưa gán</span>}
        </span>
      ),
    },
    {
      key: 'students',
      header: 'Sĩ Số',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
          {row._count?.students ?? row.students?.length ?? 0} SV
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      render: () => <StatusBadge status="Active" label="Hoạt động" />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản Lý Lớp Hành Chính (Homeroom Classes)"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Academic' },
          { label: 'Homerooms' },
        ]}
        actionLabel="Tạo Lớp Mới"
        onActionClick={() => setShowModal(true)}
        onRefresh={fetchData}
        extraActions={
          <Button
            variant="secondary"
            leftIcon={<Zap className="h-4 w-4 text-purple-600" />}
            onClick={() => setShowAutoAssign(true)}
            className="border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100"
          >
            Phân Lớp Tự Động (Auto-Assign)
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
                  <h3 className="text-base font-bold text-gray-900">Phân Lớp Hành Chính Tự Động</h3>
                  <p className="text-xs text-purple-700">Lọc tân sinh viên chưa có lớp và tự động chia đều vào các lớp mới</p>
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
                  <label className="text-xs font-semibold text-gray-700">Khóa Học (Cohort) *</label>
                  <input
                    required
                    value={autoAssignData.cohort}
                    onChange={(e) => setAutoAssignData({ ...autoAssignData, cohort: e.target.value })}
                    type="text"
                    placeholder="Ví dụ: K26, K18..."
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Ngành Học *</label>
                  <select
                    required
                    value={autoAssignData.majorId}
                    onChange={(e) => setAutoAssignData({ ...autoAssignData, majorId: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="" disabled>-- Chọn Ngành --</option>
                    {majors.map((m) => (
                      <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                <span className="text-xs text-gray-600">Kiểm tra số lượng sinh viên chưa có lớp:</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={checkUnassigned}
                  disabled={!autoAssignData.cohort || !autoAssignData.majorId}
                >
                  Tìm Sinh Viên Chưa Có Lớp
                </Button>
              </div>

              {unassignedCount !== null && (
                <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800 border border-blue-200">
                  Tìm thấy <strong>{unassignedCount}</strong> sinh viên chưa được xếp vào lớp hành chính.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Tiền Tố Tên Lớp (Prefix) *</label>
                  <input
                    required
                    value={autoAssignData.prefix}
                    onChange={(e) => setAutoAssignData({ ...autoAssignData, prefix: e.target.value })}
                    type="text"
                    placeholder="Ví dụ: DHKTPM26"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Hậu Tố Tên Lớp (Suffix)</label>
                  <input
                    value={autoAssignData.suffix}
                    onChange={(e) => setAutoAssignData({ ...autoAssignData, suffix: e.target.value })}
                    type="text"
                    placeholder="Ví dụ: TT (Tùy chọn)"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Số Lớp Muốn Sinh Ra (Number of Classes) *</label>
                <input
                  required
                  value={autoAssignData.numberOfClasses}
                  onChange={(e) => setAutoAssignData({ ...autoAssignData, numberOfClasses: Number(e.target.value) })}
                  type="number"
                  min={1}
                  max={20}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              {autoAssignData.prefix && (
                <div className="rounded-lg bg-purple-50 p-3 text-xs text-purple-900 border border-purple-100 space-y-1">
                  <div className="font-semibold flex items-center justify-between">
                    <span>Xem trước các lớp dự kiến:</span>
                    {unassignedCount !== null && (
                      <span className="text-purple-700 font-bold">
                        ~{Math.ceil(unassignedCount / Math.max(1, autoAssignData.numberOfClasses))} sinh viên / lớp
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-purple-700 flex flex-wrap gap-1.5 pt-1">
                    {Array.from({ length: Math.min(10, Math.max(1, autoAssignData.numberOfClasses)) }, (_, i) => {
                      const letter = String.fromCharCode(65 + i);
                      return `${autoAssignData.prefix}${letter}${autoAssignData.suffix ? `-${autoAssignData.suffix}` : ''}`;
                    }).join(', ')}
                    {autoAssignData.numberOfClasses > 10 ? '...' : ''}
                  </div>
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
                  Chạy Phân Lớp Tự Động
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Tạo Lớp Hành Chính Mới</h3>
                  <p className="text-xs text-gray-500">Khai báo lớp hành chính và phân công cố vấn học tập</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Mã Lớp *</label>
                  <input
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    type="text"
                    placeholder="Ví dụ: 26SE01"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Khóa (Cohort) *</label>
                  <input
                    required
                    value={formData.cohort}
                    onChange={(e) => setFormData({ ...formData, cohort: e.target.value })}
                    type="text"
                    placeholder="Ví dụ: K26"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Tên Lớp Hành Chính *</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  type="text"
                  placeholder="Lớp 26SE01 - Kỹ Thuật Phần Mềm..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Ngành Học *</label>
                <select
                  required
                  value={formData.majorId}
                  onChange={(e) => setFormData({ ...formData, majorId: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="" disabled>-- Chọn Ngành Học --</option>
                  {majors.map((m) => (
                    <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Cố Vấn Học Tập (Giảng viên)</label>
                <select
                  value={formData.advisorId}
                  onChange={(e) => setFormData({ ...formData, advisorId: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="">-- Chưa chỉ định --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.fullName || t.username} ({t.email})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={!formData.majorId} isLoading={submitLoading}>
                  Lưu Lớp Hành Chính
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DataTable
        title="Danh Sách Lớp Hành Chính"
        data={homerooms}
        columns={columns}
        keyExtractor={(row) => row.id}
        isLoading={loading}
        emptyMessage="Chưa có lớp hành chính nào trong hệ thống."
      />
    </div>
  );
}
