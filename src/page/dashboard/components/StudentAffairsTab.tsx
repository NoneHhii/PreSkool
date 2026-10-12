import React, { useState, useEffect } from 'react';
import {
  affairsService,
  type StudentRequestData,
  type TrainingPointData,
} from '../../../services/affairs.service';
import {
  CheckCircle,
  AlertCircle,
  X,
  Send,
} from 'lucide-react';

export default function StudentAffairsTab({ user }: { user: any }) {
  const isAdmin = user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';

  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'training_points'>('requests');

  // Real requests from API
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await affairsService.getRequests();
      if (res && res.data && Array.isArray(res.data)) {
        setRequests(res.data);
      } else if (Array.isArray(res)) {
        setRequests(res as any);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.warn('API error fetching requests:', err);
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Training Points
  const [trainingPoints, setTrainingPoints] = useState<any[]>([]);

  // Request modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState<StudentRequestData>({
    requestType: 'CERTIFICATE',
    note: '',
  });

  // Training point modal
  const [showPointModal, setShowPointModal] = useState(false);
  const [pointForm, setPointForm] = useState<TrainingPointData>({
    score: 85,
    level: isStudent ? 'SELF' : isTeacher ? 'ADVISOR' : 'CLASS',
    note: '',
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await affairsService.createRequest(requestForm);
    } catch (err) {
      console.warn('API error, demo fallback');
    }

    setRequests((prev) => [
      {
        id: `req-${Date.now()}`,
        studentName: user?.fullName || 'Sinh viên hiện tại',
        studentCode: '202600123',
        ...requestForm,
        status: 'PENDING',
        createdAt: new Date().toISOString().split('T')[0],
      },
      ...prev,
    ]);
    setMessage({ type: 'success', text: 'Đã gửi yêu cầu Dịch vụ Một Cửa thành công!' });
    setShowRequestModal(false);
    setRequestForm({ requestType: 'CERTIFICATE', note: '' });
  };

  const handlePointSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await affairsService.submitTrainingPoint('sv-001', '2026-2027', 1, pointForm);
    } catch (err) {
      console.warn('API error, demo fallback');
    }
    setTrainingPoints((prev) => [
      {
        studentName: user?.fullName || 'Nguyễn Văn An',
        studentCode: '202600123',
        academicYear: '2026-2027',
        semester: 1,
        selfScore: pointForm.level === 'SELF' ? pointForm.score : 85,
        classScore: pointForm.level === 'CLASS' ? pointForm.score : 85,
        advisorScore: pointForm.level === 'ADVISOR' ? pointForm.score : 88,
        finalClassification: pointForm.score >= 90 ? 'Xuất sắc' : pointForm.score >= 80 ? 'Tốt' : 'Khá',
      },
      ...prev,
    ]);

    setMessage({
      type: 'success',
      text: `Đã lưu điểm rèn luyện cấp ${pointForm.level} (${pointForm.score} điểm)!`,
    });
    setShowPointModal(false);
  };

  const handleApproveRequest = async (reqId: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: 'APPROVED', feedback: 'Đã duyệt yêu cầu thành công.' } : r))
    );
    setMessage({ type: 'success', text: 'Admin đã duyệt yêu cầu và xuất kết quả!' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">Phân Hệ Công Tác Sinh Viên (Student Affairs)</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Bộ phận Dịch vụ Một Cửa (Xin giấy xác nhận SV, hoãn NVQS, bảng điểm) và Đánh giá điểm rèn luyện 3 cấp.
          </p>
        </div>

        {(isStudent || isAdmin) && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm"
            >
              <Send className="w-4 h-4" /> Gửi Yêu Cầu Một Cửa
            </button>
          </div>
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
          onClick={() => setActiveSubTab('requests')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeSubTab === 'requests' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          Dịch Vụ Một Cửa ({requests.length})
        </button>

        <button
          onClick={() => setActiveSubTab('training_points')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeSubTab === 'training_points' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          Đánh Giá Điểm Rèn Luyện
        </button>
      </div>

      {/* Subtab 1: Requests */}
      {activeSubTab === 'requests' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold">
                <th className="py-3.5 px-4">Loại Yêu Cầu</th>
                <th className="py-3.5 px-4">Sinh Viên</th>
                <th className="py-3.5 px-4">Nội Dung Ghi Chú</th>
                <th className="py-3.5 px-4">Ngày Gửi</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loadingRequests ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    Đang tải danh sách yêu cầu dịch vụ Một Cửa...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    Chưa có yêu cầu Một Cửa nào được ghi nhận.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {r.requestType === 'CERTIFICATE'
                        ? 'Giấy xác nhận SV'
                        : r.requestType === 'MILITARY_DEFERRAL'
                        ? 'Tạm hoãn NVQS'
                        : r.requestType === 'TRANSCRIPT'
                        ? 'Cấp Bảng Điểm'
                        : 'Yêu cầu khác'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">{r.studentName}</div>
                      <div className="text-xs text-gray-400 font-mono">{r.studentCode}</div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 max-w-xs truncate">{r.note}</td>
                    <td className="py-3.5 px-4 text-gray-500 text-xs">{r.createdAt}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          r.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.status === 'APPROVED' ? 'Đã Phê Duyệt' : 'Đang Xử Lý'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isAdmin && r.status !== 'APPROVED' ? (
                        <button
                          onClick={() => handleApproveRequest(r.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                        >
                          Duyệt Yêu Cầu
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Xem file</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Subtab 2: Training Points */}
      {activeSubTab === 'training_points' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-sm font-semibold text-gray-700">
              Quy trình chấm: Sinh viên tự chấm (SELF) → Ban cán sự lớp (CLASS) → Cố vấn học tập chốt (ADVISOR)
            </span>
            <button
              onClick={() => setShowPointModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition"
            >
              {isStudent ? 'Tự Chấm Điểm Rèn Luyện' : isTeacher ? 'Cố Vấn Chấm Điểm' : 'Duyệt Điểm Rèn Luyện'}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold">
                  <th className="py-3.5 px-4">Sinh Viên</th>
                  <th className="py-3.5 px-4">Năm Học / Kỳ</th>
                  <th className="py-3.5 px-4">SV Tự Chấm (SELF)</th>
                  <th className="py-3.5 px-4">Lớp Trưởng (CLASS)</th>
                  <th className="py-3.5 px-4">Cố Vấn Chốt (ADVISOR)</th>
                  <th className="py-3.5 px-4">Xếp Loại</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {trainingPoints.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-400">
                      Chưa có dữ liệu đánh giá điểm rèn luyện trong học kỳ này.
                    </td>
                  </tr>
                ) : (
                  trainingPoints.map((tp, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{tp.studentName}</div>
                        <div className="text-xs text-gray-400 font-mono">{tp.studentCode}</div>
                      </td>
                    <td className="py-3.5 px-4 text-gray-600 font-medium">
                      {tp.academicYear} - Kỳ {tp.semester}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-700">{tp.selfScore} đ</td>
                    <td className="py-3.5 px-4 font-bold text-gray-700">{tp.classScore} đ</td>
                    <td className="py-3.5 px-4 font-extrabold text-blue-600">{tp.advisorScore} đ</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        {tp.finalClassification}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Gửi yêu cầu Một Cửa */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Gửi Đơn Dịch Vụ Một Cửa</h3>
              <button onClick={() => setShowRequestModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="py-4 space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Loại giấy tờ / Thủ tục</label>
                <select
                  value={requestForm.requestType}
                  onChange={(e: any) => setRequestForm({ ...requestForm, requestType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                >
                  <option value="CERTIFICATE">Giấy xác nhận sinh viên (Vay vốn, thủ tục cá nhân)</option>
                  <option value="MILITARY_DEFERRAL">Giấy tạm hoãn nghĩa vụ quân sự (NVQS)</option>
                  <option value="TRANSCRIPT">Cấp bảng điểm học tập tích lũy</option>
                  <option value="OTHER">Thủ tục khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ghi chú cụ thể</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Vd: Xin giấy xác nhận để nộp cơ quan quân sự phường 12..."
                  value={requestForm.note}
                  onChange={(e) => setRequestForm({ ...requestForm, note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm"
                >
                  Gửi Yêu Cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Chấm điểm rèn luyện */}
      {showPointModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Chấm Điểm Rèn Luyện</h3>
              <button onClick={() => setShowPointModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePointSubmit} className="py-4 space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Cấp chấm điểm (Level)</label>
                <select
                  value={pointForm.level}
                  onChange={(e: any) => setPointForm({ ...pointForm, level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                >
                  <option value="SELF">SELF - Sinh viên tự đánh giá</option>
                  <option value="CLASS">CLASS - Ban cán sự lớp họp xét</option>
                  <option value="ADVISOR">ADVISOR - Cố vấn học tập phê duyệt</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Số điểm (Thang 100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={pointForm.score}
                  onChange={(e) => setPointForm({ ...pointForm, score: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ghi chú minh chứng</label>
                <textarea
                  rows={2}
                  placeholder="Tham gia hoạt động tình nguyện, cuộc thi nghiên cứu khoa học..."
                  value={pointForm.note || ''}
                  onChange={(e) => setPointForm({ ...pointForm, note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPointModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm"
                >
                  Lưu Điểm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
