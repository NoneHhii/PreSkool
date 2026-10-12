import React, { useState } from 'react';
import {
  examinationService,
  type GradeInputData,
  type AdminGradeEditData,
} from '../../../services/examination.service';
import {
  Plus,
  CheckCircle,
  AlertCircle,
  X,
  ShieldAlert,
  Calculator,
} from 'lucide-react';

export default function ExaminationTab({ user }: { user: any }) {
  const isAdmin = user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';

  const [activeSubTab, setActiveSubTab] = useState<'grade_entry' | 'exam_schedules' | 'question_bank' | 'rescore'>('grade_entry');

  // Demo Student Grades
  const [studentGrades, setStudentGrades] = useState<any[]>([
    {
      id: 'sv-001',
      studentCode: '202600123',
      fullName: 'Nguyễn Văn An',
      processScore: 8.0,
      midtermScore: 7.5,
      finalScore: 8.5,
      totalScore: 8.1,
      letterGrade: 'B',
      classId: 'class-01',
    },
    {
      id: 'sv-002',
      studentCode: '202600124',
      fullName: 'Trần Thị Mai',
      processScore: 9.0,
      midtermScore: 8.5,
      finalScore: 9.0,
      totalScore: 8.85,
      letterGrade: 'A',
      classId: 'class-01',
    },
    {
      id: 'sv-003',
      studentCode: '202600125',
      fullName: 'Lê Hoàng Nam',
      processScore: 6.0,
      midtermScore: 5.0,
      finalScore: 5.5,
      totalScore: 5.45,
      letterGrade: 'D',
      classId: 'class-01',
    },
  ]);

  // Demo Exam list
  const [exams, setExams] = useState<any[]>([
    {
      id: 'exam-01',
      className: 'Lập trình OOP (CS101.N11)',
      examDate: '2026-12-15T08:00:00Z',
      examType: 'MULTIPLE_CHOICE',
      roomsAssigned: true,
      totalRooms: 2,
    },
    {
      id: 'exam-02',
      className: 'Cơ sở dữ liệu nâng cao (CS102.N12)',
      examDate: '2026-12-18T13:30:00Z',
      examType: 'ESSAY',
      roomsAssigned: false,
    },
  ]);

  // Demo Rescore Requests
  const [rescoreList] = useState<any[]>([
    {
      id: 'rescore-01',
      studentName: 'Lê Hoàng Nam',
      studentCode: '202600125',
      className: 'Lập trình OOP',
      component: 'FINAL',
      currentScore: 5.5,
      reason: 'Bài thi cuối kỳ phần câu hỏi 4 em làm đúng đáp án nhưng bị chấm sót điểm.',
      status: 'PENDING',
    },
  ]);

  // Modals state
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedStudentGrade, setSelectedStudentGrade] = useState<any>(null);
  const [gradeForm, setGradeForm] = useState<GradeInputData>({
    processScore: 0,
    midtermScore: 0,
    finalScore: 0,
  });

  // Admin audit edit modal
  const [showAdminAuditModal, setShowAdminAuditModal] = useState(false);
  const [auditForm, setAuditForm] = useState<AdminGradeEditData>({
    finalScore: 0,
    reason: '',
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Helper compute final score & letter
  const calculateTotal = (process: number, mid: number, final: number) => {
    const total = Number((process * 0.2 + mid * 0.3 + final * 0.5).toFixed(2));
    let letter = 'F';
    if (total >= 8.5) letter = 'A';
    else if (total >= 7.0) letter = 'B';
    else if (total >= 5.5) letter = 'C';
    else if (total >= 4.0) letter = 'D';
    else letter = 'F';
    return { total, letter };
  };

  const openGradeModal = (st: any) => {
    setSelectedStudentGrade(st);
    setGradeForm({
      processScore: st.processScore,
      midtermScore: st.midtermScore,
      finalScore: st.finalScore,
    });
    setShowGradeModal(true);
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentGrade) return;

    const { total, letter } = calculateTotal(
      Number(gradeForm.processScore),
      Number(gradeForm.midtermScore),
      Number(gradeForm.finalScore)
    );

    try {
      await examinationService.submitGrades('class-01', selectedStudentGrade.id, gradeForm);
    } catch (err) {
      console.warn('API error, using demo fallback');
    }

    setStudentGrades((prev) =>
      prev.map((item) =>
        item.id === selectedStudentGrade.id
          ? {
              ...item,
              ...gradeForm,
              totalScore: total,
              letterGrade: letter,
            }
          : item
      )
    );
    setMessage({
      type: 'success',
      text: `Đã lưu điểm cho ${selectedStudentGrade.fullName}! Điểm tổng kết: ${total} (Điểm chữ: ${letter})`,
    });
    setShowGradeModal(false);
  };

  const openAdminAuditModal = (st: any) => {
    setSelectedStudentGrade(st);
    setAuditForm({
      finalScore: st.finalScore,
      reason: '',
    });
    setShowAdminAuditModal(true);
  };

  const handleAdminAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentGrade) return;

    const { total, letter } = calculateTotal(
      Number(selectedStudentGrade.processScore),
      Number(selectedStudentGrade.midtermScore),
      Number(auditForm.finalScore)
    );

    try {
      await examinationService.auditEditGrades('class-01', selectedStudentGrade.id, auditForm);
    } catch (err) {
      console.warn('API error, using demo fallback');
    }

    setStudentGrades((prev) =>
      prev.map((item) =>
        item.id === selectedStudentGrade.id
          ? {
              ...item,
              finalScore: auditForm.finalScore,
              totalScore: total,
              letterGrade: letter,
            }
          : item
      )
    );
    setMessage({
      type: 'success',
      text: `Admin sửa điểm kiểm toán thành công (Lý do: "${auditForm.reason}")!`,
    });
    setShowAdminAuditModal(false);
  };

  // Auto assign rooms & generate SBD
  const handleAssignRooms = async (exam: any) => {
    try {
      await examinationService.assignRooms(exam.id, [
        { roomName: 'A101', capacity: 30 },
        { roomName: 'A102', capacity: 30 },
      ]);
    } catch (err) {
      console.warn('API error, using demo fallback');
    }

    setExams((prev) =>
      prev.map((item) => (item.id === exam.id ? { ...item, roomsAssigned: true, totalRooms: 2 } : item))
    );
    setMessage({
      type: 'success',
      text: `Đã tự động chia phòng thi (A101, A102) và sinh Số Báo Danh (SBD) tự động cho ca thi!`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">Phân Hệ Khảo Thí & Điểm Số (Examination & Grading)</h2>
            <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full font-medium">
              {isAdmin
                ? 'Quyền: Quản Trị Viên (Phân phòng, duyệt điểm & audit)'
                : isTeacher
                ? 'Quyền: Giảng Viên (Nhập điểm & Ngân hàng đề)'
                : 'Quyền: Sinh Viên (Tra cứu bảng điểm cá nhân & Lịch thi)'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Xếp lịch & chia phòng thi SBD tự động, nhập điểm quy đổi chữ A/B/C/D/F, sửa điểm có Audit Log, ngân hàng câu hỏi & phúc khảo.
          </p>
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

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveSubTab('grade_entry')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeSubTab === 'grade_entry' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          {isStudent ? 'Bảng Điểm Cá Nhân' : 'Nhập & Quản Lý Điểm Số'}
        </button>

        <button
          onClick={() => setActiveSubTab('exam_schedules')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeSubTab === 'exam_schedules' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          {isStudent ? 'Lịch Thi & Phòng Thi' : 'Lịch Thi & Xếp Phòng Tự Động'}
        </button>

        <button
          onClick={() => setActiveSubTab('rescore')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeSubTab === 'rescore' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          Đơn Phúc Khảo Điểm
        </button>

        {!isStudent && (
          <button
            onClick={() => setActiveSubTab('question_bank')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeSubTab === 'question_bank' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Ngân Hàng Câu Hỏi
          </button>
        )}
      </div>

      {/* Subtab 1: Grade Entry */}
      {activeSubTab === 'grade_entry' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-800">Lớp học phần:</span>
              <select className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm bg-white font-medium text-gray-700">
                <option>CS101.N11 - Lập trình OOP (4 TC)</option>
                <option>CS102.N12 - Cơ sở dữ liệu nâng cao (3 TC)</option>
              </select>
            </div>
            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-blue-600" />
              Công thức: 20% Quá trình + 30% Giữa kỳ + 50% Cuối kỳ → Quy đổi (A, B, C, D, F)
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold">
                  <th className="py-3.5 px-4">MSSV</th>
                  <th className="py-3.5 px-4">Họ và Tên</th>
                  <th className="py-3.5 px-4">Quá Trình (20%)</th>
                  <th className="py-3.5 px-4">Giữa Kỳ (30%)</th>
                  <th className="py-3.5 px-4">Cuối Kỳ (50%)</th>
                  <th className="py-3.5 px-4">Tổng Kết (Hệ 10)</th>
                  <th className="py-3.5 px-4">Điểm Chữ</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {studentGrades.map((st) => (
                  <tr key={st.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-4 font-mono font-medium text-blue-600">{st.studentCode}</td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">{st.fullName}</td>
                    <td className="py-3.5 px-4 text-gray-700">{st.processScore}</td>
                    <td className="py-3.5 px-4 text-gray-700">{st.midtermScore}</td>
                    <td className="py-3.5 px-4 text-gray-700 font-semibold">{st.finalScore}</td>
                    <td className="py-3.5 px-4 font-extrabold text-blue-600">{st.totalScore}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          st.letterGrade === 'A'
                            ? 'bg-emerald-100 text-emerald-800'
                            : st.letterGrade === 'B'
                            ? 'bg-blue-100 text-blue-800'
                            : st.letterGrade === 'C'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {st.letterGrade}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {!isStudent ? (
                        <div className="flex items-center justify-end gap-2">
                          {/* Teacher / Admin Entry */}
                          <button
                            onClick={() => openGradeModal(st)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                          >
                            Nhập / Sửa Điểm
                          </button>

                          {/* Admin Audit Edit */}
                          {isAdmin && (
                            <button
                              onClick={() => openAdminAuditModal(st)}
                              title="Sửa điểm có kiểm toán (Admin)"
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition border border-rose-200 flex items-center gap-1"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" /> Audit Edit
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-full">
                          Điểm chính thức
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 2: Exam Schedules & Rooms */}
      {activeSubTab === 'exam_schedules' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((ex) => (
              <div key={ex.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{ex.className}</h3>
                    <span className="text-xs text-gray-400">Hình thức: {ex.examType}</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                      ex.roomsAssigned ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {ex.roomsAssigned ? `Đã xếp ${ex.totalRooms} phòng` : 'Chưa xếp phòng'}
                  </span>
                </div>

                <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl space-y-1">
                  <div className="flex justify-between">
                    <span>Ngày & Giờ thi:</span>
                    <strong>{new Date(ex.examDate).toLocaleString()}</strong>
                  </div>
                </div>

                {isAdmin && !ex.roomsAssigned && (
                  <button
                    onClick={() => handleAssignRooms(ex)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-semibold transition shadow-xs"
                  >
                    Xếp Phòng Thi & Sinh SBD Tự Động
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 3: Rescore Requests */}
      {activeSubTab === 'rescore' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
          <h3 className="font-bold text-gray-900 text-base">Đơn Phúc Khảo Điểm Thi</h3>
          <div className="space-y-3">
            {rescoreList.map((r) => (
              <div key={r.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-gray-900">{r.studentName} ({r.studentCode})</span>
                    <span className="text-xs text-gray-500 block">Môn: {r.className} • Phần điểm: {r.component} (Hiện tại: {r.currentScore})</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                    {r.status}
                  </span>
                </div>
                <p className="text-xs text-gray-600 italic">"{r.reason}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 4: Question Bank */}
      {activeSubTab === 'question_bank' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-900 text-base">Ngân Hàng Câu Hỏi Trắc Nghiệm / Tự Luận</h3>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Thêm Câu Hỏi
            </button>
          </div>
          <div className="space-y-3">
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Môn: Lập trình OOP (CS101)</span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">Độ khó: DỄ</span>
              </div>
              <p className="text-sm font-semibold text-gray-800 mb-2">Đặc tính nào sau đây KHÔNG PHẢI là tính chất của OOP?</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="p-2 bg-white rounded-lg border border-gray-100">A. Tính đóng gói</div>
                <div className="p-2 bg-white rounded-lg border border-gray-100">B. Tính kế thừa</div>
                <div className="p-2 bg-white rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold">C. Tính tuần tự hóa (Đáp án đúng)</div>
                <div className="p-2 bg-white rounded-lg border border-gray-100">D. Tính đa hình</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nhập điểm giảng viên */}
      {showGradeModal && selectedStudentGrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                Nhập Điểm: {selectedStudentGrade.fullName}
              </h3>
              <button onClick={() => setShowGradeModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGradeSubmit} className="py-4 space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Điểm quá trình (Hệ số 20%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  required
                  value={gradeForm.processScore}
                  onChange={(e) => setGradeForm({ ...gradeForm, processScore: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Điểm giữa kỳ (Hệ số 30%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  required
                  value={gradeForm.midtermScore}
                  onChange={(e) => setGradeForm({ ...gradeForm, midtermScore: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Điểm thi cuối kỳ (Hệ số 50%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  required
                  value={gradeForm.finalScore}
                  onChange={(e) => setGradeForm({ ...gradeForm, finalScore: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-900">
                Điểm dự kiến: <strong>{calculateTotal(Number(gradeForm.processScore), Number(gradeForm.midtermScore), Number(gradeForm.finalScore)).total}</strong> (Điểm chữ: <strong>{calculateTotal(Number(gradeForm.processScore), Number(gradeForm.midtermScore), Number(gradeForm.finalScore)).letter}</strong>)
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGradeModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm"
                >
                  Lưu & Tính Điểm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Admin Audit Edit Grades */}
      {showAdminAuditModal && selectedStudentGrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-rose-600 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Sửa Điểm Có Kiểm Toán (Audit)
              </h3>
              <button onClick={() => setShowAdminAuditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminAuditSubmit} className="py-4 space-y-3 text-sm">
              <p className="text-xs text-gray-500">
                Sửa điểm sau khi đã khóa cho SV <strong>{selectedStudentGrade.fullName}</strong>. Bắt buộc nhập lý do (phúc khảo, chấm lại, quyết định hội đồng).
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Điểm cuối kỳ mới</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  required
                  value={auditForm.finalScore}
                  onChange={(e) => setAuditForm({ ...auditForm, finalScore: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Lý do điều chỉnh (bắt buộc)</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Vd: Phúc khảo điểm thi, chấm lại theo đơn của sinh viên..."
                  value={auditForm.reason}
                  onChange={(e) => setAuditForm({ ...auditForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-rose-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdminAuditModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium shadow-sm"
                >
                  Xác Nhận & Lưu Audit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
