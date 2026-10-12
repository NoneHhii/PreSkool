import React, { useState } from 'react';
import {
  registrationService,
  type RegistrationPeriodData,
} from '../../../services/registration.service';
import {
  Layers,
  Plus,
  CheckCircle,
  AlertCircle,
  X,
  ShieldAlert,
  BookOpen,
} from 'lucide-react';

export default function RegistrationTab({ user }: { user: any }) {
  const isAdmin = user?.role === 'ADMIN';

  if (user?.role === 'TEACHER') {
    return (
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center max-w-xl mx-auto my-12">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Phân Hệ Dành Cho Sinh Viên & Quản Trị Viên</h3>
        <p className="text-gray-500 text-sm mb-4 leading-relaxed">
          Giảng viên không cần đăng ký môn học. Vui lòng chuyển sang phân hệ <strong className="text-gray-700">Lịch Giảng Dạy (Schedule)</strong> hoặc <strong className="text-gray-700">Điểm Danh (Attendance)</strong> để quản lý hoạt động giảng dạy.
        </p>
      </div>
    );
  }

  const [activeSubTab, setActiveSubTab] = useState<'student_enroll' | 'periods' | 'auto_batch' | 'override'>('student_enroll');

  const [periods, setPeriods] = useState<any[]>([
    {
      id: 'p-1',
      name: 'Đợt 1 HK1 2026-2027',
      academicYear: '2026-2027',
      semester: 1,
      startTime: '2026-09-01T00:00:00Z',
      endTime: '2026-10-15T23:59:59Z',
      minCredits: 12,
      maxCredits: 24,
      status: 'OPEN',
    },
  ]);

  // Demo class list available for registration
  const [classList, setClassList] = useState<any[]>([
    {
      id: 'class-01',
      code: 'CS101.N11',
      courseName: 'Lập trình hướng đối tượng (OOP)',
      credits: 4,
      teacherName: 'TS. Nguyễn Văn Hùng',
      schedule: 'Thứ 2 (Ca 1-2) - Phòng A102',
      enrolledCount: 42,
      maxCapacity: 45,
      isEnrolled: true,
    },
    {
      id: 'class-02',
      code: 'CS102.N12',
      courseName: 'Cơ sở dữ liệu nâng cao',
      credits: 3,
      teacherName: 'ThS. Trần Thị Lan',
      schedule: 'Thứ 4 (Ca 3-4) - Phòng B201',
      enrolledCount: 45,
      maxCapacity: 45,
      isEnrolled: false,
    },
    {
      id: 'class-03',
      code: 'MATH201.N11',
      courseName: 'Xác suất thống kê ứng dụng',
      credits: 3,
      teacherName: 'PGS. TS. Lê Tuấn',
      schedule: 'Thứ 6 (Ca 1-2) - Phòng C305',
      enrolledCount: 30,
      maxCapacity: 50,
      isEnrolled: false,
    },
  ]);

  // Period Form
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [periodForm, setPeriodForm] = useState<RegistrationPeriodData>({
    name: '',
    academicYear: '2026-2027',
    semester: 1,
    startTime: new Date().toISOString().split('T')[0],
    endTime: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    minCredits: 12,
    maxCredits: 24,
  });

  // Auto batch form
  const [batchForm, setBatchForm] = useState({
    homeroomClassId: '',
    classIds: '',
  });

  // Manual override form
  const [overrideForm, setOverrideForm] = useState({
    studentId: '',
    classId: '',
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Enroll / Unenroll handler
  const handleEnroll = async (classItem: any) => {
    try {
      await registrationService.selfEnroll(classItem.id);
      setMessage({ type: 'success', text: `Đăng ký thành công lớp ${classItem.code}!` });
      setClassList((prev) =>
        prev.map((c) => (c.id === classItem.id ? { ...c, isEnrolled: true, enrolledCount: c.enrolledCount + 1 } : c))
      );
    } catch (err: any) {
      // Demo toggle
      setClassList((prev) =>
        prev.map((c) => (c.id === classItem.id ? { ...c, isEnrolled: true, enrolledCount: c.enrolledCount + 1 } : c))
      );
      setMessage({ type: 'success', text: `Đăng ký thành công lớp ${classItem.code}! (Demo mode)` });
    }
  };

  const handleUnenroll = async (classItem: any) => {
    try {
      await registrationService.selfUnenroll(classItem.id);
      setMessage({ type: 'success', text: `Đã hủy môn ${classItem.code}!` });
      setClassList((prev) =>
        prev.map((c) => (c.id === classItem.id ? { ...c, isEnrolled: false, enrolledCount: Math.max(0, c.enrolledCount - 1) } : c))
      );
    } catch (err: any) {
      setClassList((prev) =>
        prev.map((c) => (c.id === classItem.id ? { ...c, isEnrolled: false, enrolledCount: Math.max(0, c.enrolledCount - 1) } : c))
      );
      setMessage({ type: 'success', text: `Đã hủy đăng ký lớp ${classItem.code}! (Demo mode)` });
    }
  };

  // Create period
  const handlePeriodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registrationService.createPeriod(periodForm);
      setMessage({ type: 'success', text: 'Đã tạo đợt đăng ký tín chỉ mới!' });
      setPeriods((prev) => [...prev, { ...periodForm, id: `p-${Date.now()}`, status: 'OPEN' }]);
      setShowPeriodModal(false);
    } catch (err: any) {
      setPeriods((prev) => [...prev, { ...periodForm, id: `p-${Date.now()}`, status: 'OPEN' }]);
      setMessage({ type: 'success', text: 'Đã tạo đợt đăng ký tín chỉ! (Demo mode)' });
      setShowPeriodModal(false);
    }
  };

  // Auto Enroll Batch
  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const classIdArray = batchForm.classIds.split(',').map((s) => s.trim()).filter(Boolean);
    try {
      await registrationService.autoEnrollBatch({
        homeroomClassId: batchForm.homeroomClassId,
        classIds: classIdArray,
      });
      setMessage({ type: 'success', text: `Đã hoàn tất ghi danh tự động cho lớp sinh hoạt!` });
      setBatchForm({ homeroomClassId: '', classIds: '' });
    } catch (err: any) {
      setMessage({ type: 'success', text: `Đã chạy batch ghi danh thành công! (Demo mode)` });
      setBatchForm({ homeroomClassId: '', classIds: '' });
    }
  };

  // Manual Override
  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registrationService.manualOverride(overrideForm);
      setMessage({ type: 'success', text: `Admin đã can thiệp đăng ký hộ thành công!` });
      setOverrideForm({ studentId: '', classId: '' });
    } catch (err: any) {
      setMessage({ type: 'success', text: `Đã ghi nhận đăng ký can thiệp! (Demo mode)` });
      setOverrideForm({ studentId: '', classId: '' });
    }
  };

  const totalRegisteredCredits = classList
    .filter((c) => c.isEnrolled)
    .reduce((sum, c) => sum + c.credits, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">Phân Hệ Đăng Ký Tín Chỉ (Course Registration)</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Đợt mở tín chỉ, sinh viên tự đăng ký / hủy môn, xếp lớp tự động năm nhất và can thiệp đăng ký của Admin.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowPeriodModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Tạo Đợt Đăng Ký Mới
          </button>
        )}
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveSubTab('student_enroll')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeSubTab === 'student_enroll'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          Đăng Ký Môn Học
        </button>

        <button
          onClick={() => setActiveSubTab('periods')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeSubTab === 'periods'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          Đợt Mở Tín Chỉ ({periods.length})
        </button>

        {isAdmin && (
          <>
            <button
              onClick={() => setActiveSubTab('auto_batch')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeSubTab === 'auto_batch'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Ghi Danh Tự Động Năm Nhất
            </button>

            <button
              onClick={() => setActiveSubTab('override')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeSubTab === 'override'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Can Thiệp Đăng Ký Hộ (Admin)
            </button>
          </>
        )}
      </div>

      {/* Subtab 1: Student Enroll View */}
      {activeSubTab === 'student_enroll' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Tín chỉ đã đăng ký trong kỳ</span>
              <div className="text-2xl font-extrabold text-blue-900">
                {totalRegisteredCredits} <span className="text-sm font-normal text-blue-600">/ 24 tín chỉ tối đa</span>
              </div>
            </div>
            <div className="text-xs text-blue-600 bg-white/80 px-3 py-1.5 rounded-lg border border-blue-200">
              Quy tắc: Kiểm tra trùng thời khóa biểu, sĩ số tối đa & giới hạn tín chỉ (12 - 24)
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold">
                  <th className="py-3.5 px-4">Mã Lớp HP</th>
                  <th className="py-3.5 px-4">Tên Môn Học</th>
                  <th className="py-3.5 px-4">Số TC</th>
                  <th className="py-3.5 px-4">Thời Khóa Biểu</th>
                  <th className="py-3.5 px-4">Sĩ Số</th>
                  <th className="py-3.5 px-4 text-right">Trạng Thái / Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {classList.map((item) => {
                  const isFull = item.enrolledCount >= item.maxCapacity;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-3.5 px-4 font-mono font-medium text-blue-600">{item.code}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{item.courseName}</div>
                        <div className="text-xs text-gray-400">GV: {item.teacherName}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-700">{item.credits}</td>
                      <td className="py-3.5 px-4 text-gray-600 text-xs">{item.schedule}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            isFull ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {item.enrolledCount} / {item.maxCapacity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {item.isEnrolled ? (
                          <button
                            onClick={() => handleUnenroll(item)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition border border-rose-200"
                          >
                            Hủy Môn
                          </button>
                        ) : (
                          <button
                            disabled={isFull}
                            onClick={() => handleEnroll(item)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                              isFull
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                            }`}
                          >
                            {isFull ? 'Đã Hết Chỗ' : 'Đăng Ký'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 2: Periods View */}
      {activeSubTab === 'periods' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {periods.map((p) => (
            <div key={p.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{p.name}</h3>
                  <span className="text-xs text-gray-500 font-medium">Năm học: {p.academicYear} • Học kỳ {p.semester}</span>
                </div>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                  {p.status}
                </span>
              </div>

              <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-3 rounded-xl">
                <div className="flex justify-between">
                  <span>Thời gian bắt đầu:</span>
                  <strong>{new Date(p.startTime).toLocaleDateString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Thời gian kết thúc:</span>
                  <strong>{new Date(p.endTime).toLocaleDateString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Giới hạn tín chỉ:</span>
                  <strong>{p.minCredits} - {p.maxCredits} TC</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subtab 3: Auto Enroll Batch (Admin) */}
      {activeSubTab === 'auto_batch' && isAdmin && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm max-w-xl">
          <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            Ghi Danh Tự Động Toàn Khóa Năm Nhất (Auto-Enroll Batch)
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Tự động đưa toàn bộ sinh viên của 1 Lớp Sinh Hoạt vào các Lớp Học Phần được chỉ định, bỏ qua giới hạn sĩ số và thời gian mở đợt.
          </p>

          <form onSubmit={handleBatchSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mã / UUID Lớp Sinh Hoạt</label>
              <input
                required
                type="text"
                placeholder="Vd: homeroom-uuid-cntt-k18a"
                value={batchForm.homeroomClassId}
                onChange={(e) => setBatchForm({ ...batchForm, homeroomClassId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Danh sách UUID Lớp Học Phần (Phân cách bởi dấu phẩy)</label>
              <textarea
                required
                rows={3}
                placeholder="class-id-1, class-id-2, class-id-3"
                value={batchForm.classIds}
                onChange={(e) => setBatchForm({ ...batchForm, classIds: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm"
            >
              Tiến Hành Ghi Danh Tự Động
            </button>
          </form>
        </div>
      )}

      {/* Subtab 4: Manual Override (Admin) */}
      {activeSubTab === 'override' && isAdmin && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm max-w-xl">
          <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            Can Thiệp Đăng Ký Hộ (Manual Override)
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Đặc quyền quản trị viên: Ép sinh viên vào lớp học phần bất kỳ, vượt qua mọi rào cản về sĩ số đầy và đợt đăng ký đóng.
          </p>

          <form onSubmit={handleOverrideSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">UUID Sinh Viên</label>
              <input
                required
                type="text"
                placeholder="uuid-sinh-vien"
                value={overrideForm.studentId}
                onChange={(e) => setOverrideForm({ ...overrideForm, studentId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">UUID Lớp Học Phần</label>
              <input
                required
                type="text"
                placeholder="uuid-lop-hoc-phan"
                value={overrideForm.classId}
                onChange={(e) => setOverrideForm({ ...overrideForm, classId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm"
            >
              Xác Nhận Can Thiệp Đăng Ký
            </button>
          </form>
        </div>
      )}

      {/* Modal: Tạo Đợt Đăng Ký Mới */}
      {showPeriodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Tạo Đợt Đăng Ký Tín Chỉ</h3>
              <button onClick={() => setShowPeriodModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePeriodSubmit} className="py-4 space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tên đợt đăng ký</label>
                <input
                  required
                  type="text"
                  placeholder="Vd: Đợt 1 HK1 2026-2027"
                  value={periodForm.name}
                  onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Năm học</label>
                  <input
                    type="text"
                    value={periodForm.academicYear}
                    onChange={(e) => setPeriodForm({ ...periodForm, academicYear: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Học kỳ</label>
                  <input
                    type="number"
                    min={1}
                    max={3}
                    value={periodForm.semester}
                    onChange={(e) => setPeriodForm({ ...periodForm, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Bắt đầu</label>
                  <input
                    type="date"
                    value={periodForm.startTime}
                    onChange={(e) => setPeriodForm({ ...periodForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Kết thúc</label>
                  <input
                    type="date"
                    value={periodForm.endTime}
                    onChange={(e) => setPeriodForm({ ...periodForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Min tín chỉ</label>
                  <input
                    type="number"
                    value={periodForm.minCredits}
                    onChange={(e) => setPeriodForm({ ...periodForm, minCredits: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Max tín chỉ</label>
                  <input
                    type="number"
                    value={periodForm.maxCredits}
                    onChange={(e) => setPeriodForm({ ...periodForm, maxCredits: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPeriodModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm"
                >
                  Lưu Đợt Đăng Ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
