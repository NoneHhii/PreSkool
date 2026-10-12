import React, { useState, useEffect } from 'react';
import { academicService, type HomeroomClass, type Major, type Student } from '../../../services/academic.service';
import { 
  Plus, AlertCircle, CheckCircle, GraduationCap, Zap, Sparkles, 
  Calendar, BookOpen, Users, RefreshCw, Eye, X, 
  Search, ShieldCheck, Laptop, Check
} from 'lucide-react';

interface HomeroomsTabProps {
  onNavigateTab?: (tab: string) => void;
}

export default function HomeroomsTab({ onNavigateTab }: HomeroomsTabProps) {
  const [homerooms, setHomerooms] = useState<HomeroomClass[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({ code: '', name: '', majorId: '', cohort: '', advisorId: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Unassigned metrics
  const [totalUnassigned, setTotalUnassigned] = useState<number>(0);

  // 1-Click All-In-One Modal State
  const [showAllModal, setShowAllModal] = useState(false);
  const [allCohort, setAllCohort] = useState('1');
  const [allLoading, setAllLoading] = useState(false);
  const [allResult, setAllResult] = useState<any | null>(null);

  // Single Major Auto Assign Modal
  const [showAutoAssign, setShowAutoAssign] = useState(false);
  const [autoAssignData, setAutoAssignData] = useState({ majorId: '', cohort: '1', numberOfClasses: 1, prefix: '', suffix: '' });
  const [autoAssignLoading, setAutoAssignLoading] = useState(false);
  const [unassignedCount, setUnassignedCount] = useState<number | null>(null);
  const [unassignedStudentIds, setUnassignedStudentIds] = useState<string[]>([]);

  // View Roster Modal
  const [selectedHomeroom, setSelectedHomeroom] = useState<HomeroomClass | null>(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterStudents, setRosterStudents] = useState<Student[]>([]);

  // Search and Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMajorFilter, setSelectedMajorFilter] = useState('');
  const [selectedCohortFilter, setSelectedCohortFilter] = useState('');

  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const [homeroomsRes, majorsRes, teachersRes, unassignedRes] = await Promise.all([
        academicService.getHomerooms().catch(err => {
          console.error('Error fetching homerooms:', err);
          return null;
        }),
        academicService.getMajors().catch(() => ({ data: [] })),
        academicService.getTeachers().catch(() => ({ data: [] })),
        academicService.getUnassignedHomeroomStudents().catch(() => ({ data: [] }))
      ]);

      if (homeroomsRes && Array.isArray(homeroomsRes.data)) {
        setHomerooms(homeroomsRes.data);
      } else if (!homeroomsRes) {
        setFetchError('Không thể kết nối đến máy chủ để tải danh sách lớp. Vui lòng thử lại.');
      }

      if (majorsRes && Array.isArray(majorsRes.data)) setMajors(majorsRes.data);
      if (teachersRes && Array.isArray(teachersRes.data)) setTeachers(teachersRes.data);
      if (unassignedRes && Array.isArray(unassignedRes.data)) setTotalUnassigned(unassignedRes.data.length);
    } catch (err: any) {
      console.error(err);
      setFetchError('Có lỗi xảy ra khi tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  const handle1ClickAutoAssign = async () => {
    setAllLoading(true);
    setAllResult(null);
    setMessage(null);
    try {
      const res = await academicService.autoAssignAllFreshmen({ cohort: allCohort || undefined });
      setAllResult(res.data);
      setMessage({
        type: 'success',
        text: `Hoàn tất Auto-Assign toàn diện: Đã phân lớp cho ${res.data.totalStudents} tân sinh viên, tạo ${res.data.classesCreated} lớp sinh hoạt, mở ${res.data.totalCourseClassesCreated} lớp học phần và kích hoạt LMS!`
      });
      fetchData();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Có lỗi xảy ra trong quá trình Auto-Assign toàn trường.'
      });
    } finally {
      setAllLoading(false);
    }
  };

  const getStudentCount = (h: HomeroomClass) => {
    if (Array.isArray(h.students) && h.students.length > 0) return h.students.length;
    if (h._count?.students !== undefined) return h._count.students;
    if (Array.isArray(h.students)) return h.students.length;
    return 0;
  };

  const handleViewRoster = async (homeroom: HomeroomClass) => {
    setSelectedHomeroom(homeroom);
    setRosterLoading(true);
    try {
      // Direct query for this specific homeroom
      const res = await academicService.getStudents({ homeroomClassId: homeroom.id });
      const enrolled = res.data || [];
      
      // Sort A-Z by Vietnamese name
      enrolled.sort((a: any, b: any) => {
        const nameA = a.user?.profile?.fullName || a.user?.username || '';
        const nameB = b.user?.profile?.fullName || b.user?.username || '';
        const partsA = nameA.trim().split(' ');
        const partsB = nameB.trim().split(' ');
        const firstA = partsA.pop() || '';
        const firstB = partsB.pop() || '';
        if (firstA !== firstB) return firstA.localeCompare(firstB, 'vi');
        return nameA.localeCompare(nameB, 'vi');
      });

      setRosterStudents(enrolled);
    } catch (err) {
      console.error(err);
      setRosterStudents([]);
    } finally {
      setRosterLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage(null);
    try {
      await academicService.createHomeroom({
        ...formData,
        advisorId: formData.advisorId || undefined
      });
      setMessage({ type: 'success', text: 'Tạo lớp sinh hoạt thành công!' });
      setFormData({ code: '', name: '', majorId: '', cohort: '', advisorId: '' });
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi tạo lớp sinh hoạt' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const checkUnassigned = async () => {
    if (!autoAssignData.cohort || !autoAssignData.majorId) return;
    try {
      let res = await academicService.getUnassignedHomeroomStudents({
        cohort: autoAssignData.cohort,
        majorId: autoAssignData.majorId
      });
      let students = res.data || [];
      
      // Fallback matching if empty: "1" <-> "K1"
      if (students.length === 0) {
        const alt = autoAssignData.cohort.startsWith('K') 
          ? autoAssignData.cohort.substring(1) 
          : `K${autoAssignData.cohort}`;
        const altRes = await academicService.getUnassignedHomeroomStudents({
          cohort: alt,
          majorId: autoAssignData.majorId
        });
        if (altRes.data && altRes.data.length > 0) {
          students = altRes.data;
          setAutoAssignData(prev => ({ ...prev, cohort: alt }));
        }
      }

      setUnassignedCount(students.length);
      setUnassignedStudentIds(students.map(s => s.id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAutoAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (unassignedCount === 0 || unassignedCount === null) {
      alert("Chưa có sinh viên nào đủ điều kiện để phân lớp!");
      return;
    }

    setAutoAssignLoading(true);
    setMessage(null);
    try {
      const res = await academicService.autoAssignHomerooms({
        majorId: autoAssignData.majorId,
        cohort: autoAssignData.cohort,
        studentIds: unassignedStudentIds,
        numberOfClasses: autoAssignData.numberOfClasses,
        prefix: autoAssignData.prefix,
        suffix: autoAssignData.suffix || undefined
      });
      
      const resData = res.data;
      const enrolledMsg = resData?.curriculumCoursesCloned 
        ? ` Đồng thời hệ thống đã quét Khung đào tạo Kỳ 1, tự động khởi tạo ${resData.curriculumCoursesCloned} lớp học phần và ghi danh cứng toàn bộ sinh viên!` 
        : '';

      setMessage({ 
        type: 'success', 
        text: `Thành công: Đã tạo ${resData?.classesCreated || autoAssignData.numberOfClasses} lớp sinh hoạt và phân bổ ${unassignedCount} tân sinh viên theo thứ tự A-Z.${enrolledMsg}` 
      });
      setShowAutoAssign(false);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi tự động phân lớp sinh hoạt' });
    } finally {
      setAutoAssignLoading(false);
    }
  };

  // Filtered Homerooms
  const filteredHomerooms = homerooms.filter(h => {
    const matchesSearch = 
      h.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.major?.name && h.major.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesMajor = !selectedMajorFilter || h.majorId === selectedMajorFilter;
    const matchesCohort = !selectedCohortFilter || h.cohort === selectedCohortFilter;
    return matchesSearch && matchesMajor && matchesCohort;
  });

  const totalAssignedStudents = homerooms.reduce((acc, h) => acc + getStudentCount(h), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* 1. TOP METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lớp Sinh Hoạt</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{homerooms.length}</p>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <Check size={12} /> Đã phân bổ quản lý
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <GraduationCap size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">SV Đã Có Lớp</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">{totalAssignedStudents}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">Đã có TKB & LMS</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tân SV Chưa Có Lớp</p>
            <p className={`text-2xl font-black mt-1 ${totalUnassigned > 0 ? 'text-amber-500 animate-pulse' : 'text-gray-900'}`}>
              {totalUnassigned}
            </p>
            <p className="text-xs text-amber-600 font-medium mt-1">
              {totalUnassigned > 0 ? 'Cần chạy Auto-Assign' : 'Đã phân bổ 100%'}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${totalUnassigned > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <Zap size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Chuyên Ngành Đào Tạo</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{majors.length}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">Khung đào tạo Kỳ 1</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookOpen size={24} />
          </div>
        </div>
      </div>

      {/* 2. GRAND HERO BANNER: 1-CLICK AUTO-ASSIGN ALL-IN-ONE */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-7 md:p-8 shadow-2xl border border-indigo-800/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-400/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={14} className="text-purple-400" />
              <span>ERP 1-Click Auto-Provisioning Engine</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              Tự Động Hóa 4-Trong-1: Phân Lớp, Lập Lịch Học, Thời Khóa Biểu & Kích Hoạt LMS
            </h1>

            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              Chỉ với <strong className="text-purple-300">1 thao tác bấm nút Auto-Assign</strong>, toàn bộ hàng trăm tân sinh viên sẽ tự động có 
              <span className="text-indigo-200 font-semibold"> Lớp Sinh Hoạt (A-Z)</span>, 
              <span className="text-indigo-200 font-semibold"> Lớp Học Phần Kỳ 1</span> theo Khung đào tạo, 
              <span className="text-indigo-200 font-semibold"> Thời Khóa Biểu 10 tuần</span> và 
              <span className="text-indigo-200 font-semibold"> Không gian học tập trên LMS</span> với đầy đủ bài giảng & bài tập.
            </p>

            {/* 4 Steps Showcase */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 backdrop-blur-xs flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-purple-500/30 text-purple-300 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <span className="text-xs font-medium text-gray-200">Lớp Sinh Hoạt (A-Z)</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 backdrop-blur-xs flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/30 text-indigo-300 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <span className="text-xs font-medium text-gray-200">Lớp Học Phần (Kỳ 1)</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 backdrop-blur-xs flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-500/30 text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <span className="text-xs font-medium text-gray-200">TKB 10 Tuần (Ca/Phòng)</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 backdrop-blur-xs flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/30 text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0">4</span>
                <span className="text-xs font-medium text-gray-200">Kích Hoạt LMS Toàn Diện</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => { setShowAllModal(true); setAllResult(null); }}
              className="px-6 py-4 bg-gradient-to-r from-purple-500 via-indigo-600 to-indigo-700 hover:from-purple-600 hover:to-indigo-800 text-white font-bold rounded-2xl shadow-xl hover:shadow-purple-500/25 transition-all flex items-center justify-center gap-3 group transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Zap size={22} className="text-amber-300 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <span className="block text-xs uppercase tracking-wider text-purple-200">One-Click Action</span>
                <span className="text-base font-extrabold">Bấm Auto-Assign Toàn Trường</span>
              </div>
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => { setShowAutoAssign(!showAutoAssign); setShowForm(false); }}
                className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl backdrop-blur-xs transition border border-white/10 flex items-center justify-center gap-1.5"
              >
                <span>Phân lớp theo từng ngành</span>
              </button>
              <button
                onClick={() => { setShowForm(!showForm); setShowAutoAssign(false); }}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl backdrop-blur-xs transition border border-white/10 flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                <span>Thêm thủ công</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FEEDBACK MESSAGE */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          {message.type === 'success' ? <CheckCircle size={20} className="text-emerald-600 shrink-0" /> : <AlertCircle size={20} className="text-rose-600 shrink-0" />}
          <p className="text-sm font-semibold flex-1">{message.text}</p>
          <button onClick={() => setMessage(null)} className="opacity-70 hover:opacity-100 font-bold p-1">×</button>
        </div>
      )}

      {/* 3. 1-CLICK AUTO-ASSIGN TOÀN TRƯỜNG MODAL */}
      {showAllModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-indigo-800 p-6 text-white flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1.5 bg-white/20 rounded-lg"><Sparkles size={18} /></span>
                  <span className="text-xs uppercase font-bold tracking-wider text-purple-200">Quy trình tự động hóa ERP</span>
                </div>
                <h3 className="text-xl font-black">Xác Nhận Auto-Assign Toàn Trường (All-In-One)</h3>
                <p className="text-xs text-purple-100 mt-1">
                  Đồng bộ toàn bộ tân sinh viên vào Lớp Sinh Hoạt, Lớp Học Phần, Thời Khóa Biểu & LMS.
                </p>
              </div>
              <button 
                onClick={() => setShowAllModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {!allResult && !allLoading && (
                <>
                  <div className="bg-purple-50/70 border border-purple-100 p-4 rounded-2xl flex items-start gap-3">
                    <ShieldCheck size={24} className="text-purple-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-purple-900 space-y-1">
                      <p className="font-bold text-sm">Hệ thống sẽ thực hiện đồng thời các tác vụ sau:</p>
                      <ul className="list-disc pl-4 space-y-1 text-purple-800">
                        <li>Quét toàn bộ <strong className="font-bold text-purple-950">{totalUnassigned > 0 ? totalUnassigned : 'hàng trăm'}</strong> tân sinh viên chưa có lớp sinh hoạt.</li>
                        <li>Sắp xếp danh sách sinh viên theo thứ tự <strong>A-Z họ tên tiếng Việt</strong> chuẩn mực.</li>
                        <li>Tạo mã lớp theo chuyên ngành (VD: <code className="bg-white px-1.5 py-0.5 rounded border border-purple-200">CNTT1A</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-purple-200">KTPM1A</code>) với sĩ số tối ưu ~35 SV/lớp.</li>
                        <li>Quét Khung đào tạo Kỳ 1 (Curriculum) và nhân bản tương ứng cho từng lớp sinh hoạt.</li>
                        <li>Tự động xếp Thời Khóa Biểu 10 tuần (Mon-Fri, ca học 1-4, phòng học & Lab).</li>
                        <li>Mở sẵn không gian môn học trên LMS: Đề cương, Slide bài giảng (PDF), Video & Bài tập tuần 1.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Chọn Khóa Đào Tạo (Cohort)</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Khóa 1 (Tân SV)', val: '1' },
                        { label: 'Khóa K1', val: 'K1' },
                        { label: 'Khóa K18', val: 'K18' },
                        { label: 'Tất cả các khóa', val: '' }
                      ].map(opt => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setAllCohort(opt.val)}
                          className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${allCohort === opt.val ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                        >
                          <span>{opt.label}</span>
                          <span className={`text-[10px] font-normal ${allCohort === opt.val ? 'text-purple-200' : 'text-gray-400'}`}>
                            {opt.val ? `cohort="${opt.val}"` : 'Tất cả'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Loading State */}
              {allLoading && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                    <Sparkles className="w-6 h-6 text-purple-600 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">Đang Tiến Hành Auto-Assign Toàn Trường...</h4>
                    <p className="text-xs text-gray-500 max-w-sm mt-1">
                      Đang xử lý phân lớp A-Z ➔ Mở Lớp học phần ➔ Sinh TKB 10 tuần ➔ Kích hoạt LMS cho tất cả sinh viên. Vui lòng chờ vài giây!
                    </p>
                  </div>
                </div>
              )}

              {/* Success Result View */}
              {allResult && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check size={20} />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-emerald-950">Auto-Assign Toàn Bộ Thành Công Rực Rỡ!</h4>
                      <p className="text-xs text-emerald-700">{allResult.message}</p>
                    </div>
                  </div>

                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-100 text-center">
                      <span className="text-[11px] font-semibold text-purple-700 uppercase block">Sinh Viên Phân Lớp</span>
                      <strong className="text-2xl font-black text-purple-950 block mt-0.5">{allResult.totalStudents}</strong>
                    </div>
                    <div className="bg-indigo-50 p-3.5 rounded-xl border border-indigo-100 text-center">
                      <span className="text-[11px] font-semibold text-indigo-700 uppercase block">Lớp Sinh Hoạt Mới</span>
                      <strong className="text-2xl font-black text-indigo-950 block mt-0.5">{allResult.classesCreated}</strong>
                    </div>
                    <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-100 text-center">
                      <span className="text-[11px] font-semibold text-blue-700 uppercase block">Lớp Học Phần Kỳ 1</span>
                      <strong className="text-2xl font-black text-blue-950 block mt-0.5">{allResult.totalCourseClassesCreated}</strong>
                    </div>
                    <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-100 text-center">
                      <span className="text-[11px] font-semibold text-emerald-700 uppercase block">TKB & Không Gian LMS</span>
                      <strong className="text-2xl font-black text-emerald-950 block mt-0.5">100% Sẵn Sàng</strong>
                    </div>
                  </div>

                  {/* Major Breakdown Table */}
                  {allResult.details && allResult.details.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Chi Tiết Phân Bổ Theo Chuyên Ngành:</h5>
                      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y text-xs">
                        {allResult.details.map((d: any, idx: number) => (
                          <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-gray-50">
                            <div>
                              <strong className="text-gray-900 block font-semibold">{d.majorName}</strong>
                              <span className="text-gray-500 font-mono text-[11px]">Tiền tố: {d.prefix}A, {d.prefix}B</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-indigo-600">{d.studentsCount} SV</span>
                              <span className="text-gray-400 block text-[10px]">{d.classesCreated} lớp SH • {d.curriculumCoursesPerClass * d.classesCreated} lớp HP</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Navigation Shortcuts */}
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
                    <p className="text-xs font-bold text-gray-700">Xem ngay kết quả trên các phân hệ:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {onNavigateTab && (
                        <>
                          <button
                            type="button"
                            onClick={() => { setShowAllModal(false); onNavigateTab('schedule'); }}
                            className="p-2.5 bg-white border border-gray-200 hover:border-indigo-400 rounded-xl text-xs font-semibold text-indigo-700 flex items-center justify-center gap-1.5 transition shadow-xs"
                          >
                            <Calendar size={14} />
                            <span>Thời Khóa Biểu</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowAllModal(false); onNavigateTab('lms'); }}
                            className="p-2.5 bg-white border border-gray-200 hover:border-indigo-400 rounded-xl text-xs font-semibold text-indigo-700 flex items-center justify-center gap-1.5 transition shadow-xs"
                          >
                            <Laptop size={14} />
                            <span>Khóa Học LMS</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowAllModal(false); onNavigateTab('classes'); }}
                            className="p-2.5 bg-white border border-gray-200 hover:border-indigo-400 rounded-xl text-xs font-semibold text-indigo-700 flex items-center justify-center gap-1.5 transition shadow-xs"
                          >
                            <BookOpen size={14} />
                            <span>Lớp Học Phần</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-5 border-t border-gray-100 flex justify-end gap-3">
              {!allResult ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowAllModal(false)}
                    disabled={allLoading}
                    className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handle1ClickAutoAssign}
                    disabled={allLoading}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                  >
                    <Zap size={16} />
                    <span>Tiến Hành Auto-Assign Toàn Trường</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAllModal(false)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                >
                  Đóng & Xem Danh Sách Lớp
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. SINGLE MAJOR AUTO ASSIGN SECTION (EXPANDABLE) */}
      {showAutoAssign && (
        <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50/40 p-6 rounded-2xl border border-purple-200 shadow-md animate-in fade-in slide-in-from-top-4 space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-600 text-white rounded-xl shadow-sm"><Zap size={24} /></div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-purple-950">Phân Lớp Tự Động Theo Từng Ngành (Single Major)</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">ERP Engine</span>
              </div>
              <p className="text-sm text-purple-700 mt-1">
                Tùy chỉnh phân lớp cho riêng 1 chuyên ngành cụ thể: Sắp xếp A-Z ➔ Chia lớp sinh hoạt ➔ Quét Khung đào tạo Kỳ 1 ➔ Mở Lớp học phần & LMS.
              </p>
            </div>
          </div>

          <form onSubmit={handleAutoAssign} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="space-y-4 bg-white p-5 rounded-xl border border-purple-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center">1</span>
                    Lọc Sinh Viên Cần Phân Lớp
                  </h4>
                  <div className="space-y-3 mt-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Khóa / Cohort</label>
                        <div className="flex gap-1">
                          {['1', 'K1', 'K18', '2026'].map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setAutoAssignData({ ...autoAssignData, cohort: c })}
                              className={`px-1.5 py-0.5 text-[10px] rounded transition font-medium ${autoAssignData.cohort === c ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input 
                        required 
                        value={autoAssignData.cohort} 
                        onChange={e => setAutoAssignData({...autoAssignData, cohort: e.target.value})} 
                        type="text" 
                        placeholder="ví dụ: 1 hoặc K1, K18..." 
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-200 outline-none text-sm" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase">Chuyên ngành ({majors.length})</label>
                      <select 
                        required 
                        value={autoAssignData.majorId} 
                        onChange={e => {
                          const mId = e.target.value;
                          const selMajor = majors.find(m => m.id === mId);
                          const prefixGuess = selMajor?.code?.startsWith('7') ? `CN${selMajor.code.substring(3)}` : selMajor?.code || 'LH';
                          setAutoAssignData({
                            ...autoAssignData, 
                            majorId: mId,
                            prefix: autoAssignData.prefix || `${prefixGuess}${autoAssignData.cohort || '1'}`
                          });
                        }} 
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-200 outline-none bg-white text-sm"
                      >
                        <option value="" disabled>-- Chọn Chuyên ngành --</option>
                        {majors.map(m => (
                          <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={checkUnassigned} 
                  disabled={!autoAssignData.cohort || !autoAssignData.majorId} 
                  className="w-full mt-2 py-2.5 bg-purple-100 hover:bg-purple-200 text-purple-900 text-sm font-semibold rounded-lg transition disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  🔍 Tìm sinh viên đủ điều kiện
                </button>
              </div>

              {/* Step 2 */}
              <div className="space-y-4 bg-white p-5 rounded-xl border border-purple-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center">2</span>
                    Thiết lập Tên Lớp
                  </h4>
                  <div className="space-y-3 mt-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase">Tiền tố lớp (Prefix)</label>
                      <input 
                        required 
                        value={autoAssignData.prefix} 
                        onChange={e => setAutoAssignData({...autoAssignData, prefix: e.target.value})} 
                        type="text" 
                        placeholder="vd: CNTT1 hoặc KTPM1" 
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-200 outline-none text-sm" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase">Hậu tố tùy chọn (Suffix)</label>
                      <input 
                        value={autoAssignData.suffix} 
                        onChange={e => setAutoAssignData({...autoAssignData, suffix: e.target.value})} 
                        type="text" 
                        placeholder="vd: TT (nếu có)" 
                        className="w-full px-3 py-2 border rounded-lg outline-none text-sm" 
                      />
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-100 text-xs text-purple-900">
                  <span className="font-semibold block mb-1">Mẫu tên lớp sẽ tạo:</span>
                  <div className="flex flex-wrap gap-1 font-mono">
                    <span className="px-2 py-0.5 bg-white border border-purple-200 rounded text-purple-800 font-bold">
                      {autoAssignData.prefix || 'PREFIX'}A{autoAssignData.suffix}
                    </span>
                    <span className="px-2 py-0.5 bg-white border border-purple-200 rounded text-purple-800 font-bold">
                      {autoAssignData.prefix || 'PREFIX'}B{autoAssignData.suffix}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="space-y-4 bg-white p-5 rounded-xl border border-purple-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center">3</span>
                    Thực thi & Ghi danh
                  </h4>
                  <div className="mt-3 space-y-3">
                    {unassignedCount !== null && (
                      <div className="p-3 bg-blue-50 text-blue-900 rounded-lg text-xs border border-blue-100">
                        Tìm thấy <strong className="text-blue-700 text-sm">{unassignedCount}</strong> tân sinh viên hợp lệ chưa có lớp.
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase">Số lượng lớp cần tạo</label>
                      <input 
                        required 
                        value={autoAssignData.numberOfClasses} 
                        onChange={e => setAutoAssignData({...autoAssignData, numberOfClasses: Number(e.target.value)})} 
                        type="number" 
                        min={1} 
                        max={26} 
                        className="w-full px-3 py-2 border rounded-lg outline-none text-sm font-semibold" 
                      />
                      {unassignedCount !== null && unassignedCount > 0 && autoAssignData.numberOfClasses > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Dự kiến: ~<strong className="text-gray-800">{Math.ceil(unassignedCount / autoAssignData.numberOfClasses)}</strong> sinh viên / lớp.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  disabled={autoAssignLoading || !unassignedCount || !autoAssignData.prefix} 
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  {autoAssignLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang xử lý 4 bước...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} />
                      <span>Chạy Auto-Assign Ngành Này</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 5. MANUAL CREATE FORM */}
      {showForm && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Tạo Thủ Công Lớp Sinh Hoạt Mới</h3>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Mã Lớp</label>
                <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} type="text" placeholder="vd: CNTT1A" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Tên Lớp</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" placeholder="vd: Lớp CNTT1A - Công Nghệ Thông Tin" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Khóa (Cohort)</label>
                <input required value={formData.cohort} onChange={e => setFormData({...formData, cohort: e.target.value})} type="text" placeholder="vd: 1 hoặc K1" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Chuyên Ngành</label>
                <select required value={formData.majorId} onChange={e => setFormData({...formData, majorId: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none bg-white text-sm">
                  <option value="" disabled>-- Chọn Chuyên Ngành --</option>
                  {majors.map(m => (
                    <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Cố Vấn Học Tập / GVCN (Tùy chọn)</label>
                <select value={formData.advisorId} onChange={e => setFormData({...formData, advisorId: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none bg-white text-sm">
                  <option value="">-- Chưa chỉ định cố vấn --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName || t.username} ({t.email})</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">
                Hủy
              </button>
              <button type="submit" disabled={submitLoading || !formData.majorId} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-70 transition text-sm">
                {submitLoading ? 'Đang lưu...' : 'Lưu Lớp Sinh Hoạt'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. SEARCH & FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã lớp, tên lớp, chuyên ngành..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-purple-200 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedMajorFilter}
            onChange={e => setSelectedMajorFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 bg-white outline-none"
          >
            <option value="">Tất cả Chuyên ngành ({majors.length})</option>
            {majors.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          <select
            value={selectedCohortFilter}
            onChange={e => setSelectedCohortFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 bg-white outline-none"
          >
            <option value="">Tất cả Khóa</option>
            {Array.from(new Set(homerooms.map(h => h.cohort))).map(c => (
              <option key={c} value={c}>Khóa {c}</option>
            ))}
          </select>

          <button
            onClick={fetchData}
            title="Làm mới dữ liệu"
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 transition"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 7. HOMEROOM CLASSES TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="p-4 pl-6">Mã Lớp</th>
                  <th className="p-4">Tên Lớp Sinh Hoạt</th>
                  <th className="p-4">Khóa</th>
                  <th className="p-4">Chuyên Ngành</th>
                  <th className="p-4">Cố Vấn Học Tập</th>
                  <th className="p-4 text-center">Sĩ Số</th>
                  <th className="p-4 pr-6 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="p-4 pl-6"><div className="h-4 w-16 bg-purple-100 rounded-md" /></td>
                    <td className="p-4"><div className="h-4 w-36 bg-gray-200 rounded-md" /></td>
                    <td className="p-4"><div className="h-5 w-14 bg-purple-50 rounded-full" /></td>
                    <td className="p-4"><div className="h-4 w-44 bg-gray-100 rounded-md" /></td>
                    <td className="p-4"><div className="h-4 w-24 bg-gray-100 rounded-md" /></td>
                    <td className="p-4 text-center"><div className="h-5 w-14 bg-emerald-50 rounded-full mx-auto" /></td>
                    <td className="p-4 pr-6 text-right"><div className="h-8 w-24 bg-gray-100 rounded-xl ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : fetchError ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle size={36} className="mx-auto text-rose-500" />
            <h4 className="text-base font-bold text-gray-800">{fetchError}</h4>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCw size={14} />
              <span>Thử lại ngay</span>
            </button>
          </div>
        ) : filteredHomerooms.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <GraduationCap size={40} className="mx-auto text-gray-300" />
            <h4 className="text-base font-bold text-gray-700">Chưa tìm thấy Lớp Sinh Hoạt nào</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Hãy bấm nút <strong className="text-purple-600">"Bấm Auto-Assign Toàn Trường"</strong> ở banner trên để hệ thống tự động phân lớp cho tất cả sinh viên!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="p-4 pl-6">Mã Lớp</th>
                  <th className="p-4">Tên Lớp Sinh Hoạt</th>
                  <th className="p-4">Khóa</th>
                  <th className="p-4">Chuyên Ngành</th>
                  <th className="p-4">Cố Vấn Học Tập</th>
                  <th className="p-4 text-center">Sĩ Số</th>
                  <th className="p-4 pr-6 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredHomerooms.map(h => (
                  <tr key={h.id} className="hover:bg-purple-50/30 transition group">
                    <td className="p-4 pl-6 font-bold text-purple-950 font-mono">
                      {h.code}
                    </td>
                    <td className="p-4 font-medium text-gray-800">
                      {h.name}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                        Khóa {h.cohort}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        {h.major?.name || '-'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 text-xs">
                      {h.advisor ? (
                        <div className="font-medium text-gray-900">
                          {h.advisor.fullName || h.advisor.username}
                        </div>
                      ) : (
                        <span className="italic text-gray-400">Chưa phân công</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleViewRoster(h)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition cursor-pointer shadow-2xs"
                        title="Bấm để xem danh sách sinh viên"
                      >
                        <Users size={12} />
                        <span>{getStudentCount(h)} SV</span>
                      </button>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => handleViewRoster(h)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-white hover:border-purple-300 hover:text-purple-700 transition shadow-2xs"
                      >
                        <Eye size={13} />
                        <span>Danh Sách SV</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 8. ROSTER MODAL (DANH SÁCH SINH VIÊN TRONG LỚP SH) */}
      {selectedHomeroom && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 p-6 text-white flex justify-between items-center">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-purple-200">Danh Sách Tân Sinh Viên</span>
                <h3 className="text-xl font-black mt-0.5">{selectedHomeroom.name} ({selectedHomeroom.code})</h3>
                <p className="text-xs text-purple-200 mt-1">
                  Chuyên ngành: {selectedHomeroom.major?.name || '-'} • Khóa {selectedHomeroom.cohort} • Sắp xếp A-Z
                </p>
              </div>
              <button 
                onClick={() => setSelectedHomeroom(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {rosterLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-gray-500">Đang tải danh sách sinh viên...</span>
                </div>
              ) : rosterStudents.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  Lớp này hiện chưa có sinh viên nào.
                </div>
              ) : (
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 font-bold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="p-3 pl-4">#</th>
                        <th className="p-3">Mã SV</th>
                        <th className="p-3">Họ và Tên (A-Z)</th>
                        <th className="p-3">Email Sinh Viên</th>
                        <th className="p-3 text-center">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rosterStudents.map((st: any, idx: number) => (
                        <tr key={st.id || idx} className="hover:bg-purple-50/30 transition">
                          <td className="p-3 pl-4 font-mono text-gray-400">{idx + 1}</td>
                          <td className="p-3 font-mono font-bold text-purple-900">{st.studentCode || st.user?.username}</td>
                          <td className="p-3 font-semibold text-gray-900">
                            {st.user?.profile?.fullName || st.user?.username || 'Sinh viên'}
                          </td>
                          <td className="p-3 text-gray-500 font-mono text-[11px]">{st.user?.email || '-'}</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              ACTIVE
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
              <span>Tổng số: <strong className="text-gray-900">{rosterStudents.length}</strong> sinh viên trong lớp</span>
              <button
                onClick={() => setSelectedHomeroom(null)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
