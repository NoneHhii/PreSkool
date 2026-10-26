import React, { useState, useEffect } from 'react';
import {
  lmsService,
  type QuizData,
  type QuestionBankData,
} from '../../../../services/lms.service';
import {
  Clock,
  ShieldAlert,
  AlertTriangle,
  Play,
  Plus,
  X,
  FileQuestion,
  Lock,
  Award,
  Timer,
} from 'lucide-react';

interface LmsQuizzesProps {
  classId: string;
  user: any;
}

export const LmsQuizzes: React.FC<LmsQuizzesProps> = ({ classId, user }) => {
  const isAdmin = user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';

  const [subTab, setSubTab] = useState<'quizzes' | 'question_bank' | 'monitoring'>('quizzes');

  // Demo Quizzes
  const [quizzes, setQuizzes] = useState<QuizData[]>([
    {
      id: 'quiz-01',
      classId,
      title: 'Kiểm tra 15 phút: Kiến trúc RESTful & HTTP Methods',
      description: 'Làm bài nghiêm túc. Hệ thống tự động ghi nhận nếu chuyển tab hoặc mở cửa sổ khác.',
      openTime: '2026-11-01T08:00:00Z',
      closeTime: '2026-11-05T22:00:00Z',
      durationMinutes: 15,
      password: 'quizpassword2026',
      maxAttempts: 1,
      shuffleQuestions: true,
      shuffleOptions: true,
      passingScore: 5.0,
      questionMatrix: {
        difficulty: { EASY: 4, MEDIUM: 4, HARD: 2 },
      },
    },
    {
      id: 'quiz-02',
      classId,
      title: 'Trắc nghiệm Giữa Kỳ: CSDL Quan Hệ & Tối Ưu Truy Vấn',
      description: 'Gồm 20 câu trắc nghiệm tổng hợp lý thuyết và câu hỏi mã SQL.',
      openTime: '2026-11-10T08:00:00Z',
      closeTime: '2026-11-15T22:00:00Z',
      durationMinutes: 30,
      maxAttempts: 2,
      shuffleQuestions: true,
      shuffleOptions: true,
      passingScore: 5.0,
    },
  ]);

  // Demo Question Bank
  const [questions, setQuestions] = useState<QuestionBankData[]>([
    {
      id: 'qb-1',
      courseId: 'course-it-01',
      title: 'Đặc trưng RESTful API',
      difficulty: 'MEDIUM',
      chapter: 'Chương 1',
      content: 'Phương thức HTTP nào được khuyến nghị cho việc cập nhật một phần của tài nguyên (partial update)?',
      options: ['POST', 'PUT', 'PATCH', 'GET'],
      answer: 'PATCH',
    },
    {
      id: 'qb-2',
      courseId: 'course-it-01',
      title: 'Mã phản hồi HTTP',
      difficulty: 'EASY',
      chapter: 'Chương 1',
      content: 'Mã HTTP Status Code nào biểu thị tài nguyên được yêu cầu không tìm thấy trên server?',
      options: ['200 OK', '401 Unauthorized', '403 Forbidden', '404 Not Found'],
      answer: '404 Not Found',
    },
    {
      id: 'qb-3',
      courseId: 'course-it-01',
      title: 'CSDL Indexing',
      difficulty: 'HARD',
      chapter: 'Chương 2',
      content: 'Cấu trúc dữ liệu nào phổ biến nhất được sử dụng để xây dựng Index trong hệ quản trị CSDL quan hệ như PostgreSQL/MySQL?',
      options: ['Binary Search Tree', 'B-Tree / B+Tree', 'Hash Table', 'Trie'],
      answer: 'B-Tree / B+Tree',
    },
    {
      id: 'qb-4',
      courseId: 'course-it-01',
      title: 'Idempotency trong REST',
      difficulty: 'MEDIUM',
      chapter: 'Chương 1',
      content: 'Phương thức HTTP nào sau đây KHÔNG có tính chất Idempotent?',
      options: ['GET', 'PUT', 'DELETE', 'POST'],
      answer: 'POST',
    },
  ]);

  // Real-time Monitoring List (Teacher)
  const [monitoringList, setMonitoringList] = useState<any[]>([
    {
      studentId: 'st-01',
      studentCode: '26107002',
      fullName: 'Nguyễn Văn An',
      startTime: '10:05:12',
      progress: '8/10 câu',
      tabSwitchCount: 0,
      status: 'DOING',
    },
    {
      studentId: 'st-02',
      studentCode: '26107003',
      fullName: 'Trần Thị Mai',
      startTime: '10:02:40',
      progress: '10/10 câu',
      tabSwitchCount: 1,
      status: 'SUBMITTED',
      score: 9.0,
    },
    {
      studentId: 'st-03',
      studentCode: '26107004',
      fullName: 'Lê Hoàng Nam',
      startTime: '10:08:15',
      progress: '4/10 câu',
      tabSwitchCount: 4, // Cheating suspected!
      status: 'DOING',
    },
  ]);

  // ACTIVE EXAM STATE (STUDENT)
  const [activeQuiz, setActiveQuiz] = useState<QuizData | null>(null);
  const [examAttemptId, setExamAttemptId] = useState<string>('');
  const [quizPasswordInput, setQuizPasswordInput] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isExamRunning, setIsExamRunning] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(15 * 60);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('Đã kết nối');
  const [tabSwitchAlert, setTabSwitchAlert] = useState<{ show: boolean; count: number }>({ show: false, count: 0 });
  const [examResult, setExamResult] = useState<any | null>(null);

  // Teacher Modals
  const [showCreateQuizModal, setShowCreateQuizModal] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [newQuizForm, setNewQuizForm] = useState<QuizData>({
    classId,
    title: '',
    durationMinutes: 15,
    openTime: '',
    closeTime: '',
    password: '',
    maxAttempts: 1,
    passingScore: 5.0,
    shuffleQuestions: true,
    shuffleOptions: true,
  });

  const [newQuestionForm, setNewQuestionForm] = useState<QuestionBankData>({
    courseId: 'course-it-01',
    title: '',
    chapter: 'Chương 1',
    difficulty: 'MEDIUM',
    content: '',
    options: ['', '', '', ''],
    answer: '',
  });

  // Countdown timer effect
  useEffect(() => {
    let timer: any;
    if (isExamRunning && timeLeftSeconds > 0) {
      timer = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAutoSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isExamRunning, timeLeftSeconds]);

  // Anti-cheating listeners (Tab Switch & Blur Detection)
  useEffect(() => {
    if (!isExamRunning) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleTriggerCheatingLog('Sinh viên chuyển sang tab hoặc cửa sổ khác');
      }
    };

    const handleWindowBlur = () => {
      handleTriggerCheatingLog('Cửa sổ làm bài thi bị mất tiêu điểm (Window blur)');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isExamRunning, examAttemptId]);

  const handleTriggerCheatingLog = async (details: string) => {
    setTabSwitchAlert((prev) => {
      const nextCount = prev.count + 1;
      return { show: true, count: nextCount };
    });

    try {
      if (examAttemptId) {
        await lmsService.logCheating(examAttemptId, {
          event: 'TAB_SWITCH',
          details,
        });
      }
    } catch {
      // fallback
    }
  };

  const handleStartExamPrompt = (quiz: QuizData) => {
    setActiveQuiz(quiz);
    if (quiz.password) {
      setQuizPasswordInput('');
      setShowPasswordModal(true);
    } else {
      startExamDirectly(quiz);
    }
  };

  const handleConfirmPassword = () => {
    if (activeQuiz?.password && quizPasswordInput !== activeQuiz.password) {
      alert('Mật khẩu ca thi không chính xác! Vui lòng kiểm tra lại với giám thị.');
      return;
    }
    setShowPasswordModal(false);
    startExamDirectly(activeQuiz!);
  };

  const startExamDirectly = async (quiz: QuizData) => {
    const attemptId = `att-${Date.now()}`;
    setExamAttemptId(attemptId);
    setTimeLeftSeconds(quiz.durationMinutes * 60);
    setStudentAnswers({});
    setCurrentQuestionIdx(0);
    setTabSwitchAlert({ show: false, count: 0 });
    setExamResult(null);
    setIsExamRunning(true);

    try {
      await lmsService.startQuiz(quiz.id!, quizPasswordInput);
    } catch {
      // fallback
    }
  };

  // Real-time auto save answer
  const handleSelectAnswer = async (questionId: string, answer: string) => {
    setStudentAnswers((prev) => ({ ...prev, [questionId]: answer }));
    setAutoSaveStatus('Đang lưu...');

    try {
      if (examAttemptId) {
        await lmsService.saveQuizAnswer(examAttemptId, {
          questionBankId: questionId,
          studentAnswer: answer,
        });
      }
      setTimeout(() => setAutoSaveStatus('Đã lưu đáp án ✓'), 300);
    } catch {
      setAutoSaveStatus('Đã lưu bộ nhớ tạm');
    }
  };

  const handleAutoSubmitExam = () => {
    handleSubmitExam(true);
  };

  const handleSubmitExam = async (isTimeOut = false) => {
    if (!isTimeOut && !window.confirm('Bạn có chắc chắn muốn nộp bài thi? Không thể thay đổi đáp án sau khi nộp.')) {
      return;
    }

    setIsExamRunning(false);

    try {
      if (examAttemptId) {
        await lmsService.submitQuiz(examAttemptId);
      }
    } catch {
      // fallback
    }

    // Compute score based on questions
    let correctCount = 0;
    questions.forEach((q) => {
      if (studentAnswers[q.id!] === q.answer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100) / 10;
    setExamResult({
      score,
      totalQuestions: questions.length,
      correctCount,
      passed: score >= (activeQuiz?.passingScore || 5.0),
      tabSwitches: tabSwitchAlert.count,
    });
  };

  const handleReopenAttempt = async (studentId: string) => {
    try {
      await lmsService.reopenQuizAttempt('quiz-01', studentId);
    } catch {
      // fallback
    }
    setMonitoringList((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status: 'REOPENED', tabSwitchCount: 0 } : s))
    );
    alert('Đã mở lại lượt thi thành công cho sinh viên!');
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-6">
      {/* FULLSCREEN EXAM RUNNER FOR STUDENT */}
      {isExamRunning && activeQuiz && (
        <div className="fixed inset-0 z-50 bg-[#f8fafc] flex flex-col animate-in fade-in">
          {/* Exam Header */}
          <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                <FileQuestion className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-gray-900">{activeQuiz.title}</h3>
                <span className="text-[11px] text-gray-400 font-medium">
                  {autoSaveStatus} • Thí sinh: {user?.fullName || 'Sinh viên'}
                </span>
              </div>
            </div>

            {/* Countdown Timer with warning styling */}
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-base font-bold transition shadow-xs ${
                  timeLeftSeconds < 120
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                }`}
              >
                <Timer className="h-4 w-4" />
                <span>{formatTimer(timeLeftSeconds)}</span>
              </div>

              <button
                onClick={() => handleSubmitExam(false)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition cursor-pointer shadow-xs"
              >
                Nộp Bài Thi
              </button>
            </div>
          </header>

          {/* Exam Content Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Question Area */}
            <main className="flex-1 overflow-y-auto p-6 md:p-10 max-w-4xl mx-auto w-full">
              {questions[currentQuestionIdx] && (
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                      Câu Hỏi {currentQuestionIdx + 1} / {questions.length}
                    </span>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                      Độ khó: {questions[currentQuestionIdx].difficulty}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-gray-900 leading-relaxed">
                    {questions[currentQuestionIdx].content}
                  </h4>

                  {/* Options */}
                  <div className="space-y-3 pt-2">
                    {questions[currentQuestionIdx].options?.map((opt, oIdx) => {
                      const isSelected = studentAnswers[questions[currentQuestionIdx].id!] === opt;
                      return (
                        <div
                          key={oIdx}
                          onClick={() => handleSelectAnswer(questions[currentQuestionIdx].id!, opt)}
                          className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50/60 text-blue-900 font-semibold shadow-xs'
                              : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className="text-xs">{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Navigation prev/next */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                    <button
                      disabled={currentQuestionIdx === 0}
                      onClick={() => setCurrentQuestionIdx((p) => p - 1)}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                    >
                      ← Câu Trước
                    </button>
                    <button
                      disabled={currentQuestionIdx === questions.length - 1}
                      onClick={() => setCurrentQuestionIdx((p) => p + 1)}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40 cursor-pointer"
                    >
                      Câu Tiếp Theo →
                    </button>
                  </div>
                </div>
              )}
            </main>

            {/* Right Question Palette */}
            <aside className="w-72 border-l border-gray-200 bg-white p-6 hidden lg:block overflow-y-auto">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">Danh Sách Câu Hỏi</h4>
              <div className="grid grid-cols-4 gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = Boolean(studentAnswers[q.id!]);
                  const isCurrent = currentQuestionIdx === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestionIdx(idx)}
                      className={`h-10 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isCurrent
                          ? 'ring-2 ring-blue-600 bg-blue-50 text-blue-700'
                          : isAnswered
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 space-y-2 text-[11px] text-gray-500 border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-emerald-600" />
                  <span>Đã trả lời</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-gray-200" />
                  <span>Chưa trả lời</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded border-2 border-blue-600" />
                  <span>Đang xem</span>
                </div>
              </div>
            </aside>
          </div>

          {/* ANTI-CHEATING ALERT MODAL */}
          {tabSwitchAlert.show && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl border-2 border-rose-500">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-3 animate-bounce">
                  <ShieldAlert className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-rose-900">CẢNH BÁO VI PHẠM PHÒNG THI!</h3>
                <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                  Hệ thống phát hiện bạn vừa rời khỏi màn hình làm bài thi (Chuyển tab / Mất tiêu điểm).
                </p>
                <div className="my-3 rounded-lg bg-rose-50 p-2.5 text-xs font-bold text-rose-700">
                  Số lần vi phạm ghi nhận: {tabSwitchAlert.count} lần
                </div>
                <p className="text-[11px] text-gray-400">
                  Mọi hành vi đều được tự động lưu vào hệ thống giám sát và chuyển cho giảng viên xử lý.
                </p>
                <button
                  onClick={() => setTabSwitchAlert((prev) => ({ ...prev, show: false }))}
                  className="mt-4 w-full rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer shadow-sm"
                >
                  Tôi Đã Hiểu Và Quay Lại Làm Bài
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EXAM RESULT MODAL */}
      {examResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3">
              <Award className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Kết Quả Bài Thi Trắc Nghiệm</h3>
            <p className="text-xs text-gray-500 mt-1">{activeQuiz?.title}</p>

            <div className="my-5 rounded-2xl bg-gray-50 p-4 border border-gray-100 grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-gray-400 uppercase font-semibold">Điểm Tổng Kết</span>
                <p className="text-3xl font-extrabold text-blue-600 font-mono mt-0.5">{examResult.score}/10</p>
              </div>
              <div>
                <span className="text-[11px] text-gray-400 uppercase font-semibold">Số Câu Đúng</span>
                <p className="text-3xl font-extrabold text-emerald-600 font-mono mt-0.5">
                  {examResult.correctCount}/{examResult.totalQuestions}
                </p>
              </div>
            </div>

            <div className="text-xs space-y-1 mb-4">
              <p>
                Trạng thái:{' '}
                <strong className={examResult.passed ? 'text-emerald-600' : 'text-rose-600'}>
                  {examResult.passed ? 'ĐẠT YÊU CẦU' : 'KHÔNG ĐẠT'}
                </strong>
              </p>
              {examResult.tabSwitches > 0 && (
                <p className="text-amber-600 font-semibold">
                  Số lần cảnh báo chuyển tab ghi nhận: {examResult.tabSwitches} lần
                </p>
              )}
            </div>

            <button
              onClick={() => {
                setExamResult(null);
                setActiveQuiz(null);
              }}
              className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition cursor-pointer"
            >
              Hoàn Tất & Đóng
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB NAV */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex rounded-xl bg-gray-100 p-1 self-start">
          <button
            onClick={() => setSubTab('quizzes')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              subTab === 'quizzes' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Bài Thi & Quiz ({quizzes.length})</span>
          </button>

          {(isAdmin || isTeacher) && (
            <>
              <button
                onClick={() => setSubTab('question_bank')}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                  subTab === 'question_bank'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileQuestion className="h-4 w-4" />
                <span>Ngân Hàng Câu Hỏi ({questions.length})</span>
              </button>

              <button
                onClick={() => setSubTab('monitoring')}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                  subTab === 'monitoring' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ShieldAlert className="h-4 w-4 text-rose-500" />
                <span>Giám Sát Phòng Thi Real-time</span>
              </button>
            </>
          )}
        </div>

        {/* Action Button */}
        {(isAdmin || isTeacher) && (
          <div>
            {subTab === 'quizzes' && (
              <button
                onClick={() => setShowCreateQuizModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Tạo Đề Thi / Quiz</span>
              </button>
            )}
            {subTab === 'question_bank' && (
              <button
                onClick={() => setShowAddQuestionModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm Câu Hỏi Mới</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 1. QUIZZES LIST */}
      {subTab === 'quizzes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs space-y-4 hover:border-gray-200 transition"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                    Thời lượng: {quiz.durationMinutes} phút
                  </span>
                  {quiz.password && (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      <Lock className="h-2.5 w-2.5" /> Có mật khẩu ca thi
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-gray-900 leading-snug">{quiz.title}</h4>
                <p className="text-xs text-gray-500">{quiz.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 border-y border-gray-100 py-3">
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Lượt làm tối đa:</span>
                  <strong>{quiz.maxAttempts || 1} lần</strong>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Điểm qua môn:</span>
                  <strong>{quiz.passingScore || 5.0} / 10</strong>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-gray-400">Đảo đề ngẫu nhiên ✓</span>

                {isStudent && (
                  <button
                    onClick={() => handleStartExamPrompt(quiz)}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition cursor-pointer shadow-xs"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Bắt Đầu Làm Bài</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. QUESTION BANK */}
      {subTab === 'question_bank' && (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={q.id || idx} className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-blue-600">Câu {idx + 1}</span>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                    {q.chapter}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                      q.difficulty === 'EASY'
                        ? 'bg-emerald-50 text-emerald-700'
                        : q.difficulty === 'HARD'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {q.difficulty}
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-600">Đáp án: {q.answer}</span>
              </div>

              <p className="text-xs font-semibold text-gray-800">{q.content}</p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {q.options?.map((opt, oIdx) => (
                  <div
                    key={oIdx}
                    className={`rounded-lg p-2 border ${
                      opt === q.answer
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold'
                        : 'border-gray-100 bg-gray-50/60 text-gray-700'
                    }`}
                  >
                    {String.fromCharCode(65 + oIdx)}. {opt}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. REAL-TIME MONITORING */}
      {subTab === 'monitoring' && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-xs overflow-hidden">
          <div className="p-4 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-gray-900">Danh Sách Thí Sinh Trong Phòng Thi</h4>
              <p className="text-[11px] text-gray-500">Giám sát hành vi vi phạm & thời gian thực</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 animate-pulse">
              ● Đang truyền tín hiệu trực tiếp
            </span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold">
              <tr>
                <th className="py-2.5 px-4">MSSV</th>
                <th className="py-2.5 px-4">Họ và Tên</th>
                <th className="py-2.5 px-4">Giờ Bắt Đầu</th>
                <th className="py-2.5 px-4">Tiến Độ</th>
                <th className="py-2.5 px-4">Chuyển Tab (Gian Lận)</th>
                <th className="py-2.5 px-4">Trạng Thái</th>
                <th className="py-2.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {monitoringList.map((m) => (
                <tr key={m.studentId} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">{m.studentCode}</td>
                  <td className="py-3 px-4 font-semibold text-gray-900">{m.fullName}</td>
                  <td className="py-3 px-4 text-gray-500 font-mono">{m.startTime}</td>
                  <td className="py-3 px-4 font-semibold text-gray-700">{m.progress}</td>
                  <td className="py-3 px-4">
                    {m.tabSwitchCount > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                        <AlertTriangle className="h-3 w-3" /> {m.tabSwitchCount} lần vi phạm
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-semibold">An toàn (0)</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        m.status === 'DOING'
                          ? 'bg-blue-50 text-blue-700'
                          : m.status === 'REOPENED'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleReopenAttempt(m.studentId)}
                      className="rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                    >
                      Mở Lại Lượt Thi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PASSWORD MODAL FOR PROTECTED QUIZ */}
      {showPasswordModal && activeQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-in fade-in">
            <h3 className="text-base font-bold text-gray-900">Yêu Cầu Mật Khẩu Ca Thi</h3>
            <p className="text-xs text-gray-500 mt-1">
              Bài thi <strong>{activeQuiz.title}</strong> được bảo vệ bằng mật khẩu phòng máy.
            </p>

            <div className="my-4">
              <input
                type="password"
                placeholder="Nhập mã ca thi từ giám thị..."
                value={quizPasswordInput}
                onChange={(e) => setQuizPasswordInput(e.target.value)}
                className="w-full rounded-lg border border-gray-200 p-2.5 text-xs outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmPassword}
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
              >
                Vào Phòng Thi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE QUIZ MODAL */}
      {showCreateQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Thiết Lập Đề Thi Trắc Nghiệm Mới</h3>
              <button
                onClick={() => setShowCreateQuizModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setQuizzes((prev) => [{ ...newQuizForm, id: `quiz-${Date.now()}` }, ...prev]);
                setShowCreateQuizModal(false);
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Tiêu Đề Bài Thi / Quiz</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Kiểm tra 15 phút..."
                  value={newQuizForm.title}
                  onChange={(e) => setNewQuizForm({ ...newQuizForm, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Thời lượng (Phút)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={newQuizForm.durationMinutes}
                    onChange={(e) =>
                      setNewQuizForm({ ...newQuizForm, durationMinutes: parseInt(e.target.value) || 15 })
                    }
                    className="w-full rounded-lg border border-gray-200 p-2 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Mật khẩu ca thi (Tùy chọn)</label>
                  <input
                    type="text"
                    placeholder="Mã phòng thi..."
                    value={newQuizForm.password}
                    onChange={(e) => setNewQuizForm({ ...newQuizForm, password: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 p-2 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateQuizModal(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
                >
                  Tạo Đề Thi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD QUESTION MODAL */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Thêm Câu Hỏi Vào Ngân Hàng</h3>
              <button
                onClick={() => setShowAddQuestionModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setQuestions((prev) => [...prev, { ...newQuestionForm, id: `qb-${Date.now()}` }]);
                setShowAddQuestionModal(false);
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Nội dung câu hỏi</label>
                <textarea
                  rows={2}
                  value={newQuestionForm.content}
                  onChange={(e) => setNewQuestionForm({ ...newQuestionForm, content: e.target.value })}
                  placeholder="Nhập đề bài câu hỏi trắc nghiệm..."
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Chương / Chủ đề</label>
                  <input
                    type="text"
                    value={newQuestionForm.chapter}
                    onChange={(e) => setNewQuestionForm({ ...newQuestionForm, chapter: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 p-2 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Độ khó</label>
                  <select
                    value={newQuestionForm.difficulty}
                    onChange={(e: any) => setNewQuestionForm({ ...newQuestionForm, difficulty: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 p-2 outline-none"
                  >
                    <option value="EASY">Dễ (EASY)</option>
                    <option value="MEDIUM">Trung bình (MEDIUM)</option>
                    <option value="HARD">Khó (HARD)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Đáp án đúng (Chính xác)</label>
                <input
                  type="text"
                  placeholder="Nhập nội dung đáp án đúng..."
                  value={newQuestionForm.answer}
                  onChange={(e) => setNewQuestionForm({ ...newQuestionForm, answer: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 p-2 outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                >
                  Lưu Câu Hỏi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LmsQuizzes;
