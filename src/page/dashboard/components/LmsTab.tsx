import { useState, useEffect, useCallback } from 'react';
import { academicService, type Class } from '../../../services/academic.service';
import { lmsService, type LmsModuleData, type AssignmentData } from '../../../services/lms.service';
import {
  BookOpen,
  FileText,
  Clock,
  MessageSquare,
  Award,
  Calendar,
  School,
} from 'lucide-react';
import LmsCourseSpace from './lms/LmsCourseSpace';
import LmsAssignments from './lms/LmsAssignments';
import LmsQuizzes from './lms/LmsQuizzes';
import LmsDiscussions from './lms/LmsDiscussions';
import LmsGradebook from './lms/LmsGradebook';
import LmsCalendarAnnouncements from './lms/LmsCalendarAnnouncements';

const DEFAULT_MODULES: LmsModuleData[] = [
  {
    id: 'mod-1',
    classId: 'class-demo',
    title: 'Tuần 1: Tổng quan Kiến trúc Hệ thống & RESTful API',
    description: 'Tổng quan môn học, phương pháp học tập và các chuẩn đầu ra cần đạt được.',
    week: 1,
    materials: [
      {
        id: 'mat-1',
        title: 'Đề cương chi tiết học phần (PDF)',
        type: 'PDF',
        url: 'https://storage.preskool.edu.vn/materials/de_cuong.pdf',
        description: 'Tài liệu hướng dẫn môn học và phương pháp đánh giá',
        isCompleted: true,
      },
      {
        id: 'mat-2',
        title: 'Video Bài giảng Khai mạc môn học',
        type: 'VIDEO',
        url: 'https://storage.preskool.edu.vn/materials/video_lecture_1.mp4',
        description: 'Xem trước bài giảng trước khi lên lớp',
        isCompleted: true,
      },
      {
        id: 'mat-3',
        title: 'Slide bài giảng Tuần 1: Clean Architecture',
        type: 'PPTX',
        url: 'https://storage.preskool.edu.vn/materials/slide_week1.pptx',
        description: 'Slide chính thức dùng trong các buổi học lý thuyết',
        isCompleted: false,
      },
    ],
  },
  {
    id: 'mod-2',
    classId: 'class-demo',
    title: 'Tuần 2: Thiết kế CSDL Quan Hệ & Tối Ưu Truy Vấn',
    description: 'Mô hình hóa dữ liệu quan hệ, Indexing B-Tree và Transaction Isolation.',
    week: 2,
    materials: [
      {
        id: 'mat-4',
        title: 'Slide bài giảng Tuần 2: Database Indexing',
        type: 'PDF',
        url: 'https://storage.preskool.edu.vn/materials/slide_week2.pdf',
        isCompleted: false,
      },
      {
        id: 'mat-5',
        title: 'Tài liệu đọc thêm: Designing Data-Intensive Applications',
        type: 'LINK',
        url: 'https://dataintensive.net',
        isCompleted: false,
      },
    ],
  },
];

const DEFAULT_ASSIGNMENTS: AssignmentData[] = [
  {
    id: 'ass-1',
    classId: 'class-demo',
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
    classId: 'class-demo',
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
];

export default function LmsTab({ user }: { user: any }) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('class-demo');
  const [selectedClassName, setSelectedClassName] = useState<string>('Lập trình RESTful API & Backend (SE101.N11)');
  const [activeSubTab, setActiveSubTab] = useState<
    'space' | 'assignments' | 'quizzes' | 'discussions' | 'gradebook' | 'calendar'
  >('space');

  const [modules, setModules] = useState<LmsModuleData[]>(DEFAULT_MODULES);
  const [assignments, setAssignments] = useState<AssignmentData[]>(DEFAULT_ASSIGNMENTS);

  const fetchClassData = useCallback(async (cId: string) => {
    if (!cId) return;
    try {
      const [modRes, assRes] = await Promise.allSettled([
        lmsService.getModules(cId),
        lmsService.getAssignments(cId),
      ]);

      if (modRes.status === 'fulfilled' && Array.isArray(modRes.value?.data) && modRes.value.data.length > 0) {
        setModules(modRes.value.data);
      } else {
        setModules(DEFAULT_MODULES.map((m) => ({ ...m, classId: cId })));
      }

      if (assRes.status === 'fulfilled' && Array.isArray(assRes.value?.data) && assRes.value.data.length > 0) {
        setAssignments(assRes.value.data);
      } else {
        setAssignments(DEFAULT_ASSIGNMENTS.map((a) => ({ ...a, classId: cId })));
      }
    } catch {
      setModules(DEFAULT_MODULES.map((m) => ({ ...m, classId: cId })));
      setAssignments(DEFAULT_ASSIGNMENTS.map((a) => ({ ...a, classId: cId })));
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await academicService.getClasses();
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setClasses(list);
      if (list.length > 0) {
        const firstId = list[0].id;
        setSelectedClassId(firstId);
        setSelectedClassName(`${list[0].code} - ${list[0].course?.name || 'Lớp Học Phần'}`);
        fetchClassData(firstId);
      } else {
        setSelectedClassId('class-demo');
        setSelectedClassName('SE101.N11 - Lập trình RESTful API & Backend');
        fetchClassData('class-demo');
      }
    } catch (err) {
      console.warn('Could not load classes list for LMS:', err);
      setSelectedClassId('class-demo');
      setSelectedClassName('SE101.N11 - Lập trình RESTful API & Backend');
      fetchClassData('class-demo');
    }
  }, [fetchClassData]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleSelectClass = (cId: string) => {
    setSelectedClassId(cId);
    const found = classes.find((c) => c.id === cId);
    if (found) {
      setSelectedClassName(`${found.code} - ${found.course?.name || 'Lớp Học Phần'}`);
    }
    fetchClassData(cId);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Course Selector */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-600 text-white shadow-xs">
              <School className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded uppercase">
                  LMS Học Trực Tuyến
                </span>
                <span className="text-[11px] text-gray-400 font-medium">Học kỳ 1 • 2026-2027</span>
              </div>
              <h2 className="text-base font-bold text-gray-900 mt-0.5">{selectedClassName}</h2>
            </div>
          </div>

          {/* Class Select Dropdown */}
          <div className="flex items-center gap-2.5">
            <label className="text-xs font-semibold text-gray-600 whitespace-nowrap">Chọn Lớp:</label>
            <select
              value={selectedClassId}
              onChange={(e) => handleSelectClass(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2 text-xs font-medium text-gray-800 outline-none transition focus:border-blue-500 focus:bg-white"
            >
              {classes.length > 0 ? (
                classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.code} - {cls.course?.name || 'Lớp học phần'}
                  </option>
                ))
              ) : (
                <option value="class-demo">SE101.N11 - Lập trình RESTful API</option>
              )}
            </select>
          </div>
        </div>

        {/* Sub-tab Navigation (6 Modules) */}
        <div className="mt-5 pt-3 border-t border-gray-100 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveSubTab('space')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeSubTab === 'space'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>1. Học Liệu & Đề Cương</span>
          </button>

          <button
            onClick={() => setActiveSubTab('assignments')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeSubTab === 'assignments'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>2. Bài Tập & Đồ Án</span>
          </button>

          <button
            onClick={() => setActiveSubTab('quizzes')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeSubTab === 'quizzes'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>3. Khảo Thí & Thi Online</span>
          </button>

          <button
            onClick={() => setActiveSubTab('discussions')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeSubTab === 'discussions'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>4. Hỏi Đáp & Lớp Học Ảo</span>
          </button>

          <button
            onClick={() => setActiveSubTab('gradebook')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeSubTab === 'gradebook'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Award className="h-4 w-4" />
            <span>5. Sổ Điểm LMS & Phân Tích</span>
          </button>

          <button
            onClick={() => setActiveSubTab('calendar')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeSubTab === 'calendar'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>6. Lịch & Thông Báo</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-tab Content Rendering */}
      <div>
        {activeSubTab === 'space' && (
          <LmsCourseSpace
            key={selectedClassId}
            classId={selectedClassId}
            classNameTitle={selectedClassName}
            user={user}
            modules={modules}
            onModulesChange={setModules}
            onRefresh={() => fetchClassData(selectedClassId)}
          />
        )}

        {activeSubTab === 'assignments' && (
          <LmsAssignments
            key={selectedClassId}
            classId={selectedClassId}
            user={user}
            assignments={assignments}
            onAssignmentsChange={setAssignments}
            onRefresh={() => fetchClassData(selectedClassId)}
          />
        )}

        {activeSubTab === 'quizzes' && (
          <LmsQuizzes
            key={selectedClassId}
            classId={selectedClassId}
            user={user}
          />
        )}

        {activeSubTab === 'discussions' && (
          <LmsDiscussions
            key={selectedClassId}
            classId={selectedClassId}
            user={user}
          />
        )}

        {activeSubTab === 'gradebook' && (
          <LmsGradebook
            key={selectedClassId}
            classId={selectedClassId}
            user={user}
          />
        )}

        {activeSubTab === 'calendar' && (
          <LmsCalendarAnnouncements
            key={selectedClassId}
            classId={selectedClassId}
            user={user}
          />
        )}
      </div>
    </div>
  );
}
