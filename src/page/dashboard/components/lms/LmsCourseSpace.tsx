import React, { useState } from 'react';
import {
  lmsService,
  type SyllabusData,
  type LmsModuleData,
  type MaterialData,
} from '../../../../services/lms.service';
import {
  BookOpen,
  FileText,
  Video,
  Link2,
  CheckCircle,
  Plus,
  Trash2,
  Lock,
  Layers,
  Sparkles,
  ExternalLink,
  Edit3,
  X,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';

interface LmsCourseSpaceProps {
  classId: string;
  classNameTitle: string;
  user: any;
  modules: LmsModuleData[];
  onRefresh?: () => void;
}

export const LmsCourseSpace: React.FC<LmsCourseSpaceProps> = ({
  classId,
  classNameTitle,
  user,
  modules: initialModules,
  onRefresh,
}) => {
  const isAdmin = user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';

  // Demo fallback syllabus
  const [syllabus, setSyllabus] = useState<SyllabusData>({
    objectives:
      'Trang bị kiến thức phát triển hệ thống phần mềm phân tán, RESTful API chuẩn hóa, kiến trúc Clean Architecture và tối ưu hóa truy vấn CSDL quan hệ.',
    clos: [
      'CLO1: Phân tích và thiết kế RESTful API theo chuẩn OpenAPI 3.0',
      'CLO2: Xây dựng cơ sở dữ liệu quan hệ tối ưu, áp dụng Indexing và Transaction',
      'CLO3: Đóng gói và triển khai ứng dụng bằng Docker & CI/CD pipeline',
    ],
    gradeWeights: {
      quiz: 0.2,
      assignment: 0.3,
      midterm: 0.2,
      final: 0.3,
    },
    textbooks: [
      'Giáo trình Lập trình Hướng dịch vụ - NXB ĐHQG (2024)',
      'Clean Architecture: A Craftsman\'s Guide to Software Structure - Robert C. Martin',
      'Designing Data-Intensive Applications - Martin Kleppmann',
    ],
    description: 'Học phần chuyên ngành cốt lõi dành cho sinh viên năm 3 ngành Công nghệ Thông tin & Kỹ thuật Phần mềm.',
  });

  const [modules, setModules] = useState<LmsModuleData[]>(initialModules);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    'mod-1': true,
    'mod-2': true,
  });

  // Syllabus Modal
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);
  const [syllabusForm, setSyllabusForm] = useState<SyllabusData>(syllabus);

  // New Module Modal
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDesc, setModuleDesc] = useState('');

  // New Material Modal
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [materialForm, setMaterialForm] = useState<MaterialData>({
    title: '',
    type: 'PDF',
    url: '',
    description: '',
    unlockAt: '',
  });

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Progress computation
  const totalMaterials = modules.reduce((acc, m) => acc + (m.materials?.length || 0), 0);
  const completedMaterials = modules.reduce(
    (acc, m) => acc + (m.materials?.filter((mat) => mat.isCompleted)?.length || 0),
    0
  );
  const progressPercent = totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 65;

  const handleCompleteMaterial = async (moduleId: string, materialId: string) => {
    try {
      await lmsService.updateMaterialProgress(materialId, {
        progressPercent: 100,
        isCompleted: true,
      });
    } catch {
      // Demo fallback
    }

    setModules((prev) =>
      prev.map((mod) => {
        if (mod.id === moduleId && mod.materials) {
          return {
            ...mod,
            materials: mod.materials.map((mat) =>
              mat.id === materialId ? { ...mat, isCompleted: true, progressPercent: 100 } : mat
            ),
          };
        }
        return mod;
      })
    );
  };

  const handleSaveSyllabus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await lmsService.updateSyllabus(classId, syllabusForm);
    } catch {
      // Demo fallback
    }
    setSyllabus(syllabusForm);
    setShowSyllabusModal(false);
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle.trim()) return;

    const newMod: LmsModuleData = {
      id: `mod-${Date.now()}`,
      classId,
      title: moduleTitle,
      description: moduleDesc,
      week: modules.length + 1,
      materials: [],
    };

    try {
      await lmsService.createModule(newMod);
    } catch {
      // Demo fallback
    }

    setModules((prev) => [...prev, newMod]);
    setExpandedModules((prev) => ({ ...prev, [newMod.id!]: true }));
    setModuleTitle('');
    setModuleDesc('');
    setShowModuleModal(false);
    onRefresh?.();
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialForm.title.trim()) return;

    const newMat: MaterialData = {
      ...materialForm,
      id: `mat-${Date.now()}`,
      moduleId: selectedModuleId,
      isCompleted: false,
      progressPercent: 0,
    };

    try {
      await lmsService.createMaterial(selectedModuleId, newMat);
    } catch {
      // Demo fallback
    }

    setModules((prev) =>
      prev.map((m) => {
        if (m.id === selectedModuleId) {
          return {
            ...m,
            materials: [...(m.materials || []), newMat],
          };
        }
        return m;
      })
    );

    setMaterialForm({ title: '', type: 'PDF', url: '', description: '', unlockAt: '' });
    setShowMaterialModal(false);
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa Tuần học này?')) return;
    try {
      await lmsService.deleteModule(moduleId);
    } catch {
      // fallback
    }
    setModules((prev) => prev.filter((m) => m.id !== moduleId));
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return <Video className="h-4 w-4 text-rose-500" />;
      case 'LINK':
        return <Link2 className="h-4 w-4 text-sky-500" />;
      case 'PPTX':
        return <FileSpreadsheet className="h-4 w-4 text-orange-500" />;
      case 'DOCX':
        return <FileCode className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Student Progress */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                Lớp Học Phần
              </span>
              <h2 className="text-xl font-bold text-gray-900">{classNameTitle}</h2>
            </div>
            <p className="text-xs text-gray-500 max-w-2xl">{syllabus.description}</p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {(isAdmin || isTeacher) && (
              <>
                <button
                  onClick={() => setShowSyllabusModal(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5 text-blue-600" />
                  <span>Sửa Đề Cương</span>
                </button>
                <button
                  onClick={() => setShowModuleModal(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Thêm Tuần Học</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Progress bar for Students */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-gray-700 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Tiến độ học tập tổng thể
            </span>
            <span className="font-bold text-blue-600">{progressPercent}% Hoàn thành</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-linear-to-r from-blue-500 to-indigo-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Syllabus Accordion Card */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4 text-blue-600" />
          Đề Cương Chi Tiết & Chuẩn Đầu Ra (Syllabus)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="rounded-lg bg-gray-50/70 p-3.5 border border-gray-100">
            <p className="font-bold text-gray-800 mb-1">Mục Tiêu Môn Học:</p>
            <p className="text-gray-600 leading-relaxed">{syllabus.objectives}</p>
          </div>

          <div className="rounded-lg bg-gray-50/70 p-3.5 border border-gray-100">
            <p className="font-bold text-gray-800 mb-1">Chuẩn Đầu Ra (CLOs):</p>
            <ul className="space-y-1 text-gray-600">
              {syllabus.clos.map((clo, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>{clo}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg bg-gray-50/70 p-3.5 border border-gray-100">
            <p className="font-bold text-gray-800 mb-1">Tỷ Trọng Điểm Đánh Giá:</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <span className="rounded bg-blue-50 p-1.5 text-center font-semibold text-blue-700">
                Quiz: {syllabus.gradeWeights.quiz * 100}%
              </span>
              <span className="rounded bg-indigo-50 p-1.5 text-center font-semibold text-indigo-700">
                Bài tập: {syllabus.gradeWeights.assignment * 100}%
              </span>
              <span className="rounded bg-amber-50 p-1.5 text-center font-semibold text-amber-700">
                Giữa kỳ: {syllabus.gradeWeights.midterm * 100}%
              </span>
              <span className="rounded bg-emerald-50 p-1.5 text-center font-semibold text-emerald-700">
                Cuối kỳ: {syllabus.gradeWeights.final * 100}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Modules and Materials List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-600" />
            Nội Dung Bài Học Theo Tuần ({modules.length} Tuần)
          </h3>
        </div>

        {modules.map((mod, idx) => {
          const isExpanded = expandedModules[mod.id || `mod-${idx}`];
          return (
            <div
              key={mod.id || idx}
              className="rounded-xl border border-gray-100 bg-white shadow-xs overflow-hidden transition"
            >
              {/* Module Header */}
              <div
                onClick={() => toggleModule(mod.id || `mod-${idx}`)}
                className="flex items-center justify-between p-4 bg-gray-50/70 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{mod.title}</h4>
                    {mod.description && <p className="text-[11px] text-gray-500 mt-0.5">{mod.description}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {(isAdmin || isTeacher) && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedModuleId(mod.id!);
                          setShowMaterialModal(true);
                        }}
                        className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                      >
                        + Thêm học liệu
                      </button>
                      <button
                        onClick={() => handleDeleteModule(mod.id!)}
                        className="rounded-lg p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Xóa tuần học"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                  <span className="text-xs text-gray-400 ml-2">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Module Materials List */}
              {isExpanded && (
                <div className="p-4 divide-y divide-gray-100">
                  {(!mod.materials || mod.materials.length === 0) && (
                    <p className="text-xs text-gray-400 py-3 text-center italic">
                      Chưa có học liệu nào trong tuần này.
                    </p>
                  )}

                  {mod.materials?.map((mat, mIdx) => (
                    <div
                      key={mat.id || mIdx}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 px-2 rounded-lg transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                          {getMaterialIcon(mat.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-semibold text-gray-800">{mat.title}</h5>
                            <span className="rounded bg-gray-100 px-1.5 py-0.2 text-[9px] font-bold text-gray-600 uppercase">
                              {mat.type}
                            </span>
                            {mat.isCompleted && (
                              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700">
                                <CheckCircle className="h-2.5 w-2.5" /> Đã hoàn thành
                              </span>
                            )}
                            {mat.isLocked && (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.2 text-[9px] font-bold text-amber-700">
                                <Lock className="h-2.5 w-2.5" /> Khóa đến {mat.unlockAt}
                              </span>
                            )}
                          </div>
                          {mat.description && (
                            <p className="text-[11px] text-gray-500 mt-0.5">{mat.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Material Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <a
                          href={mat.url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Mở xem
                        </a>

                        {isStudent && !mat.isCompleted && (
                          <button
                            onClick={() => handleCompleteMaterial(mod.id!, mat.id!)}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Đánh dấu xong
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL: Sửa Đề Cương */}
      {showSyllabusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Chỉnh Sửa Đề Cương Môn Học</h3>
              <button
                onClick={() => setShowSyllabusModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSyllabus} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Mục Tiêu Môn Học</label>
                <textarea
                  rows={3}
                  value={syllabusForm.objectives}
                  onChange={(e) => setSyllabusForm({ ...syllabusForm, objectives: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Mô Tả Tổng Quan</label>
                <textarea
                  rows={2}
                  value={syllabusForm.description}
                  onChange={(e) => setSyllabusForm({ ...syllabusForm, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Quiz (%)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={syllabusForm.gradeWeights.quiz}
                    onChange={(e) =>
                      setSyllabusForm({
                        ...syllabusForm,
                        gradeWeights: { ...syllabusForm.gradeWeights, quiz: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 p-2 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Bài tập (%)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={syllabusForm.gradeWeights.assignment}
                    onChange={(e) =>
                      setSyllabusForm({
                        ...syllabusForm,
                        gradeWeights: { ...syllabusForm.gradeWeights, assignment: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 p-2 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Giữa kỳ (%)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={syllabusForm.gradeWeights.midterm}
                    onChange={(e) =>
                      setSyllabusForm({
                        ...syllabusForm,
                        gradeWeights: { ...syllabusForm.gradeWeights, midterm: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 p-2 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Cuối kỳ (%)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={syllabusForm.gradeWeights.final}
                    onChange={(e) =>
                      setSyllabusForm({
                        ...syllabusForm,
                        gradeWeights: { ...syllabusForm.gradeWeights, final: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 p-2 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowSyllabusModal(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
                >
                  Lưu Đề Cương
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Thêm Tuần Học */}
      {showModuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Thêm Tuần / Chương Học Mới</h3>
              <button
                onClick={() => setShowModuleModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateModule} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Tiêu Đề Tuần Học</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tuần 3: Thiết kế API và Middleware..."
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Mô Tả Ngắn (Tùy chọn)</label>
                <textarea
                  rows={2}
                  placeholder="Nội dung tóm tắt kiến thức trong tuần..."
                  value={moduleDesc}
                  onChange={(e) => setModuleDesc(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModuleModal(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
                >
                  Tạo Tuần Học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Thêm Học Liệu */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Thêm Học Liệu Vào Tuần Học</h3>
              <button
                onClick={() => setShowMaterialModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMaterial} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Tên Học Liệu / Tài Liệu</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Slide bài giảng Chương 2 (PDF)..."
                  value={materialForm.title}
                  onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Định Dạng Học Liệu</label>
                  <select
                    value={materialForm.type}
                    onChange={(e: any) => setMaterialForm({ ...materialForm, type: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                  >
                    <option value="PDF">PDF Tài Liệu</option>
                    <option value="VIDEO">Video Bài Giảng</option>
                    <option value="LINK">Liên Kết Ngoài</option>
                    <option value="PPTX">Slide PPTX</option>
                    <option value="DOCX">Văn Bản DOCX</option>
                    <option value="SCORM">Gói SCORM</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Đường Dẫn / URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={materialForm.url}
                    onChange={(e) => setMaterialForm({ ...materialForm, url: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Ghi Chú Hướng Dẫn</label>
                <textarea
                  rows={2}
                  placeholder="Hướng dẫn sinh viên đọc trước tài liệu..."
                  value={materialForm.description}
                  onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
                >
                  Lưu Học Liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LmsCourseSpace;
