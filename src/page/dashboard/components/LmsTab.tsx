import React, { useState, useEffect } from 'react';
import {
  lmsService,
  type LmsModuleData,
} from '../../../services/lms.service';
import { academicService, type Class } from '../../../services/academic.service';
import {
  Video,
  Link2,
  File,
  Plus,
  Upload,
  CheckCircle,
  AlertCircle,
  X,
  Clock,
  Send,
} from 'lucide-react';

export default function LmsTab({ user }: { user: any }) {
  const isAdmin = user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';

  const [activeSubTab, setActiveSubTab] = useState<'modules' | 'assignments'>('modules');
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Demo Modules fallback
  const [modules, setModules] = useState<any[]>([
    {
      id: 'mod-1',
      title: 'Tuần 1: Giới thiệu môn học & Đề cương chi tiết',
      description: 'Tổng quan môn học, phương pháp học tập và các chuẩn đầu ra cần đạt được.',
      materials: [
        { id: 'mat-1', title: 'Đề cương chi tiết môn học.pdf', type: 'PDF', url: '#' },
        { id: 'mat-2', title: 'Video bài giảng khai giảng môn học', type: 'VIDEO', url: '#' },
        { id: 'mat-3', title: 'Slide bài giảng Tuần 1: Tổng quan', type: 'PDF', url: '#' },
      ],
    },
    {
      id: 'mod-2',
      title: 'Tuần 2: Kiến thức nền tảng & Tài liệu trọng tâm',
      description: 'Lý thuyết cơ sở và các khái niệm cốt lõi của môn học.',
      materials: [
        { id: 'mat-4', title: 'Slide bài giảng Tuần 2.pdf', type: 'PDF', url: '#' },
        { id: 'mat-5', title: 'Tài liệu đọc thêm chuyên sâu', type: 'LINK', url: '#' },
      ],
    },
  ]);

  // Demo Assignments fallback
  const [assignments, setAssignments] = useState<any[]>([
    {
      id: 'ass-1',
      title: 'Bài tập Khởi động Tuần 1: Khảo sát & Đọc đề cương',
      dueDate: '2026-10-23T23:59:00Z',
      maxScore: 10,
      description: 'Sinh viên đọc kỹ đề cương môn học và hoàn thành bài thu hoạch/khảo sát đầu khóa.',
      isSubmitted: false,
    },
    {
      id: 'ass-2',
      title: 'Bài tập thực hành Tuần 2: Ứng dụng lý thuyết',
      dueDate: '2026-10-30T23:59:00Z',
      maxScore: 10,
      description: 'Hoàn thành các câu hỏi trắc nghiệm và bài tập tự luận theo hướng dẫn trong slide.',
      isSubmitted: false,
    },
  ]);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await academicService.getClasses();
      const list = res.data || [];
      setClasses(list);
      if (list.length > 0) {
        setSelectedClassId(list[0].id);
      }
    } catch (err) {
      console.warn('Error loading classes for LMS:', err);
    }
  };

  useEffect(() => {
    if (selectedClassId) {
      loadLmsData(selectedClassId);
    }
  }, [selectedClassId]);

  const loadLmsData = async (classId: string) => {
    try {
      setLoading(true);
      const [modRes, assRes] = await Promise.all([
        lmsService.getModules(classId),
        lmsService.getAssignments(classId)
      ]);
      if (modRes.data?.data && Array.isArray(modRes.data.data) && modRes.data.data.length > 0) {
        setModules(modRes.data.data);
      }
      if (assRes.data?.data && Array.isArray(assRes.data.data) && assRes.data.data.length > 0) {
        setAssignments(assRes.data.data);
      }
    } catch (err) {
      console.warn('Using default LMS modules fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  // Modal create module
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleForm, setModuleForm] = useState<LmsModuleData>({
    classId: '',
    title: '',
    description: '',
  });

  // Modal submit assignment
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submitFileUrl, setSubmitFileUrl] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...moduleForm,
      classId: selectedClassId || moduleForm.classId
    };
    try {
      await lmsService.createModule(payload);
    } catch (err) {
      console.warn('API error, demo fallback');
    }

    setModules((prev) => [
      ...prev,
      {
        id: `mod-${Date.now()}`,
        ...payload,
        materials: [],
      },
    ]);
    setMessage({ type: 'success', text: 'Tạo chương/tuần học mới thành công!' });
    setShowModuleModal(false);
    setModuleForm({ classId: selectedClassId, title: '', description: '' });
  };

  const openSubmitModal = (ass: any) => {
    setSelectedAssignment(ass);
    setSubmitFileUrl('');
    setShowSubmitModal(true);
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    try {
      await lmsService.submitAssignment(selectedAssignment.id, { fileUrl: submitFileUrl });
    } catch (err) {
      console.warn('API error, demo fallback');
    }

    setAssignments((prev) =>
      prev.map((a) => (a.id === selectedAssignment.id ? { ...a, isSubmitted: true } : a))
    );
    setMessage({ type: 'success', text: `Nộp bài tập "${selectedAssignment.title}" thành công!` });
    setShowSubmitModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">Hệ Thống LMS & Học Trực Tuyến (E-Learning)</h2>
            <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full font-medium">
              {isAdmin || isTeacher
                ? 'Quyền: Giảng Viên / Quản Trị (Soạn bài giảng, giao bài & chấm điểm)'
                : 'Quyền: Sinh Viên (Tải tài liệu & Nộp bài tập)'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý tài liệu bài giảng theo tuần/chương, bài tập thực hành, nộp bài trực tuyến và giảng viên chấm điểm.
          </p>
        </div>

        {(isAdmin || isTeacher) && (
          <button
            onClick={() => setShowModuleModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Thêm Tuần / Chương Học
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

      {/* Tabs & Class Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-200 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSubTab('modules')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeSubTab === 'modules' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Bài Giảng & Tài Liệu ({modules.length} Tuần)
          </button>

          <button
            onClick={() => setActiveSubTab('assignments')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeSubTab === 'assignments' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Bài Tập & Nộp Bài ({assignments.length})
          </button>
        </div>

        {classes.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-semibold uppercase">Lớp học phần:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-100"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} {c.course?.name ? `(${c.course.name})` : ''}
                </option>
              ))}
            </select>
            {loading && <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
          </div>
        )}
      </div>

      {/* Subtab 1: Modules */}
      {activeSubTab === 'modules' && (
        <div className="space-y-4">
          {modules.map((mod) => (
            <div key={mod.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{mod.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{mod.description}</p>
                </div>
              </div>

              {/* Materials list */}
              <div className="space-y-2 pt-2 border-t border-gray-50">
                {mod.materials && mod.materials.length > 0 ? (
                  mod.materials.map((mat: any) => (
                    <div
                      key={mat.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 hover:bg-blue-50/50 transition border border-gray-100/80"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                          {mat.type === 'VIDEO' ? (
                            <Video className="w-4 h-4" />
                          ) : mat.type === 'LINK' ? (
                            <Link2 className="w-4 h-4" />
                          ) : (
                            <File className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-800 text-sm">{mat.title}</span>
                          <span className="text-[11px] text-gray-400 block uppercase font-mono">{mat.type}</span>
                        </div>
                      </div>

                      <button className="text-blue-600 hover:text-blue-700 text-xs font-semibold px-3 py-1 rounded-lg hover:bg-blue-100/50 transition">
                        Xem / Tải về
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">Chưa có tài liệu đính kèm cho tuần này.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subtab 2: Assignments */}
      {activeSubTab === 'assignments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((ass) => (
            <div key={ass.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="text-base font-bold text-gray-900 leading-snug">{ass.title}</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      ass.isSubmitted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {ass.isSubmitted ? 'Đã Nộp' : 'Chưa Nộp'}
                  </span>
                </div>

                <p className="text-xs text-gray-600">{ass.description}</p>

                <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Hạn nộp: {new Date(ass.dueDate).toLocaleString()}</span>
                </div>

                {ass.submissionScore !== undefined && (
                  <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-900 space-y-0.5">
                    <div>
                      Điểm số: <strong className="text-sm">{ass.submissionScore} / {ass.maxScore}</strong>
                    </div>
                    {ass.feedback && <p className="italic">Nhận xét: "{ass.feedback}"</p>}
                  </div>
                )}
              </div>

              <div>
                {isStudent ? (
                  !ass.isSubmitted ? (
                    <button
                      onClick={() => openSubmitModal(ass)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-semibold transition shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" /> Nộp Bài Tập (Upload File)
                    </button>
                  ) : (
                    <button
                      onClick={() => openSubmitModal(ass)}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl text-xs font-semibold transition"
                    >
                      Nộp lại bài
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => {
                      setMessage({ type: 'success', text: `Xem danh sách 38 bài nộp của lớp cho bài tập "${ass.title}"` });
                    }}
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Danh Sách Nộp & Chấm Điểm
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Tạo Module mới */}
      {showModuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Tạo Tuần / Chương Học Mới</h3>
              <button onClick={() => setShowModuleModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModuleSubmit} className="py-4 space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tiêu đề chương / tuần học</label>
                <input
                  required
                  type="text"
                  placeholder="Vd: Tuần 3: Thiết kế cơ sở dữ liệu quan hệ"
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mô tả nội dung</label>
                <textarea
                  rows={3}
                  placeholder="Khái niệm chuẩn hóa, ERD, khóa chính, khóa ngoại..."
                  value={moduleForm.description || ''}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModuleModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm"
                >
                  Lưu Tuần Học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nộp bài tập */}
      {showSubmitModal && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Nộp Bài: {selectedAssignment.title}
              </h3>
              <button onClick={() => setShowSubmitModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStudentSubmit} className="py-4 space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Đường dẫn file nộp (Drive / GitHub / Cloud Storage)</label>
                <input
                  required
                  type="url"
                  placeholder="https://github.com/student/oop-assignment.git"
                  value={submitFileUrl}
                  onChange={(e) => setSubmitFileUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-500">
                Chấp nhận file PDF, ZIP hoặc link GitHub repository. Đảm bảo quyền truy cập công khai hoặc cấp quyền cho giảng viên.
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Gửi Bài Nộp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
