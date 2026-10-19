import React, { useState, useEffect } from 'react';
import { academicService, type Major, type Faculty } from '../../../services/academic.service';
import { GraduationCap, AlertCircle, CheckCircle, X } from 'lucide-react';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { type Column } from '../../../components/common/DataTable';
import StatusBadge from '../../../components/common/StatusBadge';
import Button from '../../../components/common/Button';

export default function MajorsTab() {
  const [majors, setMajors] = useState<Major[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({ code: '', name: '', facultyId: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [majorsRes, facultiesRes] = await Promise.all([
        academicService.getMajors(),
        academicService.getFaculties(),
      ]);
      setMajors(majorsRes.data || []);
      setFaculties(facultiesRes.data || []);
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
      await academicService.createMajor(formData);
      setMessage({ type: 'success', text: 'Tạo Ngành học mới thành công!' });
      setFormData({ code: '', name: '', facultyId: '' });
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Không thể tạo Ngành học' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns: Column<Major>[] = [
    {
      key: 'code',
      header: 'Mã Ngành',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-blue-600 hover:underline cursor-pointer">
          {row.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Tên Ngành Đào Tạo',
      sortable: true,
      render: (row) => <span className="font-medium text-gray-900">{row.name}</span>,
    },
    {
      key: 'faculty',
      header: 'Khoa Trực Thuộc',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center rounded-md bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
          {row.faculty?.name || row.facultyId}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      render: () => <StatusBadge status="Active" label="Đang tuyển sinh" />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản Lý Ngành Học (Majors)"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Academic' },
          { label: 'Majors' },
        ]}
        actionLabel="Thêm Ngành Mới"
        onActionClick={() => setShowModal(true)}
        onRefresh={fetchData}
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

      {/* Modal tạo mới */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Thêm Ngành Học Mới</h3>
                  <p className="text-xs text-gray-500">Gán ngành học trực thuộc khoa tương ứng</p>
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
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Mã Ngành (Code) *</label>
                <input
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  type="text"
                  placeholder="Ví dụ: SE, CS, IT, AI..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Tên Ngành Học (Name) *</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  type="text"
                  placeholder="Kỹ Thuật Phần Mềm..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Thuộc Khoa / Viện *</label>
                <select
                  required
                  value={formData.facultyId}
                  onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                >
                  <option value="" disabled>-- Chọn Khoa Trực Thuộc --</option>
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={!formData.facultyId}
                  isLoading={submitLoading}
                >
                  Lưu Ngành Học
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DataTable
        title="Danh Sách Ngành Học"
        data={majors}
        columns={columns}
        keyExtractor={(row) => row.id}
        isLoading={loading}
        emptyMessage="Chưa có ngành học nào trong hệ thống."
      />
    </div>
  );
}
