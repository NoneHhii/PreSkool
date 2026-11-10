import React, { useState, useEffect } from 'react';
import { academicService, type Course } from '../../../services/academic.service';
import { BookOpen, AlertCircle, CheckCircle, X } from 'lucide-react';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { type Column } from '../../../components/common/DataTable';
import StatusBadge from '../../../components/common/StatusBadge';
import Button from '../../../components/common/Button';

export default function CoursesTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({ code: '', name: '', credits: 3, description: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await academicService.getCourses();
      setCourses(res.data || []);
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
      await academicService.createCourse(formData);
      setMessage({ type: 'success', text: 'Tạo Môn học mới thành công!' });
      setFormData({ code: '', name: '', credits: 3, description: '' });
      setShowModal(false);
      fetchCourses();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Không thể tạo Môn học' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns: Column<Course>[] = [
    {
      key: 'code',
      header: 'Mã Môn Học',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-blue-600 hover:underline cursor-pointer">
          {row.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Tên Môn Học',
      sortable: true,
      render: (row) => <span className="font-medium text-gray-900">{row.name}</span>,
    },
    {
      key: 'credits',
      header: 'Số Tín Chỉ',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
          {row.credits} Tín chỉ
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Mô Tả Học Phần',
      render: (row) => <span className="text-gray-500 truncate max-w-xs block">{row.description || '-'}</span>,
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      render: () => <StatusBadge status="Active" label="Đang giảng dạy" />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản Lý Môn Học (Subjects / Courses)"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Academic' },
          { label: 'Courses' },
        ]}
        actionLabel="Thêm Môn Học Mới"
        onActionClick={() => setShowModal(true)}
        onRefresh={fetchCourses}
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
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Thêm Môn Học Mới</h3>
                  <p className="text-xs text-gray-500">Cấu hình môn học vào chương trình đào tạo</p>
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
                  <label className="text-xs font-semibold text-gray-700">Mã Môn Học *</label>
                  <input
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    type="text"
                    placeholder="Ví dụ: CS101, SE202..."
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Số Tín Chỉ *</label>
                  <input
                    required
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                    type="number"
                    min={1}
                    max={10}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Tên Môn Học *</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  type="text"
                  placeholder="Nhập môn Lập trình, Cấu trúc dữ liệu..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Mô Tả Học Phần</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Mô tả nội dung môn học, chuẩn đầu ra..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 outline-none resize-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
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
                  isLoading={submitLoading}
                >
                  Lưu Môn Học
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DataTable
        title="Danh Sách Môn Học"
        data={courses}
        columns={columns}
        keyExtractor={(row) => row.id}
        isLoading={loading}
        emptyMessage="Chưa có môn học nào trong hệ thống."
      />
    </div>
  );
}
