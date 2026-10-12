import { useState } from 'react';
import {
  advisorService,
} from '../../../services/advisor.service';
import {
  Users,
  AlertTriangle,
  GraduationCap,
  CheckCircle,
  AlertCircle,
  X,
  FileCheck,
  TrendingUp,
} from 'lucide-react';

export default function AdvisorTab({ user }: { user: any }) {
  if (user?.role === 'STUDENT') {
    return (
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center max-w-xl mx-auto my-12">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Quyền Truy Cập Bị Giới Hạn</h3>
        <p className="text-gray-500 text-sm">
          Phân hệ Cố vấn học tập chỉ dành cho Giảng viên chủ nhiệm và Ban Giám hiệu / Quản trị viên.
        </p>
      </div>
    );
  }

  const [selectedClass, setSelectedClass] = useState('cntt-k18a');

  // Demo stats
  const classStats = {
    className: 'Lớp Sinh Hoạt CNTT-K18A',
    majorName: 'Công nghệ thông tin (K18)',
    totalStudents: 45,
    averageGpa: 3.24,
    warningCount: 3,
    totalCreditsAccumulatedAvg: 38.5,
  };

  // Demo students with warnings / training points to review
  const [studentsReview, setStudentsReview] = useState<any[]>([
    {
      id: 'st-01',
      studentCode: '202600123',
      fullName: 'Nguyễn Văn An',
      gpa: 3.45,
      accumulatedCredits: 40,
      academicStatus: 'ACTIVE',
      selfTrainingPoint: 85,
      advisorReviewed: false,
    },
    {
      id: 'st-02',
      studentCode: '202600128',
      fullName: 'Vũ Quốc Bảo',
      gpa: 1.82,
      accumulatedCredits: 22,
      academicStatus: 'WARNING_LEVEL_1', // Cảnh báo học vụ mức 1
      selfTrainingPoint: 62,
      advisorReviewed: false,
    },
    {
      id: 'st-03',
      studentCode: '202600130',
      fullName: 'Đặng Thùy Dung',
      gpa: 3.65,
      accumulatedCredits: 42,
      academicStatus: 'ACTIVE',
      selfTrainingPoint: 92,
      advisorReviewed: true,
      approvedPoint: 94,
    },
  ]);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleApprovePoint = async (st: any) => {
    try {
      await advisorService.reviewTrainingPoint({
        studentId: st.id,
        score: st.selfTrainingPoint + 2,
        status: 'APPROVED',
      });
    } catch (err) {
      console.warn('API error, demo fallback');
    }

    setStudentsReview((prev) =>
      prev.map((s) => (s.id === st.id ? { ...s, advisorReviewed: true, approvedPoint: s.selfTrainingPoint + 2 } : s))
    );
    setMessage({
      type: 'success',
      text: `Đã duyệt chốt điểm rèn luyện cho ${st.fullName} (${st.selfTrainingPoint + 2} điểm)!`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">Cố Vấn Học Tập (Homeroom Advisor)</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi tiến độ học vụ, thống kê GPA, xử lý cảnh báo học vụ và xét duyệt điểm rèn luyện của lớp sinh hoạt phụ trách.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-600">Lớp sinh hoạt:</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm bg-white font-medium text-gray-700"
          >
            <option value="cntt-k18a">CNTT-K18A (45 Sinh viên)</option>
            <option value="cntt-k17b">CNTT-K17B (38 Sinh viên)</option>
          </select>
        </div>
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

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-medium">Sĩ số lớp</span>
            <strong className="text-xl font-bold text-gray-900">{classStats.totalStudents} SV</strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-medium">GPA trung bình</span>
            <strong className="text-xl font-bold text-emerald-600">{classStats.averageGpa} / 4.0</strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-medium">Số TC tích lũy TB</span>
            <strong className="text-xl font-bold text-gray-900">{classStats.totalCreditsAccumulatedAvg} TC</strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-medium">Cảnh báo học vụ</span>
            <strong className="text-xl font-bold text-rose-600">{classStats.warningCount} Sinh viên</strong>
          </div>
        </div>
      </div>

      {/* Roster & Review Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm">Danh Sách Sinh Viên & Duyệt Điểm Rèn Luyện</h3>
        </div>

        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold">
              <th className="py-3.5 px-4">MSSV</th>
              <th className="py-3.5 px-4">Họ và Tên</th>
              <th className="py-3.5 px-4">GPA Tích Lũy</th>
              <th className="py-3.5 px-4">Số TC Đạt</th>
              <th className="py-3.5 px-4">Tình Trạng Học Vụ</th>
              <th className="py-3.5 px-4">Điểm RL Tự Chấm</th>
              <th className="py-3.5 px-4 text-right">Duyệt Điểm RL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {studentsReview.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-gray-400">
                  Lớp sinh hoạt này chưa có dữ liệu sinh viên cần xét duyệt.
                </td>
              </tr>
            ) : (
              studentsReview.map((st) => (
                <tr key={st.id} className="hover:bg-gray-50/50 transition">
                  <td className="py-3.5 px-4 font-mono font-medium text-blue-600">{st.studentCode}</td>
                <td className="py-3.5 px-4 font-bold text-gray-900">{st.fullName}</td>
                <td className="py-3.5 px-4 font-bold text-gray-700">{st.gpa}</td>
                <td className="py-3.5 px-4 text-gray-600">{st.accumulatedCredits} TC</td>
                <td className="py-3.5 px-4">
                  {st.academicStatus.includes('WARNING') ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1 w-fit">
                      <AlertTriangle className="w-3 h-3" /> Cảnh Báo Mức 1
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      Bình thường
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 font-semibold text-gray-700">
                  {st.advisorReviewed ? (
                    <span className="text-emerald-700 font-bold">{st.approvedPoint} đ (Đã chốt)</span>
                  ) : (
                    <span>{st.selfTrainingPoint} đ</span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right">
                  {!st.advisorReviewed ? (
                    <button
                      onClick={() => handleApprovePoint(st)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs flex items-center gap-1 ml-auto"
                    >
                      <FileCheck className="w-3.5 h-3.5" /> Chốt Điểm
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400 font-medium">Hoàn tất</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
        </table>
      </div>
    </div>
  );
}
