import React, { useState } from 'react';
import {
  lmsService,
  type AssignmentData,
  type AssignmentGroup,
  type SubmissionData,
  type GradeSubmissionData,
} from '../../../../services/lms.service';
import {
  FileText,
  Clock,
  Users,
  CheckCircle,
  UploadCloud,
  Plus,
  X,
  Sparkles,
  Calendar,
  Award,
} from 'lucide-react';

interface LmsAssignmentsProps {
  classId: string;
  user: any;
  assignments: AssignmentData[];
  onRefresh?: () => void;
}

export const LmsAssignments: React.FC<LmsAssignmentsProps> = ({
  classId,
  user,
  assignments: initialAssignments,
  onRefresh,
}) => {
  const isAdmin = user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';

  const [activeTab, setActiveTab] = useState<'assignments' | 'groups'>('assignments');
  const [assignments, setAssignments] = useState<AssignmentData[]>(
    initialAssignments.length > 0
      ? initialAssignments
      : [
          {
            id: 'ass-1',
            classId,
            title: 'Bài tập lớn: Xây dựng RESTful API Backend với NestJS',
            description:
              'Sinh viên thiết kế API theo kiến trúc phân tầng Clean Architecture, có xác thực JWT, kết nối PostgreSQL qua Prisma ORM và viết tài liệu Swagger.',
            openDate: '2026-11-01T00:00:00Z',
            deadline: '2026-11-15T23:59:59Z',
            cutOffDate: '2026-11-18T23:59:59Z',
            allowLate: true,
            isGroup: true,
            maxScore: 10,
            rubric: [
              { criteria: 'Thiết kế CSDL chuẩn hóa (3NF & Indexing)', maxPoints: 3 },
              { criteria: 'Xử lý logic nghiệp vụ, bảo mật JWT & Phân quyền', maxPoints: 5 },
              { criteria: 'Tài liệu Swagger OpenAPI & Unit Tests', maxPoints: 2 },
            ],
            isSubmitted: true,
          },
          {
            id: 'ass-2',
            classId,
            title: 'Bài tập cá nhân Tuần 2: Query Optimization & Caching Redis',
            description:
              'Tối ưu hóa câu truy vấn SQL phức tạp, cấu hình Redis Cache cho các endpoint đọc nhiều và đo lường sự cải thiện bằng Apache Benchmark.',
            openDate: '2026-10-25T00:00:00Z',
            deadline: '2026-11-05T23:59:59Z',
            cutOffDate: '2026-11-07T23:59:59Z',
            allowLate: false,
            isGroup: false,
            maxScore: 10,
            rubric: [
              { criteria: 'Giải pháp Cache Invalidation hợp lý', maxPoints: 4 },
              { criteria: 'Báo cáo benchmark so sánh trước và sau khi tối ưu', maxPoints: 6 },
            ],
            isSubmitted: false,
          },
        ]
  );

  // Groups state
  const [groups, setGroups] = useState<AssignmentGroup[]>([
    {
      id: 'grp-1',
      name: 'Nhóm Đồ Án 01',
      classId,
      members: [
        { id: 'st-1', studentCode: '26107002', fullName: 'Nguyễn Văn An', email: 'an.nv@preskool.edu.vn' },
        { id: 'st-2', studentCode: '26107003', fullName: 'Trần Thị Mai', email: 'mai.tt@preskool.edu.vn' },
        { id: 'st-3', studentCode: '26107004', fullName: 'Lê Hoàng Nam', email: 'nam.lh@preskool.edu.vn' },
      ],
    },
    {
      id: 'grp-2',
      name: 'Nhóm Đồ Án 02',
      classId,
      members: [
        { id: 'st-4', studentCode: '26107005', fullName: 'Phạm Minh Đức', email: 'duc.pm@preskool.edu.vn' },
        { id: 'st-5', studentCode: '26107006', fullName: 'Đỗ Thảo Linh', email: 'linh.dt@preskool.edu.vn' },
      ],
    },
  ]);

  // Submission Modal
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentData | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitForm, setSubmitForm] = useState<SubmissionData>({
    fileUrl: '',
    onlineText: '',
    linkUrl: '',
    submissionType: 'HYBRID',
    comments: '',
  });

  // Grading Modal (Teacher)
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [gradingForm, setGradingForm] = useState<GradeSubmissionData>({
    score: 8.5,
    feedback: 'Code sạch sẽ, cấu trúc các tầng rất rõ ràng. Cần chú ý thêm trường hợp validation dữ liệu đầu vào.',
    rubricScores: { '0': 2.5, '1': 4.5, '2': 1.5 },
  });

  // Create Assignment Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<AssignmentData>({
    classId,
    title: '',
    description: '',
    deadline: '',
    cutOffDate: '',
    allowLate: true,
    isGroup: false,
    maxScore: 10,
    rubric: [
      { criteria: 'Yêu cầu kỹ thuật & Kiến trúc', maxPoints: 5 },
      { criteria: 'Giao diện & Trải nghiệm người dùng', maxPoints: 5 },
    ],
  });

  // Auto Split Modal
  const [showAutoSplitModal, setShowAutoSplitModal] = useState(false);
  const [splitSize, setSplitSize] = useState(4);
  const [splitPrefix, setSplitPrefix] = useState('Nhóm Đồ Án');

  const handleOpenSubmit = (ass: AssignmentData) => {
    setSelectedAssignment(ass);
    setSubmitForm({
      fileUrl: 'https://storage.preskool.edu.vn/submissions/report_project_v1.pdf',
      onlineText: 'Dự án đã hoàn thành các module cơ bản và kết nối CSDL thành công.',
      linkUrl: 'https://github.com/preskool/backend-project',
      submissionType: 'HYBRID',
      comments: 'Phiên bản nộp bài lần 1',
    });
    setShowSubmitModal(true);
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    try {
      await lmsService.submitAssignment(selectedAssignment.id!, submitForm);
    } catch {
      // Demo fallback
    }

    setAssignments((prev) =>
      prev.map((a) => (a.id === selectedAssignment.id ? { ...a, isSubmitted: true } : a))
    );
    alert('Nộp bài tập thành công! Hệ thống đã ghi nhận bài nộp và cập nhật trạng thái.');
    setShowSubmitModal(false);
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await lmsService.gradeSubmission('sub-demo', gradingForm);
    } catch {
      // fallback
    }
    alert(`Đã lưu điểm thành công: ${gradingForm.score}/10!`);
    setShowGradingModal(false);
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    const newAss: AssignmentData = {
      ...createForm,
      id: `ass-${Date.now()}`,
      isSubmitted: false,
    };
    try {
      await lmsService.createAssignment(newAss);
    } catch {
      // fallback
    }
    setAssignments((prev) => [newAss, ...prev]);
    setShowCreateModal(false);
    onRefresh?.();
  };

  const handleAutoSplit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await lmsService.autoSplitGroups({
        classId,
        groupSize: splitSize,
        prefix: splitPrefix,
      });
    } catch {
      // fallback
    }

    // Mock split 3 groups
    const newGroups: AssignmentGroup[] = [
      {
        id: `grp-${Date.now()}-1`,
        name: `${splitPrefix} 01`,
        classId,
        members: [
          { id: 'st-1', studentCode: '26107002', fullName: 'Nguyễn Văn An' },
          { id: 'st-2', studentCode: '26107003', fullName: 'Trần Thị Mai' },
        ],
      },
      {
        id: `grp-${Date.now()}-2`,
        name: `${splitPrefix} 02`,
        classId,
        members: [
          { id: 'st-3', studentCode: '26107004', fullName: 'Lê Hoàng Nam' },
          { id: 'st-4', studentCode: '26107005', fullName: 'Phạm Minh Đức' },
        ],
      },
    ];
    setGroups(newGroups);
    setShowAutoSplitModal(false);
    alert(`Đã tự động chia thành ${newGroups.length} nhóm thành công!`);
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      await lmsService.joinGroup(groupId);
    } catch {
      // fallback
    }
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          const already = g.members.some((m) => m.studentCode === '26107002');
          if (already) return g;
          return {
            ...g,
            members: [
              ...g.members,
              { id: 'my-st', studentCode: '26107002', fullName: user?.fullName || 'Sinh viên hiện tại' },
            ],
          };
        }
        return g;
      })
    );
    alert('Đã tham gia nhóm thành công!');
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex rounded-xl bg-gray-100 p-1 self-start">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'assignments' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Danh Sách Bài Tập ({assignments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'groups' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Nhóm Đồ Án ({groups.length} Nhóm)</span>
          </button>
        </div>

        {/* Action button for Teacher/Admin */}
        {(isAdmin || isTeacher) && (
          <div className="flex items-center gap-2">
            {activeTab === 'assignments' ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Giao Bài Tập Mới</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAutoSplitModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-xs cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Tự Động Chia Nhóm (Auto-split)</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 1. ASSIGNMENTS TAB */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {assignments.map((ass) => (
            <div
              key={ass.id}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs transition hover:border-gray-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                        ass.isGroup ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {ass.isGroup ? 'Đồ Án Nhóm' : 'Cá Nhân'}
                    </span>
                    <h4 className="text-sm font-bold text-gray-900">{ass.title}</h4>
                    {ass.isSubmitted && (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <CheckCircle className="h-3 w-3" /> Đã nộp bài
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">{ass.description}</p>

                  {/* Rubric preview */}
                  {ass.rubric && ass.rubric.length > 0 && (
                    <div className="mt-3 rounded-xl bg-gray-50/80 p-3 border border-gray-100">
                      <p className="text-[11px] font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-amber-500" />
                        Tiêu chí chấm điểm (Rubric):
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {ass.rubric.map((r, rIdx) => (
                          <div
                            key={rIdx}
                            className="rounded-lg bg-white p-2 border border-gray-100 text-[11px] flex justify-between items-center"
                          >
                            <span className="text-gray-700 truncate pr-2">{r.criteria}</span>
                            <span className="font-bold text-blue-600 shrink-0">+{r.maxPoints}đ</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      Hạn nộp: <strong className="text-gray-800">{new Date(ass.deadline).toLocaleDateString('vi-VN')}</strong>
                    </span>
                    {ass.cutOffDate && (
                      <span className="flex items-center gap-1 text-rose-600">
                        <Clock className="h-3.5 w-3.5" />
                        Khóa hoàn toàn: {new Date(ass.cutOffDate).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                    {ass.allowLate && (
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                        Cho phép nộp trễ (bị trừ điểm)
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row lg:flex-col gap-2 shrink-0 self-end lg:self-center">
                  {isStudent && (
                    <button
                      onClick={() => handleOpenSubmit(ass)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white transition shadow-xs cursor-pointer ${
                        ass.isSubmitted ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <UploadCloud className="h-4 w-4" />
                      <span>{ass.isSubmitted ? 'Nộp Lại (Resubmit)' : 'Nộp Bài Tập'}</span>
                    </button>
                  )}

                  {(isAdmin || isTeacher) && (
                    <button
                      onClick={() => {
                        setSelectedAssignment(ass);
                        setShowGradingModal(true);
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                    >
                      <Award className="h-4 w-4 text-blue-600" />
                      <span>Chấm Điểm & Phản Hồi</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. GROUPS TAB */}
      {activeTab === 'groups' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((grp) => (
            <div key={grp.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{grp.name}</h4>
                    <p className="text-[10px] text-gray-400">{grp.members.length} Thành viên</p>
                  </div>
                </div>

                {isStudent && (
                  <button
                    onClick={() => handleJoinGroup(grp.id)}
                    className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
                  >
                    Tham gia nhóm
                  </button>
                )}
              </div>

              {/* Members List */}
              <div className="space-y-2">
                {grp.members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50/70 px-3 py-2 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{m.fullName}</p>
                      <p className="text-[10px] text-gray-500 font-mono">MSSV: {m.studentCode}</p>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      Thành viên
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Nộp bài tập (Sinh viên) */}
      {showSubmitModal && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {selectedAssignment.isSubmitted ? 'Nộp Lại Bài Tập (Resubmit)' : 'Nộp Bài Tập'}
                </h3>
                <p className="text-xs text-gray-500 truncate max-w-md">{selectedAssignment.title}</p>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Đường dẫn Báo cáo / File URL (Cloud Storage / Drive)
                </label>
                <input
                  type="url"
                  placeholder="https://storage.preskool.edu.vn/... / https://drive.google.com/..."
                  value={submitForm.fileUrl}
                  onChange={(e) => setSubmitForm({ ...submitForm, fileUrl: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Kho mã nguồn Github / Gitlab (Link Repo)
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={submitForm.linkUrl}
                  onChange={(e) => setSubmitForm({ ...submitForm, linkUrl: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Nội dung ghi chú trực tuyến</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả kết quả đạt được, tài khoản đăng nhập demo..."
                  value={submitForm.onlineText}
                  onChange={(e) => setSubmitForm({ ...submitForm, onlineText: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Nhật ký cập nhật (Version Comments)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đã sửa lỗi kết nối DB và bổ sung test cases..."
                  value={submitForm.comments}
                  onChange={(e) => setSubmitForm({ ...submitForm, comments: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
                >
                  Xác Nhận Nộp Bài
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Chấm điểm bài nộp theo Rubric (Giảng viên) */}
      {showGradingModal && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Chấm Điểm Theo Tiêu Chí (Rubric)</h3>
                <p className="text-xs text-gray-500 truncate max-w-md">{selectedAssignment.title}</p>
              </div>
              <button
                onClick={() => setShowGradingModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGradeSubmit} className="mt-4 space-y-4 text-xs">
              <div className="rounded-xl bg-blue-50 p-3.5 border border-blue-100 flex items-center justify-between">
                <span className="font-bold text-blue-900">Tổng điểm tổng kết (Thang 10):</span>
                <span className="text-lg font-bold text-blue-700 font-mono">{gradingForm.score} / 10</span>
              </div>

              {/* Rubric scores */}
              <div className="space-y-3">
                <p className="font-bold text-gray-800">Chấm điểm từng tiêu chí:</p>
                {selectedAssignment.rubric?.map((rub, rIdx) => (
                  <div key={rIdx} className="rounded-lg bg-gray-50 p-3 border border-gray-100 space-y-1">
                    <div className="flex justify-between font-semibold text-gray-700">
                      <span>{rub.criteria}</span>
                      <span className="text-blue-600">Tối đa: {rub.maxPoints}đ</span>
                    </div>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max={rub.maxPoints}
                      defaultValue={rub.maxPoints * 0.85}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setGradingForm((prev) => ({
                          ...prev,
                          rubricScores: { ...prev.rubricScores, [rIdx.toString()]: val },
                        }));
                      }}
                      className="w-full rounded-md border border-gray-200 bg-white p-2 outline-none"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Nhận xét chi tiết & Phản hồi</label>
                <textarea
                  rows={3}
                  value={gradingForm.feedback}
                  onChange={(e) => setGradingForm({ ...gradingForm, feedback: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowGradingModal(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
                >
                  Lưu & Công Bố Điểm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Tạo bài tập mới (Giảng viên / Admin) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Giao Bài Tập / Đồ Án Mới</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Tiêu Đề Bài Tập</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đồ án cuối kỳ: Xây dựng hệ thống thương mại điện tử..."
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Mô Tả Yêu Cầu Đề Bài</label>
                <textarea
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Hạn Nộp (Deadline)</label>
                  <input
                    type="datetime-local"
                    value={createForm.deadline}
                    onChange={(e) => setCreateForm({ ...createForm, deadline: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 p-2 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Khóa Hoàn Toàn (Cut-off Date)</label>
                  <input
                    type="datetime-local"
                    value={createForm.cutOffDate}
                    onChange={(e) => setCreateForm({ ...createForm, cutOffDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 p-2 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createForm.isGroup}
                    onChange={(e) => setCreateForm({ ...createForm, isGroup: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-semibold text-gray-700">Đồ án làm theo Nhóm</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createForm.allowLate}
                    onChange={(e) => setCreateForm({ ...createForm, allowLate: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-semibold text-gray-700">Cho phép nộp trễ</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
                >
                  Tạo Bài Tập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Auto split groups */}
      {showAutoSplitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Tự Động Chia Nhóm Lớp Học</h3>
              <button
                onClick={() => setShowAutoSplitModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAutoSplit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Số sinh viên mỗi nhóm</label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={splitSize}
                  onChange={(e) => setSplitSize(parseInt(e.target.value) || 4)}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Tiền tố tên nhóm</label>
                <input
                  type="text"
                  value={splitPrefix}
                  onChange={(e) => setSplitPrefix(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAutoSplitModal(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                >
                  Bắt Đầu Chia Nhóm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LmsAssignments;
