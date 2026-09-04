import React, { useState, useEffect } from 'react';
import { academicService, type Class, type Course, type HomeroomClass } from '../../../services/academic.service';
import { Plus, Users, AlertCircle, CheckCircle, UserPlus, Zap } from 'lucide-react';

export default function ClassesTab() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [homerooms, setHomerooms] = useState<HomeroomClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({ code: '', courseId: '', academicYear: '2026-2027', semester: 1 });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Assign Student Modal
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [assignMode, setAssignMode] = useState<'MANUAL' | 'HOMEROOM'>('HOMEROOM');
  const [studentIdsStr, setStudentIdsStr] = useState('');
  const [selectedHomeroomId, setSelectedHomeroomId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // Auto Assign Modal
  const [showAutoAssign, setShowAutoAssign] = useState(false);
  const [autoAssignData, setAutoAssignData] = useState({ courseId: '', academicYear: '2026-2027', semester: 1, numberOfClasses: 1 });
  const [autoAssignLoading, setAutoAssignLoading] = useState(false);
  const [unassignedCount, setUnassignedCount] = useState<number | null>(null);
  const [unassignedStudentIds, setUnassignedStudentIds] = useState<string[]>([]);
  
  // Auto Assign Filters
  const [filterCohort, setFilterCohort] = useState('');
  const [filterMajorId, setFilterMajorId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, coursesRes, homeroomsRes] = await Promise.all([
        academicService.getClasses(),
        academicService.getCourses(),
        academicService.getHomerooms()
      ]);
      setClasses(classesRes.data || []);
      setCourses(coursesRes.data || []);
      setHomerooms(homeroomsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage(null);
    try {
      await academicService.createClass(formData);
      setMessage({ type: 'success', text: 'Class created successfully!' });
      setFormData({ code: '', courseId: '', academicYear: '2026-2027', semester: 1 });
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create class' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignModal) return;
    
    setAssignLoading(true);
    setMessage(null);
    try {
      if (assignMode === 'MANUAL') {
        const idsArray = studentIdsStr.split(',').map(id => id.trim()).filter(id => id);
        await academicService.assignStudentsToClass(showAssignModal, idsArray);
        setMessage({ type: 'success', text: `Assigned ${idsArray.length} students successfully!` });
      } else {
        await academicService.assignHomeroomToClass(showAssignModal, selectedHomeroomId);
        setMessage({ type: 'success', text: `Assigned entire homeroom class successfully!` });
      }
      setShowAssignModal(null);
      setStudentIdsStr('');
      setSelectedHomeroomId('');
      fetchData(); // Refresh list to update student count
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to assign students' });
    } finally {
      setAssignLoading(false);
    }
  };

  const checkUnassigned = async () => {
    if (!filterCohort && !filterMajorId && !autoAssignData.courseId) return;
    try {
      const res = await academicService.getUnassignedStudents({
        cohort: filterCohort || undefined,
        majorId: filterMajorId || undefined,
        courseId: autoAssignData.courseId || undefined
      });
      const students = res.data || [];
      setUnassignedCount(students.length);
      setUnassignedStudentIds(students.map(s => s.id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAutoAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (unassignedCount === 0 || unassignedCount === null) {
      alert("No students to assign!");
      return;
    }

    setAutoAssignLoading(true);
    setMessage(null);
    try {
      await academicService.autoAssignClasses({
        courseId: autoAssignData.courseId,
        academicYear: autoAssignData.academicYear,
        semester: autoAssignData.semester,
        numberOfClasses: autoAssignData.numberOfClasses,
        studentIds: unassignedStudentIds
      });
      setMessage({ type: 'success', text: `Successfully auto-assigned ${unassignedCount} students into ${autoAssignData.numberOfClasses} classes!` });
      setShowAutoAssign(false);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to auto-assign classes' });
    } finally {
      setAutoAssignLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Course Classes</h2>
            <p className="text-sm text-gray-500">Manage course classes and enrollments</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setShowAutoAssign(!showAutoAssign); setShowForm(false); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition shadow-sm"
          >
            <Zap size={18} />
            Auto Assign (Tự động chia lớp)
          </button>
          <button 
            onClick={() => { setShowForm(!showForm); setShowAutoAssign(false); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            <Plus size={18} />
            {showForm ? 'Cancel' : 'New Class'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-medium">{message.text}</p>
          <button onClick={() => setMessage(null)} className="ml-auto opacity-70 hover:opacity-100">×</button>
        </div>
      )}

      {/* AUTO ASSIGN SECTION */}
      {showAutoAssign && (
        <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl border border-purple-200 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-start gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-700"><Zap size={20} /></div>
            <div>
              <h3 className="text-lg font-bold text-purple-900">Auto Assign Students to Classes</h3>
              <p className="text-sm text-purple-700">Filter unassigned students and automatically split them into multiple classes.</p>
            </div>
          </div>
          
          <form onSubmit={handleAutoAssign} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1: Target Course */}
              <div className="space-y-4 bg-white p-4 rounded-lg border border-purple-100 shadow-sm">
                <h4 className="font-semibold text-gray-900 border-b pb-2">1. Target Course</h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Course</label>
                    <select required value={autoAssignData.courseId} onChange={e => setAutoAssignData({...autoAssignData, courseId: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-200 outline-none bg-white text-sm">
                      <option value="" disabled>Select a Course</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase">Year</label>
                      <input required value={autoAssignData.academicYear} onChange={e => setAutoAssignData({...autoAssignData, academicYear: e.target.value})} type="text" className="w-full px-3 py-2 border rounded-lg outline-none text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase">Sem</label>
                      <input required value={autoAssignData.semester} onChange={e => setAutoAssignData({...autoAssignData, semester: Number(e.target.value)})} type="number" min={1} max={3} className="w-full px-3 py-2 border rounded-lg outline-none text-sm" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Filter Students */}
              <div className="space-y-4 bg-white p-4 rounded-lg border border-purple-100 shadow-sm">
                <h4 className="font-semibold text-gray-900 border-b pb-2">2. Filter Students</h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Cohort (Optional)</label>
                    <input value={filterCohort} onChange={e => setFilterCohort(e.target.value)} type="text" placeholder="e.g. K26" className="w-full px-3 py-2 border rounded-lg outline-none text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Major (Optional)</label>
                    <select value={filterMajorId} onChange={e => setFilterMajorId(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none bg-white text-sm">
                      <option value="">Any Major</option>
                      {/* You can load majors here if needed, or use a unique set from homerooms */}
                      {Array.from(new Set(homerooms.map(h => h.major?.id))).map(id => {
                        const m = homerooms.find(h => h.major?.id === id)?.major;
                        return m ? <option key={m.id} value={m.id}>{m.name}</option> : null;
                      })}
                    </select>
                  </div>
                  <button type="button" onClick={checkUnassigned} disabled={!autoAssignData.courseId} className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg transition disabled:opacity-50">
                    Find Eligible Students
                  </button>
                </div>
              </div>

              {/* Step 3: Split Strategy */}
              <div className="space-y-4 bg-white p-4 rounded-lg border border-purple-100 shadow-sm">
                <h4 className="font-semibold text-gray-900 border-b pb-2">3. Execute</h4>
                {unassignedCount !== null && (
                  <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100 mb-3">
                    Found <strong>{unassignedCount}</strong> students eligible for {courses.find(c => c.id === autoAssignData.courseId)?.code}.
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Number of Classes to Create</label>
                  <input required value={autoAssignData.numberOfClasses} onChange={e => setAutoAssignData({...autoAssignData, numberOfClasses: Number(e.target.value)})} type="number" min={1} max={20} className="w-full px-3 py-2 border rounded-lg outline-none text-sm" />
                  {unassignedCount !== null && unassignedCount > 0 && autoAssignData.numberOfClasses > 0 && (
                    <p className="text-xs text-gray-500 mt-1">Approx ~{Math.ceil(unassignedCount / autoAssignData.numberOfClasses)} students per class.</p>
                  )}
                </div>
                
                <button type="submit" disabled={autoAssignLoading || !unassignedCount} className="w-full mt-4 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-70 transition flex items-center justify-center gap-2 shadow-sm">
                  {autoAssignLoading ? 'Processing...' : 'Run Auto-Assign'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* MANUAL CREATE FORM */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Class Manually</h3>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Class Code</label>
                <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} type="text" placeholder="e.g. CS101-01" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Course</label>
                <select required value={formData.courseId} onChange={e => setFormData({...formData, courseId: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none bg-white">
                  <option value="" disabled>Select a Course</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Academic Year</label>
                <input required value={formData.academicYear} onChange={e => setFormData({...formData, academicYear: e.target.value})} type="text" placeholder="2026-2027" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Semester</label>
                <select required value={formData.semester} onChange={e => setFormData({...formData, semester: Number(e.target.value)})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none bg-white">
                  <option value={1}>Semester 1</option>
                  <option value={2}>Semester 2</option>
                  <option value={3}>Semester 3</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={submitLoading || !formData.courseId} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-70 transition">
                {submitLoading ? 'Saving...' : 'Save Class'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
        ) : classes.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No classes found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4">Code</th>
                <th className="p-4">Course</th>
                <th className="p-4">Academic Year</th>
                <th className="p-4">Semester</th>
                <th className="p-4">Students</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {classes.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 font-bold text-gray-900">{c.code}</td>
                  <td className="p-4 text-gray-700">
                    <div className="font-semibold">{c.course?.code}</div>
                    <div className="text-xs text-gray-500">{c.course?.name}</div>
                  </td>
                  <td className="p-4 text-gray-700">{c.academicYear}</td>
                  <td className="p-4 text-gray-700">Sem {c.semester}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                      {c.students?.length || 0}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => setShowAssignModal(c.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition"
                    >
                      <UserPlus size={16} />
                      Enroll Students
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Enroll Students Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <UserPlus size={18} className="text-blue-600" />
                Enroll Students
              </h3>
              <button onClick={() => setShowAssignModal(null)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            
            <div className="px-6 py-3 border-b border-gray-100 bg-white">
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => setAssignMode('HOMEROOM')} 
                  className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition ${assignMode === 'HOMEROOM' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  By Homeroom (1-Click)
                </button>
                <button 
                  onClick={() => setAssignMode('MANUAL')} 
                  className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition ${assignMode === 'MANUAL' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Manual (UUIDs)
                </button>
              </div>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-6 pt-4">
              {assignMode === 'HOMEROOM' ? (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Select Homeroom Class</label>
                  <select 
                    required value={selectedHomeroomId} onChange={e => setSelectedHomeroomId(e.target.value)} 
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none bg-white"
                  >
                    <option value="" disabled>-- Select a Homeroom Class --</option>
                    {homerooms.map(h => (
                      <option key={h.id} value={h.id}>{h.code} - {h.name} ({h.students?.length || 0} students)</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500">All students from the selected homeroom will be added to this course class.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Student IDs (comma-separated UUIDs)</label>
                  <textarea 
                    required rows={4} value={studentIdsStr} onChange={e => setStudentIdsStr(e.target.value)}
                    placeholder="uuid-student-1, uuid-student-2, ..."
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none resize-none font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">Paste the valid UUIDs of students to enroll them into this class.</p>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAssignModal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={assignLoading || (assignMode === 'HOMEROOM' ? !selectedHomeroomId : !studentIdsStr.trim())}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-70 flex items-center gap-2 shadow-sm"
                >
                  {assignLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {assignMode === 'HOMEROOM' ? 'Enroll Entire Class' : 'Enroll Students'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
